// src/hooks/useOptimizedEscrowLoader.ts - Only Active Escrows with Ankr RPC
import { useState, useCallback, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import { Escrow, EscrowContract } from '../types';

interface OptimizedEscrowState {
  activeEscrows: Escrow[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  progress: {
    total: number;
    loaded: number;
    failed: number;
    percentage: number;
  };
  stats: {
    total: number;
    asBuyer: number;
    asSeller: number;
    asArbiter: number;
    disputed: number;
  };
}

// Rate limiting configuration for Ankr RPC
const RATE_LIMIT = {
  maxRequestsPer10Sec: 250,
  maxRequestsPer10Min: 10000,
  batchSize: 3,
  delayBetweenBatches: 300,
  delayBetweenRequests: 30
};

// In-memory cache for active escrows only
const activeEscrowCache = new Map<string, { data: Escrow; timestamp: number }>();
const CACHE_DURATION = 45000; // 45 seconds

const useOptimizedEscrowLoader = () => {
  const [state, setState] = useState<OptimizedEscrowState>({
    activeEscrows: [],
    loading: false,
    error: null,
    lastUpdated: 0,
    progress: { total: 0, loaded: 0, failed: 0, percentage: 0 },
    stats: { total: 0, asBuyer: 0, asSeller: 0, asArbiter: 0, disputed: 0 }
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const requestCountRef = useRef({ per10Sec: 0, per10Min: 0 });
  const lastResetRef = useRef({ sec: Date.now(), min: Date.now() });

  // Reset rate limit counters
  const resetRateLimitCounters = useCallback(() => {
    const now = Date.now();
    if (now - lastResetRef.current.sec >= 10000) {
      requestCountRef.current.per10Sec = 0;
      lastResetRef.current.sec = now;
    }
    if (now - lastResetRef.current.min >= 600000) {
      requestCountRef.current.per10Min = 0;
      lastResetRef.current.min = now;
    }
  }, []);

  // Check if we can make a request
  const canMakeRequest = useCallback(() => {
    resetRateLimitCounters();
    return (
      requestCountRef.current.per10Sec < RATE_LIMIT.maxRequestsPer10Sec &&
      requestCountRef.current.per10Min < RATE_LIMIT.maxRequestsPer10Min
    );
  }, [resetRateLimitCounters]);

  // Increment request counter
  const incrementRequestCount = useCallback(() => {
    requestCountRef.current.per10Sec++;
    requestCountRef.current.per10Min++;
  }, []);

  // Rate-limited delay
  const waitForRateLimit = useCallback(async () => {
    while (!canMakeRequest()) {
      console.log('⏳ Rate limit reached, waiting...');
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }, [canMakeRequest]);

  // Check if escrow is active
  const isActiveEscrow = (escrow: Escrow): boolean => {
    return !escrow.fundsDisbursed;
  };

  // Get cached or fetch active escrow (wallet-specific)
  const getCachedOrFetchActiveEscrow = useCallback(async (
    contract: EscrowContract,
    escrowId: string
  ): Promise<Escrow | null> => {
    const cacheKey = `wallet-active-${contract.target}-${escrowId}`;
    const cached = activeEscrowCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📋 Cache hit for wallet's active escrow ${escrowId}`);
      return cached.data;
    }

    await waitForRateLimit();
    
    try {
      incrementRequestCount();
      console.log(`🔄 Fetching escrow ${escrowId} details for wallet`);
      
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 4000);
      });

      const dataPromise = contract.getEscrow(escrowId);
      const data = await Promise.race([dataPromise, timeoutPromise]);

      const escrow: Escrow = {
        id: escrowId,
        buyer: data[0],
        seller: data[1],
        arbiter: data[2],
        amount: ethers.formatEther(data[3]),
        fundsDisbursed: data[4],
        disputeRaised: data[5]
      };

      // Only cache if it's an active escrow (not completed)
      if (isActiveEscrow(escrow)) {
        activeEscrowCache.set(cacheKey, { data: escrow, timestamp: Date.now() });
        console.log(`✅ Active escrow ${escrowId} cached for wallet`);
        return escrow;
      } else {
        console.log(`⏭️ Escrow ${escrowId} is completed (fundsDisbursed: ${escrow.fundsDisbursed}), not caching`);
        return escrow; // Return it so we can check if user is involved, but don't cache
      }
      
    } catch (error) {
      console.error(`❌ Failed to fetch escrow ${escrowId}:`, error);
      return null;
    }
  }, [waitForRateLimit, incrementRequestCount]);

  // Get user's escrow IDs efficiently - FIXED to properly use getUserEscrows
  const getUserEscrowIds = useCallback(async (
    contract: EscrowContract,
    userAddress: string
  ): Promise<string[]> => {
    await waitForRateLimit();
    
    try {
      incrementRequestCount();
      console.log(`🔍 Getting escrow IDs for wallet: ${userAddress}`);
      
      // Call the getUserEscrows method from the contract ABI
      const escrowIdsArray = await contract.getUserEscrows(userAddress);
      const userEscrowIds = escrowIdsArray.map((id: any) => id.toString());
      
      console.log(`✅ Found ${userEscrowIds.length} escrows for wallet ${userAddress}:`, userEscrowIds);
      return userEscrowIds;
      
    } catch (error) {
      console.error('❌ getUserEscrows method failed:', error);
      console.log('🔄 Falling back to manual escrow checking...');
      
      try {
        await waitForRateLimit();
        incrementRequestCount();
        
        const totalCount = await contract.getEscrowCount();
        const total = Number(totalCount);
        
        console.log(`📊 Checking ${total} escrows manually for wallet ${userAddress}`);
        
        const userEscrowIds: string[] = [];
        const userAddr = userAddress.toLowerCase();
        
        // Check all escrows (but efficiently)
        for (let i = 0; i < total; i += RATE_LIMIT.batchSize) {
          const batch = [];
          const batchEnd = Math.min(i + RATE_LIMIT.batchSize, total);
          
          for (let j = i; j < batchEnd; j++) {
            batch.push(j);
          }
          
          // Check each escrow in parallel
          const batchPromises = batch.map(async (escrowId) => {
            try {
              await waitForRateLimit();
              incrementRequestCount();
              
              const data = await contract.getEscrow(escrowId);
              const buyer = data[0].toLowerCase();
              const seller = data[1].toLowerCase();
              const arbiter = data[2].toLowerCase();
              
              // Check if user is involved in this escrow
              if (buyer === userAddr || seller === userAddr || arbiter === userAddr) {
                const role = buyer === userAddr ? 'buyer' : seller === userAddr ? 'seller' : 'arbiter';
                console.log(`✅ User is ${role} in escrow ${escrowId}`);
                return escrowId.toString();
              }
              
              return null;
            } catch (error) {
              console.error(`❌ Error checking escrow ${escrowId}:`, error);
              return null;
            }
          });
          
          const batchResults = await Promise.allSettled(batchPromises);
          batchResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
              userEscrowIds.push(result.value);
            }
          });
          
          // Progress update
          console.log(`📦 Checked ${Math.min(batchEnd, total)}/${total} escrows, found ${userEscrowIds.length} for user`);
          
          // Delay between batches
          if (i + RATE_LIMIT.batchSize < total) {
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.delayBetweenBatches));
          }
        }
        
        console.log(`✅ Manual check complete: Found ${userEscrowIds.length} escrows for wallet ${userAddress}`);
        return userEscrowIds;
        
      } catch (fallbackError) {
        console.error('❌ Manual escrow checking also failed:', fallbackError);
        throw new Error(`Unable to fetch escrows for wallet ${userAddress}: ${fallbackError}`);
      }
    }
  }, [waitForRateLimit, incrementRequestCount]);

  // Main loading function - ONLY connected wallet's ACTIVE escrows
  const loadActiveEscrows = useCallback(async (
    contract: EscrowContract,
    userAddress: string
  ) => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    setState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null,
      progress: { total: 0, loaded: 0, failed: 0, percentage: 0 }
    }));

    try {
      console.log(`🚀 Starting escrow loading for wallet: ${userAddress}`);
      console.log(`📞 Contract address: ${contract.target || 'unknown'}`);
      
      // Step 1: Get ONLY the connected user's escrow IDs
      const userEscrowIds = await getUserEscrowIds(contract, userAddress);
      
      if (userEscrowIds.length === 0) {
        setState(prev => ({
          ...prev,
          loading: false,
          activeEscrows: [],
          stats: { total: 0, asBuyer: 0, asSeller: 0, asArbiter: 0, disputed: 0 },
          lastUpdated: Date.now()
        }));
        console.log(`📭 No escrows found for wallet ${userAddress}`);
        return;
      }

      console.log(`📋 Processing ${userEscrowIds.length} escrows for wallet ${userAddress}`);
      console.log(`🔍 Escrow IDs to check: [${userEscrowIds.join(', ')}]`);
      
      // Step 2: Load each escrow and keep ONLY active ones
      const activeEscrows: Escrow[] = [];
      const stats = { total: 0, asBuyer: 0, asSeller: 0, asArbiter: 0, disputed: 0 };
      let processed = 0;
      let failed = 0;

      setState(prev => ({
        ...prev,
        progress: { total: userEscrowIds.length, loaded: 0, failed: 0, percentage: 0 }
      }));

      // Process each user escrow to check if it's active
      for (let i = 0; i < userEscrowIds.length; i += RATE_LIMIT.batchSize) {
        if (abortControllerRef.current?.signal.aborted) {
          console.log('🛑 Operation cancelled');
          return;
        }

        const batch = userEscrowIds.slice(i, i + RATE_LIMIT.batchSize);
        console.log(`📦 Processing batch ${Math.ceil((i + 1) / RATE_LIMIT.batchSize)}/${Math.ceil(userEscrowIds.length / RATE_LIMIT.batchSize)}: [${batch.join(', ')}]`);

        for (const escrowId of batch) {
          try {
            console.log(`🔄 Loading escrow ${escrowId}...`);
            const escrow = await getCachedOrFetchActiveEscrow(contract, escrowId);
            
            if (escrow) {
              const userAddr = userAddress.toLowerCase();
              const userRole = escrow.buyer.toLowerCase() === userAddr ? 'buyer' : 
                             escrow.seller.toLowerCase() === userAddr ? 'seller' : 'arbiter';
              
              if (isActiveEscrow(escrow)) {
                // This is an ACTIVE escrow for the connected user
                activeEscrows.push(escrow);
                
                // Calculate stats
                if (escrow.buyer.toLowerCase() === userAddr) stats.asBuyer++;
                if (escrow.seller.toLowerCase() === userAddr) stats.asSeller++;
                if (escrow.arbiter.toLowerCase() === userAddr) stats.asArbiter++;
                if (escrow.disputeRaised) stats.disputed++;
                stats.total++;
                
                console.log(`✅ ACTIVE escrow ${escrowId} added (User role: ${userRole}, Amount: ${escrow.amount} MON, Disputed: ${escrow.disputeRaised})`);
              } else {
                console.log(`⏭️ Escrow ${escrowId} is COMPLETED (User role: ${userRole}, fundsDisbursed: true) - skipping`);
              }
            } else {
              console.log(`❌ Failed to load escrow ${escrowId}`);
            }
            
            processed++;
          } catch (error) {
            console.error(`❌ Error processing escrow ${escrowId}:`, error);
            failed++;
          }
          
          // Update progress
          const percentage = Math.round(((processed + failed) / userEscrowIds.length) * 100);
          setState(prev => ({
            ...prev,
            progress: { total: userEscrowIds.length, loaded: processed, failed, percentage },
            activeEscrows: [...activeEscrows] // Update UI with current active escrows
          }));
          
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.delayBetweenRequests));
        }
        
        if (i + RATE_LIMIT.batchSize < userEscrowIds.length) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.delayBetweenBatches));
        }
      }

      // Sort by ID (newest first)
      activeEscrows.sort((a, b) => parseInt(b.id) - parseInt(a.id));

      console.log(`✅ LOADING COMPLETE for wallet ${userAddress}:`);
      console.log(`   📊 Total escrows checked: ${userEscrowIds.length}`);
      console.log(`   🎯 Active escrows found: ${activeEscrows.length}`);
      console.log(`   👤 User roles: Buyer(${stats.asBuyer}) Seller(${stats.asSeller}) Arbiter(${stats.asArbiter})`);
      console.log(`   ⚡ Processing: ${processed} successful, ${failed} failed`);
      console.log(`   💰 Total active value: ${activeEscrows.reduce((sum, e) => sum + parseFloat(e.amount), 0).toFixed(3)} MON`);

      setState(prev => ({
        ...prev,
        activeEscrows,
        loading: false,
        error: failed > 0 ? `Processed ${processed}/${userEscrowIds.length} user escrows (${failed} failed)` : null,
        lastUpdated: Date.now(),
        stats
      }));

    } catch (error) {
      console.error(`❌ CRITICAL ERROR loading escrows for wallet ${userAddress}:`, error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : `Failed to load escrows for wallet ${userAddress}`
      }));
    }
  }, [getUserEscrowIds, getCachedOrFetchActiveEscrow]);

  // Quick refresh for active escrows only
  const refreshIfStale = useCallback(async (
    contract: EscrowContract,
    userAddress: string,
    maxAge: number = 45000
  ) => {
    const now = Date.now();
    const isStale = now - state.lastUpdated > maxAge;

    if (isStale || state.activeEscrows.length === 0) {
      console.log('🔄 Active escrow data is stale, refreshing...');
      await loadActiveEscrows(contract, userAddress);
    } else {
      console.log('✅ Active escrow data is fresh');
    }
  }, [state.lastUpdated, state.activeEscrows.length, loadActiveEscrows]);

  // Clear cache
  const clearCache = useCallback(() => {
    activeEscrowCache.clear();
    console.log('🧹 Active escrow cache cleared');
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // Data
    activeEscrows: state.activeEscrows,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    progress: state.progress,
    stats: state.stats,

    // Actions
    loadActiveEscrows,
    refreshIfStale,
    clearCache,

    // Computed values
    hasData: state.activeEscrows.length > 0,
    isStale: Date.now() - state.lastUpdated > 45000,
    isPartiallyLoaded: state.progress.failed > 0 && state.progress.loaded > 0,
    
    // Rate limit info
    rateLimitInfo: {
      per10Sec: requestCountRef.current.per10Sec,
      per10Min: requestCountRef.current.per10Min,
      maxPer10Sec: RATE_LIMIT.maxRequestsPer10Sec,
      maxPer10Min: RATE_LIMIT.maxRequestsPer10Min
    }
  };
};

export default useOptimizedEscrowLoader;
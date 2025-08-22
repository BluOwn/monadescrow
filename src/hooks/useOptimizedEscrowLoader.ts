// src/hooks/useOptimizedEscrowLoader.ts - Optimized for Ankr RPC
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

// Ankr RPC configuration
const ANKR_RPC_URL = 'https://rpc.ankr.com/monad_testnet';
const RATE_LIMIT = {
  maxRequestsPer10Sec: 250, // Conservative limit (300 - buffer)
  maxRequestsPer10Min: 10000, // Conservative limit (12000 - buffer)
  batchSize: 5, // Small batches to avoid overwhelming
  delayBetweenBatches: 500, // 500ms delay between batches
  delayBetweenRequests: 50 // 50ms delay between individual requests
};

// In-memory cache for escrow data
const escrowCache = new Map<string, { data: Escrow; timestamp: number }>();
const CACHE_DURATION = 30000; // 30 seconds cache

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
    
    // Reset 10-second counter
    if (now - lastResetRef.current.sec >= 10000) {
      requestCountRef.current.per10Sec = 0;
      lastResetRef.current.sec = now;
    }
    
    // Reset 10-minute counter
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

  // Get cached escrow or fetch new
  const getCachedOrFetchEscrow = useCallback(async (
    contract: EscrowContract,
    escrowId: string
  ): Promise<Escrow | null> => {
    const cacheKey = `${contract.target}-${escrowId}`;
    const cached = escrowCache.get(cacheKey);
    
    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📋 Cache hit for escrow ${escrowId}`);
      return cached.data;
    }

    // Wait for rate limit clearance
    await waitForRateLimit();
    
    try {
      incrementRequestCount();
      
      console.log(`🔄 Fetching escrow ${escrowId} from Ankr RPC`);
      
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 5000);
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

      // Cache the result
      escrowCache.set(cacheKey, { data: escrow, timestamp: Date.now() });
      
      return escrow;
    } catch (error) {
      console.error(`❌ Failed to fetch escrow ${escrowId}:`, error);
      return null;
    }
  }, [waitForRateLimit, incrementRequestCount]);

  // Get user's escrow IDs efficiently
  const getUserEscrowIds = useCallback(async (
    contract: EscrowContract,
    userAddress: string
  ): Promise<string[]> => {
    await waitForRateLimit();
    
    try {
      incrementRequestCount();
      console.log('🔍 Getting user escrow IDs from Ankr RPC');
      
      const escrowIds = await contract.getUserEscrows(userAddress);
      return escrowIds.map((id: any) => id.toString());
    } catch (error) {
      console.error('❌ Failed to get user escrow IDs:', error);
      
      // Fallback: try to get total count and check each one
      try {
        await waitForRateLimit();
        incrementRequestCount();
        
        const totalCount = await contract.getEscrowCount();
        const total = Number(totalCount);
        
        console.log(`📊 Fallback: checking ${total} escrows for user involvement`);
        
        // Only check recent escrows to avoid overwhelming the RPC
        const maxToCheck = Math.min(total, 50); // Limit to last 50 escrows
        const startId = Math.max(0, total - maxToCheck);
        
        const userEscrowIds: string[] = [];
        
        // Process in small batches
        for (let i = startId; i < total; i += RATE_LIMIT.batchSize) {
          const batch = [];
          const batchEnd = Math.min(i + RATE_LIMIT.batchSize, total);
          
          for (let j = i; j < batchEnd; j++) {
            batch.push(j.toString());
          }
          
          // Check each escrow in the batch
          const batchPromises = batch.map(async (id) => {
            const escrow = await getCachedOrFetchEscrow(contract, id);
            if (escrow) {
              const userAddr = userAddress.toLowerCase();
              if (
                escrow.buyer.toLowerCase() === userAddr ||
                escrow.seller.toLowerCase() === userAddr ||
                escrow.arbiter.toLowerCase() === userAddr
              ) {
                return id;
              }
            }
            return null;
          });
          
          const batchResults = await Promise.allSettled(batchPromises);
          batchResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
              userEscrowIds.push(result.value);
            }
          });
          
          // Delay between batches
          if (i + RATE_LIMIT.batchSize < total) {
            await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.delayBetweenBatches));
          }
        }
        
        return userEscrowIds;
      } catch (fallbackError) {
        console.error('❌ Fallback method also failed:', fallbackError);
        throw new Error('Unable to fetch user escrows');
      }
    }
  }, [waitForRateLimit, incrementRequestCount, getCachedOrFetchEscrow]);

  // Main loading function optimized for Ankr RPC
  const loadActiveEscrows = useCallback(async (
    contract: EscrowContract,
    userAddress: string
  ) => {
    // Cancel any existing operation
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
      console.log('🚀 Starting optimized escrow loading with Ankr RPC');
      console.log('📊 Rate limits:', RATE_LIMIT);
      
      // Step 1: Get user's escrow IDs
      const userEscrowIds = await getUserEscrowIds(contract, userAddress);
      
      if (userEscrowIds.length === 0) {
        setState(prev => ({
          ...prev,
          loading: false,
          activeEscrows: [],
          stats: { total: 0, asBuyer: 0, asSeller: 0, asArbiter: 0, disputed: 0 },
          lastUpdated: Date.now()
        }));
        return;
      }

      console.log(`📋 Found ${userEscrowIds.length} escrows for user`);
      
      // Step 2: Load escrow details in optimized batches
      const activeEscrows: Escrow[] = [];
      const stats = { total: 0, asBuyer: 0, asSeller: 0, asArbiter: 0, disputed: 0 };
      let loaded = 0;
      let failed = 0;

      setState(prev => ({
        ...prev,
        progress: { total: userEscrowIds.length, loaded: 0, failed: 0, percentage: 0 }
      }));

      // Process in small batches with delays
      for (let i = 0; i < userEscrowIds.length; i += RATE_LIMIT.batchSize) {
        // Check if operation was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          console.log('🛑 Operation cancelled');
          return;
        }

        const batch = userEscrowIds.slice(i, i + RATE_LIMIT.batchSize);
        console.log(`📦 Processing batch ${Math.floor(i/RATE_LIMIT.batchSize) + 1}/${Math.ceil(userEscrowIds.length/RATE_LIMIT.batchSize)}`);

        // Process batch with individual delays
        for (const escrowId of batch) {
          try {
            const escrow = await getCachedOrFetchEscrow(contract, escrowId);
            
            if (escrow) {
              activeEscrows.push(escrow);
              
              // Calculate stats
              const userAddr = userAddress.toLowerCase();
              if (escrow.buyer.toLowerCase() === userAddr) stats.asBuyer++;
              if (escrow.seller.toLowerCase() === userAddr) stats.asSeller++;
              if (escrow.arbiter.toLowerCase() === userAddr) stats.asArbiter++;
              if (escrow.disputeRaised) stats.disputed++;
              stats.total++;
              
              loaded++;
            } else {
              failed++;
            }
          } catch (error) {
            console.error(`❌ Error processing escrow ${escrowId}:`, error);
            failed++;
          }
          
          // Update progress
          const percentage = Math.round(((loaded + failed) / userEscrowIds.length) * 100);
          setState(prev => ({
            ...prev,
            progress: { total: userEscrowIds.length, loaded, failed, percentage },
            activeEscrows: [...activeEscrows]
          }));
          
          // Small delay between individual requests
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.delayBetweenRequests));
        }
        
        // Longer delay between batches
        if (i + RATE_LIMIT.batchSize < userEscrowIds.length) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.delayBetweenBatches));
        }
      }

      // Sort by ID (newest first)
      activeEscrows.sort((a, b) => parseInt(b.id) - parseInt(a.id));

      console.log('✅ Optimized loading complete:', {
        total: userEscrowIds.length,
        loaded,
        failed,
        cached: userEscrowIds.length - (loaded + failed),
        stats
      });

      setState(prev => ({
        ...prev,
        activeEscrows,
        loading: false,
        error: failed > 0 ? `Loaded ${loaded}/${userEscrowIds.length} escrows (${failed} failed)` : null,
        lastUpdated: Date.now(),
        stats
      }));

    } catch (error) {
      console.error('❌ Critical error in optimized escrow loading:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load escrows'
      }));
    }
  }, [getUserEscrowIds, getCachedOrFetchEscrow]);

  // Quick refresh with staleness check
  const refreshIfStale = useCallback(async (
    contract: EscrowContract,
    userAddress: string,
    maxAge: number = 60000 // Increased to 1 minute due to rate limits
  ) => {
    const now = Date.now();
    const isStale = now - state.lastUpdated > maxAge;

    if (isStale || state.activeEscrows.length === 0) {
      console.log('🔄 Data is stale, refreshing with Ankr RPC...');
      await loadActiveEscrows(contract, userAddress);
    } else {
      console.log('✅ Data is fresh, no refresh needed');
    }
  }, [state.lastUpdated, state.activeEscrows.length, loadActiveEscrows]);

  // Clear cache when needed
  const clearCache = useCallback(() => {
    escrowCache.clear();
    console.log('🧹 Escrow cache cleared');
  }, []);

  // Cleanup on unmount
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
    isStale: Date.now() - state.lastUpdated > 60000,
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
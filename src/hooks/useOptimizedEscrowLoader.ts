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

  // Get cached or fetch active escrow
  const getCachedOrFetchActiveEscrow = useCallback(async (
    contract: EscrowContract,
    escrowId: string
  ): Promise<Escrow | null> => {
    const cacheKey = `active-${contract.target}-${escrowId}`;
    const cached = activeEscrowCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      console.log(`📋 Cache hit for active escrow ${escrowId}`);
      return cached.data;
    }

    await waitForRateLimit();
    
    try {
      incrementRequestCount();
      console.log(`🔄 Checking escrow ${escrowId} for active status`);
      
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

      if (isActiveEscrow(escrow)) {
        activeEscrowCache.set(cacheKey, { data: escrow, timestamp: Date.now() });
        console.log(`✅ Active escrow ${escrowId} cached`);
        return escrow;
      } else {
        console.log(`⏭️ Escrow ${escrowId} is completed, skipping`);
        return null;
      }
      
    } catch (error) {
      console.error(`❌ Failed to fetch escrow ${escrowId}:`, error);
      return null;
    }
  }, [waitForRateLimit, incrementRequestCount]);

  // Get user's escrow IDs
  const getUserEscrowIds = useCallback(async (
    contract: EscrowContract,
    userAddress: string
  ): Promise<string[]> => {
    await waitForRateLimit();
    
    try {
      incrementRequestCount();
      console.log('🔍 Getting user escrow IDs from Ankr RPC');
      
      const escrowIds = await contract.getUserEscrows(userAddress);
      return escrowIds.map((id: unknown) => id?.toString() || '0');
    } catch (error) {
      console.error('❌ Failed to get user escrow IDs:', error);
      
      // Fallback: check recent escrows only
      try {
        await waitForRateLimit();
        incrementRequestCount();
        
        const totalCount = await contract.getEscrowCount();
        const total = Number(totalCount);
        
        console.log(`📊 Fallback: checking recent escrows for active ones (total: ${total})`);
        
        const maxToCheck = Math.min(total, 30);
        const startId = Math.max(0, total - maxToCheck);
        const userEscrowIds: string[] = [];
        
        for (let i = startId; i < total; i += RATE_LIMIT.batchSize) {
          const batch = [];
          const batchEnd = Math.min(i + RATE_LIMIT.batchSize, total);
          
          for (let j = i; j < batchEnd; j++) {
            batch.push(j.toString());
          }
          
          const batchPromises = batch.map(async (id) => {
            const escrow = await getCachedOrFetchActiveEscrow(contract, id);
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
  }, [waitForRateLimit, incrementRequestCount, getCachedOrFetchActiveEscrow]);

  // Main loading function - ACTIVE ESCROWS ONLY
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
      console.log('🚀 Loading ACTIVE escrows only with Ankr RPC optimization');
      
      const userEscrowIds = await getUserEscrowIds(contract, userAddress);
      
      if (userEscrowIds.length === 0) {
        setState(prev => ({
          ...prev,
          loading: false,
          activeEscrows: [],
          stats: { total: 0, asBuyer: 0, asSeller: 0, asArbiter: 0, disputed: 0 },
          lastUpdated: Date.now()
        }));
        console.log('📭 No escrows found for user');
        return;
      }

      console.log(`📋 Found ${userEscrowIds.length} potential escrows, filtering for active ones...`);
      
      const activeEscrows: Escrow[] = [];
      const stats = { total: 0, asBuyer: 0, asSeller: 0, asArbiter: 0, disputed: 0 };
      let loaded = 0;
      let failed = 0;

      setState(prev => ({
        ...prev,
        progress: { total: userEscrowIds.length, loaded: 0, failed: 0, percentage: 0 }
      }));

      for (let i = 0; i < userEscrowIds.length; i += RATE_LIMIT.batchSize) {
        if (abortControllerRef.current?.signal.aborted) {
          console.log('🛑 Operation cancelled');
          return;
        }

        const batch = userEscrowIds.slice(i, i + RATE_LIMIT.batchSize);
        console.log(`📦 Processing batch for active escrows: ${batch.join(', ')}`);

        for (const escrowId of batch) {
          try {
            const escrow = await getCachedOrFetchActiveEscrow(contract, escrowId);
            
            if (escrow && isActiveEscrow(escrow)) {
              activeEscrows.push(escrow);
              
              const userAddr = userAddress.toLowerCase();
              if (escrow.buyer.toLowerCase() === userAddr) stats.asBuyer++;
              if (escrow.seller.toLowerCase() === userAddr) stats.asSeller++;
              if (escrow.arbiter.toLowerCase() === userAddr) stats.asArbiter++;
              if (escrow.disputeRaised) stats.disputed++;
              stats.total++;
              
              loaded++;
              console.log(`✅ Active escrow ${escrowId} loaded`);
            } else {
              loaded++;
            }
          } catch (error) {
            console.error(`❌ Error processing escrow ${escrowId}:`, error);
            failed++;
          }
          
          const percentage = Math.round(((loaded + failed) / userEscrowIds.length) * 100);
          setState(prev => ({
            ...prev,
            progress: { total: userEscrowIds.length, loaded, failed, percentage },
            activeEscrows: [...activeEscrows]
          }));
          
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.delayBetweenRequests));
        }
        
        if (i + RATE_LIMIT.batchSize < userEscrowIds.length) {
          await new Promise(resolve => setTimeout(resolve, RATE_LIMIT.delayBetweenBatches));
        }
      }

      activeEscrows.sort((a, b) => parseInt(b.id) - parseInt(a.id));

      console.log('✅ Active-only loading complete:', {
        totalChecked: userEscrowIds.length,
        activeFound: activeEscrows.length,
        loaded,
        failed,
        stats
      });

      setState(prev => ({
        ...prev,
        activeEscrows,
        loading: false,
        error: failed > 0 ? `Processed ${loaded}/${userEscrowIds.length} escrows (${failed} failed)` : null,
        lastUpdated: Date.now(),
        stats
      }));

    } catch (error) {
      console.error('❌ Critical error in active escrow loading:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load active escrows'
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
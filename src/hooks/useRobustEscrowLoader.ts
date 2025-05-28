// src/hooks/useRobustEscrowLoader.ts - Reliable escrow loading with retry logic
import { useState, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { Escrow, EscrowContract } from '../types';

interface RobustEscrowState {
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

const useRobustEscrowLoader = () => {
  const [state, setState] = useState<RobustEscrowState>({
    activeEscrows: [],
    loading: false,
    error: null,
    lastUpdated: 0,
    progress: { total: 0, loaded: 0, failed: 0, percentage: 0 },
    stats: { total: 0, asBuyer: 0, asSeller: 0, asArbiter: 0, disputed: 0 }
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  // Helper to format escrow data
  const formatEscrow = (id: number, data: any): Escrow => ({
    id: id.toString(),
    buyer: data[0],
    seller: data[1],
    arbiter: data[2],
    amount: ethers.formatEther(data[3]),
    fundsDisbursed: data[4],
    disputeRaised: data[5]
  });

  // ROBUST: Load individual escrow with retries
  const loadEscrowWithRetry = async (
    contract: EscrowContract,
    escrowId: any,
    maxRetries: number = 3
  ): Promise<Escrow | null> => {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Add timeout to prevent hanging
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 5000);
        });

        const dataPromise = contract.getEscrow(escrowId);
        const data = await Promise.race([dataPromise, timeoutPromise]);
        
        const escrow = formatEscrow(Number(escrowId), data);
        
        // Only return if it's active (not completed)
        if (!escrow.fundsDisbursed) {
          return escrow;
        }
        return null; // Skip completed escrows
        
      } catch (error: any) {
        console.warn(`Attempt ${attempt}/${maxRetries} failed for escrow ${escrowId}:`, error.message);
        
        if (attempt === maxRetries) {
          // Final attempt failed
          return null;
        }
        
        // Wait before retry (exponential backoff)
        await new Promise(resolve => setTimeout(resolve, attempt * 500));
      }
    }
    return null;
  };

  // ROBUST: Load all escrows with comprehensive error handling
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
      console.log('🔄 Starting robust escrow loading for:', userAddress);

      // STEP 1: Get user's escrow IDs with retry
      let userEscrowIds: any[] = [];
      
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          userEscrowIds = await contract.getUserEscrows(userAddress);
          console.log(`✅ Got ${userEscrowIds.length} escrow IDs on attempt ${attempt}`);
          break;
        } catch (error) {
          console.error(`❌ Attempt ${attempt}/3 to get user escrows failed:`, error);
          if (attempt === 3) {
            throw new Error('Failed to get user escrow IDs after 3 attempts');
          }
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      if (userEscrowIds.length === 0) {
        setState(prev => ({
          ...prev,
          loading: false,
          activeEscrows: [],
          stats: { total: 0, asBuyer: 0, asSeller: 0, asArbiter: 0, disputed: 0 }
        }));
        return;
      }

      // STEP 2: Load each escrow with progress tracking
      const activeEscrows: Escrow[] = [];
      const stats = { total: 0, asBuyer: 0, asSeller: 0, asArbiter: 0, disputed: 0 };
      
      setState(prev => ({
        ...prev,
        progress: { total: userEscrowIds.length, loaded: 0, failed: 0, percentage: 0 }
      }));

      // Process escrows in small batches to ensure reliability
      const BATCH_SIZE = 3; // Very small batches for reliability
      let loaded = 0;
      let failed = 0;

      for (let i = 0; i < userEscrowIds.length; i += BATCH_SIZE) {
        // Check if operation was cancelled
        if (abortControllerRef.current?.signal.aborted) {
          console.log('🛑 Operation cancelled');
          return;
        }

        const batch = userEscrowIds.slice(i, i + BATCH_SIZE);
        console.log(`📦 Processing batch ${Math.floor(i/BATCH_SIZE) + 1}/${Math.ceil(userEscrowIds.length/BATCH_SIZE)}: escrows ${batch.join(', ')}`);

        // Process batch with individual retry logic
        const batchPromises = batch.map(async (escrowId) => {
          try {
            const escrow = await loadEscrowWithRetry(contract, escrowId, 3);
            
            if (escrow) {
              // Calculate stats
              const userAddr = userAddress.toLowerCase();
              if (escrow.buyer.toLowerCase() === userAddr) stats.asBuyer++;
              if (escrow.seller.toLowerCase() === userAddr) stats.asSeller++;
              if (escrow.arbiter.toLowerCase() === userAddr) stats.asArbiter++;
              if (escrow.disputeRaised) stats.disputed++;
              stats.total++;
              
              loaded++;
              return escrow;
            } else {
              loaded++; // Count as loaded even if filtered out
              return null;
            }
          } catch (error) {
            failed++;
            console.error(`❌ Failed to load escrow ${escrowId}:`, error);
            return null;
          }
        });

        const batchResults = await Promise.allSettled(batchPromises);
        
        // Collect successful results
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            activeEscrows.push(result.value);
          }
        });

        // Update progress
        const percentage = Math.round(((loaded + failed) / userEscrowIds.length) * 100);
        setState(prev => ({
          ...prev,
          progress: { total: userEscrowIds.length, loaded, failed, percentage },
          activeEscrows: [...activeEscrows], // Update UI with current results
          stats: { ...stats }
        }));

        // Small delay between batches for network stability
        if (i + BATCH_SIZE < userEscrowIds.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }

      // Sort by ID (newest first)
      activeEscrows.sort((a, b) => parseInt(b.id) - parseInt(a.id));

      console.log('✅ Robust loading complete:', {
        total: userEscrowIds.length,
        active: activeEscrows.length,
        loaded,
        failed,
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
      console.error('❌ Critical error in robust escrow loading:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load escrows'
      }));
    }
  }, []);

  // Quick refresh with staleness check
  const refreshIfStale = useCallback(async (
    contract: EscrowContract,
    userAddress: string,
    maxAge: number = 30000
  ) => {
    const now = Date.now();
    const isStale = now - state.lastUpdated > maxAge;

    if (isStale || state.activeEscrows.length === 0) {
      console.log('🔄 Data is stale, refreshing...');
      await loadActiveEscrows(contract, userAddress);
    } else {
      console.log('✅ Data is fresh, no refresh needed');
    }
  }, [state.lastUpdated, state.activeEscrows.length, loadActiveEscrows]);

  // Force refresh
  const forceRefresh = useCallback(async (
    contract: EscrowContract,
    userAddress: string
  ) => {
    console.log('🔄 Force refresh requested');
    await loadActiveEscrows(contract, userAddress);
  }, [loadActiveEscrows]);

  // Cancel current operation
  const cancelLoading = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Operation cancelled'
      }));
    }
  }, []);

  // Clear all data
  const clearData = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState({
      activeEscrows: [],
      loading: false,
      error: null,
      lastUpdated: 0,
      progress: { total: 0, loaded: 0, failed: 0, percentage: 0 },
      stats: { total: 0, asBuyer: 0, asSeller: 0, asArbiter: 0, disputed: 0 }
    });
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
    forceRefresh,
    cancelLoading,
    clearData,

    // Computed values
    hasData: state.activeEscrows.length > 0,
    isStale: Date.now() - state.lastUpdated > 30000,
    isPartiallyLoaded: state.progress.failed > 0 && state.progress.loaded > 0
  };
};

export default useRobustEscrowLoader;
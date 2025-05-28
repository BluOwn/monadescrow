// src/hooks/useOptimizedEscrowLoader.ts
import { useState, useCallback, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import { Escrow, EscrowContract } from '../types';

interface OptimizedEscrowState {
  userEscrows: Escrow[];
  arbitratedEscrows: Escrow[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  totalChecked: number;
  progress: number;
}

export const useOptimizedEscrowLoader = () => {
  const [state, setState] = useState<OptimizedEscrowState>({
    userEscrows: [],
    arbitratedEscrows: [],
    loading: false,
    error: null,
    lastUpdated: 0,
    totalChecked: 0,
    progress: 0
  });

  // Use refs to prevent memory leaks and excessive re-renders
  const abortControllerRef = useRef<AbortController | null>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Safe state update that checks if component is still mounted
  const safeSetState = useCallback((updater: (prev: OptimizedEscrowState) => OptimizedEscrowState) => {
    if (!isUnmountedRef.current) {
      setState(updater);
    }
  }, []);

  // Helper to format escrow data
  const formatEscrow = useCallback((id: number, data: any): Escrow | null => {
    try {
      return {
        id: id.toString(),
        buyer: data[0],
        seller: data[1],
        arbiter: data[2],
        amount: ethers.formatEther(data[3]),
        fundsDisbursed: data[4],
        disputeRaised: data[5]
      };
    } catch (error) {
      console.warn(`Failed to format escrow ${id}:`, error);
      return null;
    }
  }, []);

  // OPTIMIZED: Load user escrows efficiently
  const loadUserEscrows = useCallback(async (
    contract: EscrowContract, 
    userAddress: string
  ): Promise<Escrow[]> => {
    try {
      console.log('📝 Loading user escrows for:', userAddress);
      
      // Get user's escrow IDs first
      const userEscrowIds = await contract.getUserEscrows(userAddress);
      console.log(`Found ${userEscrowIds.length} user escrows`);
      
      if (userEscrowIds.length === 0) {
        return [];
      }

      // Limit to prevent excessive loading
      const MAX_USER_ESCROWS = 50;
      const escrowIdsToLoad = userEscrowIds.slice(-MAX_USER_ESCROWS); // Get the most recent ones
      
      // Load escrows in small batches with timeout
      const BATCH_SIZE = 5;
      const userEscrows: Escrow[] = [];
      
      for (let i = 0; i < escrowIdsToLoad.length; i += BATCH_SIZE) {
        if (isUnmountedRef.current || abortControllerRef.current?.signal.aborted) {
          break;
        }
        
        const batch = escrowIdsToLoad.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (id: any) => {
          try {
            // Add timeout to prevent hanging
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Timeout')), 3000);
            });
            
            const dataPromise = contract.getEscrow(id);
            const data = await Promise.race([dataPromise, timeoutPromise]);
            
            return formatEscrow(Number(id), data);
          } catch (error) {
            // Silent fail for individual escrows
            return null;
          }
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            userEscrows.push(result.value);
          }
        });
        
        // Small delay between batches
        if (i + BATCH_SIZE < escrowIdsToLoad.length) {
          await new Promise(resolve => setTimeout(resolve, 200));
        }
      }
      
      // Sort by ID descending (newest first)
      userEscrows.sort((a, b) => parseInt(b.id) - parseInt(a.id));
      
      console.log(`✅ Loaded ${userEscrows.length} user escrows`);
      return userEscrows;
      
    } catch (error) {
      console.error('Error loading user escrows:', error);
      throw error;
    }
  }, [formatEscrow]);

  // OPTIMIZED: Load arbitrated escrows with smart sampling
  const loadArbitratedEscrows = useCallback(async (
    contract: EscrowContract, 
    userAddress: string
  ): Promise<Escrow[]> => {
    try {
      console.log('⚖️ Loading arbitrated escrows for:', userAddress);
      
      const totalEscrowCount = await contract.getEscrowCount();
      const totalCount = Number(totalEscrowCount);
      
      console.log(`Total escrows in contract: ${totalCount}`);
      
      if (totalCount === 0) {
        return [];
      }
      
      // OPTIMIZATION: Smart sampling instead of checking all escrows
      // Check recent escrows first, then sample older ones
      const MAX_RECENT_CHECK = 100; // Check last 100 escrows fully
      const MAX_SAMPLE_CHECK = 50;  // Sample 50 from older escrows
      
      const escrowsToCheck: number[] = [];
      
      // 1. Add recent escrows (more likely to be active)
      const recentStart = Math.max(0, totalCount - MAX_RECENT_CHECK);
      for (let i = recentStart; i < totalCount; i++) {
        escrowsToCheck.push(i);
      }
      
      // 2. Sample older escrows if there are any
      if (recentStart > 0) {
        const olderEscrowsCount = recentStart;
        const sampleSize = Math.min(MAX_SAMPLE_CHECK, olderEscrowsCount);
        const sampleStep = Math.floor(olderEscrowsCount / sampleSize);
        
        for (let i = 0; i < sampleSize; i++) {
          const escrowId = i * sampleStep;
          if (escrowId < recentStart) {
            escrowsToCheck.push(escrowId);
          }
        }
      }
      
      console.log(`Checking ${escrowsToCheck.length} escrows for arbitration`);
      
      const arbitratedEscrows: Escrow[] = [];
      const BATCH_SIZE = 8;
      let processed = 0;
      
      // Process in batches with progress reporting
      for (let i = 0; i < escrowsToCheck.length; i += BATCH_SIZE) {
        if (isUnmountedRef.current || abortControllerRef.current?.signal.aborted) {
          break;
        }
        
        const batch = escrowsToCheck.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (escrowId) => {
          try {
            // Add timeout
            const timeoutPromise = new Promise((_, reject) => {
              setTimeout(() => reject(new Error('Timeout')), 2000);
            });
            
            const dataPromise = contract.getEscrow(escrowId);
            const data = await Promise.race([dataPromise, timeoutPromise]);
            
            const escrow = formatEscrow(escrowId, data);
            
            // Check if user is arbiter
            if (escrow && escrow.arbiter.toLowerCase() === userAddress.toLowerCase()) {
              return escrow;
            }
            return null;
          } catch (error) {
            // Silent fail for individual checks
            return null;
          }
        });
        
        const batchResults = await Promise.allSettled(batchPromises);
        
        batchResults.forEach(result => {
          if (result.status === 'fulfilled' && result.value) {
            arbitratedEscrows.push(result.value);
          }
        });
        
        processed += batch.length;
        
        // Update progress
        safeSetState(prev => ({
          ...prev,
          totalChecked: processed,
          progress: (processed / escrowsToCheck.length) * 100
        }));
        
        // Small delay between batches
        if (i + BATCH_SIZE < escrowsToCheck.length) {
          await new Promise(resolve => setTimeout(resolve, 150));
        }
      }
      
      // Sort by ID descending
      arbitratedEscrows.sort((a, b) => parseInt(b.id) - parseInt(a.id));
      
      console.log(`✅ Found ${arbitratedEscrows.length} arbitrated escrows`);
      return arbitratedEscrows;
      
    } catch (error) {
      console.error('Error loading arbitrated escrows:', error);
      throw error;
    }
  }, [formatEscrow, safeSetState]);

  // MAIN LOADING FUNCTION - Optimized and cancellable
  const loadAllEscrows = useCallback(async (
    contract: EscrowContract, 
    userAddress: string
  ) => {
    // Cancel any existing operation
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Clear existing timeout
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    safeSetState(prev => ({ 
      ...prev, 
      loading: true, 
      error: null, 
      progress: 0,
      totalChecked: 0
    }));
    
    // Set overall timeout
    loadingTimeoutRef.current = setTimeout(() => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      safeSetState(prev => ({
        ...prev,
        loading: false,
        error: 'Loading timed out. Please try again.'
      }));
    }, 30000); // 30 second timeout
    
    try {
      console.log('🔄 Starting optimized escrow loading...');
      
      // Load user escrows and arbitrated escrows in sequence (not parallel to reduce load)
      safeSetState(prev => ({ ...prev, progress: 10 }));
      
      const userEscrows = await loadUserEscrows(contract, userAddress);
      
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      safeSetState(prev => ({ 
        ...prev, 
        userEscrows,
        progress: 50 
      }));
      
      const arbitratedEscrows = await loadArbitratedEscrows(contract, userAddress);
      
      if (abortControllerRef.current?.signal.aborted) {
        return;
      }
      
      safeSetState(prev => ({
        ...prev,
        arbitratedEscrows,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
        progress: 100
      }));
      
      console.log('✅ Escrow loading completed successfully');
      
    } catch (error) {
      if (!abortControllerRef.current?.signal.aborted) {
        console.error('❌ Error loading escrows:', error);
        safeSetState(prev => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load escrows'
        }));
      }
    } finally {
      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
        loadingTimeoutRef.current = null;
      }
    }
  }, [loadUserEscrows, loadArbitratedEscrows, safeSetState]);

  // Quick refresh function - only reloads if data is stale
  const refreshIfStale = useCallback(async (
    contract: EscrowContract, 
    userAddress: string, 
    maxAge: number = 60000 // Increased to 1 minute
  ) => {
    const now = Date.now();
    const isStale = now - state.lastUpdated > maxAge;
    
    if (isStale || state.userEscrows.length === 0) {
      console.log('🔄 Data is stale, refreshing...');
      await loadAllEscrows(contract, userAddress);
    } else {
      console.log('✅ Data is fresh, no refresh needed');
    }
  }, [state.lastUpdated, state.userEscrows.length, loadAllEscrows]);

  // Force refresh - always reloads
  const forceRefresh = useCallback(async (
    contract: EscrowContract, 
    userAddress: string
  ) => {
    console.log('🔄 Force refresh requested');
    await loadAllEscrows(contract, userAddress);
  }, [loadAllEscrows]);

  // Cancel current loading operation
  const cancelLoading = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (loadingTimeoutRef.current) {
      clearTimeout(loadingTimeoutRef.current);
      loadingTimeoutRef.current = null;
    }
    safeSetState(prev => ({
      ...prev,
      loading: false,
      error: null
    }));
  }, [safeSetState]);

  // Clear all data
  const clearData = useCallback(() => {
    cancelLoading();
    safeSetState(prev => ({
      ...prev,
      userEscrows: [],
      arbitratedEscrows: [],
      error: null,
      lastUpdated: 0,
      totalChecked: 0,
      progress: 0
    }));
  }, [cancelLoading, safeSetState]);

  return {
    // Data
    userEscrows: state.userEscrows,
    arbitratedEscrows: state.arbitratedEscrows,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    progress: state.progress,
    totalChecked: state.totalChecked,
    
    // Actions
    loadAllEscrows,
    refreshIfStale,
    forceRefresh,
    clearData,
    cancelLoading,
    
    // Computed values
    hasData: state.userEscrows.length > 0 || state.arbitratedEscrows.length > 0,
    isStale: Date.now() - state.lastUpdated > 60000
  };
};
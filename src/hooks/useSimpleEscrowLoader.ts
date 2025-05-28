// src/hooks/useSimpleEscrowLoader.ts - Fixed export and optimized
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { Escrow, EscrowContract } from '../types';

interface SimpleEscrowState {
  userEscrows: Escrow[];
  arbitratedEscrows: Escrow[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
}

// OPTIMIZED: Use the new cache utility
import { getEscrowFast } from '../utils/optimizedCacheUtils';

const useSimpleEscrowLoader = () => {
  const [state, setState] = useState<SimpleEscrowState>({
    userEscrows: [],
    arbitratedEscrows: [],
    loading: false,
    error: null,
    lastUpdated: 0
  });

  // Helper to convert contract data to Escrow object
  const formatEscrow = (id: number, data: any): Escrow => ({
    id: id.toString(),
    buyer: data[0],
    seller: data[1],
    arbiter: data[2],
    amount: ethers.formatEther(data[3]),
    fundsDisbursed: data[4],
    disputeRaised: data[5]
  });

  // OPTIMIZED: Main loading function - reduced API calls and better error handling
  const loadAllEscrows = useCallback(async (
    contract: EscrowContract, 
    userAddress: string
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🔄 Loading escrows for:', userAddress);
      
      // STEP 1: Load user's own escrows (fast and reliable)
      const userEscrowIds = await contract.getUserEscrows(userAddress);
      console.log('📝 User escrow IDs:', userEscrowIds.length);
      
      // Limit user escrows to prevent excessive loading
      const MAX_USER_ESCROWS = 50;
      const userEscrowIdsToLoad = userEscrowIds.slice(-MAX_USER_ESCROWS);
      
      const userEscrowPromises = userEscrowIdsToLoad.map(async (id: any) => {
        try {
          const data = await contract.getEscrow(id);
          return formatEscrow(Number(id), data);
        } catch (error) {
          console.warn(`Failed to load user escrow ${id}:`, error);
          return null;
        }
      });
      
      const userEscrows = (await Promise.all(userEscrowPromises))
        .filter(escrow => escrow !== null) as Escrow[];
      
      // STEP 2: Load arbitrated escrows (OPTIMIZED approach)
      const totalEscrowCount = await contract.getEscrowCount();
      const totalCount = Number(totalEscrowCount);
      console.log('📊 Total escrows in contract:', totalCount);
      
      // OPTIMIZATION: Smart sampling instead of checking ALL escrows
      const MAX_RECENT_CHECK = 50;  // Reduced from 200
      const MAX_SAMPLE_CHECK = 25;  // Reduced from 50
      
      const escrowsToCheck: number[] = [];
      
      // 1. Check recent escrows (more likely to be active)
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
      
      console.log(`🔍 Checking ${escrowsToCheck.length} escrows for arbitration (reduced from ${totalCount})`);
      
      const arbitratedEscrows: Escrow[] = [];
      
      // OPTIMIZATION: Process in smaller batches to reduce server load
      const BATCH_SIZE = 5; // Reduced from 20
      for (let i = 0; i < escrowsToCheck.length; i += BATCH_SIZE) {
        const batchEnd = Math.min(i + BATCH_SIZE, escrowsToCheck.length);
        const batchIds = escrowsToCheck.slice(i, batchEnd);
        
        const batchPromises = batchIds.map(async (id) => {
          try {
            const data = await contract.getEscrow(id);
            const escrow = formatEscrow(id, data);
            
            // Check if user is the arbiter
            if (escrow.arbiter.toLowerCase() === userAddress.toLowerCase()) {
              return escrow;
            }
            return null;
          } catch (error) {
            // Silently skip failed escrows (probably don't exist)
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        const validEscrows = batchResults.filter(escrow => escrow !== null) as Escrow[];
        arbitratedEscrows.push(...validEscrows);
        
        // Small delay between batches to be nice to the network
        if (i + BATCH_SIZE < escrowsToCheck.length) {
          await new Promise(resolve => setTimeout(resolve, 200)); // Increased delay
        }
      }
      
      // Sort escrows by ID (newest first)
      const sortByIdDesc = (a: Escrow, b: Escrow) => parseInt(b.id) - parseInt(a.id);
      userEscrows.sort(sortByIdDesc);
      arbitratedEscrows.sort(sortByIdDesc);
      
      console.log('✅ Loading complete:', {
        userEscrows: userEscrows.length,
        arbitratedEscrows: arbitratedEscrows.length,
        totalChecked: escrowsToCheck.length,
        totalAvailable: totalCount
      });
      
      setState({
        userEscrows,
        arbitratedEscrows,
        loading: false,
        error: null,
        lastUpdated: Date.now()
      });
      
    } catch (error) {
      console.error('❌ Error loading escrows:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load escrows'
      }));
    }
  }, []);

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

  // Clear all data
  const clearData = useCallback(() => {
    setState({
      userEscrows: [],
      arbitratedEscrows: [],
      loading: false,
      error: null,
      lastUpdated: 0
    });
  }, []);

  return {
    // Data
    userEscrows: state.userEscrows,
    arbitratedEscrows: state.arbitratedEscrows,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    
    // Actions
    loadAllEscrows,
    refreshIfStale,
    forceRefresh,
    clearData,
    
    // Computed values
    hasData: state.userEscrows.length > 0 || state.arbitratedEscrows.length > 0,
    isStale: Date.now() - state.lastUpdated > 60000 // 1 minute
  };
};

// Export as both named and default export
export { useSimpleEscrowLoader };
export default useSimpleEscrowLoader;
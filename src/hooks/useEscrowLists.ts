// src/hooks/useEscrowLists.ts - Updated with correct imports
import { useState, useCallback } from 'react';
import { Escrow, EscrowContract } from '../types';
import { getEscrowFast } from '../utils/optimizedCacheUtils'; // Updated import
import { delayBetweenCalls } from '../utils/networkUtils';
import { ethers } from 'ethers';

export interface EscrowListsState {
  escrows: Escrow[];
  arbitratedEscrows: Escrow[];
  loadingEscrows: boolean;
  loadingArbitratedEscrows: boolean;
}

export function useEscrowLists() {
  const [state, setState] = useState<EscrowListsState>({
    escrows: [],
    arbitratedEscrows: [],
    loadingEscrows: false,
    loadingArbitratedEscrows: false
  });

  // Helper function to sort escrows from newest to oldest (by ID)
  const sortEscrowsNewestFirst = (escrows: Escrow[]): Escrow[] => {
    return [...escrows].sort((a, b) => {
      const idA = parseInt(a.id);
      const idB = parseInt(b.id);
      return idB - idA; // Descending order (newest first)
    });
  };

  // OPTIMIZED: Load user escrows function with silent error handling
  const loadUserEscrows = useCallback(async (
    escrowContract: EscrowContract, 
    userAddress: string, 
    maxRetries: number = 2,
    forceRefresh: boolean = false
  ): Promise<void> => {
    let retries = 0;
    setState(prev => ({ ...prev, loadingEscrows: true }));
    
    // Clear existing data if force refresh
    if (forceRefresh) {
      setState(prev => ({ ...prev, escrows: [] }));
    }
    
    while (retries < maxRetries) {
      try {
        if (retries > 0) {
          await delayBetweenCalls(1000);
        }
        
        if (!escrowContract || !escrowContract.getUserEscrows) {
          throw new Error('Contract not properly initialized');
        }
        
        // Get the IDs first
        const escrowIds = await escrowContract.getUserEscrows(userAddress);
        
        if (escrowIds.length === 0) {
          setState(prev => ({ ...prev, escrows: [], loadingEscrows: false }));
          return;
        }
        
        // OPTIMIZATION: Load all escrow details in parallel with smaller batches
        const BATCH_SIZE = 5; // Reduced batch size
        const batches: any[][] = [];
        
        for (let i = 0; i < escrowIds.length; i += BATCH_SIZE) {
          batches.push(escrowIds.slice(i, i + BATCH_SIZE));
        }
        
        const allEscrows: Escrow[] = [];
        
        // Process batches sequentially to reduce load
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
          
          if (batchIndex > 0) {
            await delayBetweenCalls(300);
          }
          
          const batchResults = await Promise.allSettled(
            batch.map(async (escrowId: any) => {
              try {
                return await getEscrowFast(escrowContract as unknown as ethers.Contract, escrowId);
              } catch (err: any) {
                // Silent handling - don't log expected errors
                if (err && typeof err === 'object' && err.message && !err.message.includes('does not exist')) {
                  console.warn(`Error loading escrow ${escrowId}:`, err);
                }
                return null; // Return null for non-existent escrows
              }
            })
          );
          
          const validEscrows = batchResults
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => (result as PromiseFulfilledResult<Escrow>).value);
          
          allEscrows.push(...validEscrows);
        }
        
        // Sort and set final results
        const sortedEscrows = sortEscrowsNewestFirst(allEscrows);
        setState(prev => ({ 
          ...prev, 
          escrows: sortedEscrows,
          loadingEscrows: false 
        }));
        
        return; // Success
        
      } catch (error) {
        console.error(`Attempt ${retries + 1} failed loading escrows:`, error);
        retries++;
        
        if (retries >= maxRetries) {
          setState(prev => ({ ...prev, loadingEscrows: false }));
          throw error;
        }
        
        await delayBetweenCalls(1000 * retries);
      }
    }
  }, []);

  // OPTIMIZED: Load arbitrated escrows function with smart sampling
  const loadArbitratedEscrows = useCallback(async (
    escrowContract: EscrowContract, 
    arbiterAddress: string, 
    maxRetries: number = 2,
    forceRefresh: boolean = false
  ): Promise<void> => {
    let retries = 0;
    setState(prev => ({ ...prev, loadingArbitratedEscrows: true }));
    
    // Clear existing data if force refresh
    if (forceRefresh) {
      setState(prev => ({ ...prev, arbitratedEscrows: [] }));
    }
    
    while (retries < maxRetries) {
      try {
        if (retries > 0) {
          await delayBetweenCalls(1000);
        }
        
        if (!escrowContract || !escrowContract.getEscrowCount) {
          throw new Error('Contract not properly initialized');
        }
        
        // Get total escrow count
        const escrowCount = await escrowContract.getEscrowCount();
        const totalEscrows = Number(escrowCount);
        
        if (totalEscrows === 0) {
          setState(prev => ({ 
            ...prev, 
            arbitratedEscrows: [],
            loadingArbitratedEscrows: false 
          }));
          return;
        }
        
        // OPTIMIZATION: Smart sampling instead of checking all escrows
        const MAX_RECENT_CHECK = 50; // Reduced from 100
        const MAX_SAMPLE_CHECK = 25;  // Reduced from 50
        
        const escrowsToCheck: number[] = [];
        
        // 1. Add recent escrows (more likely to be active)
        const recentStart = Math.max(0, totalEscrows - MAX_RECENT_CHECK);
        for (let i = recentStart; i < totalEscrows; i++) {
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
        
        // OPTIMIZATION: Process in smaller batches
        const BATCH_SIZE = 5; // Reduced batch size
        const batches: number[][] = [];
        
        for (let i = 0; i < escrowsToCheck.length; i += BATCH_SIZE) {
          batches.push(escrowsToCheck.slice(i, i + BATCH_SIZE));
        }
        
        const arbitratedEscrows: Escrow[] = [];
        
        // Process batches sequentially to reduce server load
        for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
          const batch = batches[batchIndex];
          
          if (batchIndex > 0) {
            await delayBetweenCalls(200);
          }
          
          const batchResults = await Promise.allSettled(
            batch.map(async (escrowId) => {
              try {
                const escrow = await getEscrowFast(escrowContract as unknown as ethers.Contract, escrowId);
                
                // Check if user is arbiter (case-insensitive)
                if (escrow.arbiter.toLowerCase() === arbiterAddress.toLowerCase()) {
                  return escrow;
                }
                return null;
              } catch (err: any) {
                // Silent handling - don't log expected errors for non-existent escrows
                if (err && typeof err === 'object' && err.message && !err.message.includes('does not exist')) {
                  console.warn(`Error fetching escrow #${escrowId}:`, err);
                }
                return null;
              }
            })
          );
          
          const validEscrows = batchResults
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => (result as PromiseFulfilledResult<Escrow>).value);
          
          arbitratedEscrows.push(...validEscrows);
        }
        
        // Sort and set final results
        const sortedArbitratedEscrows = sortEscrowsNewestFirst(arbitratedEscrows);
        setState(prev => ({ 
          ...prev, 
          arbitratedEscrows: sortedArbitratedEscrows,
          loadingArbitratedEscrows: false
        }));
        
        console.log(`Total arbitrated escrows found: ${sortedArbitratedEscrows.length}`);
        return; // Success
        
      } catch (error) {
        console.error(`Attempt ${retries + 1} failed loading arbitrated escrows:`, error);
        retries++;
        
        if (retries >= maxRetries) {
          setState(prev => ({ ...prev, loadingArbitratedEscrows: false }));
          throw error;
        }
      }
    }
  }, []);

  // FORCE REFRESH: Clear and reload user escrows
  const forceRefreshUserEscrows = useCallback(async (
    escrowContract: EscrowContract, 
    userAddress: string
  ): Promise<void> => {
    console.log('Force refreshing user escrows...');
    await loadUserEscrows(escrowContract, userAddress, 2, true);
  }, [loadUserEscrows]);

  // FORCE REFRESH: Clear and reload arbitrated escrows
  const forceRefreshArbitratedEscrows = useCallback(async (
    escrowContract: EscrowContract, 
    arbiterAddress: string
  ): Promise<void> => {
    console.log('Force refreshing arbitrated escrows...');
    await loadArbitratedEscrows(escrowContract, arbiterAddress, 2, true);
  }, [loadArbitratedEscrows]);

  return {
    ...state,
    loadUserEscrows,
    loadArbitratedEscrows,
    forceRefreshUserEscrows,
    forceRefreshArbitratedEscrows,
    setEscrows: (escrows: Escrow[]) => {
      const sortedEscrows = sortEscrowsNewestFirst(escrows);
      setState(prev => ({ ...prev, escrows: sortedEscrows }));
    },
    setArbitratedEscrows: (arbitratedEscrows: Escrow[]) => {
      const sortedEscrows = sortEscrowsNewestFirst(arbitratedEscrows);
      setState(prev => ({ ...prev, arbitratedEscrows: sortedEscrows }));
    },
    clearAllEscrows: () => {
      setState(prev => ({ 
        ...prev, 
        escrows: [], 
        arbitratedEscrows: [] 
      }));
    }
  };
}

export default useEscrowLists;
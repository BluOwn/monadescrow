// src/hooks/useEscrowLists.ts - Final version with better error handling
import { useState, useCallback } from 'react';
import { Escrow, EscrowContract } from '../types';
import { getAndCacheEscrow } from '../utils/cacheUtils';
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
    maxRetries: number = 2
  ): Promise<void> => {
    let retries = 0;
    setState(prev => ({ ...prev, loadingEscrows: true }));
    
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
        
        // OPTIMIZATION: Load all escrow details in parallel with larger batches
        const BATCH_SIZE = 10;
        const batches: any[][] = [];
        
        for (let i = 0; i < escrowIds.length; i += BATCH_SIZE) {
          batches.push(escrowIds.slice(i, i + BATCH_SIZE));
        }
        
        const allEscrows: Escrow[] = [];
        
        // Process batches in parallel
        const batchPromises = batches.map(async (batch, batchIndex) => {
          if (batchIndex > 0) {
            await delayBetweenCalls(200);
          }
          
          const batchResults = await Promise.allSettled(
            batch.map(async (escrowId: any) => {
              try {
                return await getAndCacheEscrow(escrowContract as unknown as ethers.Contract, escrowId, ethers);
              } catch (err: any) {
                // Silent handling - don't log expected errors
                if (err && typeof err === 'object' && err.message && !err.message.includes('does not exist')) {
                  console.warn(`Error loading escrow ${escrowId}:`, err);
                }
                return null; // Return null for non-existent escrows
              }
            })
          );
          
          return batchResults
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => (result as PromiseFulfilledResult<Escrow>).value);
        });
        
        // Wait for all batches to complete
        const batchResults = await Promise.all(batchPromises);
        
        // Flatten results and filter out nulls
        batchResults.forEach(batchEscrows => {
          allEscrows.push(...batchEscrows.filter(escrow => escrow !== null));
        });
        
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

  // OPTIMIZED: Load arbitrated escrows function with silent error handling
  const loadArbitratedEscrows = useCallback(async (
    escrowContract: EscrowContract, 
    arbiterAddress: string, 
    maxRetries: number = 2
  ): Promise<void> => {
    let retries = 0;
    setState(prev => ({ ...prev, loadingArbitratedEscrows: true }));
    
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
        
        // Create array of escrow IDs to check
        const escrowsToCheck = Array.from({ length: totalEscrows }, (_, i) => i);
        
        // OPTIMIZATION: Process in larger parallel batches
        const BATCH_SIZE = 15;
        const batches: number[][] = [];
        
        for (let i = 0; i < escrowsToCheck.length; i += BATCH_SIZE) {
          batches.push(escrowsToCheck.slice(i, i + BATCH_SIZE));
        }
        
        const arbitratedEscrows: Escrow[] = [];
        
        // Process all batches in parallel
        const batchPromises = batches.map(async (batch, batchIndex) => {
          if (batchIndex > 0) {
            await delayBetweenCalls(150);
          }
          
          const batchResults = await Promise.allSettled(
            batch.map(async (escrowId) => {
              try {
                const escrow = await getAndCacheEscrow(escrowContract as unknown as ethers.Contract, escrowId, ethers);
                
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
          
          return batchResults
            .filter(result => result.status === 'fulfilled' && result.value !== null)
            .map(result => (result as PromiseFulfilledResult<Escrow>).value);
        });
        
        // Wait for all batches and collect results
        const batchResults = await Promise.all(batchPromises);
        
        // Flatten and filter results
        batchResults.forEach(batchEscrows => {
          arbitratedEscrows.push(...batchEscrows.filter(e => e !== null));
        });
        
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

  return {
    ...state,
    loadUserEscrows,
    loadArbitratedEscrows,
    setEscrows: (escrows: Escrow[]) => {
      const sortedEscrows = sortEscrowsNewestFirst(escrows);
      setState(prev => ({ ...prev, escrows: sortedEscrows }));
    },
    setArbitratedEscrows: (arbitratedEscrows: Escrow[]) => {
      const sortedEscrows = sortEscrowsNewestFirst(arbitratedEscrows);
      setState(prev => ({ ...prev, arbitratedEscrows: sortedEscrows }));
    }
  };
}

export default useEscrowLists;
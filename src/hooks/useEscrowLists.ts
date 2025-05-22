// src/hooks/useEscrowLists.ts
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

  // Load user escrows function
  const loadUserEscrows = useCallback(async (
    escrowContract: EscrowContract, 
    userAddress: string, 
    maxRetries: number = 3
  ): Promise<void> => {
    let retries = 0;
    setState(prev => ({ ...prev, loadingEscrows: true }));
    
    // Show at least a loading UI immediately
    if (state.escrows.length === 0) {
      // Set empty array to show the "loading" state
      setState(prev => ({ ...prev, escrows: [] }));
    }
    
    while (retries < maxRetries) {
      try {
        // Add a small delay to ensure contract is properly initialized
        if (retries > 0) {
          await delayBetweenCalls(2000);
        }
        
        // First check if contract is properly initialized
        if (!escrowContract || !escrowContract.getUserEscrows) {
          throw new Error('Contract not properly initialized');
        }
        
        // Get the IDs first
        const escrowIds = await escrowContract.getUserEscrows(userAddress);
        
        // Create a map to avoid duplicates
        const escrowMap: Record<string, Escrow> = {};
        
        // Immediately show the number of escrows, even before loading details
        if (escrowIds.length > 0) {
          // Create placeholder escrows with just IDs
          const placeholders = escrowIds.map((id: any) => {
            const escrowId = id.toString();
            const placeholder: Escrow = {
              id: escrowId,
              placeholder: true,
              amount: "Loading...",
              buyer: userAddress,
              seller: "Loading...",
              arbiter: "Loading...",
              fundsDisbursed: false,
              disputeRaised: false
            };
                      
            // Store in map to avoid duplicates
            escrowMap[escrowId] = placeholder;
            return placeholder;
          });
          
          // Sort placeholders and set them immediately
          const sortedPlaceholders = sortEscrowsNewestFirst(Object.values(escrowMap));
          setState(prev => ({ ...prev, escrows: sortedPlaceholders }));
          
          // Now load details in batches
          const BATCH_SIZE = 3;
          for (let i = 0; i < escrowIds.length; i += BATCH_SIZE) {
            const batch = escrowIds.slice(i, i + BATCH_SIZE);
            
            await Promise.all(
              batch.map(async (escrowId: any) => {
                try {
                  const fullEscrow = await getAndCacheEscrow(escrowContract as unknown as ethers.Contract, escrowId, ethers);
                  // Update the map with the full data
                  escrowMap[fullEscrow.id.toString()] = fullEscrow;
                  return fullEscrow;
                } catch (err) {
                  console.warn(`Error loading escrow ${escrowId}:`, err);
                  // Return a placeholder for failed items with error flag
                  const errorEscrow: Escrow = {
                    id: escrowId.toString(),
                    error: true,
                    amount: "Error",
                    buyer: userAddress,
                    seller: "Error loading data",
                    arbiter: "Error loading data",
                    fundsDisbursed: false,
                    disputeRaised: false
                  };
                  escrowMap[escrowId.toString()] = errorEscrow;
                  return errorEscrow;
                }
              })
            );
            
            // Update escrows with the complete map (removes duplicates) and sort
            const sortedEscrows = sortEscrowsNewestFirst(Object.values(escrowMap));
            setState(prev => ({ ...prev, escrows: sortedEscrows }));
            
            // Add delay between batches
            if (i + BATCH_SIZE < escrowIds.length) {
              await delayBetweenCalls(1000);
            }
          }
        } else {
          // No escrows found
          setState(prev => ({ ...prev, escrows: [] }));
        }
        
        setState(prev => ({ ...prev, loadingEscrows: false }));
        return;
        
      } catch (error) {
        console.error(`Attempt ${retries + 1} failed loading escrows:`, error);
        retries++;
        
        // Wait longer between retries
        await delayBetweenCalls(2000 * retries);
        
        if (retries >= maxRetries) {
          setState(prev => ({ ...prev, loadingEscrows: false }));
          throw error; // Let the caller handle the error
        }
      }
    }
  }, [state.escrows.length]);

  // Load arbitrated escrows function
  const loadArbitratedEscrows = useCallback(async (
    escrowContract: EscrowContract, 
    arbiterAddress: string, 
    maxRetries: number = 3
  ): Promise<void> => {
    let retries = 0;
    setState(prev => ({ ...prev, loadingArbitratedEscrows: true }));
    
    while (retries < maxRetries) {
      try {
        // Add a small delay to ensure contract is properly initialized
        if (retries > 0) {
          await delayBetweenCalls(2000);
        }
        
        // First check if contract is properly initialized
        if (!escrowContract || !escrowContract.getEscrowCount) {
          throw new Error('Contract not properly initialized');
        }
        
        // Get total escrow count
        const escrowCount = await escrowContract.getEscrowCount();
        const totalEscrows = Number(escrowCount);
        
        // Create array of escrow IDs to check (all escrows)
        const escrowsToCheck = Array.from({ length: totalEscrows }, (_, i) => i);
        
        // Create a map to store arbitrated escrows by ID
        const arbitratedMap: Record<string, Escrow> = {};
        
        // Process escrow details in batches
        const BATCH_SIZE = 5; // Slightly larger batch for checking
        
        for (let i = 0; i < escrowsToCheck.length; i += BATCH_SIZE) {
          const batch = escrowsToCheck.slice(i, i + BATCH_SIZE);
          
          const batchResults = await Promise.all(
            batch.map(async (escrowId) => {
              try {
                const escrow = await getAndCacheEscrow(escrowContract as unknown as ethers.Contract, escrowId, ethers);
                
                // Check if the user is the arbiter for this escrow (case-insensitive comparison)
                if (escrow.arbiter.toLowerCase() === arbiterAddress.toLowerCase()) {
                  // Store in map to ensure uniqueness
                  arbitratedMap[escrow.id.toString()] = escrow;
                  console.log(`Found arbitrated escrow: ${escrow.id} - Arbiter: ${escrow.arbiter}, User: ${arbiterAddress}`);
                  return escrow;
                }
                return null; // Not an arbiter, don't include
              } catch (err) {
                console.warn(`Error fetching escrow #${escrowId}:`, err);
                return null;
              }
            })
          );
          
          // Update the UI with what we have so far (from the map) and sort
          const sortedArbitratedEscrows = sortEscrowsNewestFirst(Object.values(arbitratedMap));
          setState(prev => ({ ...prev, arbitratedEscrows: sortedArbitratedEscrows }));
          
          // Add delay between batches
          if (i + BATCH_SIZE < escrowsToCheck.length) {
            await delayBetweenCalls(1000);
          }
        }
        
        // Final update to ensure we have the complete set, sorted
        const finalSortedEscrows = sortEscrowsNewestFirst(Object.values(arbitratedMap));
        setState(prev => ({ 
          ...prev, 
          arbitratedEscrows: finalSortedEscrows,
          loadingArbitratedEscrows: false
        }));
        
        console.log(`Total arbitrated escrows found: ${finalSortedEscrows.length}`);
        return; // Success, exit the retry loop
        
      } catch (error) {
        console.error(`Attempt ${retries + 1} failed loading arbitrated escrows:`, error);
        retries++;
        
        if (retries >= maxRetries) {
          setState(prev => ({ ...prev, loadingArbitratedEscrows: false }));
          throw error; // Let the caller handle the error
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
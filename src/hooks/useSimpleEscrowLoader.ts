// src/hooks/useSimpleEscrowLoader.ts
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

export const useSimpleEscrowLoader = () => {
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

  // Main loading function - simple and reliable
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
      
      const userEscrowPromises = userEscrowIds.map(async (id: any) => {
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
      
      // STEP 2: Load arbitrated escrows (smart approach)
      const totalEscrowCount = await contract.getEscrowCount();
      const totalCount = Number(totalEscrowCount);
      console.log('📊 Total escrows in contract:', totalCount);
      
      // Instead of checking ALL escrows, check only recent ones
      const MAX_CHECK = Math.min(200, totalCount); // Check last 200 escrows max
      const startId = Math.max(0, totalCount - MAX_CHECK);
      
      console.log(`🔍 Checking escrows ${startId} to ${totalCount - 1} for arbitration`);
      
      const arbitratedEscrows: Escrow[] = [];
      
      // Process in small batches to avoid overwhelming the network
      const BATCH_SIZE = 20;
      for (let i = startId; i < totalCount; i += BATCH_SIZE) {
        const batchEnd = Math.min(i + BATCH_SIZE, totalCount);
        const batchIds = Array.from({ length: batchEnd - i }, (_, idx) => i + idx);
        
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
        if (i + BATCH_SIZE < totalCount) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Sort escrows by ID (newest first)
      const sortByIdDesc = (a: Escrow, b: Escrow) => parseInt(b.id) - parseInt(a.id);
      userEscrows.sort(sortByIdDesc);
      arbitratedEscrows.sort(sortByIdDesc);
      
      console.log('✅ Loading complete:', {
        userEscrows: userEscrows.length,
        arbitratedEscrows: arbitratedEscrows.length
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
    maxAge: number = 30000 // 30 seconds
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
    isStale: Date.now() - state.lastUpdated > 30000
  };
};
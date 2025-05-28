// src/hooks/useActiveEscrowLoader.ts - Only load active escrows for current user
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { Escrow, EscrowContract } from '../types';

interface ActiveEscrowState {
  activeEscrows: Escrow[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
  stats: {
    total: number;
    asBuyer: number;
    asSeller: number;
    asArbiter: number;
    disputed: number;
  };
}

const useActiveEscrowLoader = () => {
  const [state, setState] = useState<ActiveEscrowState>({
    activeEscrows: [],
    loading: false,
    error: null,
    lastUpdated: 0,
    stats: {
      total: 0,
      asBuyer: 0,
      asSeller: 0,
      asArbiter: 0,
      disputed: 0
    }
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

  // SUPER OPTIMIZED: Only load active escrows for the current user
  const loadActiveEscrows = useCallback(async (
    contract: EscrowContract, 
    userAddress: string
  ) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      console.log('🔄 Loading ACTIVE escrows only for:', userAddress);
      
      // STEP 1: Get ALL user's escrow IDs (this includes buyer, seller, arbiter roles)
      const allUserEscrowIds = await contract.getUserEscrows(userAddress);
      console.log('📝 Total user escrow IDs:', allUserEscrowIds.length);
      
      if (allUserEscrowIds.length === 0) {
        setState({
          activeEscrows: [],
          loading: false,
          error: null,
          lastUpdated: Date.now(),
          stats: { total: 0, asBuyer: 0, asSeller: 0, asArbiter: 0, disputed: 0 }
        });
        return;
      }
      
      // STEP 2: Load escrow details and filter for ACTIVE only
      const activeEscrows: Escrow[] = [];
      const stats = {
        total: 0,
        asBuyer: 0,
        asSeller: 0,
        asArbiter: 0,
        disputed: 0
      };
      
      // Process in small batches to avoid overwhelming the network
      const BATCH_SIZE = 10;
      for (let i = 0; i < allUserEscrowIds.length; i += BATCH_SIZE) {
        const batch = allUserEscrowIds.slice(i, i + BATCH_SIZE);
        
        const batchPromises = batch.map(async (id: any) => {
          try {
            const data = await contract.getEscrow(id);
            const escrow = formatEscrow(Number(id), data);
            
            // FILTER: Only include ACTIVE escrows (not completed)
            if (!escrow.fundsDisbursed) {
              return escrow;
            }
            return null; // Skip completed escrows
          } catch (error) {
            console.warn(`Failed to load escrow ${id}:`, error);
            return null;
          }
        });
        
        const batchResults = await Promise.all(batchPromises);
        const validActiveEscrows = batchResults.filter(escrow => escrow !== null) as Escrow[];
        
        // Add to results and calculate stats
        validActiveEscrows.forEach(escrow => {
          activeEscrows.push(escrow);
          stats.total++;
          
          const userAddr = userAddress.toLowerCase();
          if (escrow.buyer.toLowerCase() === userAddr) stats.asBuyer++;
          if (escrow.seller.toLowerCase() === userAddr) stats.asSeller++;
          if (escrow.arbiter.toLowerCase() === userAddr) stats.asArbiter++;
          if (escrow.disputeRaised) stats.disputed++;
        });
        
        // Small delay between batches
        if (i + BATCH_SIZE < allUserEscrowIds.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      // Sort by ID (newest first)
      activeEscrows.sort((a, b) => parseInt(b.id) - parseInt(a.id));
      
      console.log('✅ Active escrows loaded:', {
        active: activeEscrows.length,
        total: allUserEscrowIds.length,
        filtered: allUserEscrowIds.length - activeEscrows.length,
        stats
      });
      
      setState({
        activeEscrows,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
        stats
      });
      
    } catch (error) {
      console.error('❌ Error loading active escrows:', error);
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
    maxAge: number = 30000 // 30 seconds - can be more frequent since we're loading less
  ) => {
    const now = Date.now();
    const isStale = now - state.lastUpdated > maxAge;
    
    if (isStale || state.activeEscrows.length === 0) {
      console.log('🔄 Data is stale, refreshing active escrows...');
      await loadActiveEscrows(contract, userAddress);
    } else {
      console.log('✅ Active escrows data is fresh');
    }
  }, [state.lastUpdated, state.activeEscrows.length, loadActiveEscrows]);

  // Force refresh - always reloads
  const forceRefresh = useCallback(async (
    contract: EscrowContract, 
    userAddress: string
  ) => {
    console.log('🔄 Force refresh active escrows');
    await loadActiveEscrows(contract, userAddress);
  }, [loadActiveEscrows]);

  // Clear all data
  const clearData = useCallback(() => {
    setState({
      activeEscrows: [],
      loading: false,
      error: null,
      lastUpdated: 0,
      stats: { total: 0, asBuyer: 0, asSeller: 0, asArbiter: 0, disputed: 0 }
    });
  }, []);

  // Get escrows by role
  const getEscrowsByRole = useCallback((role: 'buyer' | 'seller' | 'arbiter') => {
    return state.activeEscrows.filter(escrow => {
      switch (role) {
        case 'buyer': return escrow.buyer.toLowerCase() === (window as any).currentUserAddress?.toLowerCase();
        case 'seller': return escrow.seller.toLowerCase() === (window as any).currentUserAddress?.toLowerCase();
        case 'arbiter': return escrow.arbiter.toLowerCase() === (window as any).currentUserAddress?.toLowerCase();
        default: return false;
      }
    });
  }, [state.activeEscrows]);

  return {
    // Data
    activeEscrows: state.activeEscrows,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    stats: state.stats,
    
    // Actions
    loadActiveEscrows,
    refreshIfStale,
    forceRefresh,
    clearData,
    getEscrowsByRole,
    
    // Computed values
    hasData: state.activeEscrows.length > 0,
    isStale: Date.now() - state.lastUpdated > 30000 // 30 seconds
  };
};

export default useActiveEscrowLoader;
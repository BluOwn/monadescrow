// src/hooks/useEscrowData.js
import { useState, useCallback, useEffect } from 'react';
import { ethers } from 'ethers';
import { getAndCacheEscrow, invalidateEscrowCache } from '../utils/cacheUtils';
import { delayBetweenCalls, isRateLimitError } from '../utils/networkUtils';

export const useEscrowData = (contract, account) => {
  const [escrows, setEscrows] = useState([]);
  const [arbitratedEscrows, setArbitratedEscrows] = useState([]);
  const [selectedEscrow, setSelectedEscrow] = useState(null);
  const [loadingEscrows, setLoadingEscrows] = useState(false);
  const [loadingArbitratedEscrows, setLoadingArbitratedEscrows] = useState(false);
  const [error, setError] = useState('');
  const [rateLimited, setRateLimited] = useState(false);

  // Load user's escrows
  const loadUserEscrows = useCallback(async (maxRetries = 3) => {
    if (!contract || !account) return;
    
    let retries = 0;
    setLoadingEscrows(true);
    
    if (escrows.length === 0) {
      setEscrows([]);
    }
    
    while (retries < maxRetries) {
      try {
        if (retries > 0) {
          await delayBetweenCalls(2000);
        }
        
        if (!contract.getUserEscrows) {
          throw new Error('Contract not properly initialized');
        }
        
        const escrowIds = await contract.getUserEscrows(account);
        const escrowMap = {};
        
        if (escrowIds.length > 0) {
          const placeholders = escrowIds.map(id => {
            const escrowId = id.toString();
            return {
              id: escrowId,
              placeholder: true,
              amount: "Loading...",
              buyer: account,
              seller: "Loading...",
              arbiter: "Loading...",
              fundsDisbursed: false,
              disputeRaised: false
            };
          });
          
          placeholders.forEach(p => {
            escrowMap[p.id] = p;
          });
          
          setEscrows(Object.values(escrowMap));
          
          const BATCH_SIZE = 3;
          for (let i = 0; i < escrowIds.length; i += BATCH_SIZE) {
            const batch = escrowIds.slice(i, i + BATCH_SIZE);
            
            await Promise.all(
              batch.map(async (escrowId) => {
                try {
                  const fullEscrow = await getAndCacheEscrow(contract, escrowId, ethers);
                  escrowMap[fullEscrow.id.toString()] = fullEscrow;
                } catch (err) {
                  console.warn(`Error loading escrow ${escrowId}:`, err);
                  escrowMap[escrowId.toString()] = {
                    id: escrowId.toString(),
                    error: true,
                    amount: "Error",
                    buyer: account,
                    seller: "Error loading data",
                    arbiter: "Error loading data",
                    fundsDisbursed: false,
                    disputeRaised: false
                  };
                }
              })
            );
            
            setEscrows(Object.values(escrowMap));
            
            if (i + BATCH_SIZE < escrowIds.length) {
              await delayBetweenCalls(1000);
            }
          }
        } else {
          setEscrows([]);
        }
        
        setLoadingEscrows(false);
        setRateLimited(false);
        return;
        
      } catch (error) {
        console.error(`Attempt ${retries + 1} failed loading escrows:`, error);
        retries++;
        
        if (retries >= maxRetries) {
          setLoadingEscrows(false);
          if (isRateLimitError(error)) {
            setRateLimited(true);
          } else {
            setError(error.message || 'Error loading escrows');
          }
        }
      }
    }
  }, [contract, account]);

  // Similar method for loading arbitrated escrows
  // (This can be similar to loadUserEscrows but checks for arbiter role)
  const loadArbitratedEscrows = useCallback(async (maxRetries = 3) => {
    if (!contract || !account) return;
    
    let retries = 0;
    setLoadingArbitratedEscrows(true);
    
    // Implementation similar to loadUserEscrows but for arbitrated escrows
    // Check if account is the arbiter for each escrow
    
    setLoadingArbitratedEscrows(false);
  }, [contract, account]);

  // Get details of a specific escrow
  const getEscrowDetails = useCallback(async (escrowId) => {
    if (!contract) return null;
    
    try {
      const escrow = await getAndCacheEscrow(contract, escrowId, ethers);
      setSelectedEscrow(escrow);
      return escrow;
    } catch (error) {
      console.error("Error getting escrow details", error);
      setError(error.message || 'Error loading escrow details');
      return null;
    }
  }, [contract]);

  // Effect to load escrows when contract and account are available
  useEffect(() => {
    if (contract && account) {
      loadUserEscrows();
      loadArbitratedEscrows();
    }
  }, [contract, account, loadUserEscrows, loadArbitratedEscrows]);

  return {
    escrows,
    arbitratedEscrows,
    selectedEscrow,
    loadingEscrows,
    loadingArbitratedEscrows,
    error,
    rateLimited,
    setSelectedEscrow,
    loadUserEscrows,
    loadArbitratedEscrows,
    getEscrowDetails,
    invalidateEscrowCache
  };
};

export default useEscrowData;
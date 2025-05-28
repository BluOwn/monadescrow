// src/hooks/useEscrowOperations.ts - Optimized to prevent lagging
import { useState, useCallback, useRef } from 'react';
import { ethers } from 'ethers';
import { EscrowContract, Escrow } from '../types';
import { executeTransactionSecurely } from '../utils/security';
import { 
  getAndCacheEscrow, 
  invalidateEscrowCache 
} from '../utils/cacheUtils';
import { 
  validateAddress, 
  validateAmount, 
  validateDifferentAddresses,
  handleError 
} from '../utils/security';
import { delayBetweenCalls, isRateLimitError } from '../utils/networkUtils';

export interface EscrowOperationsState {
  loading: boolean;
  error: string;
  successMessage: string;
  selectedEscrow: Escrow | null;
  rateLimited: boolean;
  autoRetry: {
    active: boolean;
    countdown: number;
    progress: number;
  };
}

export function useEscrowOperations() {
  const [state, setState] = useState<EscrowOperationsState>({
    loading: false,
    error: '',
    successMessage: '',
    selectedEscrow: null,
    rateLimited: false,
    autoRetry: {
      active: false,
      countdown: 0,
      progress: 0
    }
  });

  // OPTIMIZATION: Use ref to track active requests and prevent multiple concurrent requests
  const activeRequestRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle RPC error with rate limit detection
  const handleRpcError = useCallback((error: any, operation: string = 'operation'): string => {
    console.error(`Error during ${operation}:`, error);
    
    if (isRateLimitError(error)) {
      setState(prev => ({ 
        ...prev, 
        rateLimited: true 
      }));
      startAutoRetryCountdown();
      return `The network is currently busy. Please wait a moment and try again.`;
    }
    
    return handleError(error, operation);
  }, []);

  // Auto retry countdown function
  const startAutoRetryCountdown = useCallback((): void => {
    const countdownSeconds = 15;
    setState(prev => ({
      ...prev,
      autoRetry: {
        active: true,
        countdown: countdownSeconds,
        progress: 0
      }
    }));
    
    let secondsLeft = countdownSeconds;
    const intervalId = setInterval(() => {
      secondsLeft -= 1;
      const progress = ((countdownSeconds - secondsLeft) / countdownSeconds) * 100;
      
      if (secondsLeft <= 0) {
        clearInterval(intervalId);
        setState(prev => ({
          ...prev,
          autoRetry: {
            active: false,
            countdown: 0,
            progress: 100
          }
        }));
      } else {
        setState(prev => ({
          ...prev,
          autoRetry: {
            active: true,
            countdown: secondsLeft,
            progress
          }
        }));
      }
    }, 1000);
  }, []);

  // Create new escrow
  const createEscrow = useCallback(async (
    contract: EscrowContract, 
    sellerAddress: string, 
    arbiterAddress: string, 
    amount: string,
    buyerAddress: string
  ): Promise<boolean> => {
    try {
      // Validate inputs
      validateAddress(sellerAddress, 'Seller address');
      validateAddress(arbiterAddress, 'Arbiter address');
      validateAmount(amount);
      validateDifferentAddresses(buyerAddress, sellerAddress, arbiterAddress);
      
      if (!contract) {
        throw new Error('Contract not initialized');
      }
      
      setState(prev => ({ ...prev, loading: true, error: '' }));
      
      const amountInWei = ethers.parseEther(amount);
      
      const receipt = await executeTransactionSecurely(
        contract as unknown as ethers.Contract,
        'createEscrow',
        [sellerAddress, arbiterAddress],
        amountInWei
      );
      
      setState(prev => ({ 
        ...prev, 
        successMessage: `Escrow created successfully! Transaction hash: ${receipt.hash}`,
        loading: false
      }));
      
      return true;
    } catch (error) {
      console.error("Error creating escrow", error);
      setState(prev => ({ 
        ...prev, 
        error: handleRpcError(error, 'create escrow'),
        loading: false
      }));
      return false;
    }
  }, [handleRpcError]);

  // OPTIMIZED: View escrow details with request deduplication and timeout
  const viewEscrowDetails = useCallback(async (
    contract: EscrowContract,
    escrowId: string
  ): Promise<Escrow | null> => {
    try {
      if (!contract) {
        throw new Error('Contract not initialized');
      }

      // OPTIMIZATION: Prevent multiple concurrent requests for the same escrow
      const requestKey = `escrow-${escrowId}`;
      if (activeRequestRef.current === requestKey) {
        console.log(`Request for escrow ${escrowId} already in progress, skipping...`);
        return state.selectedEscrow;
      }

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      activeRequestRef.current = requestKey;
      setState(prev => ({ ...prev, loading: true, error: '', selectedEscrow: null }));
      
      // OPTIMIZATION: Set a timeout to prevent hanging requests
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error(`Request timeout for escrow ${escrowId}`));
        }, 8000); // 8 second timeout
      });
      
      // Race between the actual request and timeout
      const escrowPromise = getAndCacheEscrow(contract as unknown as ethers.Contract, escrowId, ethers);
      
      try {
        const escrow = await Promise.race([escrowPromise, timeoutPromise]);
        
        // Clear timeout if successful
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        
        setState(prev => ({ 
          ...prev, 
          selectedEscrow: escrow,
          loading: false
        }));
        
        activeRequestRef.current = null;
        return escrow;
        
      } catch (raceError) {
        // Handle timeout or other race errors
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
        throw raceError;
      }
      
    } catch (error: any) {
      console.error("Error viewing escrow", error);
      
      // OPTIMIZATION: Clear the active request even on error
      activeRequestRef.current = null;
      
      // Handle timeout errors specifically
      let errorMessage = handleRpcError(error, 'view escrow');
      if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. The network might be slow. Please try again.';
      }
      
      setState(prev => ({ 
        ...prev, 
        error: errorMessage,
        loading: false,
        selectedEscrow: null
      }));
      
      return null;
    }
  }, [handleRpcError, state.selectedEscrow]);

  // Handle action on escrow
  const handleEscrowAction = useCallback(async (
    contract: EscrowContract,
    action: string, 
    escrowId: string, 
    recipient: string | null = null
  ): Promise<boolean> => {
    try {
      if (!contract) {
        throw new Error('Contract not initialized');
      }
      
      setState(prev => ({ ...prev, loading: true, error: '' }));
      
      let receipt;
      
      switch (action) {
        case 'release':
          receipt = await executeTransactionSecurely(
            contract as unknown as ethers.Contract, 
            'releaseFunds', 
            [escrowId]
          );
          break;
        case 'refund':
          receipt = await executeTransactionSecurely(
            contract as unknown as ethers.Contract, 
            'refundBuyer', 
            [escrowId]
          );
          break;
        case 'dispute':
          receipt = await executeTransactionSecurely(
            contract as unknown as ethers.Contract, 
            'raiseDispute', 
            [escrowId]
          );
          break;
        case 'resolve':
          if (!recipient) {
            setState(prev => ({ 
              ...prev, 
              error: 'Recipient address is required to resolve a dispute',
              loading: false
            }));
            return false;
          }
          validateAddress(recipient, 'Recipient');
          receipt = await executeTransactionSecurely(
            contract as unknown as ethers.Contract, 
            'resolveDispute', 
            [escrowId, recipient]
          );
          break;
        default:
          setState(prev => ({ ...prev, error: 'Invalid action', loading: false }));
          return false;
      }
      
      setState(prev => ({ 
        ...prev, 
        successMessage: `Action ${action} executed successfully! Transaction hash: ${receipt.hash}`,
        loading: false
      }));
      
      // Invalidate cache for this escrow
      invalidateEscrowCache(escrowId);
      
      // Add delay between operations
      await delayBetweenCalls(500);
      
      return true;
    } catch (error) {
      console.error(`Error executing ${action}`, error);
      setState(prev => ({ 
        ...prev, 
        error: handleRpcError(error, action),
        loading: false
      }));
      return false;
    }
  }, [handleRpcError]);

  // OPTIMIZATION: Clear function to reset all state and cancel active requests
  const clearAll = useCallback(() => {
    // Cancel active request
    activeRequestRef.current = null;
    
    // Clear timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    setState({
      loading: false,
      error: '',
      successMessage: '',
      selectedEscrow: null,
      rateLimited: false,
      autoRetry: {
        active: false,
        countdown: 0,
        progress: 0
      }
    });
  }, []);

  return {
    ...state,
    createEscrow,
    viewEscrowDetails,
    handleEscrowAction,
    clearMessages: () => setState(prev => ({ 
      ...prev, 
      error: '', 
      successMessage: '' 
    })),
    setError: (error: string) => setState(prev => ({
      ...prev,
      error
    })),
    setSelectedEscrow: (escrow: Escrow | null) => setState(prev => ({ 
      ...prev, 
      selectedEscrow: escrow 
    })),
    setRateLimited: (limited: boolean) => setState(prev => ({ 
      ...prev, 
      rateLimited: limited 
    })),
    clearAll // New function to clear everything
  };
}

export default useEscrowOperations;
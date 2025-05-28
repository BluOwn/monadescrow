// src/hooks/useOptimizedEscrowOperations.ts - Memory-efficient operations
import { useState, useCallback, useRef, useEffect } from 'react';
import { ethers } from 'ethers';
import { EscrowContract, Escrow } from '../types';
import { executeTransactionSecurely } from '../utils/security';
import { getEscrowFast, invalidateEscrow } from '../utils/optimizedCacheUtils';
import { 
  validateAddress, 
  validateAmount, 
  validateDifferentAddresses,
  handleError 
} from '../utils/security';

export interface OptimizedEscrowOperationsState {
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

export function useOptimizedEscrowOperations() {
  const [state, setState] = useState<OptimizedEscrowOperationsState>({
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

  // Use refs to prevent memory leaks
  const activeRequestRef = useRef<string | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUnmountedRef = useRef(false);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isUnmountedRef.current = true;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      activeRequestRef.current = null;
    };
  }, []);

  // Safe state update
  const safeSetState = useCallback((updater: (prev: OptimizedEscrowOperationsState) => OptimizedEscrowOperationsState) => {
    if (!isUnmountedRef.current) {
      setState(updater);
    }
  }, []);

  // OPTIMIZED: Rate limit detection
  const isRateLimitError = useCallback((error: any): boolean => {
    if (!error) return false;
    
    const errorString = error.message || error.toString() || '';
    const rateLimitPatterns = ['429', 'Too Many Requests', 'Non-200 status code'];
    
    return rateLimitPatterns.some(pattern => 
      errorString.toLowerCase().includes(pattern.toLowerCase())
    ) || error.code === -32603;
  }, []);

  // OPTIMIZED: Handle RPC errors
  const handleRpcError = useCallback((error: any, operation: string = 'operation'): string => {
    console.error(`Error during ${operation}:`, error);
    
    if (isRateLimitError(error)) {
      safeSetState(prev => ({ 
        ...prev, 
        rateLimited: true 
      }));
      startAutoRetryCountdown();
      return `Network is busy. Please wait and try again.`;
    }
    
    return handleError(error, operation);
  }, [isRateLimitError, safeSetState]);

  // OPTIMIZED: Auto retry countdown
  const startAutoRetryCountdown = useCallback((): void => {
    const countdownSeconds = 10; // Reduced from 15 seconds
    safeSetState(prev => ({
      ...prev,
      autoRetry: {
        active: true,
        countdown: countdownSeconds,
        progress: 0
      }
    }));
    
    let secondsLeft = countdownSeconds;
    
    const countdown = () => {
      if (isUnmountedRef.current) return;
      
      secondsLeft -= 1;
      const progress = ((countdownSeconds - secondsLeft) / countdownSeconds) * 100;
      
      if (secondsLeft <= 0) {
        safeSetState(prev => ({
          ...prev,
          autoRetry: {
            active: false,
            countdown: 0,
            progress: 100
          }
        }));
      } else {
        safeSetState(prev => ({
          ...prev,
          autoRetry: {
            active: true,
            countdown: secondsLeft,
            progress
          }
        }));
        
        retryTimeoutRef.current = setTimeout(countdown, 1000);
      }
    };
    
    retryTimeoutRef.current = setTimeout(countdown, 1000);
  }, [safeSetState]);

  // OPTIMIZED: Create escrow
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
      
      safeSetState(prev => ({ ...prev, loading: true, error: '' }));
      
      const amountInWei = ethers.parseEther(amount);
      
      const receipt = await executeTransactionSecurely(
        contract as unknown as ethers.Contract,
        'createEscrow',
        [sellerAddress, arbiterAddress],
        amountInWei
      );
      
      safeSetState(prev => ({ 
        ...prev, 
        successMessage: `Escrow created successfully! Transaction: ${receipt.hash}`,
        loading: false
      }));
      
      return true;
    } catch (error) {
      console.error("Error creating escrow", error);
      safeSetState(prev => ({ 
        ...prev, 
        error: handleRpcError(error, 'create escrow'),
        loading: false
      }));
      return false;
    }
  }, [handleRpcError, safeSetState]);

  // OPTIMIZED: View escrow details with request deduplication
  const viewEscrowDetails = useCallback(async (
    contract: EscrowContract,
    escrowId: string
  ): Promise<Escrow | null> => {
    try {
      if (!contract) {
        throw new Error('Contract not initialized');
      }

      // Prevent duplicate requests
      const requestKey = `escrow-${escrowId}`;
      if (activeRequestRef.current === requestKey) {
        console.log(`Request for escrow ${escrowId} already in progress`);
        return state.selectedEscrow;
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      
      activeRequestRef.current = requestKey;
      safeSetState(prev => ({ ...prev, loading: true, error: '', selectedEscrow: null }));
      
      // Set timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutRef.current = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, 5000); // 5 second timeout
      });
      
      // Race between request and timeout
      const escrowPromise = getEscrowFast(contract as unknown as ethers.Contract, escrowId);
      
      try {
        const escrow = await Promise.race([escrowPromise, timeoutPromise]);
        
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        
        safeSetState(prev => ({ 
          ...prev, 
          selectedEscrow: escrow,
          loading: false
        }));
        
        activeRequestRef.current = null;
        return escrow;
        
      } catch (raceError) {
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        throw raceError;
      }
      
    } catch (error: any) {
      console.error("Error viewing escrow", error);
      
      activeRequestRef.current = null;
      
      let errorMessage = handleRpcError(error, 'view escrow');
      if (error.message?.includes('timeout')) {
        errorMessage = 'Request timed out. Please try again.';
      }
      
      safeSetState(prev => ({ 
        ...prev, 
        error: errorMessage,
        loading: false,
        selectedEscrow: null
      }));
      
      return null;
    }
  }, [handleRpcError, safeSetState, state.selectedEscrow]);

  // OPTIMIZED: Handle escrow actions
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
      
      safeSetState(prev => ({ ...prev, loading: true, error: '' }));
      
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
            safeSetState(prev => ({ 
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
          safeSetState(prev => ({ ...prev, error: 'Invalid action', loading: false }));
          return false;
      }
      
      safeSetState(prev => ({ 
        ...prev, 
        successMessage: `Action ${action} completed! Transaction: ${receipt.hash}`,
        loading: false
      }));
      
      // Invalidate cache for this escrow
      invalidateEscrow(escrowId);
      
      return true;
    } catch (error) {
      console.error(`Error executing ${action}`, error);
      safeSetState(prev => ({ 
        ...prev, 
        error: handleRpcError(error, action),
        loading: false
      }));
      return false;
    }
  }, [handleRpcError, safeSetState]);

  // OPTIMIZED: Clear function with proper cleanup
  const clearAll = useCallback(() => {
    // Cancel active requests
    activeRequestRef.current = null;
    
    // Clear timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    safeSetState(prev => ({
      ...prev,
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
    }));
  }, [safeSetState]);

  // Helper functions
  const clearMessages = useCallback(() => {
    safeSetState(prev => ({ 
      ...prev, 
      error: '', 
      successMessage: '' 
    }));
  }, [safeSetState]);

  const setError = useCallback((error: string) => {
    safeSetState(prev => ({ ...prev, error }));
  }, [safeSetState]);

  const setSelectedEscrow = useCallback((escrow: Escrow | null) => {
    safeSetState(prev => ({ ...prev, selectedEscrow: escrow }));
  }, [safeSetState]);

  const setRateLimited = useCallback((limited: boolean) => {
    safeSetState(prev => ({ ...prev, rateLimited: limited }));
  }, [safeSetState]);

  return {
    ...state,
    createEscrow,
    viewEscrowDetails,
    handleEscrowAction,
    clearMessages,
    setError,
    setSelectedEscrow,
    setRateLimited,
    clearAll
  };
}

export default useOptimizedEscrowOperations;
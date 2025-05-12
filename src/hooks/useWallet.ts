// src/hooks/useWallet.ts
import { useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { validateNetwork, verifyContract } from '../utils/security';
import { ESCROW_SERVICE_ABI, ESCROW_SERVICE_ADDRESS } from '../constants/contractData';
import { ExtendedWindow, EscrowContract } from '../types';

// Make window's ethereum property accessible with TypeScript
declare const window: ExtendedWindow;

export interface WalletState {
  provider: ethers.Provider | null;
  signer: ethers.Signer | null;
  contract: EscrowContract | null;
  account: string;
  networkName: string;
  connected: boolean;
  loading: boolean;
  error: string;
}

export function useWallet() {
  const [walletState, setWalletState] = useState<WalletState>({
    provider: null,
    signer: null,
    contract: null,
    account: '',
    networkName: '',
    connected: false,
    loading: false,
    error: '',
  });

  const connectWallet = useCallback(async (): Promise<boolean> => {
    if (!window.ethereum) {
      setWalletState(prev => ({ ...prev, error: 'Please install MetaMask' }));
      return false;
    }

    try {
      setWalletState(prev => ({ ...prev, loading: true, error: '' }));
      
      // Request account access
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      if (accounts.length > 0) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        
        // Validate network
        try {
          await validateNetwork(provider);
        } catch (networkError) {
          setWalletState(prev => ({ 
            ...prev, 
            error: (networkError as Error).message,
            loading: false 
          }));
          return false;
        }
        
        const network = await provider.getNetwork();
        const signer = await provider.getSigner();
        
        // Initialize contract with verification
        const isContractValid = await verifyContract(provider, ESCROW_SERVICE_ADDRESS, ESCROW_SERVICE_ABI);
        
        if (!isContractValid) {
          throw new Error('Contract verification failed. Please check the contract address.');
        }
        
        const escrowContract = new ethers.Contract(
          ESCROW_SERVICE_ADDRESS,
          ESCROW_SERVICE_ABI,
          signer
        ) as unknown as EscrowContract;
        
        setWalletState({
          provider,
          signer,
          contract: escrowContract,
          account: accounts[0],
          networkName: 'Monad Testnet',
          connected: true,
          loading: false,
          error: ''
        });
        
        return true;
      } else {
        throw new Error('No accounts found');
      }
    } catch (error) {
      console.error("Error connecting to MetaMask", error);
      setWalletState(prev => ({ 
        ...prev, 
        error: (error as Error).message || 'Failed to connect wallet', 
        loading: false 
      }));
      return false;
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setWalletState({
      provider: null,
      signer: null,
      contract: null,
      account: '',
      networkName: '',
      connected: false,
      loading: false,
      error: '',
    });
  }, []);

  // Setup wallet change listeners - Fixed to always return a function
  const setupWalletListeners = useCallback(() => {
    if (window.ethereum) {
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length > 0) {
          setWalletState(prev => ({ ...prev, account: accounts[0] }));
        } else {
          disconnectWallet();
        }
      };
      
      const handleChainChanged = () => {
        window.location.reload();
      };
      
      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);
      
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
    
    // Return an empty cleanup function when ethereum is not available
    return () => {
      // Empty cleanup function
    };
  }, [disconnectWallet]);

  return {
    ...walletState,
    connectWallet,
    disconnectWallet,
    setupWalletListeners
  };
}

export default useWallet;
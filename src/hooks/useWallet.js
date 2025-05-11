// src/hooks/useWallet.js
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { validateNetwork, handleError } from '../utils/security';
import { delayBetweenCalls } from '../utils/networkUtils';

export const useWallet = () => {
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
  const [account, setAccount] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = useCallback(async () => {
    if (window.ethereum) {
      try {
        setLoading(true);
        setError('');
        
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        if (accounts.length > 0) {
          const provider = new ethers.BrowserProvider(window.ethereum);
          
          try {
            await validateNetwork(provider);
          } catch (networkError) {
            setError(networkError.message);
            setLoading(false);
            return;
          }
          
          // Add delay between operations
          await delayBetweenCalls(500);
          
          const network = await provider.getNetwork();
          const signer = await provider.getSigner();
          
          setProvider(provider);
          setSigner(signer);
          setAccount(accounts[0]);
          setNetworkName('Monad Testnet');
          setConnected(true);
          
          return { provider, signer, account: accounts[0] };
        }
      } catch (error) {
        console.error("Error connecting to MetaMask", error);
        setError(handleError(error, 'connect wallet'));
      } finally {
        setLoading(false);
      }
    } else {
      setError('Please install MetaMask');
    }
  }, []);

  const disconnectWallet = useCallback(() => {
    setProvider(null);
    setSigner(null);
    setAccount('');
    setNetworkName('');
    setConnected(false);
  }, []);

  // Effect for handling account changes
  useEffect(() => {
    if (window.ethereum) {
      const handleAccountsChanged = async (accounts) => {
        if (accounts.length > 0) {
          setAccount(accounts[0]);
        } else {
          setConnected(false);
          setAccount('');
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
  }, []);

  return {
    provider,
    signer,
    account,
    networkName,
    connected,
    loading,
    error,
    connectWallet,
    disconnectWallet
  };
};

export default useWallet;
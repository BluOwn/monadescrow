// src/utils/rpcConfig.ts - Ankr RPC Configuration
import { ethers } from 'ethers';

// Ankr RPC endpoint for Monad Testnet
export const ANKR_RPC_URL = 'https://rpc.ankr.com/monad_testnet';

// Rate limiting configuration for Ankr
export const ANKR_RATE_LIMITS = {
  maxRequestsPer10Sec: 250, // Conservative (300 - 50 buffer)
  maxRequestsPer10Min: 10000, // Conservative (12000 - 2000 buffer)
  batchSize: 5,
  delayBetweenBatches: 500,
  delayBetweenRequests: 50
};

// Create optimized provider for Ankr RPC
export const createAnkrProvider = (): ethers.JsonRpcProvider => {
  const provider = new ethers.JsonRpcProvider(ANKR_RPC_URL, {
    name: 'monad-testnet',
    chainId: 10143
  });

  // Add request throttling
  const originalSend = provider.send.bind(provider);
  let requestCount = 0;
  let lastReset = Date.now();

  provider.send = async function(method: string, params: any[]) {
    // Reset counter every 10 seconds
    const now = Date.now();
    if (now - lastReset >= 10000) {
      requestCount = 0;
      lastReset = now;
    }

    // Wait if we're approaching rate limit
    if (requestCount >= ANKR_RATE_LIMITS.maxRequestsPer10Sec - 10) {
      const waitTime = 10000 - (now - lastReset);
      if (waitTime > 0) {
        console.log(`⏳ Rate limit protection: waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
        requestCount = 0;
        lastReset = Date.now();
      }
    }

    requestCount++;
    return originalSend(method, params);
  };

  return provider;
};

// Network configuration for Monad Testnet
export const MONAD_TESTNET_CONFIG = {
  chainId: '0x2747', // 10143 in hex
  chainName: 'Monad Testnet',
  nativeCurrency: {
    name: 'Monad',
    symbol: 'MON',
    decimals: 18
  },
  rpcUrls: [ANKR_RPC_URL],
  blockExplorerUrls: ['https://testnet.monadexplorer.com/']
};

// Helper to switch to Monad Testnet with Ankr RPC
export const switchToMonadTestnet = async () => {
  if (!window.ethereum) {
    throw new Error('MetaMask not detected');
  }

  try {
    // Try to switch to Monad Testnet
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: MONAD_TESTNET_CONFIG.chainId }],
    });
  } catch (switchError: any) {
    // If network doesn't exist, add it
    if (switchError.code === 4902) {
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [MONAD_TESTNET_CONFIG],
        });
      } catch (addError) {
        throw new Error('Failed to add Monad Testnet to MetaMask');
      }
    } else {
      throw new Error('Failed to switch to Monad Testnet');
    }
  }
};

// Verify we're on the correct network
export const verifyMonadTestnet = async (provider: ethers.Provider): Promise<boolean> => {
  try {
    const network = await provider.getNetwork();
    return Number(network.chainId) === 10143;
  } catch (error) {
    console.error('Error verifying network:', error);
    return false;
  }
};

export default {
  ANKR_RPC_URL,
  ANKR_RATE_LIMITS,
  createAnkrProvider,
  MONAD_TESTNET_CONFIG,
  switchToMonadTestnet,
  verifyMonadTestnet
};
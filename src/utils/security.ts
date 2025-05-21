// src/utils/security.ts
import { ethers } from 'ethers';

export const ESCROW_SERVICE_ADDRESS = "0x44f703203A65b6b11ea3b4540cC30337F0630927";

// Security notice for users
export const SECURITY_NOTICE = `⚠️ SECURITY NOTICE:
- This is an open-source escrow service
- Always verify the contract address: ${ESCROW_SERVICE_ADDRESS}
- Never share your private keys
- Use only on Monad Testnet
- View source code: https://github.com/BluOwn/monadescrow`;

// Validate network connection
export const validateNetwork = async (provider: ethers.Provider): Promise<boolean> => {
  const network = await provider.getNetwork();
  const expectedChainId = BigInt(10143); // Monad Testnet
  
  if (network.chainId !== expectedChainId) {
    throw new Error(`Please switch to Monad Testnet manually in your wallet`);
  }
  
  return true;
};

// Verify smart contract
export const verifyContract = async (
  provider: ethers.Provider, 
  contractAddress: string, 
  contractABI: any[]
): Promise<boolean> => {
  try {
    // Check if contract exists
    const code = await provider.getCode(contractAddress);
    if (code === '0x') {
      throw new Error('Contract not found at this address');
    }
    
    // Additional verification - check for expected functions
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    
    // Verify key functions exist
    const methods = ['createEscrow', 'releaseFunds', 'getEscrow'];
    for (const method of methods) {
      if (typeof contract[method] !== 'function') {
        throw new Error(`Contract missing required function: ${method}`);
      }
    }
    
    return true;
  } catch (error) {
    console.error('Contract verification failed:', error);
    return false;
  }
};

// Execute transaction securely
export const executeTransactionSecurely = async (
  contract: ethers.Contract, 
  method: string, 
  params: any[] = [], 
  value: ethers.BigNumberish | null = null
): Promise<any> => {
  try {
    // Execute transaction
    const tx = await contract[method](...params, value ? { value } : {});
    
    // Wait for confirmation
    const receipt = await tx.wait();
    
    return receipt;
  } catch (error) {
    console.error('Transaction failed:', error);
    throw error;
  }
};

// Validate Ethereum address
export const validateAddress = (address: string, name: string = 'Address'): boolean => {
  if (!address) {
    throw new Error(`${name} is required`);
  }
  
  if (!ethers.isAddress(address)) {
    throw new Error(`${name} is not a valid Ethereum address`);
  }
  
  return true;
};

// Validate amount
export const validateAmount = (amount: string): boolean => {
  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    throw new Error('Please enter a valid amount greater than 0');
  }
  
  // Check if amount is not too large
  const maxAmount = 1000; // 1000 MON max for security
  if (Number(amount) > maxAmount) {
    throw new Error(`Amount cannot exceed ${maxAmount} MON`);
  }
  
  return true;
};

/**
 * Validates that buyer, seller, and arbiter are all different addresses
 * @param buyerAddress - The buyer's address
 * @param sellerAddress - The seller's address
 * @param arbiterAddress - The arbiter's address
 * @returns True if all addresses are different
 * @throws Error if any addresses match
 */
export const validateDifferentAddresses = (
  buyerAddress: string,
  sellerAddress: string,
  arbiterAddress: string
): boolean => {
  buyerAddress = buyerAddress.toLowerCase();
  sellerAddress = sellerAddress.toLowerCase();
  arbiterAddress = arbiterAddress.toLowerCase();
  
  if (buyerAddress === sellerAddress) {
    throw new Error('Buyer and seller must be different addresses');
  }
  
  if (buyerAddress === arbiterAddress) {
    throw new Error('Buyer and arbiter must be different addresses');
  }
  
  if (sellerAddress === arbiterAddress) {
    throw new Error('Seller and arbiter must be different addresses');
  }
  
  return true;
};

// Enhanced error handling
export const handleError = (error: any, operation: string = 'operation'): string => {
  console.error(`Error during ${operation}:`, error);
  
  let userMessage = `Failed to ${operation}. `;
  
  if (error.code === 'ACTION_REJECTED') {
    userMessage += 'Transaction was cancelled by user.';
  } else if (error.code === 'INSUFFICIENT_FUNDS') {
    userMessage += 'Insufficient funds for this transaction.';
  } else if (error.message?.includes('user rejected')) {
    userMessage += 'Transaction was rejected by user.';
  } else if (error.message?.includes('switch to Monad Testnet')) {
    userMessage = error.message;
  } else {
    userMessage += error.message || 'Please try again or contact support.';
  }
  
  return userMessage;
};

// Add security headers
export const addSecurityHeaders = (): void => {
  // Prevent clickjacking
  if (window.top !== window.self && window.top) {
    window.top.location.href = window.self.location.href;
  }
};
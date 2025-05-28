// src/utils/cacheUtils.ts - Improved with silent error handling
import { ethers } from 'ethers';
import { Escrow } from '../types';

interface CacheEntry {
  value: any;
  timestamp: number;
}

interface CacheStorage {
  [key: string]: CacheEntry;
}

// OPTIMIZED: Simpler, faster cache implementation
class FastCache {
  private cache: CacheStorage;
  private expirationTime: number;
  
  constructor(expirationTime: number = 10 * 60 * 1000) { // Increased to 10 minutes for better performance
    this.cache = {};
    this.expirationTime = expirationTime;
  }
  
  set(key: string, value: any): any {
    try {
      // OPTIMIZATION: Simplified BigInt handling - just convert to string immediately
      const safeValue = typeof value === 'object' && value !== null 
        ? this.quickBigIntFix(value) 
        : value;
      
      this.cache[key] = {
        value: safeValue,
        timestamp: Date.now()
      };
      return safeValue;
    } catch (e) {
      // Fail silently and return original value
      return value;
    }
  }
  
  get(key: string): any {
    const entry = this.cache[key];
    if (!entry) return null;
    
    // Quick expiration check
    if (Date.now() - entry.timestamp > this.expirationTime) {
      delete this.cache[key];
      return null;
    }
    
    return entry.value;
  }
  
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  clear(): void {
    this.cache = {};
  }
  
  // OPTIMIZATION: Much faster BigInt conversion - only handle immediate properties
  private quickBigIntFix(obj: any): any {
    if (Array.isArray(obj)) {
      return obj.map(item => typeof item === 'bigint' ? item.toString() : item);
    }
    
    if (typeof obj === 'object' && obj !== null) {
      const result: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          const value = obj[key];
          result[key] = typeof value === 'bigint' ? value.toString() : value;
        }
      }
      return result;
    }
    
    return obj;
  }
}

// Create cache instance for escrow data
export const escrowCache = new FastCache();

/**
 * OPTIMIZED: Gets and caches escrow data with silent error handling
 */
export const getAndCacheEscrow = async (
  contract: ethers.Contract, 
  escrowId: string | number, 
  ethers: any
): Promise<Escrow> => {
  const cacheKey = `escrow-${escrowId}`;
  
  // Quick cache check first
  const cachedEscrow = escrowCache.get(cacheKey);
  if (cachedEscrow) {
    return cachedEscrow as Escrow;
  }
  
  try {
    // OPTIMIZATION: Single contract call with timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Request timeout')), 5000); // 5 second timeout
    });
    
    const contractPromise = contract.getEscrow(escrowId);
    
    const details = await Promise.race([contractPromise, timeoutPromise]) as any;
    
    // OPTIMIZATION: Direct object creation without complex processing
    const escrow: Escrow = {
      id: escrowId.toString(),
      buyer: details[0],
      seller: details[1],
      arbiter: details[2],
      amount: ethers.formatEther(details[3]),
      fundsDisbursed: Boolean(details[4]),
      disputeRaised: Boolean(details[5])
    };
    
    // Cache and return
    escrowCache.set(cacheKey, escrow);
    return escrow;
    
  } catch (error: any) {
    // OPTIMIZATION: Silent error handling - these errors are expected for non-existent escrows
    // Don't log errors for missing escrows (CALL_EXCEPTION with missing revert data)
    const isExpectedError = error && (
      error.code === 'CALL_EXCEPTION' || 
      error.message?.includes('missing revert data') ||
      error.message?.includes('CALL_EXCEPTION')
    );
    
    if (!isExpectedError) {
      // Only log unexpected errors
      console.warn(`Unexpected error in getAndCacheEscrow for ID ${escrowId}:`, error);
    }
    
    try {
      // One more direct attempt without caching - also silent
      const details = await contract.getEscrow(escrowId);
      return {
        id: escrowId.toString(),
        buyer: details[0],
        seller: details[1],
        arbiter: details[2],
        amount: ethers.formatEther(details[3]),
        fundsDisbursed: Boolean(details[4]),
        disputeRaised: Boolean(details[5])
      };
    } catch (finalError: any) {
      // Silent failure - return null to indicate this escrow doesn't exist
      // This is expected behavior when escrow IDs don't exist
      throw new Error(`Escrow ${escrowId} does not exist`);
    }
  }
};

/**
 * Invalidates cache for a specific escrow
 */
export const invalidateEscrowCache = (escrowId: string | number): void => {
  const cacheKey = `escrow-${escrowId}`;
  delete (escrowCache as any).cache[cacheKey];
};

/**
 * OPTIMIZATION: Clear old cache entries periodically
 */
export const cleanupCache = (): void => {
  const now = Date.now();
  const cache = (escrowCache as any).cache;
  
  for (const key in cache) {
    if (cache[key] && now - cache[key].timestamp > (escrowCache as any).expirationTime) {
      delete cache[key];
    }
  }
};

// Run cleanup every 5 minutes
if (typeof window !== 'undefined') {
  setInterval(cleanupCache, 5 * 60 * 1000);
}
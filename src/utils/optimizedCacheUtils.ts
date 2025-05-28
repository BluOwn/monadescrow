// src/utils/optimizedCacheUtils.ts - Lightweight cache with memory management
import { ethers } from 'ethers';
import { Escrow } from '../types';

interface CacheEntry {
  value: any;
  timestamp: number;
  accessCount: number;
}

// OPTIMIZED: Lightweight cache with automatic cleanup
class OptimizedCache {
  private cache: Map<string, CacheEntry>;
  private readonly maxSize: number;
  private readonly expirationTime: number;
  private cleanupInterval: NodeJS.Timeout | null;
  
  constructor(maxSize: number = 200, expirationTime: number = 5 * 60 * 1000) { // 5 minutes
    this.cache = new Map();
    this.maxSize = maxSize;
    this.expirationTime = expirationTime;
    this.cleanupInterval = null;
    
    // Start cleanup cycle
    this.startCleanupCycle();
  }
  
  set(key: string, value: any): any {
    try {
      // Clean up if cache is getting too large
      if (this.cache.size >= this.maxSize) {
        this.evictLeastUsed();
      }
      
      // Simple value processing - no deep cloning
      const safeValue = this.processBigInts(value);
      
      this.cache.set(key, {
        value: safeValue,
        timestamp: Date.now(),
        accessCount: 0
      });
      
      return safeValue;
    } catch (e) {
      console.warn('Cache set error:', e);
      return value;
    }
  }
  
  get(key: string): any {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    // Check expiration
    if (Date.now() - entry.timestamp > this.expirationTime) {
      this.cache.delete(key);
      return null;
    }
    
    // Update access count for LRU
    entry.accessCount++;
    
    return entry.value;
  }
  
  has(key: string): boolean {
    return this.get(key) !== null;
  }
  
  delete(key: string): void {
    this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  size(): number {
    return this.cache.size;
  }
  
  // OPTIMIZED: Simple BigInt handling
  private processBigInts(obj: any): any {
    if (typeof obj === 'bigint') {
      return obj.toString();
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.processBigInts(item));
    }
    
    if (obj && typeof obj === 'object') {
      const result: any = {};
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          result[key] = this.processBigInts(obj[key]);
        }
      }
      return result;
    }
    
    return obj;
  }
  
  // OPTIMIZED: Remove least used entries
  private evictLeastUsed(): void {
    if (this.cache.size === 0) return;
    
    // Find entries to remove (oldest and least accessed)
    const entries = Array.from(this.cache.entries());
    const toRemove = Math.max(1, Math.floor(this.cache.size * 0.1)); // Remove 10%
    
    entries
      .sort((a, b) => {
        // Sort by access count (ascending) then by timestamp (ascending)
        const accessDiff = a[1].accessCount - b[1].accessCount;
        if (accessDiff !== 0) return accessDiff;
        return a[1].timestamp - b[1].timestamp;
      })
      .slice(0, toRemove)
      .forEach(([key]) => this.cache.delete(key));
  }
  
  // OPTIMIZED: Cleanup expired entries
  private cleanup(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];
    
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.expirationTime) {
        expiredKeys.push(key);
      }
    }
    
    expiredKeys.forEach(key => this.cache.delete(key));
    
    if (expiredKeys.length > 0) {
      console.log(`Cache cleanup: removed ${expiredKeys.length} expired entries`);
    }
  }
  
  // OPTIMIZED: Start automatic cleanup
  private startCleanupCycle(): void {
    // Run cleanup every 2 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 2 * 60 * 1000);
  }
  
  // Cleanup on destroy
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Create cache instance
export const escrowCache = new OptimizedCache();

// OPTIMIZED: Fast escrow fetching with smart caching
export const getEscrowFast = async (
  contract: ethers.Contract, 
  escrowId: string | number
): Promise<Escrow> => {
  const cacheKey = `escrow-${escrowId}`;
  
  // Try cache first
  const cached = escrowCache.get(cacheKey);
  if (cached) {
    return cached as Escrow;
  }
  
  try {
    // Single contract call with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
    
    const details = await contract.getEscrow(escrowId);
    clearTimeout(timeoutId);
    
    // Create escrow object directly
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
    // Handle different error types
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    
    // Silent handling for non-existent escrows
    if (error.code === 'CALL_EXCEPTION' || 
        error.message?.includes('missing revert data')) {
      throw new Error(`Escrow ${escrowId} does not exist`);
    }
    
    throw error;
  }
};

// OPTIMIZED: Batch escrow fetching
export const getEscrowsBatch = async (
  contract: ethers.Contract,
  escrowIds: (string | number)[],
  maxConcurrent: number = 5
): Promise<Escrow[]> => {
  const results: Escrow[] = [];
  
  // Process in batches to avoid overwhelming the network
  for (let i = 0; i < escrowIds.length; i += maxConcurrent) {
    const batch = escrowIds.slice(i, i + maxConcurrent);
    
    const batchPromises = batch.map(async (id) => {
      try {
        return await getEscrowFast(contract, id);
      } catch (error) {
        // Return null for failed escrows
        return null;
      }
    });
    
    const batchResults = await Promise.allSettled(batchPromises);
    
    batchResults.forEach(result => {
      if (result.status === 'fulfilled' && result.value) {
        results.push(result.value);
      }
    });
    
    // Small delay between batches
    if (i + maxConcurrent < escrowIds.length) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  return results;
};

// OPTIMIZED: Invalidate cache entry
export const invalidateEscrow = (escrowId: string | number): void => {
  escrowCache.delete(`escrow-${escrowId}`);
};

// OPTIMIZED: Clear cache
export const clearCache = (): void => {
  escrowCache.clear();
};

// OPTIMIZED: Get cache stats
export const getCacheStats = () => {
  return {
    size: escrowCache.size(),
    maxSize: (escrowCache as any).maxSize,
    hitRate: 'N/A' // Could implement if needed
  };
};

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    escrowCache.destroy();
  });
}

export default escrowCache;
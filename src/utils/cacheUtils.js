// src/utils/cacheUtils.js - completely replace the file with this content

// Simple in-memory cache with time-based expiration (no localStorage)
class Cache {
  constructor(expirationTime = 5 * 60 * 1000) { // Default: 5 minutes
    this.cache = {};
    this.expirationTime = expirationTime;
  }
  
  set(key, value) {
    try {
      // Convert any BigInt to string to avoid serialization issues
      const safeValue = this.handleBigInt(value);
      
      this.cache[key] = {
        value: safeValue,
        timestamp: Date.now()
      };
      return safeValue;
    } catch (e) {
      console.warn('Cache error:', e);
      return value; // Return the original value even if caching fails
    }
  }
  
  get(key) {
    const entry = this.cache[key];
    if (!entry) return null;
    
    // Check if entry has expired
    if (Date.now() - entry.timestamp > this.expirationTime) {
      delete this.cache[key];
      return null;
    }
    
    return entry.value;
  }
  
  has(key) {
    return this.get(key) !== null;
  }
  
  clear() {
    this.cache = {};
  }
  
  // Helper to convert BigInt values to strings
  handleBigInt(obj) {
    if (obj === null || obj === undefined) {
      return obj;
    }
    
    // Handle BigInt directly
    if (typeof obj === 'bigint') {
      return obj.toString();
    }
    
    // Handle arrays
    if (Array.isArray(obj)) {
      return obj.map(item => this.handleBigInt(item));
    }
    
    // Handle objects
    if (typeof obj === 'object') {
      const newObj = {};
      for (const key in obj) {
        newObj[key] = this.handleBigInt(obj[key]);
      }
      return newObj;
    }
    
    // Return other types as is
    return obj;
  }
}

// Create cache instance for escrow data
export const escrowCache = new Cache();

/**
 * Gets and caches escrow data
 * @param {object} contract - The escrow contract instance
 * @param {number|string} escrowId - The ID of the escrow to fetch
 * @returns {Promise<object>} - The escrow data
 */
export const getAndCacheEscrow = async (contract, escrowId, ethers) => {
  const cacheKey = `escrow-${escrowId}`;
  
  try {
    // Check cache first
    const cachedEscrow = escrowCache.get(cacheKey);
    if (cachedEscrow) {
      return cachedEscrow;
    }
    
    // Fetch from contract if not in cache
    const details = await contract.getEscrow(escrowId);
    
    const escrow = {
      id: escrowId,
      buyer: details[0],
      seller: details[1],
      arbiter: details[2],
      amount: ethers.formatEther(details[3]),
      fundsDisbursed: details[4],
      disputeRaised: details[5]
    };
    
    // Store in cache
    return escrowCache.set(cacheKey, escrow);
  } catch (error) {
    console.warn(`Cache error in getAndCacheEscrow:`, error);
    // If caching fails, still return data from contract
    const details = await contract.getEscrow(escrowId);
    
    return {
      id: escrowId,
      buyer: details[0],
      seller: details[1],
      arbiter: details[2],
      amount: ethers.formatEther(details[3]),
      fundsDisbursed: details[4],
      disputeRaised: details[5]
    };
  }
};

/**
 * Invalidates cache for a specific escrow
 * @param {number|string} escrowId - The ID of the escrow to invalidate
 */
export const invalidateEscrowCache = (escrowId) => {
  const cacheKey = `escrow-${escrowId}`;
  delete escrowCache.cache[cacheKey];
};
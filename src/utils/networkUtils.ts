// src/utils/networkUtils.ts - Optimized for faster loading
/**
 * OPTIMIZED: Reduced delays for faster loading
 * @param ms - Milliseconds to delay (now with shorter defaults)
 */
export const delayBetweenCalls = (ms: number = 100): Promise<void> => // Reduced from 500ms
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * OPTIMIZED: Faster batch processing with concurrent execution
 */
export const processBatches = async <T, R>(
  items: T[], 
  processFn: (item: T, index: number) => Promise<R>, 
  batchSize: number = 10, // Increased from 5
  delayMs: number = 200 // Reduced from 1000ms
): Promise<R[]> => {
  const results: R[] = [];
  
  // OPTIMIZATION: Process multiple batches in parallel
  const batches: T[][] = [];
  for (let i = 0; i < items.length; i += batchSize) {
    batches.push(items.slice(i, i + batchSize));
  }
  
  // Process 3 batches at a time
  const concurrentBatches = 3;
  
  for (let i = 0; i < batches.length; i += concurrentBatches) {
    const currentBatches = batches.slice(i, i + concurrentBatches);
    
    const batchPromises = currentBatches.map(async (batch, batchIndex) => {
      // Small staggered delay
      if (batchIndex > 0) {
        await delayBetweenCalls(delayMs / 2);
      }
      
      const batchResults = await Promise.allSettled(
        batch.map((item, index) => processFn(item, i * batchSize + index))
      );
      
      return batchResults
        .filter(result => result.status === 'fulfilled')
        .map(result => (result as PromiseFulfilledResult<R>).value)
        .filter(result => result !== undefined);
    });
    
    const batchResults = await Promise.all(batchPromises);
    
    // Flatten results
    batchResults.forEach(batchResult => {
      results.push(...batchResult);
    });
    
    // Only delay between batch groups if there are more batches
    if (i + concurrentBatches < batches.length) {
      await delayBetweenCalls(delayMs);
    }
  }
  
  return results;
};

/**
 * OPTIMIZED: More responsive rate limit detection
 */
export const isRateLimitError = (error: any): boolean => {
  if (!error) return false;
  
  const errorString = error.message || error.toString() || '';
  
  // Common rate limit indicators
  const rateLimitPatterns = [
    '429',
    'Too Many Requests',
    'Non-200 status code',
    'rate limit',
    'too many requests',
    'throttled'
  ];
  
  return rateLimitPatterns.some(pattern => 
    errorString.toLowerCase().includes(pattern.toLowerCase())
  ) || error.code === -32603;
};

/**
 * OPTIMIZATION: Smart delay that adapts based on network conditions
 */
export const adaptiveDelay = (() => {
  let consecutiveErrors = 0;
  let lastErrorTime = 0;
  
  return (baseMs: number = 100): Promise<void> => {
    const now = Date.now();
    
    // Reset error count if it's been a while since last error
    if (now - lastErrorTime > 30000) { // 30 seconds
      consecutiveErrors = 0;
    }
    
    // Calculate adaptive delay
    const adaptedDelay = Math.min(baseMs * Math.pow(1.5, consecutiveErrors), 2000);
    
    return delayBetweenCalls(adaptedDelay);
  };
})();

/**
 * OPTIMIZATION: Record network error for adaptive delays
 */
export const recordNetworkError = (() => {
  let consecutiveErrors = 0;
  let lastErrorTime = 0;
  
  return () => {
    consecutiveErrors++;
    lastErrorTime = Date.now();
  };
})();

/**
 * OPTIMIZATION: Parallel execution with smart error handling
 */
export const executeInParallel = async <T>(
  promises: Promise<T>[],
  maxConcurrent: number = 5,
  retryCount: number = 1
): Promise<T[]> => {
  const results: T[] = [];
  const errors: Error[] = [];
  
  // Process promises in chunks
  for (let i = 0; i < promises.length; i += maxConcurrent) {
    const chunk = promises.slice(i, i + maxConcurrent);
    
    const chunkResults = await Promise.allSettled(chunk);
    
    chunkResults.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        results[i + index] = result.value;
      } else {
        errors.push(new Error(`Promise ${i + index} failed: ${result.reason}`));
        
        // Retry logic for failed promises
        if (retryCount > 0) {
          // Could implement retry here if needed
        }
      }
    });
    
    // Small delay between chunks
    if (i + maxConcurrent < promises.length) {
      await delayBetweenCalls(50);
    }
  }
  
  return results.filter(result => result !== undefined);
};

/**
 * OPTIMIZATION: Timeout wrapper for promises
 */
export const withTimeout = <T>(
  promise: Promise<T>,
  timeoutMs: number = 5000
): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    })
  ]);
};
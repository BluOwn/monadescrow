// src/utils/asyncUtils.js
/**
 * Introduces a delay between operations
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Resolves after the specified delay
 */
export const delay = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Retries a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {Object} options - Retry options
 * @param {number} options.maxRetries - Maximum number of retries (default: 3)
 * @param {number} options.baseDelay - Base delay in ms (default: 1000)
 * @param {number} options.maxDelay - Maximum delay in ms (default: 10000)
 * @returns {Promise} - Result of the function call
 */
export const withRetry = async (fn, options = {}) => {
  const { 
    maxRetries = 3, 
    baseDelay = 1000, 
    maxDelay = 10000,
    onRetry = null
  } = options;
  
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      // Calculate delay with exponential backoff and jitter
      const exponentialDelay = Math.min(
        maxDelay,
        baseDelay * Math.pow(2, attempt) * (0.8 + Math.random() * 0.4)
      );
      
      // Call onRetry callback if provided
      if (onRetry) {
        onRetry(error, attempt, exponentialDelay);
      }
      
      // Wait before next attempt
      await delay(exponentialDelay);
    }
  }
  
  throw lastError;
};

/**
 * Processes items in batches with delay between batches
 * @param {Array} items - Array of items to process
 * @param {Function} processFn - Async function to process each item (receives item, index, array)
 * @param {Object} options - Batch processing options
 * @param {number} options.batchSize - Number of items in each batch (default: 5)
 * @param {number} options.delayMs - Delay between batches in ms (default: 1000)
 * @param {Function} options.onBatchComplete - Called after each batch
 * @returns {Array} - Results from all processed items
 */
export const processBatches = async (items, processFn, options = {}) => {
  const { 
    batchSize = 5, 
    delayMs = 1000,
    onBatchComplete = null
  } = options;
  
  const results = [];
  
  for (let i = 0; i < items.length; i += batchSize) {
    // Extract current batch
    const batch = items.slice(i, i + batchSize);
    
    // Process batch items in parallel
    const batchResults = await Promise.all(
      batch.map((item, index) => {
        try {
          return processFn(item, i + index, items);
        } catch (error) {
          console.warn(`Error processing item at index ${i + index}:`, error);
          return { error, item, index: i + index };
        }
      })
    );
    
    // Add batch results to overall results
    results.push(...batchResults.filter(r => r !== undefined));
    
    // Call batch complete callback if provided
    if (onBatchComplete) {
      onBatchComplete(batchResults, i / batchSize);
    }
    
    // Delay before next batch (if not the last batch)
    if (i + batchSize < items.length) {
      await delay(delayMs);
    }
  }
  
  return results;
};
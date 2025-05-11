/**
 * Introduces a delay between API calls to avoid rate limiting
 * @param {number} ms - Milliseconds to delay
 * @returns {Promise} - Resolves after the specified delay
 */
export const delayBetweenCalls = (ms = 500) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Processes an array of items in batches with delays between batches
 * @param {Array} items - Array of items to process
 * @param {Function} processFn - Async function to process each item
 * @param {number} batchSize - Number of items to process in each batch
 * @param {number} delayMs - Milliseconds to delay between batches
 * @returns {Array} - Results of processing all items
 */
export const processBatches = async (items, processFn, batchSize = 5, delayMs = 1000) => {
  const results = [];
  
  for (let i = 0; i < items.length; i++) {
    // Add delay between batches
    if (i > 0 && i % batchSize === 0) {
      await delayBetweenCalls(delayMs);
    }
    
    try {
      const result = await processFn(items[i], i);
      if (result !== undefined) {
        results.push(result);
      }
    } catch (error) {
      console.warn(`Error processing item at index ${i}:`, error);
      // Continue with other items
    }
  }
  
  return results;
};

/**
 * Detects if an error is related to rate limiting
 * @param {Error} error - The error to check
 * @returns {boolean} - True if it's a rate limiting error
 */
export const isRateLimitError = (error) => {
  return error && 
    (error.message?.includes("429") || 
     error.message?.includes("Non-200 status code") ||
     error.code === -32603);
};
// src/utils/networkUtils.ts

/**
 * Introduces a delay between API calls to avoid rate limiting
 * @param ms - Milliseconds to delay
 * @returns Promise that resolves after the specified delay
 */
export const delayBetweenCalls = (ms: number = 500): Promise<void> => 
  new Promise(resolve => setTimeout(resolve, ms));

/**
 * Processes an array of items in batches with delays between batches
 * @param items - Array of items to process
 * @param processFn - Async function to process each item
 * @param batchSize - Number of items to process in each batch
 * @param delayMs - Milliseconds to delay between batches
 * @returns Results of processing all items
 */
export const processBatches = async <T, R>(
  items: T[], 
  processFn: (item: T, index: number) => Promise<R>, 
  batchSize: number = 5, 
  delayMs: number = 1000
): Promise<R[]> => {
  const results: R[] = [];
  
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
 * @param error - The error to check
 * @returns True if it's a rate limiting error
 */
export const isRateLimitError = (error: any): boolean => {
  return error && 
    (error.message?.includes("429") || 
     error.message?.includes("Non-200 status code") ||
     error.code === -32603);
};
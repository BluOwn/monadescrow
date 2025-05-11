// src/utils/errorHandlers.js
/**
 * Enhanced error handling for different error types
 * @param {Error} error - The error object
 * @param {string} operation - The operation that failed (for logging)
 * @returns {string} - User-friendly error message
 */
export const handleError = (error, operation = 'operation') => {
  console.error(`Error during ${operation}:`, error);
  
  // Check for common error types
  if (isRateLimitError(error)) {
    return `The network is currently busy. Please wait a moment and try again.`;
  }
  
  if (isUserRejectionError(error)) {
    return 'Transaction was cancelled by user.';
  }
  
  if (isInsufficientFundsError(error)) {
    return 'Insufficient funds for this transaction. Make sure you have enough MON in your wallet.';
  }
  
  if (isNetworkError(error)) {
    return 'Network connection issue. Please check your internet connection and try again.';
  }
  
  // Return the error message or a generic message
  return error.message || `Failed to ${operation}. Please try again or contact support.`;
};

/**
 * Checks if an error is related to rate limiting
 */
export const isRateLimitError = (error) => {
  return error && 
    (error.message?.includes("429") || 
     error.message?.includes("Non-200 status code") ||
     error.message?.includes("Too many requests") ||
     error.code === -32603);
};

/**
 * Checks if an error is related to user rejection
 */
export const isUserRejectionError = (error) => {
  return error &&
    (error.code === 4001 ||
     error.code === 'ACTION_REJECTED' ||
     error.message?.includes('user rejected'));
};

/**
 * Checks if an error is related to insufficient funds
 */
export const isInsufficientFundsError = (error) => {
  return error &&
    (error.code === 'INSUFFICIENT_FUNDS' ||
     error.message?.includes('insufficient funds'));
};

/**
 * Checks if an error is related to network issues
 */
export const isNetworkError = (error) => {
  return error &&
    (error.message?.includes('network') ||
     error.message?.includes('internet') ||
     error.message?.includes('connection') ||
     error.code === 'NETWORK_ERROR');
};
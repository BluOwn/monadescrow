// src/utils/errorHandling.ts

/**
 * Sets up global error handlers to prevent errors showing in console
 */
export const setupGlobalErrorHandlers = (): void => {
  // Handle regular JavaScript errors
  window.addEventListener('error', (event: ErrorEvent): boolean => {
    // List of errors to suppress completely
    const suppressErrors: string[] = [
      'Non-200 status code',
      'missing revert data',
      'MetaMask - RPC Error',
      'CALL_EXCEPTION'
    ];
    
    // Check if this is an error we want to suppress
    if (event.error && suppressErrors.some(e => 
        event.error.message && event.error.message.includes(e)
    )) {
      // Prevent the error from appearing in console
      event.preventDefault();
      return true;
    }
    
    // Let other errors pass through
    return false;
  });
  
  // Handle unhandled promise rejections
  window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent): boolean => {
    // List of errors to suppress in promises
    const suppressErrors: string[] = [
      'Non-200 status code',
      'missing revert data',
      'MetaMask - RPC Error',
      'CALL_EXCEPTION'
    ];
    
    // Check if this is an error we want to suppress
    if (event.reason && suppressErrors.some(e => 
        event.reason.message && event.reason.message.includes(e)
    )) {
      // Prevent the error from appearing in console
      event.preventDefault();
      return true;
    }
    
    // Let other errors pass through
    return false;
  });
  
  // Also set up console overrides as a backup
  const originalConsoleError = console.error;
  console.error = function (...args: any[]): void {
    // Convert all arguments to string to check content
    const errorString = args.join(' ');
    
    // List of error messages to hide
    const suppressPatterns: string[] = [
      'Non-200 status code',
      'missing revert data',
      '[ethjs-query]',
      'MetaMask - RPC Error',
      'validateDOMNesting',
      'CALL_EXCEPTION'
    ];
    
    // Check if this error contains any of the patterns we want to hide
    const shouldSuppress = suppressPatterns.some(pattern => 
      errorString.includes(pattern)
    );
    
    // Only print the error if it's not in our suppress list
    if (!shouldSuppress) {
      originalConsoleError.apply(console, args);
    }
  };
};

export default setupGlobalErrorHandlers;
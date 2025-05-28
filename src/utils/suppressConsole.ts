// src/utils/suppressConsole.ts - Updated to handle new error patterns

/**
 * Suppresses selected console error messages to keep the console clean
 */
export const suppressConsoleErrors = (): void => {
  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Override console.error
  console.error = function (...args: any[]): void {
    // Convert all arguments to string to check content
    const errorString = args.join(' ');
    
    // List of error messages to hide
    const suppressPatterns = [
      'Non-200 status code',
      'missing revert data',
      '[ethjs-query]',
      'MetaMask - RPC Error',
      'validateDOMNesting',
      'CALL_EXCEPTION',
      'BigInt',
      'serialize',
      'Error in getAndCacheEscrow for ID', // New pattern for escrow fetch errors
      'action="call"', // Ethers.js call exceptions
      'transaction={', // Transaction error details
      'CALL_EXCEPTION', // Duplicate but keeping for clarity
      'code=CALL_EXCEPTION', // More specific pattern
      'reason=null', // Contract revert with no reason
      'data=null', // Missing revert data
      'invocation=null', // Contract invocation errors
      'revert=null' // Contract revert errors
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
  
  // Also override console.warn if needed
  console.warn = function (...args: any[]): void {
    // Convert all arguments to string to check content
    const warnString = args.join(' ');
    
    // List of warning messages to hide
    const suppressPatterns = [
      'Warning: validateDOMNesting',
      'React Hook useEffect has missing dependencies',
      'is defined but never used',
      'serialize',
      'BigInt',
      'save',
      'cache',
      'Error in getAndCacheEscrow for ID', // Also suppress warnings
      'Cache error:', // Cache operation warnings
      'Error loading escrow', // Escrow loading warnings
      'Error fetching escrow' // Escrow fetching warnings
    ];
    
    // Check if this warning contains any of the patterns we want to hide
    const shouldSuppress = suppressPatterns.some(pattern => 
      warnString.includes(pattern)
    );
    
    // Only print the warning if it's not in our suppress list
    if (!shouldSuppress) {
      originalConsoleWarn.apply(console, args);
    }
  };
};

export default suppressConsoleErrors;
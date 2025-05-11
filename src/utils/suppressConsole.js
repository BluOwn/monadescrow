// src/utils/suppressConsole.js - update to handle BigInt errors too

/**
 * Suppresses selected console error messages to keep the console clean
 */
export const suppressConsoleErrors = () => {
  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Override console.error
  console.error = function (...args) {
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
      'key',
      'Keys should be unique',
      'BigInt',
      'serialize'
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
  console.warn = function (...args) {
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
      'cache'
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
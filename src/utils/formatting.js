// src/utils/formatting.js
/**
 * Truncates an Ethereum address for display
 * @param {string} address - The address to truncate
 * @param {number} prefixLength - Number of characters to keep at the beginning
 * @param {number} suffixLength - Number of characters to keep at the end
 * @returns {string} - Truncated address
 */
export const truncateAddress = (address, prefixLength = 6, suffixLength = 4) => {
  if (!address || typeof address !== 'string') {
    return '';
  }
  
  if (address.length <= prefixLength + suffixLength) {
    return address;
  }
  
  return `${address.slice(0, prefixLength)}...${address.slice(-suffixLength)}`;
};

/**
 * Formats currency values for display
 * @param {string|number} value - Value to format
 * @param {number} decimals - Number of decimal places to display
 * @returns {string} - Formatted value
 */
export const formatCurrency = (value, decimals = 4) => {
  if (!value) return '0';
  
  try {
    const numValue = typeof value === 'string' ? parseFloat(value) : Number(value);
    return numValue.toLocaleString(undefined, {
      minimumFractionDigits: 0,
      maximumFractionDigits: decimals
    });
  } catch (e) {
    console.warn('Error formatting currency value:', e);
    return String(value);
  }
};
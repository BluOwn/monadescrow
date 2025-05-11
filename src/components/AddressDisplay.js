// src/components/AddressDisplay.js
// Replace the entire file with this content:

import React, { useState } from 'react';
import { Button } from 'react-bootstrap';

const AddressDisplay = ({ address, label }) => {
  const [copied, setCopied] = useState(false);
  
  // Truncate address for display
  const truncateAddress = (addr) => {
    return addr.slice(0, 6) + '...' + addr.slice(-4);
  };
  
  // Handle copy to clipboard
  const copyToClipboard = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    
    // Reset copied status after 2 seconds
    setTimeout(() => {
      setCopied(false);
    }, 2000);
  };
  
  return (
    <span className="address-display-container d-inline-flex align-items-center">
      {label && <span className="me-1"><strong>{label}:</strong></span>}
      <span className="address-display">{truncateAddress(address)}</span>
      <Button 
        variant="link" 
        size="sm" 
        onClick={copyToClipboard}
        className="p-0 ms-1"
        title="Copy to clipboard"
      >
        {copied ? '✓' : '📋'}
      </Button>
    </span>
  );
};

export default AddressDisplay;
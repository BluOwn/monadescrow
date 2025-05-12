// src/components/RateLimitAlert.tsx
import React from 'react';
import Alert from 'react-bootstrap/Alert';
import { Button, ProgressBar } from 'react-bootstrap';
import { RateLimitAlertProps } from '../types';

const RateLimitAlert: React.FC<RateLimitAlertProps> = ({ 
  isVisible, 
  onDismiss, 
  onRetry, 
  progress = 0,
  autoRetryIn = 0
}) => {
  if (!isVisible) return null;
  
  return (
    <Alert 
      variant="warning"
      // Remove the as="div" prop
      dismissible 
      onClose={onDismiss}
    >
      <h4>Network Congestion</h4>
      <p>
        The Monad Testnet is currently experiencing high traffic. 
        We're slowing down our requests to avoid rate limiting.
      </p>
      
      {autoRetryIn > 0 && (
        <div className="mb-3">
          <small>Auto-retrying in {autoRetryIn} seconds...</small>
          <ProgressBar 
            now={progress} 
            variant="info"
            className="mt-1" 
            style={{height: '5px'}} 
          />
        </div>
      )}
      
      <Button 
        variant="outline-secondary" 
        size="sm"
        onClick={onRetry}
        className="mt-1"
      >
        Retry Now
      </Button>
    </Alert>
  );
};

export default RateLimitAlert;
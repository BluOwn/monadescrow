import React from 'react';
import { Alert, Button, ProgressBar } from 'react-bootstrap';

const RateLimitAlert = ({ 
  isVisible, 
  onDismiss, 
  onRetry, 
  progress = 0,
  autoRetryIn = 0
}) => {
  if (!isVisible) return null;
  
  return (
    <Alert variant="warning" dismissible onClose={onDismiss}>
      <Alert.Heading>Network Congestion</Alert.Heading>
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
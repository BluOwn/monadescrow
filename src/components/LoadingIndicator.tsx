// src/components/LoadingIndicator.tsx
import React from 'react';
import { Spinner } from 'react-bootstrap';
import { LoadingIndicatorProps } from '../types';

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ message = "Loading..." }) => {
  return (
    <div className="text-center py-5">
      <Spinner animation="border" role="status" variant="primary" className="mb-2">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
      <p className="mt-2">{message}</p>
    </div>
  );
};

export default LoadingIndicator;
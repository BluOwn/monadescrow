import React from 'react';

interface AnimatedLoaderProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

export const AnimatedLoader: React.FC<AnimatedLoaderProps> = ({
  size = 'medium',
  message = 'Loading...'
}) => (
  <div className="animated-loader">
    <div className={`loader-spinner ${size}`} />
    <div className="loader-message">{message}</div>
  </div>
);
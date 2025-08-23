// src/components/AnimatedProgress.tsx
import React, { useEffect, useState } from 'react';

interface AnimatedProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  animated?: boolean;
  striped?: boolean;
}

const AnimatedProgress: React.FC<AnimatedProgressProps> = ({ 
  value, 
  max = 100, 
  label, 
  showPercentage = true,
  variant = 'primary',
  animated = true,
  striped = false
}) => {
  const [animatedValue, setAnimatedValue] = useState(0);
  const percentage = Math.min((value / max) * 100, 100);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedValue(percentage);
    }, 100);

    return () => clearTimeout(timer);
  }, [percentage]);

  const getVariantClass = () => {
    switch (variant) {
      case 'success': return 'bg-success';
      case 'warning': return 'bg-warning';
      case 'danger': return 'bg-danger';
      case 'info': return 'bg-info';
      default: return 'bg-primary';
    }
  };

  return (
    <div className="animated-progress-container mb-3">
      {label && (
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="progress-label fw-medium">{label}</span>
          {showPercentage && (
            <span className="progress-percentage text-muted small">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="progress">
        <div 
          className={`progress-bar ${getVariantClass()} ${animated ? 'progress-bar-animated' : ''} ${striped ? 'progress-bar-striped' : ''}`}
          role="progressbar"
          style={{ width: `${animatedValue}%` }}
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        >
          {!showPercentage && (
            <span className="visually-hidden">{Math.round(percentage)}% Complete</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AnimatedProgress;
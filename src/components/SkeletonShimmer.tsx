// src/components/SkeletonShimmer.tsx
import React from 'react';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = '16px', 
  borderRadius = '8px',
  className = '' 
}) => {
  const style = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
    borderRadius: typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius,
  };

  return <div className={`skeleton ${className}`} style={style}></div>;
};

// Pre-built skeleton components
export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({ 
  lines = 1, 
  className = '' 
}) => (
  <div className={className}>
    {Array.from({ length: lines }, (_, i) => (
      <Skeleton 
        key={i} 
        height="16px" 
        width={i === lines - 1 ? '75%' : '100%'}
        className="skeleton-text"
      />
    ))}
  </div>
);

export const SkeletonButton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <Skeleton 
    width="80px" 
    height="36px" 
    borderRadius="12px"
    className={`skeleton-button ${className}`}
  />
);

export const SkeletonAvatar: React.FC<{ size?: number; className?: string }> = ({ 
  size = 40, 
  className = '' 
}) => (
  <Skeleton 
    width={size} 
    height={size} 
    borderRadius="50%"
    className={`skeleton-avatar ${className}`}
  />
);

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`card p-3 ${className}`}>
    <div className="d-flex align-items-center mb-3">
      <SkeletonAvatar className="me-3" />
      <div className="flex-grow-1">
        <SkeletonText lines={1} />
        <Skeleton width="60%" height="12px" className="mt-1" />
      </div>
    </div>
    <SkeletonText lines={3} />
    <div className="d-flex justify-content-between align-items-center mt-3">
      <SkeletonButton />
      <Skeleton width="100px" height="20px" />
    </div>
  </div>
);

export const EscrowCardSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`card escrow-card p-4 ${className}`}>
    <div className="d-flex justify-content-between align-items-start mb-3">
      <div className="flex-grow-1">
        <Skeleton width="120px" height="20px" className="mb-2" />
        <Skeleton width="80%" height="16px" />
      </div>
      <Skeleton width="60px" height="24px" borderRadius="12px" />
    </div>
    
    <div className="mb-3">
      <Skeleton width="100%" height="8px" borderRadius="10px" />
    </div>
    
    <div className="row g-3 mb-3">
      <div className="col-4">
        <Skeleton width="100%" height="12px" className="mb-1" />
        <Skeleton width="80%" height="16px" />
      </div>
      <div className="col-4">
        <Skeleton width="100%" height="12px" className="mb-1" />
        <Skeleton width="70%" height="16px" />
      </div>
      <div className="col-4">
        <Skeleton width="100%" height="12px" className="mb-1" />
        <Skeleton width="60%" height="16px" />
      </div>
    </div>
    
    <div className="d-flex gap-2">
      <SkeletonButton />
      <SkeletonButton />
    </div>
  </div>
);

export const WalletInfoSkeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`card p-4 ${className}`}>
    <div className="d-flex align-items-center justify-content-between">
      <div className="d-flex align-items-center">
        <SkeletonAvatar size={48} className="me-3" />
        <div>
          <Skeleton width="150px" height="18px" className="mb-1" />
          <Skeleton width="200px" height="14px" />
        </div>
      </div>
      <SkeletonButton />
    </div>
  </div>
);

export const FormSkeleton: React.FC<{ fields?: number; className?: string }> = ({ 
  fields = 3, 
  className = '' 
}) => (
  <div className={className}>
    {Array.from({ length: fields }, (_, i) => (
      <div key={i} className="mb-3">
        <Skeleton width="100px" height="16px" className="mb-2" />
        <Skeleton width="100%" height="40px" borderRadius="12px" />
      </div>
    ))}
    <div className="d-flex gap-2 mt-4">
      <Skeleton width="100px" height="40px" borderRadius="12px" />
      <Skeleton width="80px" height="40px" borderRadius="12px" />
    </div>
  </div>
);

export default Skeleton;
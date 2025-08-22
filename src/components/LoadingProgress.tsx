// src/components/LoadingProgress.tsx - Enhanced loading with progress
import React from 'react';
import { Card, ProgressBar, Badge, Alert } from 'react-bootstrap';

interface LoadingProgressProps {
  loading: boolean;
  progress: {
    total: number;
    loaded: number;
    failed: number;
    percentage: number;
  };
  rateLimitInfo?: {
    per10Sec: number;
    per10Min: number;
    maxPer10Sec: number;
    maxPer10Min: number;
  };
  error?: string | null;
}

const LoadingProgress: React.FC<LoadingProgressProps> = ({
  loading,
  progress,
  rateLimitInfo,
  error
}) => {
  if (!loading && progress.total === 0) {
    return null;
  }

  const isNearRateLimit = rateLimitInfo && (
    rateLimitInfo.per10Sec > rateLimitInfo.maxPer10Sec * 0.8 ||
    rateLimitInfo.per10Min > rateLimitInfo.maxPer10Min * 0.8
  );

  return (
    <Card className="loading-progress-card mb-4">
      <Card.Body>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="mb-0">
            {loading ? '🔄 Loading Escrows' : '✅ Loading Complete'}
          </h6>
          {progress.total > 0 && (
            <Badge bg="primary">
              {progress.loaded + progress.failed} / {progress.total}
            </Badge>
          )}
        </div>

        {progress.total > 0 && (
          <>
            <ProgressBar className="mb-3">
              <ProgressBar 
                variant="success" 
                now={(progress.loaded / progress.total) * 100} 
                key={1}
              />
              {progress.failed > 0 && (
                <ProgressBar 
                  variant="warning" 
                  now={(progress.failed / progress.total) * 100} 
                  key={2}
                />
              )}
            </ProgressBar>

            <div className="d-flex justify-content-between text-muted small">
              <span>✅ Loaded: {progress.loaded}</span>
              {progress.failed > 0 && <span>⚠️ Failed: {progress.failed}</span>}
              <span>📊 Progress: {progress.percentage}%</span>
            </div>
          </>
        )}

        {/* Rate limit indicator */}
        {rateLimitInfo && (
          <div className="mt-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <span className="small text-muted">🌐 Ankr RPC Usage</span>
              {isNearRateLimit && (
                <Badge bg="warning" className="small">
                  Near Limit
                </Badge>
              )}
            </div>
            
            <div className="mb-2">
              <div className="d-flex justify-content-between small text-muted">
                <span>10 sec: {rateLimitInfo.per10Sec}/{rateLimitInfo.maxPer10Sec}</span>
                <span>10 min: {rateLimitInfo.per10Min}/{rateLimitInfo.maxPer10Min}</span>
              </div>
              
              <ProgressBar className="mt-1" style={{ height: '4px' }}>
                <ProgressBar 
                  variant={rateLimitInfo.per10Sec > rateLimitInfo.maxPer10Sec * 0.8 ? 'warning' : 'info'}
                  now={(rateLimitInfo.per10Sec / rateLimitInfo.maxPer10Sec) * 100}
                />
              </ProgressBar>
            </div>
          </div>
        )}

        {/* Loading tips */}
        {loading && (
          <Alert variant="info" className="mt-3 mb-0">
            <small>
              <strong>💡 Tip:</strong> Using optimized Ankr RPC with smart caching and rate limiting. 
              First load may take longer, but subsequent loads will be much faster!
            </small>
          </Alert>
        )}

        {/* Error display */}
        {error && (
          <Alert variant="warning" className="mt-3 mb-0">
            <small>
              <strong>⚠️ Notice:</strong> {error}
            </small>
          </Alert>
        )}

        {/* Performance info */}
        {!loading && progress.total > 0 && (
          <Alert variant="success" className="mt-3 mb-0">
            <small>
              <strong>⚡ Performance:</strong> Loaded {progress.loaded} escrows using cached data and optimized batching. 
              Data will stay fresh for 1 minute.
            </small>
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
};

export default LoadingProgress;
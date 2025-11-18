// src/components/ErrorBoundary.tsx - Error boundary for app stability
import React from 'react';
import { ErrorBoundary as ReactErrorBoundary } from 'react-error-boundary';
import { Container, Alert, Button, Card } from 'react-bootstrap';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

const ErrorFallback: React.FC<ErrorFallbackProps> = ({ error, resetErrorBoundary }) => {
  return (
    <Container className="min-vh-100 d-flex align-items-center justify-content-center">
      <Card className="shadow-lg" style={{ maxWidth: '600px' }}>
        <Card.Body className="p-4">
          <div className="text-center mb-4">
            <div className="display-1 mb-3">⚠️</div>
            <h2 className="mb-3">Oops! Something went wrong</h2>
            <p className="text-muted mb-4">
              The application encountered an unexpected error. Don't worry, your wallet and funds are safe.
            </p>
          </div>

          <Alert variant="danger" className="mb-4">
            <Alert.Heading className="h6">Error Details</Alert.Heading>
            <pre className="mb-0 small text-break" style={{ whiteSpace: 'pre-wrap' }}>
              {error.message}
            </pre>
          </Alert>

          <div className="d-grid gap-2">
            <Button
              variant="primary"
              size="lg"
              onClick={resetErrorBoundary}
            >
              🔄 Try Again
            </Button>
            <Button
              variant="outline-secondary"
              onClick={() => window.location.href = '/'}
            >
              🏠 Go to Home
            </Button>
          </div>

          <div className="text-center mt-4">
            <small className="text-muted">
              If this problem persists, please{' '}
              <a
                href="https://github.com/BluOwn/monadescrow/issues"
                target="_blank"
                rel="noopener noreferrer"
                className="text-decoration-none"
              >
                report it on GitHub
              </a>
            </small>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

const AppErrorBoundary: React.FC<AppErrorBoundaryProps> = ({ children }) => {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error caught by boundary:', error);
      console.error('Error info:', errorInfo);
    }

    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  };

  const handleReset = () => {
    // Clear any error state
    // Reload the page to start fresh
    window.location.href = '/';
  };

  return (
    <ReactErrorBoundary
      FallbackComponent={ErrorFallback}
      onError={handleError}
      onReset={handleReset}
    >
      {children}
    </ReactErrorBoundary>
  );
};

export default AppErrorBoundary;

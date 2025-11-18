// src/components/EnhancedButton.tsx - Enhanced button with loading states and animations
import React from 'react';
import { Button, ButtonProps, Spinner } from 'react-bootstrap';

interface EnhancedButtonProps extends ButtonProps {
  loading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
}

const EnhancedButton: React.FC<EnhancedButtonProps> = ({
  loading = false,
  loadingText = 'Loading...',
  icon,
  children,
  disabled,
  ...props
}) => {
  return (
    <Button
      {...props}
      disabled={disabled || loading}
      className={`enhanced-button ${props.className || ''}`}
    >
      {loading ? (
        <>
          <Spinner
            as="span"
            animation="border"
            size="sm"
            role="status"
            aria-hidden="true"
            className="me-2"
          />
          {loadingText}
        </>
      ) : (
        <>
          {icon && <span className="me-2" aria-hidden="true">{icon}</span>}
          {children}
        </>
      )}
    </Button>
  );
};

export default EnhancedButton;

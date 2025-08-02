// src/components/AnimatedAlert.tsx - TypeScript errors fixed
import React, { useEffect, useState } from 'react';
import { Alert } from 'react-bootstrap';

interface AnimatedAlertProps {
  variant: 'success' | 'danger' | 'warning' | 'info';
  children: React.ReactNode;
  show: boolean;
  onClose?: () => void;
  dismissible?: boolean;
  autoClose?: boolean;
  autoCloseDelay?: number;
  icon?: string;
  title?: string;
}

const AnimatedAlert: React.FC<AnimatedAlertProps> = ({
  variant,
  children,
  show,
  onClose,
  dismissible = true,
  autoClose = false,
  autoCloseDelay = 5000,
  icon,
  title
}) => {
  const [isVisible, setIsVisible] = useState(show);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (show) {
      setIsVisible(true);
      setIsExiting(false);
    } else {
      setIsExiting(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [show]);

  useEffect(() => {
    if (autoClose && show) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoCloseDelay);
      return () => clearTimeout(timer);
    }
    // Added explicit return for all code paths
    return undefined;
  }, [autoClose, autoCloseDelay, show]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setIsVisible(false);
      onClose?.();
    }, 300);
  };

  const getIcon = (): string => {
    if (icon) return icon;
    
    switch (variant) {
      case 'success': return '✅';
      case 'danger': return '❌';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '';
    }
  };

  if (!isVisible) return null;

  return (
    <Alert 
      variant={variant}
      dismissible={dismissible}
      onClose={dismissible ? handleClose : undefined}
      className={`animated-alert ${isExiting ? 'alert-exit' : 'alert-enter'}`}
    >
      <div className="d-flex align-items-start">
        {getIcon() && (
          <span className="alert-icon me-2" style={{ fontSize: '1.2rem' }}>
            {getIcon()}
          </span>
        )}
        <div className="flex-grow-1">
          {title && (
            <Alert.Heading className="h6 mb-1 fw-bold">
              {title}
            </Alert.Heading>
          )}
          <div className="alert-content">
            {children}
          </div>
        </div>
      </div>
      {autoClose && (
        <div 
          className="alert-progress-bar"
          style={{ 
            animationDuration: `${autoCloseDelay}ms`,
            animationName: show ? 'alertProgress' : 'none'
          }}
        />
      )}
    </Alert>
  );
};

export const ToastNotification: React.FC<{
  message: string;
  variant: 'success' | 'danger' | 'warning' | 'info';
  show: boolean;
  onClose: () => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
}> = ({ 
  message, 
  variant, 
  show, 
  onClose,
  position = 'top-right'
}) => {
  const positionClasses = {
    'top-right': 'position-fixed top-0 end-0 m-3',
    'top-left': 'position-fixed top-0 start-0 m-3',
    'bottom-right': 'position-fixed bottom-0 end-0 m-3',
    'bottom-left': 'position-fixed bottom-0 start-0 m-3'
  };

  return (
    <div className={positionClasses[position]} style={{ zIndex: 1050 }}>
      <AnimatedAlert
        variant={variant}
        show={show}
        onClose={onClose}
        autoClose={true}
        autoCloseDelay={4000}
      >
        {message}
      </AnimatedAlert>
    </div>
  );
};

export default AnimatedAlert;
// src/components/CustomAlert.tsx
import React from 'react';
import { Alert as BSAlert } from 'react-bootstrap';

interface CustomAlertProps {
  variant?: string;
  dismissible?: boolean;
  onClose?: () => void;
  className?: string;
  children: React.ReactNode;
}

const CustomAlert: React.FC<CustomAlertProps> = (props) => {
  return <BSAlert {...props} />;
};

export default CustomAlert;
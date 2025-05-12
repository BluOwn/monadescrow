// src/components/SecurityComponents.tsx
import React from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import { ESCROW_SERVICE_ADDRESS } from '../utils/security';
import { SecurityWarningModalProps, NetworkWarningProps } from '../types';

// Contract verification information component
export const ContractInfo: React.FC = () => {
  return (
    <div className="contract-info my-3 p-3 bg-light rounded">
      <h6>Contract Verification</h6>
      <p className="mb-1">
        <strong>Contract Address:</strong> 
        <code className="ms-2">{ESCROW_SERVICE_ADDRESS}</code>
      </p>
      <p className="mb-0">
        <a 
          href={`https://testnet.monadexplorer.com/address/${ESCROW_SERVICE_ADDRESS}`}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-sm btn-outline-primary"
        >
          Verify on Monad Explorer
        </a>
      </p>
    </div>
  );
};

// Security warning modal for new users
export const SecurityWarningModal: React.FC<SecurityWarningModalProps> = ({ show, onAccept, onDecline }) => {
  return (
    <Modal show={show} onHide={onDecline} centered backdrop="static">
      <Modal.Header>
        <Modal.Title>⚠️ Security Notice</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <h6>Before You Continue:</h6>
        <ul className="mb-3">
          <li>This is a testnet application - use only test funds</li>
          <li>Never share your private keys or seed phrase</li>
          <li>Always verify the contract address before transactions</li>
          <li>This is open-source software - audit the code if needed</li>
        </ul>
        
        <h6>Contract Details:</h6>
        <p className="mb-1"><strong>Address:</strong> <code>{ESCROW_SERVICE_ADDRESS}</code></p>
        <p className="mb-1"><strong>Network:</strong> Monad Testnet (Chain ID: 10143)</p>
        <p className="mb-3">
          <a 
            href="https://github.com/BluOwn/monadescrow" 
            target="_blank" 
            rel="noopener noreferrer"
          >
            View Source Code on GitHub
          </a>
        </p>
        
        <Alert variant="warning">
          <small>
            By clicking "I Understand", you acknowledge these security considerations and
            agree to use this application at your own risk.
          </small>
        </Alert>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onDecline}>
          Cancel
        </Button>
        <Button variant="primary" onClick={onAccept}>
          I Understand - Continue
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

// Security notice banner
export const SecurityBanner: React.FC = () => {
  return (
    <div className="security-banner bg-warning bg-opacity-10 p-2 mb-3 rounded">
      <small className="d-flex align-items-center">
        <span className="me-2">⚠️</span>
        <span>
          Always verify you're on the correct domain (testnet.monadescrow.xyz) and 
          connected to Monad Testnet. 
          <a 
            href="https://github.com/BluOwn/monadescrow" 
            target="_blank" 
            rel="noopener noreferrer"
            className="ms-1"
          >
            Verify source code
          </a>
        </span>
      </small>
    </div>
  );
};

// Network warning component
export const NetworkWarning: React.FC<NetworkWarningProps> = ({ currentNetwork, expectedNetwork = "Monad Testnet" }) => {
  if (currentNetwork === expectedNetwork) return null;
  
  return (
    <Alert variant="danger" className="my-3">
      <Alert.Heading>Wrong Network</Alert.Heading>
      <p className="mb-0">
        You are connected to: <strong>{currentNetwork || 'Unknown Network'}</strong>
      </p>
      <p className="mb-0">
        Please switch to <strong>{expectedNetwork}</strong> in your wallet.
      </p>
    </Alert>
  );
};
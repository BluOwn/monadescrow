// src/components/SecurityComponents.tsx
import React from 'react';
import { Modal, Button, Alert } from 'react-bootstrap';
import { ESCROW_SERVICE_ADDRESS } from '../utils/security';
import { SecurityWarningModalProps, NetworkWarningProps } from '../types';

// Contract verification information component
export const ContractInfo: React.FC = () => {
  return (
    <div className="contract-info my-4 p-4 rounded shadow-sm" style={{
      maxWidth: '1200px',
      marginLeft: 'auto',
      marginRight: 'auto',
      background: 'rgba(139, 92, 246, 0.05)',
      border: '1px solid rgba(139, 92, 246, 0.2)'
    }}>
      <h6 className="mb-3 fw-bold">📜 Contract Verification</h6>
      <div className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
        <div className="flex-grow-1">
          <div className="mb-2">
            <strong className="d-block mb-1">Contract Address:</strong>
            <code className="d-block p-2 rounded bg-white bg-opacity-75" style={{
              wordBreak: 'break-all',
              fontSize: '0.875rem'
            }}>
              {ESCROW_SERVICE_ADDRESS}
            </code>
          </div>
        </div>
        <div>
          <a
            href={`https://testnet.monadexplorer.com/address/${ESCROW_SERVICE_ADDRESS}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-primary"
            style={{ whiteSpace: 'nowrap' }}
          >
            🔍 Verify on Explorer
          </a>
        </div>
      </div>
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
    <div
      className="security-banner mb-4 p-3 rounded shadow-sm"
      style={{
        maxWidth: '1200px',
        marginLeft: 'auto',
        marginRight: 'auto',
        background: 'rgba(255, 193, 7, 0.1)',
        border: '1px solid rgba(255, 193, 7, 0.3)'
      }}
      role="alert"
      aria-live="polite"
    >
      <div className="d-flex flex-column flex-sm-row align-items-start gap-2">
        <div className="d-flex align-items-center flex-shrink-0">
          <span className="me-2" style={{ fontSize: '1.25rem' }} aria-hidden="true">⚠️</span>
        </div>
        <div className="flex-grow-1">
          <p className="mb-2 fw-semibold" style={{ fontSize: '0.9375rem' }}>
            Security Notice
          </p>
          <p className="mb-2" style={{ fontSize: '0.875rem', lineHeight: '1.5' }}>
            Always verify you're on the correct domain (<strong>testnet.monadescrow.xyz</strong>) and
            connected to <strong>Monad Testnet</strong>.
          </p>
          <a
            href="https://github.com/BluOwn/monadescrow"
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-sm btn-outline-warning"
            style={{ fontSize: '0.875rem' }}
          >
            🔐 Verify Source Code
          </a>
        </div>
      </div>
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
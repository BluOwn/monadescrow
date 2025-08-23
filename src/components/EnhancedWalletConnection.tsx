// src/components/EnhancedWalletConnection.tsx - Simplified Version
import React, { useState, useEffect } from 'react';
import { Button, Card, Alert, Modal, Spinner, Badge } from 'react-bootstrap';

interface EnhancedWalletConnectionProps {
  connected: boolean;
  account: string | null;
  error: string;
  connectWallet: () => Promise<boolean>;
  disconnectWallet: () => void;
  onConnectionSuccess?: () => void;
  onConnectionError?: (error: string) => void;
}

const EnhancedWalletConnection: React.FC<EnhancedWalletConnectionProps> = ({
  connected,
  account,
  error,
  connectWallet,
  disconnectWallet,
  onConnectionSuccess,
  onConnectionError
}) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState('');
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = (): boolean => {
    return typeof window !== 'undefined' && 
           typeof (window as any).ethereum !== 'undefined' &&
           (window as any).ethereum.isMetaMask;
  };

  // Check if we're on Monad Testnet
  const checkNetwork = async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
        const monadChainId = '0x2798'; // 10143 in hex (Monad Testnet)
        return chainId === monadChainId;
      } catch (error) {
        console.error('Network check failed:', error);
        return false;
      }
    }
    return false;
  };

  // Simple network switch request
  const requestNetworkSwitch = async (): Promise<boolean> => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2798' }], // 10143 in hex for Monad Testnet
        });
        return true;
      } catch (switchError: any) {
        console.error('Failed to switch network:', switchError);
        if (switchError.code === 4902) {
          throw new Error('Monad Testnet is not added to your wallet. Please add it manually.');
        }
        throw new Error('Failed to switch to Monad Testnet. Please switch manually in your wallet.');
      }
    }
    return false;
  };

  const handleMetaMaskConnect = async (): Promise<void> => {
    if (!isMetaMaskInstalled()) {
      setConnectionError('MetaMask is not installed. Please install MetaMask first.');
      setShowInstructions(true);
      return;
    }

    setIsConnecting(true);
    setConnectionError('');

    try {
      // First, try to connect the wallet
      console.log('Attempting to connect wallet...');
      const success = await connectWallet();
      
      if (!success) {
        throw new Error('Failed to connect to MetaMask. Please try again.');
      }

      // After successful connection, check network
      const isCorrectNetwork = await checkNetwork();
      if (!isCorrectNetwork) {
        console.log('Wrong network detected, requesting switch...');
        await requestNetworkSwitch();
      }

      setShowWalletModal(false);
      onConnectionSuccess?.();
      
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect wallet';
      console.error('Connection error:', err);
      setConnectionError(errorMessage);
      onConnectionError?.(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = (): void => {
    disconnectWallet();
    setConnectionError('');
  };

  // Auto-hide error after 8 seconds
  useEffect(() => {
    if (connectionError) {
      const timer = setTimeout(() => {
        setConnectionError('');
      }, 8000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [connectionError]);

  // Show error from props
  useEffect(() => {
    if (error && error !== connectionError) {
      setConnectionError(error);
    }
  }, [error, connectionError]);

  if (connected && account) {
    return (
      <div className="wallet-connected">
        <div className="d-flex align-items-center gap-3">
          <Badge bg="success" className="d-flex align-items-center gap-2">
            <span>🟢</span>
            Connected
          </Badge>
          <code className="wallet-address">
            {account.slice(0, 6)}...{account.slice(-4)}
          </code>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={handleDisconnect}
          >
            Disconnect
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Connection State */}
      <div className="wallet-connection-section">
        <Card className="welcome-card">
          <Card.Body className="text-center">
            <div className="welcome-icon">🌟</div>
            <h2>Welcome to Monad Escrow</h2>
            <p className="lead">
              The most secure and user-friendly escrow service on Monad Testnet
            </p>

            {/* Error Display */}
            {connectionError && (
              <Alert variant="danger" className="mb-4">
                <div className="d-flex align-items-start gap-2">
                  <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                  <div className="text-start">
                    <strong>Connection Issue</strong>
                    <div>{connectionError}</div>
                    {connectionError.includes('MetaMask') && (
                      <small className="d-block mt-2">
                        <Button 
                          variant="link" 
                          size="sm" 
                          className="p-0"
                          onClick={() => setShowInstructions(true)}
                        >
                          Click here for setup help →
                        </Button>
                      </small>
                    )}
                  </div>
                </div>
              </Alert>
            )}

            <div className="features-grid">
              <div className="feature-item">
                <div className="feature-icon">🔒</div>
                <h5>Secure</h5>
                <p>Smart contract protection</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">⚡</div>
                <h5>Fast</h5>
                <p>Lightning-fast transactions</p>
              </div>
              <div className="feature-item">
                <div className="feature-icon">🌍</div>
                <h5>Trustless</h5>
                <p>No intermediaries needed</p>
              </div>
            </div>

            {/* Connection Buttons */}
            <div className="connection-buttons">
              {isMetaMaskInstalled() ? (
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleMetaMaskConnect}
                  disabled={isConnecting}
                  className="connect-button"
                >
                  {isConnecting ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      Connecting...
                    </>
                  ) : (
                    <>
                      <span className="me-2">🦊</span>
                      Connect MetaMask
                    </>
                  )}
                </Button>
              ) : (
                <div>
                  <Button
                    variant="outline-primary"
                    size="lg"
                    onClick={() => setShowInstructions(true)}
                    className="install-button mb-3"
                  >
                    <span className="me-2">📥</span>
                    Install MetaMask
                  </Button>
                  <div>
                    <small className="text-muted">
                      MetaMask is required to connect
                    </small>
                  </div>
                </div>
              )}
            </div>

            <div className="supported-wallets mt-3">
              <small className="text-muted">
                MetaMask • Other wallets coming soon
              </small>
            </div>

            {/* Help Link */}
            <div className="mt-3">
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowInstructions(true)}
              >
                Need help? Setup instructions →
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Instructions Modal */}
      <Modal
        show={showInstructions}
        onHide={() => setShowInstructions(false)}
        centered
        size="lg"
        className="instructions-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <span className="me-2">📖</span>
            MetaMask Setup Guide
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="setup-instructions">
            <h5>Getting Started</h5>
            
            <div className="instruction-step">
              <div className="step-number">1</div>
              <div>
                <h6>Install MetaMask</h6>
                <p>
                  Go to{' '}
                  <a 
                    href="https://metamask.io" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="fw-bold"
                  >
                    metamask.io
                  </a>{' '}
                  and install the browser extension
                </p>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-number">2</div>
              <div>
                <h6>Set Up Your Wallet</h6>
                <p>Create a new wallet or import existing one using your seed phrase</p>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-number">3</div>
              <div>
                <h6>Add Monad Testnet</h6>
                <p>You need to manually add Monad Testnet to MetaMask:</p>
                <div className="network-details">
                  <strong>Network Settings:</strong>
                  <ul>
                    <li><strong>Network Name:</strong> Monad Testnet</li>
                    <li><strong>RPC URL:</strong> https://rpc-testnet.monad.xyz</li>
                    <li><strong>Chain ID:</strong> 10143</li>
                    <li><strong>Currency Symbol:</strong> MON</li>
                    <li><strong>Block Explorer:</strong> https://testnet.monadexplorer.com</li>
                  </ul>
                  <small className="text-muted">
                    Go to MetaMask → Settings → Networks → Add Network → Add a network manually
                  </small>
                </div>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-number">4</div>
              <div>
                <h6>Get Test Tokens</h6>
                <p>Visit a Monad faucet to get testnet MON tokens for testing</p>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-number">5</div>
              <div>
                <h6>Connect to DApp</h6>
                <p>Click "Connect MetaMask" and approve the connection in the MetaMask popup</p>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInstructions(false)}>
            Close
          </Button>
          {isMetaMaskInstalled() && (
            <Button 
              variant="primary" 
              onClick={() => {
                setShowInstructions(false);
                handleMetaMaskConnect();
              }}
            >
              Try Connecting
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EnhancedWalletConnection;
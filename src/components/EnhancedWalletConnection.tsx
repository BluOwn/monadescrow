// src/components/EnhancedWalletConnection.tsx - Improved Wallet Connection
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

interface WalletProvider {
  id: string;
  name: string;
  icon: string;
  description: string;
  installed: boolean;
  connect: () => Promise<void>;
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
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [showInstructions, setShowInstructions] = useState(false);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = () => {
    return typeof window !== 'undefined' && 
           typeof (window as any).ethereum !== 'undefined' &&
           (window as any).ethereum.isMetaMask;
  };

  // Check network
  const checkNetwork = async () => {
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

  // Switch to Monad Testnet
  const switchToMonadTestnet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2798' }], // 10143 in hex
        });
        return true;
      } catch (switchError: any) {
        // If the chain hasn't been added to MetaMask, add it
        if (switchError.code === 4902) {
          try {
            await (window as any).ethereum.request({
              method: 'wallet_addEthereumChain',
              params: [
                {
                  chainId: '0x2798',
                  chainName: 'Monad Testnet',
                  rpcUrls: ['https://rpc-testnet.monad.xyz'],
                  nativeCurrency: {
                    name: 'Monad',
                    symbol: 'MON',
                    decimals: 18,
                  },
                  blockExplorerUrls: ['https://testnet.monadexplorer.com'],
                },
              ],
            });
            return true;
          } catch (addError) {
            console.error('Failed to add Monad Testnet:', addError);
            return false;
          }
        }
        console.error('Failed to switch network:', switchError);
        return false;
      }
    }
    return false;
  };

  const handleWalletConnect = async () => {
    if (!isMetaMaskInstalled()) {
      setConnectionError('MetaMask is not installed. Please install MetaMask to continue.');
      setShowInstructions(true);
      return;
    }

    setIsConnecting(true);
    setConnectionError('');
    setConnectionAttempts(prev => prev + 1);

    try {
      // Step 1: Check and switch network if needed
      const isCorrectNetwork = await checkNetwork();
      if (!isCorrectNetwork) {
        const networkSwitched = await switchToMonadTestnet();
        if (!networkSwitched) {
          throw new Error('Please switch to Monad Testnet in your wallet');
        }
      }

      // Step 2: Connect wallet
      const success = await connectWallet();
      
      if (success) {
        setShowWalletModal(false);
        onConnectionSuccess?.();
      } else {
        throw new Error('Failed to connect wallet. Please try again.');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to connect wallet';
      setConnectionError(errorMessage);
      onConnectionError?.(errorMessage);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    disconnectWallet();
    setConnectionError('');
    setConnectionAttempts(0);
  };

  const resetConnection = () => {
    setConnectionError('');
    setConnectionAttempts(0);
    setShowWalletModal(false);
  };

  // Wallet providers list
  const walletProviders: WalletProvider[] = [
    {
      id: 'metamask',
      name: 'MetaMask',
      icon: '🦊',
      description: 'Connect using browser extension',
      installed: isMetaMaskInstalled(),
      connect: handleWalletConnect
    },
    {
      id: 'walletconnect',
      name: 'WalletConnect',
      icon: '📱',
      description: 'Connect using mobile wallet',
      installed: true, // WalletConnect is always "available"
      connect: async () => {
        setConnectionError('WalletConnect integration coming soon!');
      }
    }
  ];

  // Auto-hide error after 5 seconds
  useEffect(() => {
    if (connectionError) {
      const timer = setTimeout(() => {
        setConnectionError('');
      }, 5000);
      return () => clearTimeout(timer);
    }
    // Add return statement for when there's no connectionError
    return undefined;
  }, [connectionError]);

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
            {(connectionError || error) && (
              <Alert variant="danger" className="mb-4">
                <div className="d-flex align-items-center gap-2">
                  <span>⚠️</span>
                  <div>
                    <strong>Connection Failed</strong>
                    <div>{connectionError || error}</div>
                  </div>
                </div>
              </Alert>
            )}

            {/* Connection Attempts Warning */}
            {connectionAttempts >= 3 && (
              <Alert variant="warning" className="mb-4">
                <div className="text-start">
                  <strong>Having trouble connecting?</strong>
                  <ul className="mt-2 mb-0">
                    <li>Make sure MetaMask is unlocked</li>
                    <li>Check if you're on Monad Testnet</li>
                    <li>Try refreshing the page</li>
                    <li>Restart your browser if needed</li>
                  </ul>
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
              <Button
                variant="primary"
                size="lg"
                onClick={() => setShowWalletModal(true)}
                disabled={isConnecting}
                className="connect-button me-3"
              >
                {isConnecting ? (
                  <>
                    <Spinner size="sm" className="me-2" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <span className="me-2">🔗</span>
                    Connect Wallet
                  </>
                )}
              </Button>

              {/* Quick Connect for MetaMask */}
              {isMetaMaskInstalled() && (
                <Button
                  variant="outline-primary"
                  size="lg"
                  onClick={handleWalletConnect}
                  disabled={isConnecting}
                  className="quick-connect-button"
                >
                  <span className="me-2">🦊</span>
                  MetaMask
                </Button>
              )}
            </div>

            <div className="supported-wallets mt-3">
              <small className="text-muted">
                Supports MetaMask • WalletConnect coming soon
              </small>
            </div>

            {/* Help Link */}
            <div className="mt-3">
              <Button
                variant="link"
                size="sm"
                onClick={() => setShowInstructions(true)}
              >
                Need help? Click here for setup instructions
              </Button>
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Wallet Selection Modal */}
      <Modal 
        show={showWalletModal} 
        onHide={() => setShowWalletModal(false)}
        centered
        className="wallet-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <span className="me-2">🔗</span>
            Connect Your Wallet
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="wallet-providers">
            {walletProviders.map((provider) => (
              <Card
                key={provider.id}
                className={`wallet-provider-card ${!provider.installed ? 'disabled' : ''}`}
                onClick={provider.installed ? provider.connect : undefined}
                style={{ cursor: provider.installed ? 'pointer' : 'not-allowed' }}
              >
                <Card.Body className="d-flex align-items-center gap-3">
                  <div className="provider-icon">{provider.icon}</div>
                  <div className="flex-grow-1">
                    <h5 className="mb-1">{provider.name}</h5>
                    <p className="text-muted mb-0">{provider.description}</p>
                  </div>
                  {!provider.installed && (
                    <Badge bg="warning">Not Installed</Badge>
                  )}
                  {provider.installed && (
                    <Badge bg="success">Available</Badge>
                  )}
                </Card.Body>
              </Card>
            ))}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <small className="text-muted">
            By connecting, you agree to our Terms of Service
          </small>
        </Modal.Footer>
      </Modal>

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
            Wallet Setup Instructions
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="setup-instructions">
            <h5>Getting Started with MetaMask</h5>
            
            <div className="instruction-step">
              <div className="step-number">1</div>
              <div>
                <h6>Install MetaMask</h6>
                <p>Download and install the MetaMask browser extension from <a href="https://metamask.io" target="_blank" rel="noopener noreferrer">metamask.io</a></p>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-number">2</div>
              <div>
                <h6>Create or Import Wallet</h6>
                <p>Follow MetaMask's setup process to create a new wallet or import an existing one</p>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-number">3</div>
              <div>
                <h6>Add Monad Testnet</h6>
                <p>We'll automatically add Monad Testnet to your MetaMask when you connect</p>
                <div className="network-details">
                  <strong>Network Details:</strong>
                  <ul>
                    <li>Network Name: Monad Testnet</li>
                    <li>RPC URL: https://rpc-testnet.monad.xyz</li>
                    <li>Chain ID: 10143</li>
                    <li>Currency: MON</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="instruction-step">
              <div className="step-number">4</div>
              <div>
                <h6>Get Test Tokens</h6>
                <p>Visit the Monad faucet to get testnet MON tokens for testing</p>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowInstructions(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={() => {
            setShowInstructions(false);
            setShowWalletModal(true);
          }}>
            Try Connecting
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default EnhancedWalletConnection;
// src/components/EnhancedWalletConnection.tsx
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

  // Switch to Monad Testnet (without adding)
  const switchToMonadTestnet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        await (window as any).ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x2798' }], // 10143 in hex
        });
        return true;
      } catch (switchError: any) {
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

            {/* Connect buttons */}
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
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default EnhancedWalletConnection;

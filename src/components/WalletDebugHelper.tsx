// src/components/WalletDebugHelper.tsx - Debug Component
import React, { useState, useEffect } from 'react';
import { Card, Button, Badge, Alert } from 'react-bootstrap';

interface WalletDebugHelperProps {
  account: string | null;
  connected: boolean;
  error: string;
  provider: any;
  signer: any;
  connectWallet: () => Promise<boolean>;
}

const WalletDebugHelper: React.FC<WalletDebugHelperProps> = ({
  account,
  connected,
  error,
  provider,
  signer,
  connectWallet
}) => {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [isDebugging, setIsDebugging] = useState(false);

  const collectDebugInfo = async () => {
    setIsDebugging(true);
    const info: any = {
      timestamp: new Date().toISOString(),
      windowEthereum: typeof (window as any).ethereum,
      isMetaMask: (window as any).ethereum?.isMetaMask,
      account,
      connected,
      error,
      provider: !!provider,
      signer: !!signer,
    };

    if ((window as any).ethereum) {
      try {
        info.chainId = await (window as any).ethereum.request({ method: 'eth_chainId' });
        info.accounts = await (window as any).ethereum.request({ method: 'eth_accounts' });
        info.networkVersion = await (window as any).ethereum.request({ method: 'net_version' });
      } catch (err) {
        info.ethereumError = (err as Error).message;
      }
    }

    setDebugInfo(info);
    setIsDebugging(false);
  };

  const testDirectConnection = async () => {
    if (!(window as any).ethereum) {
      alert('No ethereum provider found');
      return;
    }

    try {
      console.log('Testing direct MetaMask connection...');
      const accounts = await (window as any).ethereum.request({
        method: 'eth_requestAccounts',
      });
      console.log('Direct connection successful:', accounts);
      alert(`Direct connection successful! Account: ${accounts[0]}`);
    } catch (err) {
      console.error('Direct connection failed:', err);
      alert(`Direct connection failed: ${(err as Error).message}`);
    }
  };

  useEffect(() => {
    // Auto-collect debug info when component mounts
    collectDebugInfo();
  }, []);

  return (
    <Card className="mt-4">
      <Card.Header>
        <h5>🔧 Wallet Debug Helper</h5>
      </Card.Header>
      <Card.Body>
        <div className="d-flex gap-2 mb-3">
          <Button 
            variant="info" 
            size="sm" 
            onClick={collectDebugInfo}
            disabled={isDebugging}
          >
            {isDebugging ? 'Collecting...' : 'Collect Debug Info'}
          </Button>
          <Button 
            variant="warning" 
            size="sm" 
            onClick={testDirectConnection}
          >
            Test Direct Connection
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            onClick={connectWallet}
          >
            Test Hook Connection
          </Button>
        </div>

        {Object.keys(debugInfo).length > 0 && (
          <Alert variant="info">
            <h6>Debug Information:</h6>
            <pre style={{ fontSize: '12px', maxHeight: '300px', overflow: 'auto' }}>
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </Alert>
        )}

        <div className="status-indicators">
          <h6>Status Indicators:</h6>
          <div className="d-flex flex-wrap gap-2">
            <Badge bg={(window as any).ethereum ? 'success' : 'danger'}>
              Ethereum Provider: {(window as any).ethereum ? '✓' : '✗'}
            </Badge>
            <Badge bg={(window as any).ethereum?.isMetaMask ? 'success' : 'warning'}>
              MetaMask: {(window as any).ethereum?.isMetaMask ? '✓' : '?'}
            </Badge>
            <Badge bg={connected ? 'success' : 'secondary'}>
              Connected: {connected ? '✓' : '✗'}
            </Badge>
            <Badge bg={account ? 'success' : 'secondary'}>
              Account: {account ? '✓' : '✗'}
            </Badge>
            <Badge bg={provider ? 'success' : 'secondary'}>
              Provider: {provider ? '✓' : '✗'}
            </Badge>
            <Badge bg={signer ? 'success' : 'secondary'}>
              Signer: {signer ? '✓' : '✗'}
            </Badge>
          </div>
        </div>

        {error && (
          <Alert variant="danger" className="mt-3">
            <strong>Error:</strong> {error}
          </Alert>
        )}

        <div className="mt-3">
          <small className="text-muted">
            This debug helper shows the current state of your wallet connection.
            Use it to diagnose connection issues.
          </small>
        </div>
      </Card.Body>
    </Card>
  );
};

export default WalletDebugHelper;
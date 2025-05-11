// src/components/wallet/WalletInfo.js
import React from 'react';
import { Button } from 'react-bootstrap';
import AddressDisplay from '../common/AddressDisplay';
import ThemeToggle from '../ThemeToggle';

const WalletInfo = ({ account, networkName, disconnectWallet }) => {
  return (
    <div className="wallet-info mb-4">
      <div>
        <small>Connected to: <span className="network-badge">{networkName}</span></small>
        <p className="mb-0"><strong>Account:</strong> <AddressDisplay address={account} /></p>
      </div>
      <div className="d-flex">
        <ThemeToggle />
        <Button 
          variant="outline-secondary" 
          size="sm" 
          className="ms-2" 
          onClick={disconnectWallet}
        >
          Disconnect
        </Button>
      </div>
    </div>
  );
};

export default WalletInfo;
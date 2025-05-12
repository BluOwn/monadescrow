// src/components/ArbitratedEscrowsTab.tsx
import React from 'react';
import Card from 'react-bootstrap/Card';  // Import Card directly from its module
import EscrowList from './EscrowList';
import { ArbitratedEscrowsTabProps } from '../types';

const ArbitratedEscrowsTab: React.FC<ArbitratedEscrowsTabProps> = ({
  arbitratedEscrows, 
  onViewDetails, 
  loadingArbitratedEscrows,
  retryLoadingEscrows,
  account,
  onAction
}) => {
  return (
    <Card>
      <Card.Body>
        <Card.Title>Escrows You're Arbitrating</Card.Title>
        <EscrowList 
          escrows={arbitratedEscrows} 
          onViewDetails={onViewDetails} 
          loadingEscrows={loadingArbitratedEscrows}
          retryLoadingEscrows={retryLoadingEscrows}
          account={account}
          onAction={onAction}
        />
      </Card.Body>
    </Card>
  );
};

export default ArbitratedEscrowsTab;
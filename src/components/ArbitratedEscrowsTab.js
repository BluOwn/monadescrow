import React from 'react';
import { Card } from 'react-bootstrap';
import EscrowList from './EscrowList';

const ArbitratedEscrowsTab = ({
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
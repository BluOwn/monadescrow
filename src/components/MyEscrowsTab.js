import React from 'react';
import { Card } from 'react-bootstrap';
import EscrowList from './EscrowList';

const MyEscrowsTab = ({ 
  escrows, 
  onViewDetails, 
  loadingEscrows,
  retryLoadingEscrows,
  account,
  onAction
}) => {
  return (
    <Card>
      <Card.Body>
        <Card.Title>My Escrows</Card.Title>
        <EscrowList 
          escrows={escrows} 
          onViewDetails={onViewDetails} 
          loadingEscrows={loadingEscrows}
          retryLoadingEscrows={retryLoadingEscrows}
          account={account}
          onAction={onAction}
        />
      </Card.Body>
    </Card>
  );
};

export default MyEscrowsTab;
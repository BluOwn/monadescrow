import React, { useState } from 'react';
import { Button, Badge, Form, Alert } from 'react-bootstrap';
import AddressDisplay from './AddressDisplay';

const EscrowDetails = ({ 
  escrow, 
  account, 
  onAction, 
  loading 
}) => {
  const [recipientForDispute, setRecipientForDispute] = useState('');
  
  if (!escrow) return null;
  
  const userIsBuyer = account.toLowerCase() === escrow.buyer.toLowerCase();
  const userIsSeller = account.toLowerCase() === escrow.seller.toLowerCase();
  const userIsArbiter = account.toLowerCase() === escrow.arbiter.toLowerCase();
  
  const getStatusBadge = () => {
    if (escrow.fundsDisbursed) {
      return <Badge bg="success">Completed</Badge>;
    } else if (escrow.disputeRaised) {
      return <Badge bg="danger">Disputed</Badge>;
    } else {
      return <Badge bg="primary">Active</Badge>;
    }
  };
  
  return (
    <div className="escrow-details">
      <div className="d-flex justify-content-between align-items-start mb-3">
        <h5>Escrow #{escrow.id.toString()}</h5>
        {getStatusBadge()}
      </div>
      
      <div className="user-role-section mb-3">
        {userIsBuyer && (
          <div className="user-role-indicator">
            <Badge className="buyer-badge">You are the Buyer</Badge>
          </div>
        )}
        {userIsSeller && (
          <div className="user-role-indicator">
            <Badge className="seller-badge">You are the Seller</Badge>
          </div>
        )}
        {userIsArbiter && (
          <div className="user-role-indicator">
            <Badge className="arbiter-badge">You are the Arbiter</Badge>
          </div>
        )}
      </div>
      
      <div className="escrow-participants mb-3">
        <p><strong>Buyer:</strong> <AddressDisplay address={escrow.buyer} /></p>
        <p><strong>Seller:</strong> <AddressDisplay address={escrow.seller} /></p>
        <p><strong>Arbiter:</strong> <AddressDisplay address={escrow.arbiter} /></p>
      </div>
      
      <div className="escrow-amount mb-3">
        <h6>Amount</h6>
        <p className="fs-4 fw-bold">{escrow.amount} MON</p>
      </div>
      
      {!escrow.fundsDisbursed && (
        <div className="mt-4">
          <h6>Available Actions</h6>
          
          {/* Buyer Actions */}
          {userIsBuyer && !escrow.disputeRaised && (
            <Button 
              variant="success" 
              size="sm" 
              className="me-2 mb-2" 
              onClick={() => onAction('release', escrow.id)}
              disabled={loading}
            >
              Release Funds to Seller
            </Button>
          )}
          
          {/* Seller Actions */}
          {userIsSeller && !escrow.disputeRaised && (
            <Button 
              variant="warning" 
              size="sm" 
              className="me-2 mb-2" 
              onClick={() => onAction('refund', escrow.id)}
              disabled={loading}
            >
              Refund Buyer
            </Button>
          )}
          
          {/* Dispute Actions (Buyer or Seller) */}
          {(userIsBuyer || userIsSeller) && !escrow.disputeRaised && (
            <Button 
              variant="danger" 
              size="sm" 
              className="me-2 mb-2" 
              onClick={() => onAction('dispute', escrow.id)}
              disabled={loading}
            >
              Raise Dispute
            </Button>
          )}
          
          {/* Arbiter Actions */}
          {userIsArbiter && (
            <div className="arbiter-actions mt-3">
              <Alert variant="info" className="mb-3">
                <strong>Arbiter Controls</strong>
                <p className="mb-0">As the arbiter, you can resolve disputes or refund the buyer if needed.</p>
              </Alert>
              
              {/* Refund Button (always available to arbiter) */}
              {!escrow.disputeRaised && !escrow.fundsDisbursed && (
                <Button 
                  variant="warning" 
                  size="sm" 
                  className="me-2 mb-2" 
                  onClick={() => onAction('refund', escrow.id)}
                  disabled={loading}
                >
                  Refund Buyer
                </Button>
              )}
              
              {/* Dispute Resolution (only if dispute raised) */}
              {escrow.disputeRaised && (
                <div>
                  <Form.Group className="mb-2">
                    <Form.Label>Resolve dispute in favor of:</Form.Label>
                    <Form.Select 
                      onChange={(e) => setRecipientForDispute(e.target.value)}
                      className="mb-2"
                    >
                      <option value="">Select recipient</option>
                      <option value={escrow.buyer}>Buyer</option>
                      <option value={escrow.seller}>Seller</option>
                    </Form.Select>
                  </Form.Group>
                  
                  <Button 
                    variant="primary" 
                    size="sm" 
                    onClick={() => onAction('resolve', escrow.id, recipientForDispute)}
                    disabled={loading || !recipientForDispute}
                  >
                    Resolve Dispute
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Show completion message if escrow is completed */}
      {escrow.fundsDisbursed && (
        <Alert variant="success" className="mt-3">
          <strong>This escrow has been completed.</strong>
          <p className="mb-0">Funds have been released successfully.</p>
        </Alert>
      )}
    </div>
  );
};

export default EscrowDetails;
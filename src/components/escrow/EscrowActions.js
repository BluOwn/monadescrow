// src/components/escrow/EscrowActions.js
import React from 'react';
import { Button, Form } from 'react-bootstrap';

const EscrowActions = ({ 
  escrow, 
  userRole, 
  onAction, 
  loading,
  recipientForDispute,
  setRecipientForDispute 
}) => {
  if (!escrow || escrow.fundsDisbursed) return null;
  
  return (
    <div className="mt-4">
      <h6>Available Actions</h6>
      
      {/* Buyer Actions */}
      {userRole === 'buyer' && !escrow.disputeRaised && (
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
      {userRole === 'seller' && !escrow.disputeRaised && (
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
      {(userRole === 'buyer' || userRole === 'seller') && !escrow.disputeRaised && (
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
      {userRole === 'arbiter' && (
        <div className="arbiter-actions mt-3">
          {/* Refund Button (always available to arbiter) */}
          {!escrow.disputeRaised && (
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
  );
};

export default EscrowActions;
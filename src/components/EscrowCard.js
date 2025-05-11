import React from 'react';
import { Card, Badge, Button, ProgressBar } from 'react-bootstrap';

const EscrowCard = ({ escrow, onViewDetails, onAction, account }) => {
  // Determine escrow progress
  const getProgress = () => {
    if (escrow.fundsDisbursed) return 100;
    if (escrow.disputeRaised) return 66;
    return 33; // Active but no dispute
  };
  
  // Determine user role
  const userRole = account.toLowerCase() === escrow.buyer.toLowerCase() 
    ? 'buyer' 
    : account.toLowerCase() === escrow.seller.toLowerCase()
      ? 'seller'
      : account.toLowerCase() === escrow.arbiter.toLowerCase()
        ? 'arbiter' : null;
  
  // Helper function to truncate address
  const truncateAddress = (address) => {
    return address.slice(0, 6) + '...' + address.slice(-4);
  };
  
  return (
    <Card className="mb-3 escrow-card">
      <Card.Header className="d-flex justify-content-between align-items-center">
        <div>
          <span className="escrow-id">Escrow #{escrow.id.toString()}</span>
        </div>
        <Badge 
          bg={escrow.fundsDisbursed 
            ? 'success' 
            : escrow.disputeRaised 
              ? 'danger' 
              : 'primary'}
        >
          {escrow.fundsDisbursed 
            ? 'Completed' 
            : escrow.disputeRaised 
              ? 'Disputed' 
              : 'Active'}
        </Badge>
      </Card.Header>
      
      <Card.Body>
        <div className="escrow-progress mb-3">
          <ProgressBar 
            now={getProgress()} 
            variant={escrow.disputeRaised ? "warning" : "info"}
          />
          <div className="progress-labels d-flex justify-content-between mt-1">
            <small>Created</small>
            <small>In Progress</small>
            <small>Completed</small>
          </div>
        </div>
        
        <div className="escrow-details">
          <div className="d-flex align-items-center mb-2">
            <span className="fw-bold me-2">Amount:</span>
            <span>{escrow.amount} MON</span>
          </div>
          
          <div className="participants">
            <div className="participant d-flex align-items-center mb-1">
              <span className={userRole === 'buyer' ? 'fw-bold' : ''}>
                Buyer: {truncateAddress(escrow.buyer)}
                {userRole === 'buyer' && <small className="ms-1">(You)</small>}
              </span>
            </div>
            
            <div className="participant d-flex align-items-center mb-1">
              <span className={userRole === 'seller' ? 'fw-bold' : ''}>
                Seller: {truncateAddress(escrow.seller)}
                {userRole === 'seller' && <small className="ms-1">(You)</small>}
              </span>
            </div>
            
            <div className="participant d-flex align-items-center">
              <span className={userRole === 'arbiter' ? 'fw-bold' : ''}>
                Arbiter: {truncateAddress(escrow.arbiter)}
                {userRole === 'arbiter' && <small className="ms-1">(You)</small>}
              </span>
            </div>
          </div>
        </div>
      </Card.Body>
      
      <Card.Footer className="d-flex justify-content-between">
        <Button 
          variant="outline-primary" 
          size="sm"
          onClick={() => onViewDetails(escrow.id)}
        >
          View Details
        </Button>
        
        {!escrow.fundsDisbursed && userRole && (
          <div>
            {userRole === 'buyer' && !escrow.disputeRaised && (
              <Button 
                variant="success" 
                size="sm"
                onClick={() => onAction('release', escrow.id)}
              >
                Release Funds
              </Button>
            )}
            
            {userRole === 'arbiter' && !escrow.disputeRaised && (
              <Button 
                variant="warning" 
                size="sm"
                onClick={() => onAction('refund', escrow.id)}
              >
                Refund Buyer
              </Button>
            )}
          </div>
        )}
      </Card.Footer>
    </Card>
  );
};

export default EscrowCard;
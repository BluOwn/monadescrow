// src/components/CreateEscrowTab.tsx - Minimalist Design
import React, { useState } from 'react';
import { Card, Form, Button, Alert, Badge, Collapse } from 'react-bootstrap';
import { CreateEscrowTabProps } from '../types';

const CreateEscrowTab: React.FC<CreateEscrowTabProps> = ({ 
  handleCreateEscrow, 
  sellerAddress, 
  setSellerAddress,
  arbiterAddress, 
  setArbiterAddress,
  amount, 
  setAmount,
  loading,
  currentAccount
}) => {
  const [showHelper, setShowHelper] = useState<boolean>(false);
  
  // Recommended arbiter address
  const RECOMMENDED_ARBITER = "0xC4E06Cd628D1ABA8436a812D8a1fA49a4b3BbC47";
  
  // Validation helpers
  const isCurrentAccount = (address: string): boolean => {
    if (!address || !currentAccount) return false;
    return address.toLowerCase() === currentAccount.toLowerCase();
  };

  const isSellerArbiterSame = (seller: string, arbiter: string): boolean => {
    if (!seller || !arbiter) return false;
    return seller.toLowerCase() === arbiter.toLowerCase();
  };

  const isFormValid = (): boolean => {
    return (
      !isCurrentAccount(sellerAddress) && 
      !isCurrentAccount(arbiterAddress) && 
      !isSellerArbiterSame(sellerAddress, arbiterAddress) &&
      !!sellerAddress &&
      !!arbiterAddress &&
      !!amount &&
      parseFloat(amount) > 0
    );
  };

  const useRecommendedArbiter = (): void => {
    setArbiterAddress(RECOMMENDED_ARBITER);
    navigator.clipboard.writeText(RECOMMENDED_ARBITER);
  };

  const getAddressValidation = (address: string, type: 'seller' | 'arbiter') => {
    if (!address) return { isValid: true, message: '' };
    
    if (isCurrentAccount(address)) {
      return { 
        isValid: false, 
        message: `${type === 'seller' ? 'Seller' : 'Arbiter'} cannot be your own address` 
      };
    }
    
    if (type === 'arbiter' && sellerAddress && isSellerArbiterSame(sellerAddress, address)) {
      return { 
        isValid: false, 
        message: 'Arbiter must be different from seller' 
      };
    }
    
    return { isValid: true, message: '' };
  };

  const sellerValidation = getAddressValidation(sellerAddress, 'seller');
  const arbiterValidation = getAddressValidation(arbiterAddress, 'arbiter');

  return (
    <div className="create-escrow-container">
      <Card className="create-escrow-card">
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <Card.Title className="mb-0">Create New Escrow</Card.Title>
            <Badge bg="primary">Step 1 of 2</Badge>
          </div>
        </Card.Header>
        
        <Card.Body>
          {/* Contract Information */}
          <Alert variant="info" className="contract-info">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <h6 className="mb-1">Smart Contract</h6>
                <p className="mb-0 small">Verified on Monad Testnet</p>
              </div>
              <Badge bg="success">Verified ✓</Badge>
            </div>
          </Alert>

          {/* Role Requirements */}
          <Alert variant="light" className="requirements-info">
            <h6 className="mb-2">Requirements</h6>
            <ul className="mb-0 small">
              <li>Buyer (you), seller, and arbiter must be different addresses</li>
              <li>Minimum amount: 0.001 MON</li>
              <li>Ensure you have sufficient balance for gas fees</li>
            </ul>
          </Alert>

          {/* Create Escrow Form */}
          <Form onSubmit={handleCreateEscrow}>
            {/* Seller Address */}
            <Form.Group className="mb-4">
              <Form.Label>
                Seller Address
                <Badge bg="secondary" className="ms-2">Required</Badge>
              </Form.Label>
              <Form.Control
                type="text"
                placeholder="0x..."
                value={sellerAddress}
                onChange={(e) => setSellerAddress(e.target.value)}
                isInvalid={!sellerValidation.isValid}
                required
              />
              {!sellerValidation.isValid && (
                <Form.Control.Feedback type="invalid">
                  {sellerValidation.message}
                </Form.Control.Feedback>
              )}
              <Form.Text className="text-muted">
                The address that will receive the funds when escrow is completed
              </Form.Text>
            </Form.Group>

            {/* Arbiter Address */}
            <Form.Group className="mb-4">
              <Form.Label>
                Arbiter Address
                <Badge bg="secondary" className="ms-2">Required</Badge>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="ms-2 p-0"
                  onClick={() => setShowHelper(!showHelper)}
                >
                  Need help?
                </Button>
              </Form.Label>
              
              <Collapse in={showHelper}>
                <Alert variant="light" className="helper-box">
                  <h6>Recommended Arbiter</h6>
                  <p className="mb-2 small">
                    Use our trusted arbiter service for secure dispute resolution:
                  </p>
                  <div className="d-flex align-items-center gap-2">
                    <code className="flex-grow-1">{RECOMMENDED_ARBITER}</code>
                    <Button 
                      variant="outline-primary" 
                      size="sm"
                      onClick={useRecommendedArbiter}
                    >
                      Use This
                    </Button>
                  </div>
                </Alert>
              </Collapse>

              <Form.Control
                type="text"
                placeholder="0x..."
                value={arbiterAddress}
                onChange={(e) => setArbiterAddress(e.target.value)}
                isInvalid={!arbiterValidation.isValid}
                required
              />
              {!arbiterValidation.isValid && (
                <Form.Control.Feedback type="invalid">
                  {arbiterValidation.message}
                </Form.Control.Feedback>
              )}
              <Form.Text className="text-muted">
                Neutral third party who can resolve disputes
              </Form.Text>
            </Form.Group>

            {/* Amount */}
            <Form.Group className="mb-4">
              <Form.Label>
                Amount (MON)
                <Badge bg="secondary" className="ms-2">Required</Badge>
              </Form.Label>
              <Form.Control
                type="number"
                step="0.001"
                min="0.001"
                placeholder="0.000"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
              />
              <Form.Text className="text-muted">
                Minimum: 0.001 MON • This amount will be locked in escrow
              </Form.Text>
            </Form.Group>

            {/* Action Buttons */}
            <div className="d-grid gap-2">
              <Button 
                variant="primary" 
                type="submit" 
                disabled={loading || !isFormValid()}
                size="lg"
              >
                {loading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                    Creating Escrow...
                  </>
                ) : (
                  <>
                    ✨ Create Escrow
                  </>
                )}
              </Button>
              
              {!isFormValid() && sellerAddress && arbiterAddress && amount && (
                <Alert variant="warning" className="mb-0">
                  Please fix the validation errors above to continue
                </Alert>
              )}
            </div>
          </Form>

          {/* Security Notice */}
          <Alert variant="warning" className="mt-4 security-notice">
            <h6>🔒 Security Notice</h6>
            <ul className="mb-0 small">
              <li>Always verify addresses before creating escrow</li>
              <li>Choose a trusted arbiter for dispute resolution</li>
              <li>This is testnet - use only test funds</li>
            </ul>
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default CreateEscrowTab;
// src/components/CreateEscrowTab.tsx - Fixed with accessibility
import React, { useState } from 'react';
import { Card, Form, Button, Spinner, Alert, Badge, Collapse } from 'react-bootstrap';
import { ContractInfo } from './SecurityComponents';
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
  const [showArbiterHelper, setShowArbiterHelper] = useState<boolean>(false);
  
  // Website's recommended arbiter address
  const WEBSITE_ARBITER = "0xC4E06Cd628D1ABA8436a812D8a1fA49a4b3BbC47";
  
  // Helper to check if an address matches the current account
  const isCurrentAccount = (address: string): boolean => {
    if (!address || !currentAccount) return false;
    return address.toLowerCase() === currentAccount.toLowerCase();
  };

  // Check if seller and arbiter are the same
  const isSellerArbiterSame = (seller: string, arbiter: string): boolean => {
    if (!seller || !arbiter) return false;
    return seller.toLowerCase() === arbiter.toLowerCase();
  };

  // Check if form is valid
  const isFormValid = (): boolean => {
    return (
      !isCurrentAccount(sellerAddress) && 
      !isCurrentAccount(arbiterAddress) && 
      !isSellerArbiterSame(sellerAddress, arbiterAddress) &&
      !!sellerAddress &&
      !!arbiterAddress &&
      !!amount
    );
  };

  // Copy website arbiter address to clipboard and set it
  const useWebsiteArbiter = (): void => {
    setArbiterAddress(WEBSITE_ARBITER);
    navigator.clipboard.writeText(WEBSITE_ARBITER);
  };

  // Calculate validation states for form controls
  const sellerAddressInvalid: boolean = 
    sellerAddress ? isCurrentAccount(sellerAddress) : false;

  const arbiterAddressInvalid: boolean = 
    arbiterAddress ? (
      isCurrentAccount(arbiterAddress) || 
      Boolean(sellerAddress && isSellerArbiterSame(sellerAddress, arbiterAddress))
    ) : false;

  // Booleans to control specific error message display
  const isArbiterSameAsBuyer: boolean = 
    arbiterAddress ? isCurrentAccount(arbiterAddress) : false;

  const isArbiterSameAsSeller: boolean = 
    Boolean(arbiterAddress && sellerAddress && isSellerArbiterSame(sellerAddress, arbiterAddress));

  return (
    <Card>
      <Card.Body>
        <Card.Title>Create New Escrow</Card.Title>
        <ContractInfo />
        
        <Alert variant="info" className="mb-3">
          <strong>Role Requirements:</strong>
          <p className="mb-0">The buyer (you), seller, and arbiter must be different accounts. Your account will be the buyer.</p>
        </Alert>
        
        <Form onSubmit={handleCreateEscrow}>
          <Form.Group className="mb-3">
            <Form.Label htmlFor="sellerAddress">Seller Address</Form.Label>
            <Form.Control
              id="sellerAddress"
              type="text"
              placeholder="0x..."
              value={sellerAddress}
              onChange={(e) => setSellerAddress(e.target.value)}
              isInvalid={sellerAddressInvalid}
              required
            />
            {sellerAddressInvalid && (
              <Form.Control.Feedback type="invalid">
                Seller cannot be the same as buyer (your account)
              </Form.Control.Feedback>
            )}
            <Form.Text className="text-muted">
              The address of the party who will receive the funds
            </Form.Text>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label htmlFor="arbiterAddress" className="mb-0">Arbiter Address</Form.Label>
              <Button 
                variant="outline-info" 
                size="sm"
                onClick={() => setShowArbiterHelper(!showArbiterHelper)}
                aria-expanded={showArbiterHelper}
                aria-controls="arbiter-helper-collapse"
              >
                Need an Arbiter? {showArbiterHelper ? '▲' : '▼'}
              </Button>
            </div>
            
            <Collapse in={showArbiterHelper}>
              <div>
                <Alert variant="light" className="mb-3">
                  <div className="d-flex justify-content-between align-items-start">
                    <div style={{ flex: 1 }}>
                      <h6 className="mb-2">🏛️ Website Arbiter Service</h6>
                      <p className="mb-2">
                        Use our trusted arbiter service for dispute resolution:
                      </p>
                      <div className="mb-2">
                        <code 
                          style={{ 
                            fontSize: '0.9rem', 
                            padding: '4px 8px', 
                            backgroundColor: '#f8f9fa',
                            border: '1px solid #dee2e6',
                            borderRadius: '4px',
                            cursor: 'pointer',
                            display: 'inline-block',
                            wordBreak: 'break-all'
                          }}
                          onClick={() => navigator.clipboard.writeText(WEBSITE_ARBITER)}
                          title="Click to copy"
                          role="button"
                          tabIndex={0}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              navigator.clipboard.writeText(WEBSITE_ARBITER);
                            }
                          }}
                        >
                          {WEBSITE_ARBITER}
                        </code>
                        <Badge bg="secondary" className="ms-2">Click to copy</Badge>
                      </div>
                      <div className="mb-2">
                        <Button 
                          variant="success" 
                          size="sm" 
                          className="me-2"
                          onClick={useWebsiteArbiter}
                        >
                          Use This Arbiter
                        </Button>
                      </div>
                      <div>
                        <small className="text-muted">
                          <strong>Contact for arbiter services:</strong><br/>
                          📞 Telegram: <a href="https://t.me/oprimedev" target="_blank" rel="noopener noreferrer">@oprimedev</a><br/>
                          📝 Request Form: <a href="https://forms.gle/oxkvRCLJNvC4vXjb7" target="_blank" rel="noopener noreferrer">Google Form</a>
                        </small>
                      </div>
                    </div>
                  </div>
                </Alert>
              </div>
            </Collapse>
            
            <Form.Control
              id="arbiterAddress"
              type="text"
              placeholder="0x... or use website arbiter above"
              value={arbiterAddress}
              onChange={(e) => setArbiterAddress(e.target.value)}
              isInvalid={arbiterAddressInvalid}
              required
            />
            {isArbiterSameAsBuyer && (
              <Form.Control.Feedback type="invalid">
                Arbiter cannot be the same as buyer (your account)
              </Form.Control.Feedback>
            )}
            {isArbiterSameAsSeller && (
              <Form.Control.Feedback type="invalid">
                Arbiter cannot be the same as seller
              </Form.Control.Feedback>
            )}
            <Form.Text className="text-muted">
              A trusted third party who can resolve disputes and refund funds if needed
            </Form.Text>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label htmlFor="amount">Amount (MON)</Form.Label>
            <Form.Control
              id="amount"
              type="text"
              placeholder="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
            <Form.Text className="text-muted">
              The amount to place in escrow (Max: 1000 MON)
            </Form.Text>
          </Form.Group>
          
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading || !isFormValid()}
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Create Escrow'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CreateEscrowTab;
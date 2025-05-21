// src/components/CreateEscrowTab.tsx
import React from 'react';
import { Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
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

  // Calculate validation states for the form controls
  const sellerInvalid = sellerAddress ? isCurrentAccount(sellerAddress) : false;
  const arbiterInvalid = arbiterAddress ? 
    (isCurrentAccount(arbiterAddress) || 
    (sellerAddress && isSellerArbiterSame(sellerAddress, arbiterAddress))) : false;

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
            <Form.Label>Seller Address</Form.Label>
            <Form.Control
              type="text"
              placeholder="0x..."
              value={sellerAddress}
              onChange={(e) => setSellerAddress(e.target.value)}
              isInvalid={sellerInvalid}
              required
            />
            {sellerInvalid && (
              <Form.Control.Feedback type="invalid">
                Seller cannot be the same as buyer (your account)
              </Form.Control.Feedback>
            )}
            <Form.Text className="text-muted">
              The address of the party who will receive the funds
            </Form.Text>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Arbiter Address</Form.Label>
            <Form.Control
              type="text"
              placeholder="0x..."
              value={arbiterAddress}
              onChange={(e) => setArbiterAddress(e.target.value)}
              isInvalid={arbiterInvalid}
              required
            />
            {arbiterAddress && isCurrentAccount(arbiterAddress) && (
              <Form.Control.Feedback type="invalid">
                Arbiter cannot be the same as buyer (your account)
              </Form.Control.Feedback>
            )}
            {arbiterAddress && sellerAddress && isSellerArbiterSame(sellerAddress, arbiterAddress) && (
              <Form.Control.Feedback type="invalid">
                Arbiter cannot be the same as seller
              </Form.Control.Feedback>
            )}
            <Form.Text className="text-muted">
              A trusted third party who can resolve disputes and refund funds if needed
            </Form.Text>
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Amount (MON)</Form.Label>
            <Form.Control
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
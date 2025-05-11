import React from 'react';
import { Card, Form, Button, Spinner } from 'react-bootstrap';
import { ContractInfo } from './SecurityComponents';

const CreateEscrowTab = ({ 
  handleCreateEscrow, 
  sellerAddress, 
  setSellerAddress,
  arbiterAddress, 
  setArbiterAddress,
  amount, 
  setAmount,
  loading 
}) => {
  return (
    <Card>
      <Card.Body>
        <Card.Title>Create New Escrow</Card.Title>
        <ContractInfo />
        <Form onSubmit={handleCreateEscrow}>
          <Form.Group className="mb-3">
            <Form.Label>Seller Address</Form.Label>
            <Form.Control
              type="text"
              placeholder="0x..."
              value={sellerAddress}
              onChange={(e) => setSellerAddress(e.target.value)}
              required
            />
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
              required
            />
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
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Create Escrow'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default CreateEscrowTab;
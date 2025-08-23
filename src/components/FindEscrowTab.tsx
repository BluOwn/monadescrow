// src/components/FindEscrowTab.tsx
import React from 'react';
import { Card, Form, Button, Spinner } from 'react-bootstrap';
import { FindEscrowTabProps } from '../types';

const FindEscrowTab: React.FC<FindEscrowTabProps> = ({
  escrowIdToView,
  setEscrowIdToView,
  handleFindEscrow,
  loading
}) => {
  return (
    <Card>
      <Card.Body>
        <Card.Title>Find Escrow by ID</Card.Title>
        <Form onSubmit={handleFindEscrow} className="mb-4">
          <Form.Group className="mb-3">
            <Form.Label>Escrow ID</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter escrow ID"
              value={escrowIdToView}
              onChange={(e) => setEscrowIdToView(e.target.value)}
              required
            />
          </Form.Group>
          
          <Button 
            variant="primary" 
            type="submit" 
            disabled={loading}
          >
            {loading ? <Spinner animation="border" size="sm" /> : 'Find Escrow'}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default FindEscrowTab;
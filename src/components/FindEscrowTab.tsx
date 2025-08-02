// src/components/FindEscrowTab.tsx - Fixed with accessibility
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
            <Form.Label htmlFor="escrowIdInput">Escrow ID</Form.Label>
            <Form.Control
              id="escrowIdInput"
              type="text"
              placeholder="Enter escrow ID"
              value={escrowIdToView}
              onChange={(e) => setEscrowIdToView(e.target.value)}
              required
            />
            <Form.Text className="text-muted">
              Enter the unique ID of the escrow you want to view
            </Form.Text>
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
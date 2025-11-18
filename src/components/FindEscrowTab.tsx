// src/components/FindEscrowTab.tsx
import React, { useState } from 'react';
import { Card, Form, Button, Spinner, Alert } from 'react-bootstrap';
import { FindEscrowTabProps } from '../types';

const FindEscrowTab: React.FC<FindEscrowTabProps> = ({
  escrowIdToView,
  setEscrowIdToView,
  handleFindEscrow,
  loading
}) => {
  const [validationError, setValidationError] = useState<string>('');

  const validateEscrowId = (id: string): boolean => {
    if (!id.trim()) {
      setValidationError('Escrow ID is required');
      return false;
    }

    if (!/^\d+$/.test(id)) {
      setValidationError('Escrow ID must be a valid number (e.g., 0, 1, 2, ...)');
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEscrowIdToView(value);

    // Clear error when user starts typing
    if (validationError) {
      setValidationError('');
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (validateEscrowId(escrowIdToView)) {
      handleFindEscrow(e);
    }
  };

  return (
    <Card>
      <Card.Body>
        <Card.Title>Find Escrow by ID</Card.Title>
        <Card.Text className="text-muted">
          Search for any escrow contract by its unique ID number
        </Card.Text>

        <Form onSubmit={handleSubmit} className="mb-4">
          <Form.Group className="mb-3">
            <Form.Label>Escrow ID</Form.Label>
            <Form.Control
              type="text"
              placeholder="Enter escrow ID (e.g., 0, 1, 2, ...)"
              value={escrowIdToView}
              onChange={handleInputChange}
              isInvalid={!!validationError}
              required
              aria-label="Escrow ID"
              aria-describedby="escrowIdHelp"
              aria-invalid={!!validationError}
            />
            <Form.Control.Feedback type="invalid">
              {validationError}
            </Form.Control.Feedback>
            <Form.Text id="escrowIdHelp" className="text-muted">
              Enter a numeric escrow ID to view its details
            </Form.Text>
          </Form.Group>

          {validationError && (
            <Alert variant="danger" className="mb-3" role="alert">
              <strong>Validation Error:</strong> {validationError}
            </Alert>
          )}

          <Button
            variant="primary"
            type="submit"
            disabled={loading || !!validationError}
            aria-label="Search for escrow"
          >
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Searching...
              </>
            ) : (
              <>🔍 Find Escrow</>
            )}
          </Button>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default FindEscrowTab;
// src/components/FindEscrowTab.tsx - Minimalist Design
import React, { useState } from 'react';
import { Card, Form, Button, Alert, Badge, InputGroup } from 'react-bootstrap';
import { FindEscrowTabProps } from '../types';

const FindEscrowTab: React.FC<FindEscrowTabProps> = ({
  escrowIdToView,
  setEscrowIdToView,
  handleFindEscrow,
  loading
}) => {
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    const saved = localStorage.getItem('monad-escrow-recent-searches');
    return saved ? JSON.parse(saved) : [];
  });

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (escrowIdToView.trim()) {
      // Add to recent searches
      const newSearches = [escrowIdToView, ...recentSearches.filter(id => id !== escrowIdToView)].slice(0, 5);
      setRecentSearches(newSearches);
      localStorage.setItem('monad-escrow-recent-searches', JSON.stringify(newSearches));
      
      handleFindEscrow(e);
    }
  };

  const handleRecentSearch = (id: string) => {
    setEscrowIdToView(id);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem('monad-escrow-recent-searches');
  };

  const isValidId = (id: string) => {
    return /^\d+$/.test(id.trim()) && parseInt(id.trim()) >= 0;
  };

  return (
    <div className="find-escrow-container">
      <Card>
        <Card.Header>
          <Card.Title className="mb-0">
            🔍 Find Escrow
            <Badge bg="secondary" className="ms-2">Public Search</Badge>
          </Card.Title>
        </Card.Header>

        <Card.Body>
          {/* Search Instructions */}
          <Alert variant="info" className="search-info">
            <h6 className="mb-2">How to Search</h6>
            <ul className="mb-0 small">
              <li>Enter a valid escrow ID (numeric value)</li>
              <li>You can view any public escrow on the network</li>
              <li>Escrow IDs start from 0 and increment sequentially</li>
            </ul>
          </Alert>

          {/* Search Form */}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-4">
              <Form.Label>
                Escrow ID
                <Badge bg="secondary" className="ms-2">Required</Badge>
              </Form.Label>
              
              <InputGroup>
                <InputGroup.Text>#</InputGroup.Text>
                <Form.Control
                  type="text"
                  placeholder="Enter escrow ID (e.g., 1, 23, 456)"
                  value={escrowIdToView}
                  onChange={(e) => setEscrowIdToView(e.target.value)}
                  isInvalid={escrowIdToView.trim() !== '' && !isValidId(escrowIdToView)}
                  required
                />
                <Button 
                  type="submit" 
                  variant="primary"
                  disabled={loading || !isValidId(escrowIdToView)}
                >
                  {loading ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" role="status">
                        <span className="visually-hidden">Searching...</span>
                      </div>
                      Searching...
                    </>
                  ) : (
                    '🔍 Find Escrow'
                  )}
                </Button>
              </InputGroup>
              
              {escrowIdToView.trim() !== '' && !isValidId(escrowIdToView) && (
                <Form.Control.Feedback type="invalid" style={{ display: 'block' }}>
                  Please enter a valid numeric escrow ID
                </Form.Control.Feedback>
              )}
              
              <Form.Text className="text-muted">
                Enter the numeric ID of the escrow you want to view
              </Form.Text>
            </Form.Group>
          </Form>

          {/* Recent Searches */}
          {recentSearches.length > 0 && (
            <div className="recent-searches">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h6 className="mb-0">Recent Searches</h6>
                <Button 
                  variant="link" 
                  size="sm" 
                  className="p-0 text-decoration-none"
                  onClick={clearRecentSearches}
                >
                  Clear All
                </Button>
              </div>
              
              <div className="d-flex flex-wrap gap-2">
                {recentSearches.map((id, index) => (
                  <Badge 
                    key={index}
                    bg="light" 
                    text="dark"
                    className="recent-search-badge"
                    role="button"
                    onClick={() => handleRecentSearch(id)}
                  >
                    #{id}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Search Tips */}
          <Card className="search-tips mt-4">
            <Card.Body className="py-3">
              <h6 className="mb-2">💡 Search Tips</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="tip-item">
                    <span className="tip-icon">🎯</span>
                    <div>
                      <strong>Latest Escrows</strong>
                      <p className="mb-0 small text-muted">Try searching higher numbers to find recent escrows</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="tip-item">
                    <span className="tip-icon">🔐</span>
                    <div>
                      <strong>Privacy</strong>
                      <p className="mb-0 small text-muted">All escrow data is publicly viewable on the blockchain</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="tip-item">
                    <span className="tip-icon">⚡</span>
                    <div>
                      <strong>Real-time</strong>
                      <p className="mb-0 small text-muted">Data is fetched directly from the smart contract</p>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="tip-item">
                    <span className="tip-icon">🔍</span>
                    <div>
                      <strong>Not Found?</strong>
                      <p className="mb-0 small text-muted">The escrow may not exist or ID might be incorrect</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          {/* Example Searches */}
          <Alert variant="light" className="examples mt-4">
            <h6 className="mb-2">Example Searches</h6>
            <div className="d-flex flex-wrap gap-2">
              {['0', '1', '5', '10'].map((id) => (
                <Button
                  key={id}
                  variant="outline-primary"
                  size="sm"
                  onClick={() => setEscrowIdToView(id)}
                  disabled={loading}
                >
                  #{id}
                </Button>
              ))}
            </div>
            <small className="text-muted mt-2 d-block">
              Click any example to search for that escrow
            </small>
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default FindEscrowTab;
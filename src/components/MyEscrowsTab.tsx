// src/components/MyEscrowsTab.tsx - Minimalist Design
import React, { useState } from 'react';
import { Card, Button, Badge, Alert, Row, Col, Form } from 'react-bootstrap';
import { MyEscrowsTabProps } from '../types';

const MyEscrowsTab: React.FC<MyEscrowsTabProps> = ({ 
  escrows, 
  onViewDetails, 
  loadingEscrows,
  retryLoadingEscrows,
  account,
  onAction
}) => {
  const [filter, setFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  // Filter escrows based on selected filter
  const filteredEscrows = escrows.filter(escrow => {
    if (filter === 'all') return true;
    if (filter === 'active') return !escrow.fundsDisbursed && !escrow.disputeRaised;
    if (filter === 'completed') return escrow.fundsDisbursed;
    if (filter === 'disputed') return escrow.disputeRaised;
    return true;
  });

  // Sort escrows
  const sortedEscrows = [...filteredEscrows].sort((a, b) => {
    if (sortBy === 'newest') return parseInt(b.id) - parseInt(a.id);
    if (sortBy === 'oldest') return parseInt(a.id) - parseInt(b.id);
    if (sortBy === 'amount') return parseFloat(b.amount) - parseFloat(a.amount);
    return 0;
  });

  // Get status display
  const getStatusDisplay = (escrow: any) => {
    if (escrow.fundsDisbursed) return 'completed';
    if (escrow.disputeRaised) return 'disputed';
    return 'active';
  };

  // Get status color
  const getStatusColor = (escrow: any) => {
    if (escrow.fundsDisbursed) return 'success';
    if (escrow.disputeRaised) return 'danger';
    return 'primary';
  };

  // Get user role in escrow
  const getUserRole = (escrow: any) => {
    if (!account) return 'unknown';
    const addr = account.toLowerCase();
    if (escrow.buyer?.toLowerCase() === addr) return 'buyer';
    if (escrow.seller?.toLowerCase() === addr) return 'seller';
    if (escrow.arbiter?.toLowerCase() === addr) return 'arbiter';
    return 'unknown';
  };

  // Get available actions for user
  const getAvailableActions = (escrow: any) => {
    const role = getUserRole(escrow);
    const actions = [];

    if (role === 'buyer' && !escrow.fundsDisbursed && !escrow.disputeRaised) {
      actions.push({ label: 'Cancel', action: 'cancel', variant: 'outline-danger' });
    }
    
    if (role === 'seller' && !escrow.fundsDisbursed && !escrow.disputeRaised) {
      actions.push({ label: 'Confirm Receipt', action: 'confirm', variant: 'success' });
    }
    
    if ((role === 'buyer' || role === 'seller') && !escrow.fundsDisbursed && !escrow.disputeRaised) {
      actions.push({ label: 'Raise Dispute', action: 'dispute', variant: 'warning' });
    }
    
    if (role === 'arbiter' && escrow.disputeRaised && !escrow.fundsDisbursed) {
      actions.push(
        { label: 'Release to Seller', action: 'release-seller', variant: 'success' },
        { label: 'Refund to Buyer', action: 'release-buyer', variant: 'primary' }
      );
    }

    return actions;
  };

  if (loadingEscrows) {
    return (
      <Card>
        <Card.Header>
          <Card.Title>My Escrows</Card.Title>
        </Card.Header>
        <Card.Body>
          <div className="text-center py-5">
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading your escrows...</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="my-escrows-container">
      <Card>
        <Card.Header>
          <div className="d-flex justify-content-between align-items-center">
            <Card.Title className="mb-0">
              My Escrows
              <Badge bg="primary" className="ms-2">{escrows.length}</Badge>
            </Card.Title>
            <Button 
              variant="outline-primary" 
              size="sm"
              onClick={retryLoadingEscrows}
            >
              🔄 Refresh
            </Button>
          </div>
        </Card.Header>

        <Card.Body>
          {/* Filters and Sorting */}
          {escrows.length > 0 && (
            <Row className="mb-4">
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small text-muted">Filter by status</Form.Label>
                  <Form.Select 
                    size="sm"
                    value={filter} 
                    onChange={(e) => setFilter(e.target.value)}
                  >
                    <option value="all">All Escrows</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="disputed">Disputed</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group>
                  <Form.Label className="small text-muted">Sort by</Form.Label>
                  <Form.Select 
                    size="sm"
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="amount">Highest Amount</option>
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          )}

          {/* Escrows List */}
          {sortedEscrows.length === 0 ? (
            <div className="text-center py-5">
              {escrows.length === 0 ? (
                <>
                  <div className="mb-3">📭</div>
                  <h5>No Escrows Found</h5>
                  <p className="text-muted">You haven't created or participated in any escrows yet.</p>
                  <Button variant="primary" onClick={() => window.location.hash = '#create'}>
                    Create Your First Escrow
                  </Button>
                </>
              ) : (
                <>
                  <div className="mb-3">🔍</div>
                  <h5>No Results</h5>
                  <p className="text-muted">No escrows match your current filter.</p>
                  <Button variant="outline-primary" onClick={() => setFilter('all')}>
                    Clear Filters
                  </Button>
                </>
              )}
            </div>
          ) : (
            <div className="escrows-grid">
              {sortedEscrows.map((escrow) => {
                const role = getUserRole(escrow);
                const actions = getAvailableActions(escrow);
                
                return (
                  <Card key={escrow.id} className="escrow-card">
                    <Card.Body>
                      {/* Escrow Header */}
                      <div className="escrow-header">
                        <div>
                          <h6 className="escrow-id">Escrow #{escrow.id}</h6>
                          <div className="escrow-amount">{escrow.amount} MON</div>
                        </div>
                        <div className="text-end">
                          <Badge bg={getStatusColor(escrow)} className="mb-2">
                            {getStatusDisplay(escrow)}
                          </Badge>
                          <Badge bg="outline-secondary" className="d-block">
                            {role}
                          </Badge>
                        </div>
                      </div>

                      {/* Escrow Details */}
                      <div className="escrow-details">
                        <div className="escrow-detail-row">
                          <span className="escrow-detail-label">Buyer:</span>
                          <code className="escrow-detail-value">
                            {escrow.buyer ? `${escrow.buyer.slice(0, 6)}...${escrow.buyer.slice(-4)}` : 'N/A'}
                          </code>
                        </div>
                        <div className="escrow-detail-row">
                          <span className="escrow-detail-label">Seller:</span>
                          <code className="escrow-detail-value">
                            {escrow.seller ? `${escrow.seller.slice(0, 6)}...${escrow.seller.slice(-4)}` : 'N/A'}
                          </code>
                        </div>
                        <div className="escrow-detail-row">
                          <span className="escrow-detail-label">Arbiter:</span>
                          <code className="escrow-detail-value">
                            {escrow.arbiter ? `${escrow.arbiter.slice(0, 6)}...${escrow.arbiter.slice(-4)}` : 'N/A'}
                          </code>
                        </div>
                        {/* Remove the createdAt section since it doesn't exist */}
                      </div>

                      {/* Progress Bar */}
                      <div className="escrow-progress mb-3">
                        <div className="progress" style={{ height: '6px' }}>
                          <div 
                            className="progress-bar" 
                            style={{ 
                              width: escrow.fundsDisbursed ? '100%' : 
                                     escrow.disputeRaised ? '75%' : '50%'
                            }}
                          />
                        </div>
                        <div className="d-flex justify-content-between mt-1">
                          <small className="text-muted">Created</small>
                          <small className="text-muted">In Progress</small>
                          <small className="text-muted">Completed</small>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="escrow-actions">
                        <Button
                          variant="outline-primary"
                          size="sm"
                          onClick={() => onViewDetails(escrow.id)}
                          className="flex-grow-1"
                        >
                          📋 View Details
                        </Button>
                        
                        {actions.map((action, index) => (
                          <Button
                            key={index}
                            variant={action.variant}
                            size="sm"
                            onClick={() => onAction(action.action, escrow.id)}
                            className="flex-grow-1"
                          >
                            {action.label}
                          </Button>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Summary Stats */}
          {escrows.length > 0 && (
            <Alert variant="light" className="mt-4">
              <Row className="text-center">
                <Col>
                  <div className="fw-bold text-primary">{escrows.filter(e => !e.fundsDisbursed && !e.disputeRaised).length}</div>
                  <small className="text-muted">Active</small>
                </Col>
                <Col>
                  <div className="fw-bold text-success">{escrows.filter(e => e.fundsDisbursed).length}</div>
                  <small className="text-muted">Completed</small>
                </Col>
                <Col>
                  <div className="fw-bold text-warning">{escrows.filter(e => e.disputeRaised).length}</div>
                  <small className="text-muted">Disputed</small>
                </Col>
                <Col>
                  <div className="fw-bold text-secondary">
                    {escrows.reduce((sum, e) => sum + parseFloat(e.amount || '0'), 0).toFixed(3)}
                  </div>
                  <small className="text-muted">Total MON</small>
                </Col>
              </Row>
            </Alert>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default MyEscrowsTab;
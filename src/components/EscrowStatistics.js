import React from 'react';
import { Card, Row, Col, Badge } from 'react-bootstrap';

const EscrowStatistics = ({ 
  myEscrowsCount, 
  arbitratedEscrowsCount, 
  totalEscrowsCount,
  activeEscrowsCount,
  disputedEscrowsCount,
  completedEscrowsCount
}) => {
  return (
    <Card className="mb-4 stats-card">
      <Card.Body>
        <Card.Title>Escrow Statistics</Card.Title>
        <Row className="text-center">
          <Col xs={6} md={3} className="stat-item mb-3">
            <h3>{myEscrowsCount}</h3>
            <div className="stat-label">My Escrows</div>
          </Col>
          <Col xs={6} md={3} className="stat-item mb-3">
            <h3>{arbitratedEscrowsCount}</h3>
            <div className="stat-label">Arbitrating</div>
          </Col>
          <Col xs={6} md={3} className="stat-item mb-3">
            <h3>{totalEscrowsCount}</h3>
            <div className="stat-label">Total Escrows</div>
          </Col>
          <Col xs={6} md={3} className="stat-item mb-3">
            <h3>
              <Badge bg="success" pill>{activeEscrowsCount}</Badge>{' '}
              <Badge bg="danger" pill>{disputedEscrowsCount}</Badge>{' '}
              <Badge bg="primary" pill>{completedEscrowsCount}</Badge>
            </h3>
            <div className="stat-label">Active / Disputed / Completed</div>
          </Col>
        </Row>
      </Card.Body>
    </Card>
  );
};

export default EscrowStatistics;
// src/components/EscrowDashboard.tsx
import React from 'react';
import { Card, Row, Col } from 'react-bootstrap';
import EnhancedEscrowCard from './EnhancedEscrowCard';

interface EscrowData {
  id: string;
  buyer: string;
  seller: string;
  arbiter: string;
  amount: string;
  status: 'pending' | 'funded' | 'completed' | 'disputed' | 'resolved';
  createdAt: Date;
  description?: string;
}

interface EscrowDashboardProps {
  escrows: EscrowData[];
  onEscrowAction: (action: string, escrowId: string) => void;
}

const EscrowDashboard: React.FC<EscrowDashboardProps> = ({
  escrows,
  onEscrowAction
}) => {
  const recentEscrows = escrows.slice(0, 3);

  if (escrows.length === 0) {
    return (
      <Card className="enhanced-card text-center">
        <Card.Body className="py-5">
          <div className="empty-state">
            <div className="empty-state-icon">🔐</div>
            <h4>No Escrows Yet</h4>
            <p className="text-muted">
              Create your first escrow to get started with secure transactions.
            </p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <div className="escrow-dashboard">
      <div className="dashboard-header mb-4">
        <h4>Recent Escrows</h4>
        <p className="text-muted">Your latest escrow transactions</p>
      </div>
      
      <div className="dashboard-escrows">
        {recentEscrows.map((escrow) => (
          <div key={escrow.id} className="mb-4">
            <EnhancedEscrowCard
              escrow={escrow}
              currentUser="0x1234567890abcdef" // This should come from props or context
              onAction={(action) => onEscrowAction(action, escrow.id)}
            />
          </div>
        ))}
      </div>
      
      {escrows.length > 3 && (
        <Card className="enhanced-card text-center">
          <Card.Body>
            <p className="text-muted mb-0">
              Showing {recentEscrows.length} of {escrows.length} escrows.
              <br />
              View all in the "My Escrows" tab.
            </p>
          </Card.Body>
        </Card>
      )}
    </div>
  );
};

export default EscrowDashboard;
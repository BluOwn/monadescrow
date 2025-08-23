// src/components/EnhancedEscrowCard.tsx - Fixed TypeScript errors
import React, { useState } from 'react';
import { Card, Badge, Button, Dropdown, ProgressBar, Tooltip, OverlayTrigger } from 'react-bootstrap';

type EscrowStatus = 'pending' | 'funded' | 'completed' | 'disputed' | 'resolved';
type UserRole = 'buyer' | 'seller' | 'arbiter' | 'viewer';

interface EscrowData {
  id: string;
  buyer: string;
  seller: string;
  arbiter: string;
  amount: string;
  status: EscrowStatus;
  createdAt: Date;
  description?: string;
  progress?: number;
}

interface EnhancedEscrowCardProps {
  escrow: EscrowData;
  currentUser: string;
  onAction: (action: string) => void;
}

interface StatusConfig {
  variant: string;
  icon: string;
  text: string;
  color: string;
}

interface ActionItem {
  label: string;
  action: string;
  variant: string;
  icon: string;
}

const EnhancedEscrowCard: React.FC<EnhancedEscrowCardProps> = ({
  escrow,
  currentUser,
  onAction
}) => {
  const [isLoading, setIsLoading] = useState(false);

  const getStatusConfig = (status: EscrowStatus): StatusConfig => {
    const configs: Record<EscrowStatus, StatusConfig> = {
      pending: {
        variant: 'warning',
        icon: '⏳',
        text: 'Pending',
        color: '#f59e0b'
      },
      funded: {
        variant: 'info',
        icon: '💰',
        text: 'Funded',
        color: '#06b6d4'
      },
      completed: {
        variant: 'success',
        icon: '✅',
        text: 'Completed',
        color: '#10b981'
      },
      disputed: {
        variant: 'danger',
        icon: '⚠️',
        text: 'Disputed',
        color: '#ef4444'
      },
      resolved: {
        variant: 'primary',
        icon: '🔨',
        text: 'Resolved',
        color: '#6366f1'
      }
    };
    return configs[status];
  };

  const getUserRole = (): UserRole => {
    if (escrow.buyer.toLowerCase() === currentUser.toLowerCase()) return 'buyer';
    if (escrow.seller.toLowerCase() === currentUser.toLowerCase()) return 'seller';
    if (escrow.arbiter.toLowerCase() === currentUser.toLowerCase()) return 'arbiter';
    return 'viewer';
  };

  const getAvailableActions = (): ActionItem[] => {
    const role = getUserRole();
    const { status } = escrow;
    
    const actions: ActionItem[] = [];
    
    if (role === 'buyer') {
      if (status === 'pending') {
        actions.push({ label: 'Fund Escrow', action: 'fund', variant: 'primary', icon: '💰' });
      }
      if (status === 'funded') {
        actions.push({ label: 'Release Payment', action: 'release', variant: 'success', icon: '✅' });
        actions.push({ label: 'Raise Dispute', action: 'dispute', variant: 'warning', icon: '⚠️' });
      }
    }
    
    if (role === 'seller' && status === 'funded') {
      actions.push({ label: 'Request Release', action: 'request', variant: 'info', icon: '📨' });
    }
    
    if (role === 'arbiter' && status === 'disputed') {
      actions.push({ label: 'Resolve for Buyer', action: 'resolve-buyer', variant: 'primary', icon: '👤' });
      actions.push({ label: 'Resolve for Seller', action: 'resolve-seller', variant: 'secondary', icon: '🏪' });
    }
    
    return actions;
  };

  const formatAddress = (address: string): string => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const handleAction = async (action: string): Promise<void> => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      onAction(action);
    } finally {
      setIsLoading(false);
    }
  };

  const getProgressByStatus = (status: EscrowStatus): number => {
    const progressMap: Record<EscrowStatus, number> = {
      pending: 20,
      funded: 60,
      completed: 100,
      disputed: 40,
      resolved: 100
    };
    return progressMap[status];
  };

  const statusConfig = getStatusConfig(escrow.status);
  const userRole = getUserRole();
  const availableActions = getAvailableActions();
  const progress = escrow.progress || getProgressByStatus(escrow.status);

  return (
    <Card className={`enhanced-escrow-card status-${escrow.status}`}>
      {/* Progress Bar */}
      <div className="escrow-progress-container">
        <ProgressBar 
          now={progress} 
          variant={statusConfig.variant}
          className="escrow-progress"
          style={{ height: '4px', borderRadius: 0 }}
        />
      </div>

      {/* Header */}
      <Card.Header className="escrow-card-header">
        <div className="d-flex justify-content-between align-items-start">
          <div>
            <div className="escrow-id">#{escrow.id}</div>
            <h3 className="escrow-amount">{escrow.amount} MON</h3>
            {escrow.description && (
              <p className="escrow-description text-muted mb-0">
                {escrow.description}
              </p>
            )}
          </div>
          <div className="d-flex align-items-center gap-2">
            <Badge 
              bg={statusConfig.variant} 
              className="escrow-status-badge d-flex align-items-center gap-1"
            >
              <span>{statusConfig.icon}</span>
              {statusConfig.text}
            </Badge>
            {userRole !== 'viewer' && (
              <Badge bg="secondary" className="role-badge">
                {userRole}
              </Badge>
            )}
          </div>
        </div>
      </Card.Header>

      {/* Body */}
      <Card.Body className="enhanced-card-body">
        {/* Participants */}
        <div className="escrow-participants">
          <div className="participant-row">
            <span className="participant-label">Buyer</span>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`buyer-tooltip-${escrow.id}`}>{escrow.buyer}</Tooltip>}
            >
              <code className="participant-address">
                {formatAddress(escrow.buyer)}
              </code>
            </OverlayTrigger>
          </div>
          <div className="participant-row">
            <span className="participant-label">Seller</span>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`seller-tooltip-${escrow.id}`}>{escrow.seller}</Tooltip>}
            >
              <code className="participant-address">
                {formatAddress(escrow.seller)}
              </code>
            </OverlayTrigger>
          </div>
          <div className="participant-row">
            <span className="participant-label">Arbiter</span>
            <OverlayTrigger
              placement="top"
              overlay={<Tooltip id={`arbiter-tooltip-${escrow.id}`}>{escrow.arbiter}</Tooltip>}
            >
              <code className="participant-address">
                {formatAddress(escrow.arbiter)}
              </code>
            </OverlayTrigger>
          </div>
        </div>

        {/* Timeline/Status Info */}
        <div className="escrow-timeline">
          <div className="timeline-item">
            <div className="timeline-icon">📅</div>
            <div className="timeline-content">
              <div className="timeline-label">Created</div>
              <div className="timeline-value">{formatDate(escrow.createdAt)}</div>
            </div>
          </div>
          <div className="timeline-item">
            <div className="timeline-icon">{statusConfig.icon}</div>
            <div className="timeline-content">
              <div className="timeline-label">Status</div>
              <div className="timeline-value">{statusConfig.text}</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        {availableActions.length > 0 && (
          <div className="escrow-actions mt-4">
            {availableActions.length === 1 ? (
              <Button
                variant={availableActions[0].variant}
                className="btn-enhanced w-100"
                onClick={() => handleAction(availableActions[0].action)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <div className="spinner-border spinner-border-sm me-2" />
                    Processing...
                  </>
                ) : (
                  <>
                    <span className="me-2">{availableActions[0].icon}</span>
                    {availableActions[0].label}
                  </>
                )}
              </Button>
            ) : (
              <Dropdown className="w-100">
                <Dropdown.Toggle 
                  variant="primary" 
                  className="btn-enhanced w-100"
                  disabled={isLoading}
                  id={`actions-dropdown-${escrow.id}`}
                >
                  {isLoading ? (
                    <>
                      <div className="spinner-border spinner-border-sm me-2" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <span className="me-2">⚡</span>
                      Actions ({availableActions.length})
                    </>
                  )}
                </Dropdown.Toggle>
                <Dropdown.Menu className="w-100">
                  {availableActions.map((action, index) => (
                    <Dropdown.Item
                      key={`${action.action}-${index}`}
                      onClick={() => handleAction(action.action)}
                      className="d-flex align-items-center gap-2"
                    >
                      <span>{action.icon}</span>
                      {action.label}
                    </Dropdown.Item>
                  ))}
                </Dropdown.Menu>
              </Dropdown>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default EnhancedEscrowCard;
import React from 'react';
import { Card, Button } from 'react-bootstrap';

type EmptyStateType = 'escrows' | 'activity' | 'search';

interface EmptyStateIllustrationProps {
  type: EmptyStateType;
  onAction?: () => void;
}

interface EmptyStateContent {
  icon: string;
  title: string;
  description: string;
  actionText: string;
  gradient: string;
}

export const EmptyStateIllustration: React.FC<EmptyStateIllustrationProps> = ({
  type,
  onAction
}) => {
  const getEmptyStateContent = (stateType: EmptyStateType): EmptyStateContent => {
    const contentMap: Record<EmptyStateType, EmptyStateContent> = {
      escrows: {
        icon: '🔐',
        title: 'No Escrows Found',
        description: 'Create your first escrow to start securing your transactions.',
        actionText: 'Create Escrow',
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
      },
      activity: {
        icon: '📊',
        title: 'No Activity Yet',
        description: 'Your transaction history will appear here once you start using escrows.',
        actionText: 'Get Started',
        gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)'
      },
      search: {
        icon: '🔍',
        title: 'No Results Found',
        description: 'Try adjusting your search terms or filters.',
        actionText: 'Clear Filters',
        gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
      }
    };
    return contentMap[stateType];
  };

  const content = getEmptyStateContent(type);

  return (
    <Card className="enhanced-card text-center">
      <Card.Body className="py-5">
        <div className="empty-state">
          <div 
            className="empty-state-icon mb-4"
            style={{ 
              fontSize: '4rem',
              background: content.gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}
          >
            {content.icon}
          </div>
          <h3 className="mb-3">{content.title}</h3>
          <p className="text-muted mb-4" style={{ maxWidth: '400px', margin: '0 auto' }}>
            {content.description}
          </p>
          {onAction && (
            <Button
              variant="primary"
              className="btn-enhanced"
              onClick={onAction}
            >
              {content.actionText}
            </Button>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};
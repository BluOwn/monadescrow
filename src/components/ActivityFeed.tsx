// src/components/ActivityFeed.tsx - Fixed TypeScript errors
import React from 'react';
import { Card, ListGroup, Badge } from 'react-bootstrap';

type ActivityType = 'create' | 'fund' | 'release' | 'dispute' | 'resolve';

interface Activity {
  id: string;
  type: ActivityType;
  escrowId: string;
  timestamp: Date;
  amount?: string;
  description: string;
}

interface ActivityFeedProps {
  activities: Activity[];
  expanded?: boolean;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({
  activities,
  expanded = false
}) => {
  const getActivityIcon = (type: ActivityType): string => {
    const icons: Record<ActivityType, string> = {
      create: '➕',
      fund: '💰',
      release: '✅',
      dispute: '⚠️',
      resolve: '🔨'
    };
    return icons[type];
  };

  const getActivityColor = (type: ActivityType): string => {
    const colors: Record<ActivityType, string> = {
      create: 'primary',
      fund: 'warning',
      release: 'success',
      dispute: 'danger',
      resolve: 'info'
    };
    return colors[type];
  };

  const displayActivities = expanded ? activities : activities.slice(0, 5);

  return (
    <Card className="enhanced-card">
      <Card.Header className="enhanced-card-header">
        <h5 className="mb-0">Recent Activity</h5>
      </Card.Header>
      <Card.Body className="p-0">
        {displayActivities.length > 0 ? (
          <ListGroup variant="flush">
            {displayActivities.map((activity) => (
              <ListGroup.Item 
                key={activity.id}
                className="d-flex align-items-center justify-content-between py-3"
              >
                <div className="d-flex align-items-center gap-3">
                  <div className="activity-icon">
                    {getActivityIcon(activity.type)}
                  </div>
                  <div>
                    <div className="activity-description">
                      {activity.description}
                    </div>
                    <small className="text-muted">
                      {activity.timestamp.toLocaleDateString()} at{' '}
                      {activity.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </small>
                  </div>
                </div>
                <div className="d-flex align-items-center gap-2">
                  {activity.amount && (
                    <Badge bg="light" text="dark" className="font-monospace">
                      {activity.amount} MON
                    </Badge>
                  )}
                  <Badge bg={getActivityColor(activity.type)}>
                    #{activity.escrowId}
                  </Badge>
                </div>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <div className="text-center py-5">
            <div className="text-muted">
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📝</div>
              <p>No recent activity</p>
            </div>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default ActivityFeed;
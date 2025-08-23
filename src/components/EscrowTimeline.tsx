// src/components/EscrowTimeline.tsx
import React from 'react';

interface TimelineStep {
  id: string;
  label: string;
  icon: string;
  completed: boolean;
  active: boolean;
}

interface EscrowTimelineProps {
  escrowStatus: 'created' | 'funded' | 'disputed' | 'completed' | 'cancelled';
  disputeRaised?: boolean;
}

const EscrowTimeline: React.FC<EscrowTimelineProps> = ({ escrowStatus, disputeRaised }) => {
  const getTimelineSteps = (): TimelineStep[] => {
    const baseSteps = [
      {
        id: 'created',
        label: 'Created',
        icon: '📝',
        completed: true,
        active: escrowStatus === 'created'
      },
      {
        id: 'funded',
        label: 'Funded',
        icon: '💰',
        completed: ['funded', 'disputed', 'completed'].includes(escrowStatus),
        active: escrowStatus === 'funded'
      }
    ];

    if (disputeRaised) {
      baseSteps.push({
        id: 'disputed',
        label: 'Disputed',
        icon: '⚖️',
        completed: escrowStatus === 'completed',
        active: escrowStatus === 'disputed'
      });
    }

    baseSteps.push({
      id: 'completed',
      label: escrowStatus === 'cancelled' ? 'Cancelled' : 'Completed',
      icon: escrowStatus === 'cancelled' ? '❌' : '✅',
      completed: ['completed', 'cancelled'].includes(escrowStatus),
      active: ['completed', 'cancelled'].includes(escrowStatus)
    });

    return baseSteps;
  };

  const steps = getTimelineSteps();

  return (
    <div className="escrow-timeline">
      {steps.map((step, index) => (
        <div 
          key={step.id} 
          className={`timeline-step ${step.completed ? 'completed' : ''} ${step.active ? 'active' : ''}`}
        >
          <div className="timeline-icon">
            {step.icon}
          </div>
          <div className="timeline-label">
            {step.label}
          </div>
        </div>
      ))}
    </div>
  );
};

export default EscrowTimeline;
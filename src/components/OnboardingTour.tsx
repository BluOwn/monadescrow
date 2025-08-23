import React, { useState } from 'react';
import { Modal, Button, ProgressBar } from 'react-bootstrap';

interface OnboardingTourProps {
  show: boolean;
  onComplete: () => void;
  isFirstVisit: boolean;
}

interface OnboardingStep {
  title: string;
  content: React.ReactNode;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({
  show,
  onComplete,
  isFirstVisit
}) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps: OnboardingStep[] = [
    {
      title: 'Welcome to Monad Escrow! 🎉',
      content: (
        <div className="text-center">
          <div className="welcome-animation mb-4" style={{ fontSize: '4rem' }}>
            🔐
          </div>
          <h4>Secure Transactions Made Simple</h4>
          <p className="text-muted">
            Monad Escrow helps you conduct safe transactions using smart contracts
            on the Monad blockchain. Let's take a quick tour!
          </p>
        </div>
      )
    },
    {
      title: 'Dashboard Overview 📊',
      content: (
        <div>
          <h5>Your Command Center</h5>
          <ul className="list-unstyled">
            <li className="mb-2">
              <strong>📊 Dashboard:</strong> View your stats and recent escrows
            </li>
            <li className="mb-2">
              <strong>🔐 My Escrows:</strong> Manage all your escrow transactions
            </li>
            <li className="mb-2">
              <strong>➕ Create New:</strong> Start a new escrow agreement
            </li>
            <li className="mb-2">
              <strong>📈 Activity:</strong> Track your transaction history
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'How Escrow Works 🔄',
      content: (
        <div>
          <h5>Simple 4-Step Process</h5>
          <div className="process-steps">
            <div className="step-item mb-3">
              <span className="step-number">1</span>
              <div>
                <strong>Create</strong>
                <p className="mb-0 text-muted">Set up escrow with buyer, seller, and arbiter</p>
              </div>
            </div>
            <div className="step-item mb-3">
              <span className="step-number">2</span>
              <div>
                <strong>Fund</strong>
                <p className="mb-0 text-muted">Buyer deposits funds into smart contract</p>
              </div>
            </div>
            <div className="step-item mb-3">
              <span className="step-number">3</span>
              <div>
                <strong>Deliver</strong>
                <p className="mb-0 text-muted">Seller provides goods/services</p>
              </div>
            </div>
            <div className="step-item mb-3">
              <span className="step-number">4</span>
              <div>
                <strong>Release</strong>
                <p className="mb-0 text-muted">Funds released to seller upon completion</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Security Features 🛡️',
      content: (
        <div>
          <h5>Your Safety is Our Priority</h5>
          <div className="security-features">
            <div className="feature-item mb-3">
              <span className="feature-icon">🔐</span>
              <div>
                <strong>Smart Contract Protection</strong>
                <p className="mb-0 text-muted">Funds secured by blockchain technology</p>
              </div>
            </div>
            <div className="feature-item mb-3">
              <span className="feature-icon">👨‍⚖️</span>
              <div>
                <strong>Dispute Resolution</strong>
                <p className="mb-0 text-muted">Neutral arbiters resolve conflicts</p>
              </div>
            </div>
            <div className="feature-item mb-3">
              <span className="feature-icon">📖</span>
              <div>
                <strong>Open Source</strong>
                <p className="mb-0 text-muted">Transparent and auditable code</p>
              </div>
            </div>
          </div>
        </div>
      )
    },
    {
      title: 'Ready to Start! 🚀',
      content: (
        <div className="text-center">
          <div className="completion-animation mb-4" style={{ fontSize: '4rem' }}>
            ✨
          </div>
          <h4>You're All Set!</h4>
          <p className="text-muted mb-4">
            You now know the basics of using Monad Escrow. 
            Start by creating your first escrow or exploring the dashboard.
          </p>
          <div className="quick-tips p-3 bg-light rounded">
            <small>
              <strong>💡 Pro Tip:</strong> Always verify contract addresses and 
              only use testnet funds for testing!
            </small>
          </div>
        </div>
      )
    }
  ];

  const progress = ((currentStep + 1) / steps.length) * 100;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <Modal 
      show={show} 
      onHide={onComplete}
      centered
      size="lg"
      backdrop="static"
      className="onboarding-modal"
    >
      <Modal.Header className="border-0 pb-0">
        <div className="w-100">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5 className="mb-0">Getting Started</h5>
            <div className="step-indicator">
              {currentStep + 1} of {steps.length}
            </div>
          </div>
          <ProgressBar 
            now={progress} 
            variant="primary"
            style={{ height: '4px' }}
          />
        </div>
      </Modal.Header>
      
      <Modal.Body className="py-4">
        <div className="onboarding-step">
          <h3 className="mb-4">{steps[currentStep].title}</h3>
          {steps[currentStep].content}
        </div>
      </Modal.Body>
      
      <Modal.Footer className="border-0 pt-0">
        <div className="w-100 d-flex justify-content-between">
          <div>
            {currentStep > 0 && (
              <Button variant="outline-secondary" onClick={handlePrev}>
                ← Previous
              </Button>
            )}
          </div>
          
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={handleSkip}>
              Skip Tour
            </Button>
            <Button variant="primary" onClick={handleNext}>
              {currentStep < steps.length - 1 ? 'Next →' : 'Get Started! 🚀'}
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
};


// src/components/HowToUseTab.tsx - Minimalist Guide
import React, { useState } from 'react';
import { Card, Button, Alert, Badge, Collapse, Row, Col } from 'react-bootstrap';

const HowToUseTab: React.FC = () => {
  const [openSections, setOpenSections] = useState<{ [key: string]: boolean }>({
    setup: true,
    create: false,
    manage: false,
    security: false
  });

  const toggleSection = (section: string) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const steps = [
    {
      id: 'setup',
      title: 'Getting Started',
      icon: '🚀',
      description: 'Set up your wallet and connect to Monad Testnet',
      content: (
        <div>
          <h6>Prerequisites</h6>
          <ul className="mb-3">
            <li>MetaMask browser extension installed</li>
            <li>Monad Testnet configured in MetaMask</li>
            <li>Test MON tokens in your wallet</li>
          </ul>
          
          <Alert variant="info">
            <h6>🌐 Network Configuration</h6>
            <p className="mb-2">Add Monad Testnet to MetaMask:</p>
            <ul className="mb-0 small">
              <li><strong>Network Name:</strong> Monad Testnet</li>
              <li><strong>RPC URL:</strong> https://testnet-rpc.monad.xyz</li>
              <li><strong>Chain ID:</strong> 10143</li>
              <li><strong>Currency Symbol:</strong> MON</li>
            </ul>
          </Alert>
          
          <div className="d-grid">
            <Button variant="primary" size="lg">
              🦊 Connect MetaMask
            </Button>
          </div>
        </div>
      )
    },
    {
      id: 'create',
      title: 'Creating an Escrow',
      icon: '✨',
      description: 'Learn how to create secure escrow agreements',
      content: (
        <div>
          <h6>Step-by-Step Process</h6>
          <div className="process-steps">
            <div className="step-item">
              <Badge bg="primary" className="step-number">1</Badge>
              <div>
                <strong>Enter Seller Address</strong>
                <p className="mb-0 small text-muted">The wallet address that will receive funds when escrow completes</p>
              </div>
            </div>
            <div className="step-item">
              <Badge bg="primary" className="step-number">2</Badge>
              <div>
                <strong>Choose an Arbiter</strong>
                <p className="mb-0 small text-muted">A neutral third party who can resolve disputes</p>
              </div>
            </div>
            <div className="step-item">
              <Badge bg="primary" className="step-number">3</Badge>
              <div>
                <strong>Set Amount</strong>
                <p className="mb-0 small text-muted">Enter the amount of MON to lock in escrow (minimum 0.001)</p>
              </div>
            </div>
            <div className="step-item">
              <Badge bg="success" className="step-number">✓</Badge>
              <div>
                <strong>Confirm Transaction</strong>
                <p className="mb-0 small text-muted">Review details and sign the transaction in MetaMask</p>
              </div>
            </div>
          </div>
          
          <Alert variant="warning" className="mt-3">
            <strong>⚠️ Important:</strong> Buyer, seller, and arbiter must all be different addresses!
          </Alert>
        </div>
      )
    },
    {
      id: 'manage',
      title: 'Managing Escrows',
      icon: '📋',
      description: 'Track and manage your escrow agreements',
      content: (
        <div>
          <h6>Escrow Lifecycle</h6>
          <div className="lifecycle-stages">
            <div className="stage-item">
              <Badge bg="warning">Created</Badge>
              <div className="stage-content">
                <strong>Initial State</strong>
                <p className="mb-0 small">Escrow is created but not yet funded. Buyer can cancel at this stage.</p>
              </div>
            </div>
            <div className="stage-item">
              <Badge bg="primary">Funded</Badge>
              <div className="stage-content">
                <strong>Active Escrow</strong>
                <p className="mb-0 small">Funds are locked. Seller can confirm receipt or disputes can be raised.</p>
              </div>
            </div>
            <div className="stage-item">
              <Badge bg="danger">Disputed</Badge>
              <div className="stage-content">
                <strong>Under Review</strong>
                <p className="mb-0 small">Arbiter must decide whether to release funds to seller or refund buyer.</p>
              </div>
            </div>
            <div className="stage-item">
              <Badge bg="success">Completed</Badge>
              <div className="stage-content">
                <strong>Final State</strong>
                <p className="mb-0 small">Funds have been released to the seller or refunded to the buyer.</p>
              </div>
            </div>
          </div>
          
          <h6 className="mt-4">Available Actions</h6>
          <Row>
            <Col md={6}>
              <Card className="action-card">
                <Card.Body className="py-3">
                  <h6>👨‍💼 As Buyer</h6>
                  <ul className="mb-0 small">
                    <li>Cancel unfunded escrows</li>
                    <li>Raise disputes</li>
                    <li>View escrow details</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6}>
              <Card className="action-card">
                <Card.Body className="py-3">
                  <h6>👩‍💼 As Seller</h6>
                  <ul className="mb-0 small">
                    <li>Confirm receipt of payment</li>
                    <li>Raise disputes</li>
                    <li>View escrow details</li>
                  </ul>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>
      )
    },
    {
      id: 'security',
      title: 'Security & Best Practices',
      icon: '🔒',
      description: 'Keep your transactions safe and secure',
      content: (
        <div>
          <h6>Security Guidelines</h6>
          <Alert variant="danger">
            <h6>🚨 Critical Security Rules</h6>
            <ul className="mb-0">
              <li>Never share your private keys or seed phrase</li>
              <li>Always verify contract addresses before interacting</li>
              <li>Double-check all addresses before creating escrows</li>
              <li>This is testnet only - never use real funds</li>
            </ul>
          </Alert>
          
          <h6>Best Practices</h6>
          <div className="best-practices">
            <div className="practice-item">
              <span className="practice-icon">✅</span>
              <div>
                <strong>Verify Addresses</strong>
                <p className="mb-0 small">Always double-check wallet addresses before creating escrows</p>
              </div>
            </div>
            <div className="practice-item">
              <span className="practice-icon">✅</span>
              <div>
                <strong>Choose Trusted Arbiters</strong>
                <p className="mb-0 small">Select arbiters you trust to resolve disputes fairly</p>
              </div>
            </div>
            <div className="practice-item">
              <span className="practice-icon">✅</span>
              <div>
                <strong>Start Small</strong>
                <p className="mb-0 small">Test with small amounts before larger transactions</p>
              </div>
            </div>
            <div className="practice-item">
              <span className="practice-icon">✅</span>
              <div>
                <strong>Monitor Gas Fees</strong>
                <p className="mb-0 small">Ensure you have enough MON for transaction fees</p>
              </div>
            </div>
          </div>
          
          <Alert variant="info" className="mt-3">
            <h6>🔍 Contract Verification</h6>
            <p className="mb-1">Our smart contract is verified and open source:</p>
            <Button 
              variant="outline-primary" 
              size="sm"
              href="https://github.com/BluOwn/monadescrow" 
              target="_blank"
            >
              📄 View Source Code
            </Button>
          </Alert>
        </div>
      )
    }
  ];

  return (
    <div className="how-to-use-container">
      <Card className="welcome-card">
        <Card.Header className="text-center">
          <h2 className="mb-2">Welcome to Monad Escrow</h2>
          <p className="text-muted mb-0">
            Secure, decentralized escrow service on Monad Testnet
          </p>
        </Card.Header>
        
        <Card.Body>
          <Alert variant="primary" className="welcome-alert">
            <h5>🎯 What is Monad Escrow?</h5>
            <p className="mb-3">
              Monad Escrow is a smart contract-based service that enables secure transactions 
              between parties who don't trust each other. Funds are held in escrow until 
              both parties fulfill their obligations or a dispute is resolved.
            </p>
            
            <Row>
              <Col md={4} className="text-center">
                <div className="feature-item">
                  <div className="feature-icon">🔒</div>
                  <h6>Secure</h6>
                  <p className="small text-muted">Smart contract protection</p>
                </div>
              </Col>
              <Col md={4} className="text-center">
                <div className="feature-item">
                  <div className="feature-icon">⚖️</div>
                  <h6>Fair</h6>
                  <p className="small text-muted">Neutral arbitration system</p>
                </div>
              </Col>
              <Col md={4} className="text-center">
                <div className="feature-item">
                  <div className="feature-icon">🌐</div>
                  <h6>Decentralized</h6>
                  <p className="small text-muted">No central authority</p>
                </div>
              </Col>
            </Row>
          </Alert>
        </Card.Body>
      </Card>

      {/* Interactive Guide Sections */}
      <div className="guide-sections">
        {steps.map((step) => (
          <Card key={step.id} className="guide-section">
            <Card.Header>
              <Button
                variant="link"
                className="w-100 text-start p-0 text-decoration-none"
                onClick={() => toggleSection(step.id)}
              >
                <div className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-3">
                    <span className="step-icon">{step.icon}</span>
                    <div>
                      <h5 className="mb-0">{step.title}</h5>
                      <p className="mb-0 small text-muted">{step.description}</p>
                    </div>
                  </div>
                  <Badge bg={openSections[step.id] ? 'primary' : 'secondary'}>
                    {openSections[step.id] ? '▼' : '▶'}
                  </Badge>
                </div>
              </Button>
            </Card.Header>
            
            <Collapse in={openSections[step.id]}>
              <Card.Body>
                {step.content}
              </Card.Body>
            </Collapse>
          </Card>
        ))}
      </div>

      {/* Call to Action */}
      <Card className="cta-card">
        <Card.Body className="text-center">
          <h4>Ready to Get Started?</h4>
          <p className="text-muted mb-4">
            Connect your wallet and create your first secure escrow transaction
          </p>
          <div className="d-grid gap-2 d-md-flex justify-content-md-center">
            <Button variant="primary" size="lg">
              🦊 Connect Wallet
            </Button>
            <Button variant="outline-secondary" size="lg">
              📚 Learn More
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default HowToUseTab;
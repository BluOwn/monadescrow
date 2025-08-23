// src/components/HowToUseTab.tsx - Simple guide for new users
import React from 'react';
import { Card, Row, Col, Alert, Badge } from 'react-bootstrap';

const HowToUseTab: React.FC = () => {
  return (
    <div className="how-to-use">
      {/* Header */}
      <Card className="mb-4">
        <Card.Body className="text-center">
          <h2>🚀 How to Use Monad Escrow</h2>
          <p className="lead">
            Simple, secure escrow transactions on Monad Testnet
          </p>
        </Card.Body>
      </Card>

      {/* What is Escrow */}
      <Card className="mb-4">
        <Card.Header>
          <h4>🤔 What is Escrow?</h4>
        </Card.Header>
        <Card.Body>
          <p>
            Escrow is a secure way to trade where funds are held by a trusted third party until both parties fulfill their obligations.
          </p>
          <div className="text-center my-3">
            <Badge bg="info" className="me-2">Buyer</Badge>
            <span>→</span>
            <Badge bg="warning" className="mx-2">Escrow</Badge>
            <span>→</span>
            <Badge bg="success" className="ms-2">Seller</Badge>
          </div>
          <p className="text-muted">
            <small>💡 Perfect for buying/selling digital goods, services, or any transaction where trust is needed.</small>
          </p>
        </Card.Body>
      </Card>

      {/* Step-by-Step Guide */}
      <Card className="mb-4">
        <Card.Header>
          <h4>📋 Step-by-Step Guide</h4>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <div className="step-card mb-3">
                <h5>
                  <Badge bg="primary" className="me-2">1</Badge>
                  Connect Wallet
                </h5>
                <p>Connect your MetaMask wallet to Monad Testnet</p>
                <Alert variant="info" className="py-2">
                  <small>
                    <strong>Need testnet MON?</strong><br/>
                    Get free testnet tokens from the Monad faucet
                  </small>
                </Alert>
              </div>

              <div className="step-card mb-3">
                <h5>
                  <Badge bg="primary" className="me-2">2</Badge>
                  Create Escrow
                </h5>
                <p>Fill in the details:</p>
                <ul>
                  <li><strong>Seller Address:</strong> Who receives the funds</li>
                  <li><strong>Arbiter Address:</strong> Trusted dispute resolver</li>
                  <li><strong>Amount:</strong> How much MON to escrow</li>
                </ul>
              </div>

              <div className="step-card mb-3">
                <h5>
                  <Badge bg="primary" className="me-2">3</Badge>
                  Complete Transaction
                </h5>
                <p>Once both parties are satisfied:</p>
                <ul>
                  <li>Buyer clicks <strong>"Release Funds"</strong></li>
                  <li>Seller receives the MON</li>
                  <li>Escrow is completed ✅</li>
                </ul>
              </div>
            </Col>

            <Col md={6}>
              <div className="roles-explanation">
                <h5>👥 Understanding Roles</h5>
                
                <div className="role-card mb-3">
                  <h6>
                    <Badge bg="info" className="me-2">🛒 Buyer</Badge>
                  </h6>
                  <p>
                    <strong>You are the buyer</strong> when you create an escrow.
                    You send MON to the escrow contract and can release it to the seller.
                  </p>
                </div>

                <div className="role-card mb-3">
                  <h6>
                    <Badge bg="success" className="me-2">💰 Seller</Badge>
                  </h6>
                  <p>
                    <strong>You are the seller</strong> when someone creates an escrow with your address.
                    You receive MON when the buyer releases funds.
                  </p>
                </div>

                <div className="role-card mb-3">
                  <h6>
                    <Badge bg="warning" className="me-2">⚖️ Arbiter</Badge>
                  </h6>
                  <p>
                    <strong>You are the arbiter</strong> when chosen as a dispute resolver.
                    You can refund the buyer or resolve disputes fairly.
                  </p>
                </div>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Common Actions */}
      <Card className="mb-4">
        <Card.Header>
          <h4>⚡ Common Actions</h4>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={4}>
              <div className="action-card">
                <h6>🟢 Release Funds</h6>
                <p><strong>As Buyer:</strong> Release funds to seller when satisfied with goods/services</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="action-card">
                <h6>🔴 Refund Buyer</h6>
                <p><strong>As Seller/Arbiter:</strong> Return funds to buyer if issues arise</p>
              </div>
            </Col>
            <Col md={4}>
              <div className="action-card">
                <h6>⚠️ Raise Dispute</h6>
                <p><strong>As Buyer/Seller:</strong> Ask arbiter to resolve disagreements</p>
              </div>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* Safety Tips */}
      <Card className="mb-4">
        <Card.Header>
          <h4>🛡️ Safety Tips</h4>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Alert variant="success">
                <h6>✅ Do This</h6>
                <ul className="mb-0">
                  <li>Verify all addresses before creating escrow</li>
                  <li>Choose a trusted arbiter both parties agree on</li>
                  <li>Communicate clearly about expectations</li>
                  <li>Keep transaction records</li>
                </ul>
              </Alert>
            </Col>
            <Col md={6}>
              <Alert variant="danger">
                <h6>❌ Don't Do This</h6>
                <ul className="mb-0">
                  <li>Never share your private keys</li>
                  <li>Don't use untrusted arbiters</li>
                  <li>Avoid escrows without clear terms</li>
                  <li>Don't ignore disputes</li>
                </ul>
              </Alert>
            </Col>
          </Row>
        </Card.Body>
      </Card>

      {/* FAQ */}
      <Card className="mb-4">
        <Card.Header>
          <h4>❓ Quick FAQ</h4>
        </Card.Header>
        <Card.Body>
          <div className="faq-item mb-3">
            <h6>Q: What happens if the seller doesn't deliver?</h6>
            <p>A: You can raise a dispute, and the arbiter will decide whether to refund you or release funds to the seller.</p>
          </div>

          <div className="faq-item mb-3">
            <h6>Q: Can I cancel an escrow?</h6>
            <p>A: Once created, escrows can only be resolved by releasing funds, refunding, or arbiter decision. Choose carefully!</p>
          </div>

          <div className="faq-item mb-3">
            <h6>Q: How do I choose a good arbiter?</h6>
            <p>A: Pick someone both parties trust - could be a mutual friend, reputable community member, or our website arbiter service.</p>
          </div>

          <div className="faq-item mb-0">
            <h6>Q: Are there any fees?</h6>
            <p>A: Only standard Monad network gas fees. The escrow contract itself is free to use!</p>
          </div>
        </Card.Body>
      </Card>

      {/* Get Started */}
      <Card className="mb-4">
        <Card.Body className="text-center">
          <h4>🎉 Ready to Get Started?</h4>
          <p>
            Connect your wallet and create your first secure escrow transaction!
          </p>
          <Alert variant="info" className="mt-3">
            <small>
              <strong>New to Monad Testnet?</strong><br/>
              Add network: RPC URL, Chain ID 10143, Currency: MON
            </small>
          </Alert>
        </Card.Body>
      </Card>
    </div>
  );
};

export default HowToUseTab;
// src/App.tsx - Final Vercel fixes
import React, { Suspense, useState, useEffect, useContext, useCallback } from 'react';
import { Button, Container, Alert, Modal, Badge, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import contexts
import { ThemeContext } from './contexts/ThemeContext';

// Import hooks
import useWallet from './hooks/useWallet';
import useEscrowOperations from './hooks/useEscrowOperations';

// Import new components
import CustomNavPills from './components/CustomNavPills';
import EscrowTimeline from './components/EscrowTimeline';
import AnimatedProgress from './components/AnimatedProgress';
import AnimatedAlert, { ToastNotification } from './components/AnimatedAlert';
import { EscrowCardSkeleton, WalletInfoSkeleton, FormSkeleton } from './components/SkeletonShimmer';

// Import existing components
import ThemeToggle from './components/ThemeToggle';
import DarkModeWrapper from './components/DarkModeWrapper';
import LoadingIndicator from './components/LoadingIndicator';
import AddressDisplay from './components/AddressDisplay';
import RateLimitAlert from './components/RateLimitAlert';
import {
  ContractInfo,
  SecurityWarningModal,
  SecurityBanner
} from './components/SecurityComponents';

// Creator Information
import { CREATOR_TWITTER } from './constants/contractData';

// Lazy load components
const CreateEscrowTab = React.lazy(() => import('./components/CreateEscrowTab'));
const MyEscrowsTab = React.lazy(() => import('./components/MyEscrowsTab'));
const FindEscrowTab = React.lazy(() => import('./components/FindEscrowTab'));
const ContactForm = React.lazy(() => import('./components/ContactForm'));
const EscrowDetails = React.lazy(() => import('./components/EscrowDetails'));
const HowToUseTab = React.lazy(() => import('./components/HowToUseTab'));

// Navigation tabs configuration
const navigationTabs = [
  { id: 'guide', label: 'How to Use', icon: '📚' },
  { id: 'create', label: 'Create Escrow', icon: '➕' },
  { id: 'my-escrows', label: 'My Escrows', icon: '📋' },
  { id: 'find', label: 'Find Escrow', icon: '🔍' },
  { id: 'contact', label: 'Contact', icon: '📧' }
];

// Main App component
const App: React.FC = () => {
  // Access theme context
  const { darkMode } = useContext(ThemeContext);
  
  // Use custom hooks
  const wallet = useWallet();
  const escrowOps = useEscrowOperations();
  
  // Local state
  const [activeTab, setActiveTab] = useState<string>('guide');
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState<boolean>(false);
  const [showNetworkWarning, setShowNetworkWarning] = useState<boolean>(false);
  const [loadingProgress, setLoadingProgress] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger' | 'warning' | 'info'>('info');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);

  // Track chainId separately
  const [chainId, setChainId] = useState<number | null>(null);

  // Update chainId when provider changes
  useEffect(() => {
    if (wallet.provider) {
      wallet.provider.getNetwork().then(network => {
        setChainId(Number(network.chainId));
      }).catch(() => setChainId(null));
    } else {
      setChainId(null);
    }
  }, [wallet.provider]);

  // Show security warning on first visit
  useEffect(() => {
    const hasSeenWarning = localStorage.getItem('monad-escrow-security-warning');
    if (!hasSeenWarning) {
      setShowSecurityWarning(true);
    }
  }, []);

  // Handle security warning acceptance
  const handleSecurityAccept = useCallback(() => {
    localStorage.setItem('monad-escrow-security-warning', 'true');
    setShowSecurityWarning(false);
  }, []);

  // Handle security warning decline
  const handleSecurityDecline = useCallback(() => {
    window.location.href = 'https://google.com';
  }, []);

  // Show toast notification
  const showToastNotification = useCallback((message: string, variant: 'success' | 'danger' | 'warning' | 'info') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  }, []);

  // Handle toast close
  const handleToastClose = useCallback(() => {
    setShowToast(false);
  }, []);

  // Show success/error notifications
  useEffect(() => {
    if (escrowOps.successMessage) {
      showToastNotification(escrowOps.successMessage, 'success');
      escrowOps.clearMessages();
    }
  }, [escrowOps.successMessage, showToastNotification, escrowOps]);

  useEffect(() => {
    if (escrowOps.error) {
      showToastNotification(escrowOps.error, 'danger');
      escrowOps.clearMessages();
    }
  }, [escrowOps.error, showToastNotification, escrowOps]);

  // Handle wallet connection
  const handleConnectWallet = useCallback(async () => {
    try {
      setIsConnecting(true);
      await wallet.connectWallet();
      showToastNotification('Wallet connected successfully!', 'success');
    } catch (error) {
      showToastNotification('Failed to connect wallet', 'danger');
    } finally {
      setIsConnecting(false);
    }
  }, [wallet, showToastNotification]);

  // Check network
  useEffect(() => {
    if (wallet.account && chainId && chainId !== 10143) {
      setShowNetworkWarning(true);
    } else {
      setShowNetworkWarning(false);
    }
  }, [wallet.account, chainId]);

  // Render tab content
  const renderTabContent = () => {
    if (!wallet.account) {
      return (
        <Card className="text-center py-5">
          <Card.Body>
            <h4 className="mb-4">Connect Your Wallet</h4>
            <p className="text-muted mb-4">
              Connect your MetaMask wallet to start using the Monad Escrow Service
            </p>
            <Button 
              variant="primary" 
              size="lg" 
              onClick={handleConnectWallet}
              disabled={isConnecting}
            >
              {isConnecting ? (
                <>
                  <LoadingIndicator />
                  {' '}Connecting...
                </>
              ) : (
                'Connect Wallet'
              )}
            </Button>
          </Card.Body>
        </Card>
      );
    }

    const suspenseFallback = (
      <div className="p-4">
        {activeTab === 'create' && <FormSkeleton fields={4} />}
        {(activeTab === 'my-escrows' || activeTab === 'find') && (
          <div className="row g-3">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="col-12">
                <EscrowCardSkeleton />
              </div>
            ))}
          </div>
        )}
        {activeTab === 'guide' && <FormSkeleton fields={2} />}
        {activeTab === 'contact' && <FormSkeleton fields={3} />}
      </div>
    );

    return (
      <Suspense fallback={suspenseFallback}>
        {activeTab === 'guide' && <HowToUseTab />}
        {activeTab === 'create' && (
          <CreateEscrowTab 
            handleCreateEscrow={async (e) => {
              e.preventDefault();
              // Handle form submission here
            }}
            sellerAddress=""
            setSellerAddress={() => {}}
            arbiterAddress=""
            setArbiterAddress={() => {}}
            amount=""
            setAmount={() => {}}
            loading={escrowOps.loading}
          />
        )}
        {activeTab === 'my-escrows' && (
          <MyEscrowsTab 
            escrows={[]}
            onViewDetails={() => {}}
            loadingEscrows={false}
            retryLoadingEscrows={() => {}}
            account={wallet.account || ''}
            onAction={() => {}}
          />
        )}
        {activeTab === 'find' && (
          <FindEscrowTab 
            escrowIdToView=""
            setEscrowIdToView={() => {}}
            handleFindEscrow={() => {}}
            loading={escrowOps.loading}
          />
        )}
        {activeTab === 'contact' && <ContactForm />}
      </Suspense>
    );
  };

  return (
    <DarkModeWrapper>
      <div className="app-wrapper">
        <Container fluid className="container">
          {/* Header */}
          <header className="app-header">
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h1>Monad Escrow</h1>
              <ThemeToggle />
            </div>
            <p>Secure, decentralized escrow on Monad Testnet</p>
          </header>

          {/* Network Warning */}
          {showNetworkWarning && (
            <Alert variant="warning" className="mb-4">
              <Alert.Heading>⚠️ Wrong Network</Alert.Heading>
              Please switch to Monad Testnet (Chain ID: 10143) in your wallet.
            </Alert>
          )}

          {/* Security Banner */}
          <SecurityBanner />

          {/* Wallet Info */}
          {wallet.account ? (
            <Card className="wallet-info-card mb-4">
              <Card.Body className="d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center">
                  <div className="wallet-avatar me-3">
                    👤
                  </div>
                  <div>
                    <h6 className="mb-1">Connected Wallet</h6>
                    <AddressDisplay address={wallet.account} />
                  </div>
                </div>
                <div className="text-end">
                  <Badge bg="success" className="mb-1">Connected</Badge>
                  <div className="small text-muted">Monad Testnet</div>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <WalletInfoSkeleton />
          )}

          {/* Loading Progress */}
          {escrowOps.loading && (
            <AnimatedProgress 
              value={loadingProgress} 
              label="Loading escrows..." 
              variant="primary"
            />
          )}

          {/* Rate Limit Alert */}
          {escrowOps.rateLimited && (
            <RateLimitAlert 
              isVisible={true}
              onDismiss={() => escrowOps.setRateLimited(false)}
              onRetry={() => escrowOps.setRateLimited(false)}
            />
          )}

          {/* Navigation */}
          <CustomNavPills 
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={navigationTabs}
          />

          {/* Tab Content */}
          <main className="tab-content">
            {renderTabContent()}
          </main>

          {/* Contract Info */}
          <ContractInfo />

          {/* Footer */}
          <footer className="footer">
            <p>
              Built by{' '}
              <a 
                href={CREATOR_TWITTER} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                @Oprimedev
              </a>
              {' '}| Open source on{' '}
              <a 
                href="https://github.com/BluOwn/monadescrow" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                GitHub
              </a>
            </p>
          </footer>

          {/* Modals */}
          <SecurityWarningModal 
            show={showSecurityWarning}
            onAccept={handleSecurityAccept}
            onDecline={handleSecurityDecline}
          />

          <Modal 
            show={showDetailsModal} 
            onHide={() => setShowDetailsModal(false)}
            size="lg"
            centered
          >
            <Modal.Header closeButton>
              <Modal.Title>Escrow Details</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {escrowOps.selectedEscrow && (
                <Suspense fallback={<FormSkeleton fields={3} />}>
                  <EscrowDetails 
                    escrow={escrowOps.selectedEscrow}
                    onAction={() => setShowDetailsModal(false)}
                    account={wallet.account || ''}
                    loading={escrowOps.loading}
                  />
                  <EscrowTimeline 
                    escrowStatus={escrowOps.selectedEscrow.fundsDisbursed ? 'completed' : 'funded'}
                    disputeRaised={escrowOps.selectedEscrow.disputeRaised}
                  />
                </Suspense>
              )}
            </Modal.Body>
          </Modal>

          <ToastNotification 
            message={toastMessage}
            variant={toastVariant}
            show={showToast}
            onClose={handleToastClose}
            position="top-right"
          />
        </Container>
      </div>
    </DarkModeWrapper>
  );
};

export default App;
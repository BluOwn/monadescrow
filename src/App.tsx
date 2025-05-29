// src/App.tsx - Added How to Use guide tab
import React, { Suspense, useState, useEffect, useContext, useCallback } from 'react';
import { Button, Container, Nav, Alert, Modal, Badge, Spinner, Card, Row, Col, ProgressBar } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import contexts
import { ThemeContext } from './contexts/ThemeContext';

// Import hooks
import useWallet from './hooks/useWallet';
import useRobustEscrowLoader from './hooks/useRobustEscrowLoader';
import useEscrowOperations from './hooks/useEscrowOperations';

// Import components
import ThemeToggle from './components/ThemeToggle';
import DarkModeWrapper from './components/DarkModeWrapper';
import LoadingIndicator from './components/LoadingIndicator';
import AddressDisplay from './components/AddressDisplay';
import { 
  WalletInfoSkeleton,
  EscrowDetailsSkeleton 
} from './components/SkeletonLoaders';
import RateLimitAlert from './components/RateLimitAlert';
import {
  ContractInfo,
  SecurityWarningModal,
  SecurityBanner,
  NetworkWarning
} from './components/SecurityComponents';

// Creator Information
import { CREATOR_WALLET, CREATOR_TWITTER } from './constants/contractData';

// Lazy load components
const CreateEscrowTab = React.lazy(() => import('./components/CreateEscrowTab'));
const MyEscrowsTab = React.lazy(() => import('./components/MyEscrowsTab'));
const FindEscrowTab = React.lazy(() => import('./components/FindEscrowTab'));
const ContactForm = React.lazy(() => import('./components/ContactForm'));
const EscrowDetails = React.lazy(() => import('./components/EscrowDetails'));
const HowToUseTab = React.lazy(() => import('./components/HowToUseTab')); // New guide component

// Main App component
const App: React.FC = () => {
  // Access theme context
  const { darkMode } = useContext(ThemeContext);
  
  // Use custom hooks
  const wallet = useWallet();
  const escrowLoader = useRobustEscrowLoader();
  const escrowOps = useEscrowOperations();
  
  // Local state - Start with guide tab for new users
  const [activeTab, setActiveTab] = useState<string>('guide');
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState<boolean>(false);
  const [hasAcceptedSecurity, setHasAcceptedSecurity] = useState<boolean>(false);
  const [firstTimeUser, setFirstTimeUser] = useState<boolean>(true);

  // Form states
  const [sellerAddress, setSellerAddress] = useState<string>('');
  const [arbiterAddress, setArbiterAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [escrowIdToView, setEscrowIdToView] = useState<string>('');

  // Initialize security settings
  useEffect(() => {
    const hasAccepted = localStorage.getItem('monad-escrow-security-accepted');
    const hasVisited = localStorage.getItem('monad-escrow-visited');
    
    if (hasAccepted === 'true') {
      setHasAcceptedSecurity(true);
      setFirstTimeUser(false);
    }
    
    // If returning user, start with create tab instead of guide
    if (hasVisited === 'true' && hasAccepted === 'true') {
      setActiveTab('create');
    }
  }, []);
  
  // Setup wallet listeners
  useEffect(() => {
    const cleanup = wallet.setupWalletListeners();
    return cleanup;
  }, [wallet]);

  // Load escrows when wallet connects
  useEffect(() => {
    let isEffectActive = true;
    
    const loadData = async () => {
      if (wallet.connected && wallet.contract && wallet.account && isEffectActive) {
        console.log('👤 Wallet connected, loading escrows...');
        
        try {
          await escrowLoader.refreshIfStale(wallet.contract, wallet.account);
        } catch (error) {
          console.error('Error loading escrows:', error);
        }
      }
    };

    const timeoutId = setTimeout(loadData, 300);
    
    return () => {
      isEffectActive = false;
      clearTimeout(timeoutId);
    };
  }, [wallet.connected, wallet.contract, wallet.account]);

  // Connect to MetaMask
  const connectWallet = async (): Promise<void> => {
    if (firstTimeUser && !hasAcceptedSecurity) {
      setShowSecurityWarning(true);
      return;
    }

    try {
      const success = await wallet.connectWallet();
      if (success && wallet.contract) {
        console.log('Wallet connected successfully');
        // Mark as visited and switch to create tab
        localStorage.setItem('monad-escrow-visited', 'true');
        if (activeTab === 'guide') {
          setActiveTab('create');
        }
      }
    } catch (error) {
      console.error("Error in connect flow:", error);
    }
  };

  // Handle security warning
  const handleSecurityAccept = (): void => {
    setHasAcceptedSecurity(true);
    setFirstTimeUser(false);
    setShowSecurityWarning(false);
    localStorage.setItem('monad-escrow-security-accepted', 'true');
    localStorage.setItem('monad-escrow-visited', 'true');
    connectWallet();
  };

  const handleSecurityDecline = (): void => {
    setShowSecurityWarning(false);
  };

  // Create escrow handler
  const handleCreateEscrow = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!wallet.contract) return;
    
    const success = await escrowOps.createEscrow(
      wallet.contract,
      sellerAddress,
      arbiterAddress,
      amount,
      wallet.account
    );
    
    if (success) {
      setSellerAddress('');
      setArbiterAddress('');
      setAmount('');
      
      // Switch to My Escrows tab and refresh
      setActiveTab('my');
      setTimeout(() => {
        escrowLoader.forceRefresh(wallet.contract!, wallet.account);
      }, 2000);
    }
  };

  // View escrow details
  const viewEscrowDetails = useCallback(async (escrowId: string): Promise<void> => {
    if (!wallet.contract) {
      escrowOps.setError('Wallet not connected');
      return;
    }
    
    try {
      escrowOps.clearMessages();
      const escrow = await escrowOps.viewEscrowDetails(wallet.contract, escrowId);
      
      if (escrow) {
        setShowDetailsModal(true);
      } else {
        escrowOps.setError('Escrow not found');
      }
    } catch (error) {
      console.error("Error viewing escrow:", error);
      escrowOps.setError('Failed to load escrow details');
    }
  }, [wallet.contract, escrowOps]);

  // Handle escrow actions
  const handleEscrowAction = useCallback(async (
    action: string, 
    escrowId: string, 
    recipient: string | null = null
  ): Promise<void> => {
    if (!wallet.contract) return;
    
    const success = await escrowOps.handleEscrowAction(wallet.contract, action, escrowId, recipient);
    
    if (success) {
      // Refresh after action
      setTimeout(() => {
        if (wallet.contract && wallet.account) {
          escrowLoader.forceRefresh(wallet.contract, wallet.account);
        }
      }, 2000);
      
      // Refresh modal if open
      if (showDetailsModal && escrowOps.selectedEscrow?.id === escrowId) {
        setTimeout(() => {
          viewEscrowDetails(escrowId);
        }, 3000);
      }
    }
  }, [wallet.contract, wallet.account, showDetailsModal, escrowOps.selectedEscrow?.id, escrowLoader, viewEscrowDetails]);

  // Handle find escrow
  const handleFindEscrow = useCallback(async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!escrowIdToView || !wallet.contract) {
      escrowOps.setError('Please enter an escrow ID');
      return;
    }
    
    try {
      escrowOps.clearMessages();
      await viewEscrowDetails(escrowIdToView);
      setEscrowIdToView('');
    } catch (error) {
      console.error("Error finding escrow", error);
      escrowOps.setError('Failed to find escrow');
    }
  }, [escrowIdToView, wallet.contract, escrowOps, viewEscrowDetails]);

  // Modal close handler
  const handleModalClose = useCallback(() => {
    setShowDetailsModal(false);
    setTimeout(() => {
      escrowOps.setSelectedEscrow(null);
      escrowOps.clearMessages();
    }, 150);
  }, [escrowOps]);

  // Retry loading
  const retryLoadingEscrows = async (): Promise<void> => {
    if (wallet.contract && wallet.account) {
      escrowOps.setRateLimited(false);
      await escrowLoader.forceRefresh(wallet.contract, wallet.account);
    }
  };

  // Handle giveaway link click
  const handleGiveawayClick = (): void => {
    window.open('https://x.com/Oprimedev/status/1928143907830776161', '_blank', 'noopener,noreferrer');
  };

  // Loading Progress Component
  const LoadingProgress = () => {
    if (!escrowLoader.loading && !escrowLoader.progress.total) return null;

    return (
      <Card className="mb-4">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">
              {escrowLoader.loading ? '🔄 Loading Your Escrows...' : '📊 Loading Complete'}
            </h6>
            {escrowLoader.loading && (
              <Button 
                variant="outline-danger" 
                size="sm"
                onClick={escrowLoader.cancelLoading}
              >
                Cancel
              </Button>
            )}
          </div>
          
          {escrowLoader.progress.total > 0 && (
            <>
              <ProgressBar 
                now={escrowLoader.progress.percentage} 
                variant={escrowLoader.progress.failed > 0 ? "warning" : "info"}
                style={{ height: '8px' }}
                className="mb-2"
              />
              <div className="d-flex justify-content-between">
                <small>
                  Progress: {escrowLoader.progress.loaded}/{escrowLoader.progress.total} loaded
                  {escrowLoader.progress.failed > 0 && (
                    <span className="text-warning"> ({escrowLoader.progress.failed} failed)</span>
                  )}
                </small>
                <small>{escrowLoader.progress.percentage}%</small>
              </div>
            </>
          )}
        </Card.Body>
      </Card>
    );
  };

  // Stats display component
  const StatsCard = () => {
    if (!escrowLoader.hasData) return null;

    return (
      <Card className="mb-4">
        <Card.Body>
          <Card.Title>📊 Your Active Escrows</Card.Title>
          <Row>
            <Col xs={6} sm={3}>
              <div className="text-center">
                <h3 className="text-primary">{escrowLoader.stats.total}</h3>
                <small>Total Active</small>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="text-center">
                <h3 className="text-info">{escrowLoader.stats.asBuyer}</h3>
                <small>As Buyer</small>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="text-center">
                <h3 className="text-success">{escrowLoader.stats.asSeller}</h3>
                <small>As Seller</small>
              </div>
            </Col>
            <Col xs={6} sm={3}>
              <div className="text-center">
                <h3 className="text-warning">{escrowLoader.stats.asArbiter}</h3>
                <small>As Arbiter</small>
              </div>
            </Col>
          </Row>
          {escrowLoader.stats.disputed > 0 && (
            <Alert variant="warning" className="mt-3 mb-0">
              ⚠️ {escrowLoader.stats.disputed} escrow{escrowLoader.stats.disputed > 1 ? 's' : ''} in dispute
            </Alert>
          )}
          {escrowLoader.isPartiallyLoaded && (
            <Alert variant="info" className="mt-3 mb-0">
              ℹ️ Some escrows failed to load. Try refreshing for complete data.
            </Alert>
          )}
        </Card.Body>
      </Card>
    );
  };

  return (
    <DarkModeWrapper>
      <div className="app-wrapper">
        <Container 
          className="py-5"
          style={{
            backgroundColor: darkMode ? "#1e1e1e" : "white",
            color: darkMode ? "#e1e1e1" : "#2d3436",
            boxShadow: darkMode ? "0 4px 6px rgba(0, 0, 0, 0.3)" : "0 4px 6px rgba(0, 0, 0, 0.1)"
          }}
        >
          <div className="app-header">
            <h1>Monad Escrow Service</h1>
            <p>Secure your transactions with smart contract escrow on Monad Testnet</p>
          </div>
          
          {/* Security Warning Modal */}
          <SecurityWarningModal 
            show={showSecurityWarning}
            onAccept={handleSecurityAccept}
            onDecline={handleSecurityDecline}
          />
          
          {!wallet.connected ? (
            <div className="connect-wallet-container">
              <SecurityBanner />
              <ContractInfo />
              <p>Connect your wallet to use the escrow service</p>
              <div className="d-flex flex-column align-items-center">
                <Button 
                  className="wallet-button mb-3"
                  onClick={connectWallet} 
                  disabled={wallet.loading}
                >
                  {wallet.loading ? <Spinner animation="border" size="sm" /> : 'Connect Wallet'}
                </Button>
                <ThemeToggle />
              </div>
            </div>
          ) : (
            <>
              {wallet.loading ? (
                <WalletInfoSkeleton />
              ) : (
                <div className="wallet-info mb-4">
                  <div>
                    <small>Connected to: <span className="network-badge">{wallet.networkName}</span></small>
                    <p className="mb-0"><strong>Account:</strong> <AddressDisplay address={wallet.account} /></p>
                  </div>
                  <div className="d-flex">
                    <ThemeToggle />
                    <Button variant="outline-secondary" size="sm" className="ms-2" onClick={() => window.location.reload()}>
                      Disconnect
                    </Button>
                  </div>
                </div>
              )}
              
              {/* Security Banner */}
              <SecurityBanner />
              <NetworkWarning currentNetwork={wallet.networkName} />
              
              {/* Loading Progress */}
              <LoadingProgress />
              
              {/* Stats Card */}
              <StatsCard />
              
              {/* Error State */}
              {escrowLoader.error && (
                <Alert variant={escrowLoader.isPartiallyLoaded ? "warning" : "danger"} className="mb-3">
                  <strong>{escrowLoader.isPartiallyLoaded ? "Partial Load:" : "Error:"}</strong> {escrowLoader.error}
                  <div className="mt-2">
                    <Button 
                      variant={escrowLoader.isPartiallyLoaded ? "outline-warning" : "outline-danger"}
                      size="sm" 
                      onClick={() => escrowLoader.forceRefresh(wallet.contract!, wallet.account)}
                    >
                      {escrowLoader.isPartiallyLoaded ? "Retry Failed" : "Retry All"}
                    </Button>
                  </div>
                </Alert>
              )}
              
              {/* Escrow Operations Messages */}
              {escrowOps.error && (
                <Alert variant="danger" onClose={() => escrowOps.setError('')} dismissible>
                  {escrowOps.error}
                </Alert>
              )}
              
              {escrowOps.successMessage && (
                <Alert variant="success" onClose={() => escrowOps.clearMessages()} dismissible>
                  {escrowOps.successMessage}
                </Alert>
              )}
              
              {/* Rate Limit Alert */}
              {escrowOps.rateLimited && (
                <RateLimitAlert 
                  isVisible={escrowOps.rateLimited}
                  onDismiss={() => escrowOps.setRateLimited(false)}
                  onRetry={retryLoadingEscrows}
                  progress={escrowOps.autoRetry.progress}
                  autoRetryIn={escrowOps.autoRetry.countdown}
                />
              )}
            </>
          )}
          
          {/* Navigation - Always visible */}
          <Nav variant="tabs" className="mb-4" activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)}>
            <Nav.Item>
              <Nav.Link eventKey="guide">
                📖 How to Use
                {activeTab === 'guide' && !wallet.connected && (
                  <Badge bg="info" className="ms-2">Start Here</Badge>
                )}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="create" disabled={!wallet.connected}>
                Create Escrow
                {!wallet.connected && <small className="ms-1">(Connect wallet)</small>}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="my" disabled={!wallet.connected}>
                My Active Escrows
                {wallet.connected && escrowLoader.loading && <Spinner animation="border" size="sm" className="ms-2" />}
                {wallet.connected && escrowLoader.stats.total > 0 && (
                  <Badge bg="primary" className="ms-2">{escrowLoader.stats.total}</Badge>
                )}
                {!wallet.connected && <small className="ms-1">(Connect wallet)</small>}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="find" disabled={!wallet.connected}>
                Find Escrow
                {!wallet.connected && <small className="ms-1">(Connect wallet)</small>}
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="contact">Contact</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                onClick={handleGiveawayClick}
                style={{ cursor: 'pointer' }}
                className="text-decoration-none"
              >
                🎁 200 MON Giveaway
                <Badge bg="success" className="ms-2">Live!</Badge>
              </Nav.Link>
            </Nav.Item>
          </Nav>
          
          <Suspense fallback={<LoadingIndicator message="Loading..." />}>
            {activeTab === 'guide' && <HowToUseTab />}
            
            {activeTab === 'create' && wallet.connected && (
              <CreateEscrowTab 
                handleCreateEscrow={handleCreateEscrow}
                sellerAddress={sellerAddress}
                setSellerAddress={setSellerAddress}
                arbiterAddress={arbiterAddress}
                setArbiterAddress={setArbiterAddress}
                amount={amount}
                setAmount={setAmount}
                loading={escrowOps.loading}
                currentAccount={wallet.account}
              />
            )}
            
            {activeTab === 'my' && wallet.connected && (
              <MyEscrowsTab 
                escrows={escrowLoader.activeEscrows} 
                onViewDetails={viewEscrowDetails} 
                loadingEscrows={escrowLoader.loading}
                retryLoadingEscrows={() => escrowLoader.forceRefresh(wallet.contract!, wallet.account)}
                account={wallet.account}
                onAction={handleEscrowAction}
              />
            )}
            
            {activeTab === 'find' && wallet.connected && (
              <FindEscrowTab 
                escrowIdToView={escrowIdToView}
                setEscrowIdToView={setEscrowIdToView}
                handleFindEscrow={handleFindEscrow}
                loading={escrowOps.loading}
              />
            )}
            
            {activeTab === 'contact' && <ContactForm />}
          </Suspense>
          
          {/* Show wallet connection prompt for disabled tabs */}
          {!wallet.connected && (activeTab === 'create' || activeTab === 'my' || activeTab === 'find') && (
            <Card>
              <Card.Body className="text-center">
                <h4>🔗 Connect Your Wallet</h4>
                <p>Please connect your MetaMask wallet to access this feature</p>
                <Button 
                  variant="primary"
                  onClick={connectWallet}
                  disabled={wallet.loading}
                >
                  {wallet.loading ? <Spinner animation="border" size="sm" /> : 'Connect Wallet'}
                </Button>
              </Card.Body>
            </Card>
          )}
          
          {/* Escrow Details Modal */}
          {wallet.connected && (
            <Modal 
              show={showDetailsModal} 
              onHide={handleModalClose}
              contentClassName={darkMode ? "bg-dark text-light" : ""}
              backdrop="static"
              keyboard={false}
            >
              <Modal.Header closeButton>
                <Modal.Title>Escrow Details</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Suspense fallback={<EscrowDetailsSkeleton />}>
                  {escrowOps.selectedEscrow ? (
                    <EscrowDetails
                      escrow={escrowOps.selectedEscrow}
                      account={wallet.account}
                      onAction={handleEscrowAction}
                      loading={escrowOps.loading}
                    />
                  ) : (
                    <EscrowDetailsSkeleton />
                  )}
                </Suspense>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={handleModalClose}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
          )}
          
          {/* Footer */}
          <div className="footer">
            <p>
              Created by{" "}
              <a href={`https://twitter.com/${CREATOR_TWITTER.substring(1)}`} target="_blank" rel="noopener noreferrer">
                {CREATOR_TWITTER}
              </a>
            </p>
            <p>
              Creator wallet:{" "}
              <a
                href={`https://testnet.monadexplorer.com/address/${CREATOR_WALLET}`}
                onClick={(e) => {
                  e.preventDefault();
                  navigator.clipboard.writeText(CREATOR_WALLET);
                  window.open(e.currentTarget.href, "_blank");
                }}
                style={{ cursor: "pointer", textDecoration: "underline" }}
                title="Click to open and copy"
              >
                {CREATOR_WALLET}
              </a>
            </p>
            <p>
              <a href="https://github.com/BluOwn/monadescrow" target="_blank" rel="noopener noreferrer">
                View on GitHub
              </a>
            </p>
          </div>
        </Container>
      </div>
    </DarkModeWrapper>
  );
};

export default App;
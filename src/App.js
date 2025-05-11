// src/App.js - Complete fixed version
import React, { useState, useEffect, Suspense, lazy } from 'react';
import { Container, Alert, Nav, Modal, Button, Spinner, Badge } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Custom hooks
import useWallet from './hooks/useWallet';
import useEscrowContract from './hooks/useEscrowContract';
import useEscrowData from './hooks/useEscrowData';

// Components
import ThemeToggle from './components/ThemeToggle';
import LoadingIndicator from './components/LoadingIndicator';
import { SecurityWarningModal, SecurityBanner, NetworkWarning } from './components/SecurityComponents';
import RateLimitAlert from './components/RateLimitAlert';

// Lazy-loaded components - using correct paths for your project structure
const CreateEscrowTab = lazy(() => import('./components/CreateEscrowTab'));
const MyEscrowsTab = lazy(() => import('./components/MyEscrowsTab'));
const ArbitratedEscrowsTab = lazy(() => import('./components/ArbitratedEscrowsTab'));
const FindEscrowTab = lazy(() => import('./components/FindEscrowTab'));
const ContactForm = lazy(() => import('./components/ContactForm'));
const EscrowDetails = lazy(() => import('./components/EscrowDetails'));

// Constants
const CREATOR_WALLET = "0x0b977acab5d9b8f654f48090955f5e00973be0fe";
const CREATOR_TWITTER = "@Oprimedev";

// App footer component
const AppFooter = () => (
  <div className="footer">
    <p>
      Created by{" "}
      <a
        href={`https://twitter.com/${CREATOR_TWITTER.substring(1)}`}
        target="_blank"
        rel="noopener noreferrer"
      >
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
      <a
        href="https://github.com/BluOwn/monadescrow"
        target="_blank"
        rel="noopener noreferrer"
      >
        View on GitHub
      </a>
    </p>
  </div>
);

function App() {
  // State from custom hooks
  const { 
    account, 
    networkName, 
    connected, 
    loading: walletLoading, 
    error: walletError,
    connectWallet, 
    disconnectWallet 
  } = useWallet();
  
  const { 
    contract, 
    loading: contractLoading, 
    error: contractError,
    initializeContract,
    createEscrow,
    executeContractAction
  } = useEscrowContract();
  
  const {
    escrows,
    arbitratedEscrows,
    selectedEscrow,
    loadingEscrows,
    loadingArbitratedEscrows,
    error: escrowError,
    rateLimited,
    setSelectedEscrow,
    loadUserEscrows,
    loadArbitratedEscrows,
    getEscrowDetails,
    invalidateEscrowCache
  } = useEscrowData(contract, account);
  
  // Local state
  const [activeTab, setActiveTab] = useState('create');
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [hasAcceptedSecurity, setHasAcceptedSecurity] = useState(false);
  const [firstTimeUser, setFirstTimeUser] = useState(true);
  const [autoRetry, setAutoRetry] = useState({
    active: false,
    countdown: 0,
    progress: 0
  });

  // Initialize security check
  useEffect(() => {
    const hasAccepted = localStorage.getItem('monad-escrow-security-accepted');
    if (hasAccepted === 'true') {
      setHasAcceptedSecurity(true);
      setFirstTimeUser(false);
    }
  }, []);

  // Initialize contract when wallet connected
  useEffect(() => {
    if (connected) {
      initializeContract();
    }
  }, [connected, initializeContract]);

  // Refresh escrows when contract changes
  useEffect(() => {
    if (contract && account) {
      loadUserEscrows();
      loadArbitratedEscrows();
    }
  }, [contract, account, loadUserEscrows, loadArbitratedEscrows]);

  // Handle security warning acceptance
  const handleSecurityAccept = () => {
    setHasAcceptedSecurity(true);
    setFirstTimeUser(false);
    setShowSecurityWarning(false);
    localStorage.setItem('monad-escrow-security-accepted', 'true');
    connectWallet();
  };

  const handleSecurityDecline = () => {
    setShowSecurityWarning(false);
  };

  // Handle wallet connection
  const handleConnectWallet = () => {
    if (firstTimeUser && !hasAcceptedSecurity) {
      setShowSecurityWarning(true);
      return;
    }
    connectWallet();
  };

  // View escrow details
  const viewEscrowDetails = async (escrowId) => {
    try {
      const escrow = await getEscrowDetails(escrowId);
      if (escrow) {
        setShowDetailsModal(true);
      }
    } catch (error) {
      console.error("Error viewing escrow", error);
    }
  };

  // Handle action on escrow
  const handleEscrowAction = async (action, escrowId, recipient = null) => {
    try {
      let receipt;
      
      if (action === 'create') {
        // Special case for create which uses different parameters
        receipt = await createEscrow(recipient.sellerAddress, recipient.arbiterAddress, recipient.amount);
      } else {
        receipt = await executeContractAction(action, escrowId, recipient);
      }
      
      if (receipt) {
        setSuccessMessage(`Action ${action} executed successfully! Transaction hash: ${receipt.hash}`);
        
        // Invalidate cache for modified escrow
        if (escrowId) {
          invalidateEscrowCache(escrowId);
        }
        
        // Refresh data
        await loadUserEscrows();
        await loadArbitratedEscrows();
        
        // Refresh details if showing
        if (selectedEscrow && selectedEscrow.id === escrowId) {
          await getEscrowDetails(escrowId);
        }
      }
    } catch (error) {
      console.error(`Error performing ${action}`, error);
    }
  };

  // Start auto retry countdown
  const startAutoRetryCountdown = () => {
    const countdownSeconds = 15;
    setAutoRetry({
      active: true,
      countdown: countdownSeconds,
      progress: 0
    });
    
    let secondsLeft = countdownSeconds;
    const intervalId = setInterval(() => {
      secondsLeft -= 1;
      const progress = ((countdownSeconds - secondsLeft) / countdownSeconds) * 100;
      
      if (secondsLeft <= 0) {
        clearInterval(intervalId);
        setAutoRetry({
          active: false,
          countdown: 0,
          progress: 100
        });
        retryLoadingEscrows();
      } else {
        setAutoRetry({
          active: true,
          countdown: secondsLeft,
          progress
        });
      }
    }, 1000);
  };

  // Retry loading escrows
  const retryLoadingEscrows = async () => {
    setRateLimited(false);
    await loadUserEscrows();
    await loadArbitratedEscrows();
  };

  // Combine all errors
  const error = walletError || contractError || escrowError;
  const loading = walletLoading || contractLoading;

  // Create a WalletInfo component inline since we don't have it as a separate component yet
  const WalletInfo = () => (
    <div className="wallet-info mb-4">
      <div>
        <small>Connected to: <span className="network-badge">{networkName}</span></small>
        <p className="mb-0"><strong>Account:</strong> {account && account.slice(0, 6) + '...' + account.slice(-4)}</p>
      </div>
      <div className="d-flex">
        <ThemeToggle />
        <Button 
          variant="outline-secondary" 
          size="sm" 
          className="ms-2" 
          onClick={disconnectWallet}
        >
          Disconnect
        </Button>
      </div>
    </div>
  );

  return (
    <div className="app-wrapper">
      <Container className="py-5">
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
        
        {!connected ? (
          <div className="connect-wallet-container">
            <SecurityBanner />
            <p>Connect your wallet to use the escrow service</p>
            <div className="d-flex flex-column align-items-center">
              <Button 
                className="wallet-button mb-3"
                onClick={handleConnectWallet} 
                disabled={loading}
              >
                {loading ? <Spinner animation="border" size="sm" /> : 'Connect Wallet'}
              </Button>
              <ThemeToggle />
            </div>
          </div>
        ) : (
          <>
            <WalletInfo />
            
            <SecurityBanner />
            
            <NetworkWarning currentNetwork={networkName} />
            
            {/* Error Alert */}
            {error && (
              <Alert variant="danger" onClose={() => setError ? setError('') : null} dismissible>
                {error}
                {error.includes('refresh') && (
                  <div className="mt-2">
                    <Button variant="danger" size="sm" onClick={retryLoadingEscrows}>
                      Retry Loading
                    </Button>
                  </div>
                )}
              </Alert>
            )}
            
            {/* Success Message */}
            {successMessage && (
              <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
                {successMessage}
              </Alert>
            )}
            
            {/* Rate Limit Alert */}
            {rateLimited && (
              <RateLimitAlert 
                isVisible={rateLimited}
                onDismiss={() => setRateLimited(false)}
                onRetry={retryLoadingEscrows}
                progress={autoRetry.progress}
                autoRetryIn={autoRetry.countdown}
              />
            )}
            
            <Nav variant="tabs" className="mb-4" activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
              <Nav.Item>
                <Nav.Link eventKey="create">Create Escrow</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="my">
                  My Escrows
                  {loadingEscrows && <Spinner animation="border" size="sm" className="ms-2" />}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="arbitrated">
                  Arbitrated Escrows
                  {arbitratedEscrows.length > 0 && (
                    <Badge bg="primary" className="ms-2">{arbitratedEscrows.length}</Badge>
                  )}
                  {loadingArbitratedEscrows && <Spinner animation="border" size="sm" className="ms-2" />}
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="find">Find Escrow</Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link eventKey="contact">Contact</Nav.Link>
              </Nav.Item>
            </Nav>
            
            <Suspense fallback={<LoadingIndicator message="Loading tab content..." />}>
              {activeTab === 'create' && (
                <CreateEscrowTab 
                  onCreateEscrow={(sellerAddress, arbiterAddress, amount) => 
                    handleEscrowAction('create', null, null, {
                      sellerAddress,
                      arbiterAddress,
                      amount
                    })
                  }
                  loading={loading}
                />
              )}
              
              {activeTab === 'my' && (
                <MyEscrowsTab 
                  escrows={escrows}
                  account={account}
                  loading={loadingEscrows}
                  onViewDetails={viewEscrowDetails}
                  onAction={handleEscrowAction}
                  retryLoading={retryLoadingEscrows}
                />
              )}

              {activeTab === 'arbitrated' && (
                <ArbitratedEscrowsTab 
                  arbitratedEscrows={arbitratedEscrows}
                  account={account}
                  loading={loadingArbitratedEscrows}
                  onViewDetails={viewEscrowDetails}
                  onAction={handleEscrowAction}
                  retryLoading={retryLoadingEscrows}
                />
              )}
              
              {activeTab === 'find' && (
                <FindEscrowTab 
                  onViewDetails={viewEscrowDetails}
                  loading={loading}
                />
              )}
              
              {activeTab === 'contact' && <ContactForm />}
            </Suspense>
            
            {/* Escrow Details Modal */}
            <Modal 
              show={showDetailsModal} 
              onHide={() => setShowDetailsModal(false)}
            >
              <Modal.Header closeButton>
                <Modal.Title>Escrow Details</Modal.Title>
              </Modal.Header>
              <Modal.Body>
                <Suspense fallback={<LoadingIndicator message="Loading escrow details..." />}>
                  {selectedEscrow && (
                    <EscrowDetails
                      escrow={selectedEscrow}
                      account={account}
                      onAction={handleEscrowAction}
                      loading={loading}
                    />
                  )}
                </Suspense>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
                  Close
                </Button>
              </Modal.Footer>
            </Modal>
            
            <AppFooter />
          </>
        )}
      </Container>
    </div>
  );
}

export default App;
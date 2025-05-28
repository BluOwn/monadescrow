// src/App.tsx - Optimized version with better modal handling
import React, { Suspense, useState, useEffect, useContext, useCallback } from 'react';
import { Button, Container, Nav, Alert, Modal, Badge, Spinner } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import contexts
import { ThemeContext } from './contexts/ThemeContext';

// Import hooks
import useWallet from './hooks/useWallet';
import useEscrowLists from './hooks/useEscrowLists';
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

// Lazy load tab components
const CreateEscrowTab = React.lazy(() => import('./components/CreateEscrowTab'));
const MyEscrowsTab = React.lazy(() => import('./components/MyEscrowsTab'));
const ArbitratedEscrowsTab = React.lazy(() => import('./components/ArbitratedEscrowsTab'));
const FindEscrowTab = React.lazy(() => import('./components/FindEscrowTab'));
const ContactForm = React.lazy(() => import('./components/ContactForm'));
const EscrowDetails = React.lazy(() => import('./components/EscrowDetails'));

// Main App component
const App: React.FC = () => {
  // Access theme context
  const { darkMode } = useContext(ThemeContext);
  
  // Use custom hooks
  const wallet = useWallet();
  const escrowLists = useEscrowLists();
  const escrowOps = useEscrowOperations();
  
  // Local state
  const [activeTab, setActiveTab] = useState<string>('create');
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState<boolean>(false);
  const [hasAcceptedSecurity, setHasAcceptedSecurity] = useState<boolean>(false);
  const [firstTimeUser, setFirstTimeUser] = useState<boolean>(true);

  // Form states
  const [sellerAddress, setSellerAddress] = useState<string>('');
  const [arbiterAddress, setArbiterAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [escrowIdToView, setEscrowIdToView] = useState<string>('');

  // Initialize security settings on component mount
  useEffect(() => {
    // Check if user has previously accepted security warning
    const hasAccepted = localStorage.getItem('monad-escrow-security-accepted');
    if (hasAccepted === 'true') {
      setHasAcceptedSecurity(true);
      setFirstTimeUser(false);
    }
  }, []);
  
  // Effect for setting up wallet listeners
  useEffect(() => {
    const cleanup = wallet.setupWalletListeners();
    return cleanup;
  }, [wallet]);

  // Enhanced effect for loading escrows with better debugging
  useEffect(() => {
    const loadEscrowData = async () => {
      if (wallet.connected && wallet.contract && wallet.account) {
        try {
          console.log('Loading escrow data for account:', wallet.account);
          
          // Load user escrows
          await escrowLists.loadUserEscrows(wallet.contract, wallet.account);
          console.log('User escrows loaded:', escrowLists.escrows.length);
          
          // Load arbitrated escrows with explicit logging
          console.log('Starting to load arbitrated escrows for:', wallet.account);
          await escrowLists.loadArbitratedEscrows(wallet.contract, wallet.account);
          console.log('Arbitrated escrows loaded:', escrowLists.arbitratedEscrows.length);
        } catch (error) {
          console.error('Error loading escrow data:', error);
        }
      }
    };

    // Only load if we're connected and don't have data yet
    if (wallet.connected && wallet.contract && wallet.account && 
        (escrowLists.escrows.length === 0 || escrowLists.arbitratedEscrows.length === 0)) {
      loadEscrowData();
    }
  }, [
    wallet.connected, 
    wallet.contract, 
    wallet.account,
    escrowLists.loadUserEscrows,
    escrowLists.loadArbitratedEscrows
  ]);

  // Connect to MetaMask
  const connectWallet = async (): Promise<void> => {
    // Show security warning for first-time users
    if (firstTimeUser && !hasAcceptedSecurity) {
      setShowSecurityWarning(true);
      return;
    }

    try {
      const success = await wallet.connectWallet();
      
      if (success && wallet.contract) {
        console.log('Wallet connected successfully, loading escrows...');
        // The useEffect above will handle loading the escrows
      }
    } catch (error) {
      console.error("Error in connect flow:", error);
    }
  };

  // Handle security warning acceptance
  const handleSecurityAccept = (): void => {
    setHasAcceptedSecurity(true);
    setFirstTimeUser(false);
    setShowSecurityWarning(false);
    localStorage.setItem('monad-escrow-security-accepted', 'true');
    
    // Continue with wallet connection
    connectWallet();
  };

  const handleSecurityDecline = (): void => {
    setShowSecurityWarning(false);
    // Don't connect wallet if user declines
  };

  // Create new escrow
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
      
      // Reload escrows
      await escrowLists.loadUserEscrows(wallet.contract, wallet.account);
      await escrowLists.loadArbitratedEscrows(wallet.contract, wallet.account);
    }
  };

  // OPTIMIZED: View escrow details with better error handling
  const viewEscrowDetails = useCallback(async (escrowId: string): Promise<void> => {
    if (!wallet.contract) {
      escrowOps.setError('Wallet not connected');
      return;
    }
    
    try {
      // Clear any previous state before loading new escrow
      escrowOps.clearMessages();
      
      const escrow = await escrowOps.viewEscrowDetails(wallet.contract, escrowId);
      
      if (escrow) {
        setShowDetailsModal(true);
      } else {
        escrowOps.setError('Escrow not found or failed to load');
      }
    } catch (error) {
      console.error("Error in viewEscrowDetails:", error);
      escrowOps.setError('Failed to load escrow details');
    }
  }, [wallet.contract, escrowOps]);

  // OPTIMIZED: Handle escrow action with better state management
  const handleEscrowAction = useCallback(async (
    action: string, 
    escrowId: string, 
    recipient: string | null = null
  ): Promise<void> => {
    if (!wallet.contract) return;
    
    const success = await escrowOps.handleEscrowAction(wallet.contract, action, escrowId, recipient);
    
    if (success) {
      // Reload escrows in background
      Promise.all([
        escrowLists.loadUserEscrows(wallet.contract, wallet.account),
        escrowLists.loadArbitratedEscrows(wallet.contract, wallet.account)
      ]).catch(error => {
        console.warn('Failed to reload escrows after action:', error);
      });
      
      // Refresh the modal data if it's still open
      if (showDetailsModal && escrowOps.selectedEscrow?.id === escrowId) {
        // Small delay then refresh the modal data
        setTimeout(() => {
          viewEscrowDetails(escrowId);
        }, 1000);
      }
    }
  }, [wallet.contract, escrowOps, escrowLists, wallet.account, showDetailsModal, viewEscrowDetails]);

  // OPTIMIZED: Handle find escrow with better state management
  const handleFindEscrow = useCallback(async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!escrowIdToView || !wallet.contract) {
      escrowOps.setError('Please enter an escrow ID');
      return;
    }
    
    try {
      // Clear previous errors and state
      escrowOps.clearMessages();
      
      // Use the optimized viewEscrowDetails function
      await viewEscrowDetails(escrowIdToView);
      setEscrowIdToView(''); // Clear input only on success
    } catch (error) {
      console.error("Error finding escrow", error);
      escrowOps.setError('Failed to find escrow. Please check the ID and try again.');
    }
  }, [escrowIdToView, wallet.contract, escrowOps, viewEscrowDetails]);

  // OPTIMIZED: Modal close handler with state cleanup
  const handleModalClose = useCallback(() => {
    setShowDetailsModal(false);
    
    // Small delay to ensure modal is closed before clearing state
    setTimeout(() => {
      escrowOps.setSelectedEscrow(null);
      escrowOps.clearMessages();
    }, 150); // 150ms delay
  }, [escrowOps]);

  // Retry loading escrows button
  const retryLoadingEscrows = async (): Promise<void> => {
    if (wallet.contract && wallet.account) {
      // Clear rate limited state
      escrowOps.setRateLimited(false);
      
      console.log('Retrying to load escrows...');
      // Reload escrows
      await escrowLists.loadUserEscrows(wallet.contract, wallet.account);
      await escrowLists.loadArbitratedEscrows(wallet.contract, wallet.account);
    }
  };

  // Debug function to manually refresh arbitrated escrows
  const debugRefreshArbitratedEscrows = async (): Promise<void> => {
    if (wallet.contract && wallet.account) {
      console.log('=== DEBUG: Manually refreshing arbitrated escrows ===');
      console.log('Account:', wallet.account);
      console.log('Contract:', wallet.contract);
      
      try {
        await escrowLists.loadArbitratedEscrows(wallet.contract, wallet.account);
        console.log('=== DEBUG: Refresh complete ===');
        console.log('Arbitrated escrows found:', escrowLists.arbitratedEscrows.length);
      } catch (error) {
        console.error('=== DEBUG: Error during refresh ===', error);
      }
    }
  };

  // Render the component
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
              
              {/* Network Warning */}
              <NetworkWarning currentNetwork={wallet.networkName} />
              
              {/* Debug Controls - Only show in development */}
              {process.env.NODE_ENV === 'development' && (
                <Alert variant="warning" className="mb-3">
                  <strong>Debug Controls:</strong>
                  <div className="mt-2">
                    <Button variant="outline-warning" size="sm" className="me-2" onClick={debugRefreshArbitratedEscrows}>
                      🔍 Debug Refresh Arbitrated
                    </Button>
                    <small className="text-muted">
                      Arbitrated: {escrowLists.arbitratedEscrows.length} | 
                      My Escrows: {escrowLists.escrows.length} | 
                      Account: {wallet.account?.slice(0, 8)}...
                    </small>
                  </div>
                </Alert>
              )}
              
              {/* Error Alert */}
              {wallet.error && (
                <Alert variant="danger" onClose={() => { /* Can't directly modify the state */ }} dismissible>
                  {wallet.error}
                  {wallet.error.includes('refresh') && (
                    <div className="mt-2">
                      <Button variant="danger" size="sm" onClick={retryLoadingEscrows}>
                        Retry Loading
                      </Button>
                    </div>
                  )}
                </Alert>
              )}
              
              {/* Escrow Operations Error */}
              {escrowOps.error && (
                <Alert variant="danger" onClose={() => escrowOps.setError('')} dismissible>
                  {escrowOps.error}
                </Alert>
              )}
              
              {/* Success Message */}
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
              
              <Nav variant="tabs" className="mb-4" activeKey={activeTab} onSelect={(k) => k && setActiveTab(k)}>
                <Nav.Item>
                  <Nav.Link eventKey="create">Create Escrow</Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="my">
                    My Escrows
                    {escrowLists.loadingEscrows && <Spinner animation="border" size="sm" className="ms-2" />}
                    {escrowLists.escrows.length > 0 && (
                      <Badge bg="primary" className="ms-2">{escrowLists.escrows.length}</Badge>
                    )}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="arbitrated">
                    Arbitrated Escrows
                    {escrowLists.loadingArbitratedEscrows && <Spinner animation="border" size="sm" className="ms-2" />}
                    {escrowLists.arbitratedEscrows.length > 0 && (
                      <Badge bg="warning" className="ms-2">{escrowLists.arbitratedEscrows.length}</Badge>
                    )}
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
                
                {activeTab === 'my' && (
                  <MyEscrowsTab 
                    escrows={escrowLists.escrows} 
                    onViewDetails={viewEscrowDetails} 
                    loadingEscrows={escrowLists.loadingEscrows}
                    retryLoadingEscrows={retryLoadingEscrows}
                    account={wallet.account}
                    onAction={handleEscrowAction}
                  />
                )}

                {activeTab === 'arbitrated' && (
                  <ArbitratedEscrowsTab 
                    arbitratedEscrows={escrowLists.arbitratedEscrows} 
                    onViewDetails={viewEscrowDetails} 
                    loadingArbitratedEscrows={escrowLists.loadingArbitratedEscrows}
                    retryLoadingEscrows={retryLoadingEscrows}
                    account={wallet.account}
                    onAction={handleEscrowAction}
                  />
                )}
                
                {activeTab === 'find' && (
                  <FindEscrowTab 
                    escrowIdToView={escrowIdToView}
                    setEscrowIdToView={setEscrowIdToView}
                    handleFindEscrow={handleFindEscrow}
                    loading={escrowOps.loading}
                  />
                )}
                
                {activeTab === 'contact' && (
                  <ContactForm />
                )}
              </Suspense>
              
              {/* OPTIMIZED: Escrow Details Modal with better handling */}
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
              
              {/* Footer with creator info */}
              <div className="footer">
                <p>
                  Created by{" "}
                  
                    href={`https://twitter.com/${CREATOR_TWITTER.substring(1)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {CREATOR_TWITTER}
                  </a>
                </p>
                <p>
                  Creator wallet:{" "}
                  
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
                  
                    href="https://github.com/BluOwn/monadescrow"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View on GitHub
                  </a>
                </p>
              </div>
            </>
          )}
        </Container>
      </div>
    </DarkModeWrapper>
  );
};

export default App;
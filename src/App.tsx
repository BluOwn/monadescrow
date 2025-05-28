// src/App.tsx - Optimized version to prevent lagging and excessive resource usage
import React, { Suspense, useState, useEffect, useContext, useCallback, useMemo } from 'react';
import { Button, Container, Nav, Alert, Modal, Badge, Spinner, ProgressBar } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import contexts
import { ThemeContext } from './contexts/ThemeContext';

// Import hooks
import useWallet from './hooks/useWallet';
import { useOptimizedEscrowLoader } from './hooks/useOptimizedEscrowLoader';
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
  const escrowLoader = useOptimizedEscrowLoader();
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

  // OPTIMIZED: Single effect for loading escrows with better control
  useEffect(() => {
    let isEffectActive = true;
    
    const loadData = async () => {
      if (wallet.connected && wallet.contract && wallet.account && isEffectActive) {
        console.log('👤 Wallet connected, checking if refresh needed...');
        
        try {
          // Use refreshIfStale to avoid unnecessary reloads
          await escrowLoader.refreshIfStale(wallet.contract, wallet.account);
        } catch (error) {
          console.error('Error refreshing escrows:', error);
        }
      }
    };

    // Add a small delay to prevent rapid consecutive calls
    const timeoutId = setTimeout(loadData, 500);
    
    return () => {
      isEffectActive = false;
      clearTimeout(timeoutId);
    };
  }, [wallet.connected, wallet.contract, wallet.account]);

  // OPTIMIZED: Tab change effect with debouncing
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const handleTabChange = async () => {
      if (!wallet.connected || !wallet.contract || !wallet.account) return;
      
      // Only refresh if switching to tabs that need data and data is very stale
      if ((activeTab === 'my' || activeTab === 'arbitrated') && escrowLoader.isStale) {
        console.log(`🔄 Tab switched to ${activeTab}, data is stale, refreshing...`);
        
        try {
          await escrowLoader.refreshIfStale(wallet.contract, wallet.account, 120000); // 2 minutes
        } catch (error) {
          console.error('Error refreshing on tab change:', error);
        }
      }
    };

    // Debounce tab changes to prevent rapid API calls
    timeoutId = setTimeout(handleTabChange, 1000);
    
    return () => clearTimeout(timeoutId);
  }, [activeTab, wallet.connected, wallet.contract, wallet.account, escrowLoader.isStale]);

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

  // OPTIMIZED: Create escrow handler with better state management
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
      
      // Force refresh after creating escrow with delay
      setTimeout(() => {
        escrowLoader.forceRefresh(wallet.contract!, wallet.account);
      }, 2000); // 2 second delay to allow blockchain to update
    }
  };

  // OPTIMIZED: View escrow details with memoization
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
        escrowOps.setError('Escrow not found or failed to load');
      }
    } catch (error) {
      console.error("Error in viewEscrowDetails:", error);
      escrowOps.setError('Failed to load escrow details');
    }
  }, [wallet.contract, escrowOps]);

  // OPTIMIZED: Escrow action handler with better timing
  const handleEscrowAction = useCallback(async (
    action: string, 
    escrowId: string, 
    recipient: string | null = null
  ): Promise<void> => {
    if (!wallet.contract) return;
    
    const success = await escrowOps.handleEscrowAction(wallet.contract, action, escrowId, recipient);
    
    if (success) {
      // Force refresh after action with appropriate delay
      setTimeout(() => {
        if (wallet.contract && wallet.account) {
          escrowLoader.forceRefresh(wallet.contract, wallet.account);
        }
      }, 3000); // 3 second delay for blockchain confirmation
      
      // Refresh modal if open
      if (showDetailsModal && escrowOps.selectedEscrow?.id === escrowId) {
        setTimeout(() => {
          viewEscrowDetails(escrowId);
        }, 4000); // 4 second delay for modal refresh
      }
    }
  }, [wallet.contract, wallet.account, showDetailsModal, escrowOps.selectedEscrow?.id, escrowLoader, viewEscrowDetails]);

  // OPTIMIZED: Handle find escrow with debouncing
  const handleFindEscrow = useCallback(async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!escrowIdToView || !wallet.contract) {
      escrowOps.setError('Please enter an escrow ID');
      return;
    }
    
    try {
      escrowOps.clearMessages();
      await viewEscrowDetails(escrowIdToView);
      setEscrowIdToView(''); // Clear input only on success
    } catch (error) {
      console.error("Error finding escrow", error);
      escrowOps.setError('Failed to find escrow. Please check the ID and try again.');
    }
  }, [escrowIdToView, wallet.contract, escrowOps, viewEscrowDetails]);

  // Modal close handler with cleanup
  const handleModalClose = useCallback(() => {
    setShowDetailsModal(false);
    
    setTimeout(() => {
      escrowOps.setSelectedEscrow(null);
      escrowOps.clearMessages();
    }, 150);
  }, [escrowOps]);

  // Retry loading escrows button
  const retryLoadingEscrows = async (): Promise<void> => {
    if (wallet.contract && wallet.account) {
      escrowOps.setRateLimited(false);
      console.log('Retrying to load escrows...');
      await escrowLoader.forceRefresh(wallet.contract, wallet.account);
    }
  };

  // Cancel loading operation
  const cancelLoading = useCallback(() => {
    escrowLoader.cancelLoading();
  }, [escrowLoader]);

  // Memoize computed values to prevent unnecessary re-renders
  const tabCounts = useMemo(() => ({
    userEscrows: escrowLoader.userEscrows.length,
    arbitratedEscrows: escrowLoader.arbitratedEscrows.length
  }), [escrowLoader.userEscrows.length, escrowLoader.arbitratedEscrows.length]);

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
              
              {/* Enhanced Loading State with Progress */}
              {escrowLoader.loading && (
                <Alert variant="info" className="mb-3">
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <span>
                      <Spinner animation="border" size="sm" className="me-2" />
                      Loading escrows... ({escrowLoader.totalChecked} checked)
                    </span>
                    <Button 
                      variant="outline-danger" 
                      size="sm"
                      onClick={cancelLoading}
                    >
                      Cancel
                    </Button>
                  </div>
                  
                  {escrowLoader.progress > 0 && (
                    <ProgressBar 
                      now={escrowLoader.progress} 
                      variant="info"
                      style={{ height: '8px' }}
                    />
                  )}
                </Alert>
              )}
              
              {/* Show error state */}
              {escrowLoader.error && (
                <Alert variant="danger" className="mb-3">
                  <strong>Loading Error:</strong> {escrowLoader.error}
                  <div className="mt-2">
                    <Button 
                      variant="outline-danger" 
                      size="sm" 
                      onClick={() => escrowLoader.forceRefresh(wallet.contract!, wallet.account)}
                      disabled={escrowLoader.loading}
                    >
                      Retry
                    </Button>
                  </div>
                </Alert>
              )}
              
              {/* Debug Controls - Only show in development */}
              {process.env.NODE_ENV === 'development' && (
                <Alert variant="info" className="mb-3">
                  <strong>Debug Info:</strong>
                  <div>
                    User Escrows: {tabCounts.userEscrows} | 
                    Arbitrated: {tabCounts.arbitratedEscrows} | 
                    Loading: {escrowLoader.loading ? 'Yes' : 'No'} | 
                    Progress: {escrowLoader.progress.toFixed(1)}% |
                    Last Updated: {escrowLoader.lastUpdated ? new Date(escrowLoader.lastUpdated).toLocaleTimeString() : 'Never'}
                  </div>
                  <div className="mt-2">
                    <Button 
                      variant="outline-info" 
                      size="sm" 
                      className="me-2"
                      onClick={() => escrowLoader.forceRefresh(wallet.contract!, wallet.account)}
                      disabled={escrowLoader.loading}
                    >
                      🔄 Force Refresh
                    </Button>
                    <Button 
                      variant="outline-warning" 
                      size="sm"
                      onClick={escrowLoader.clearData}
                    >
                      🗑️ Clear Data
                    </Button>
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
                    {escrowLoader.loading && activeTab === 'my' && <Spinner animation="border" size="sm" className="ms-2" />}
                    {tabCounts.userEscrows > 0 && (
                      <Badge bg="primary" className="ms-2">{tabCounts.userEscrows}</Badge>
                    )}
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="arbitrated">
                    Arbitrated Escrows
                    {escrowLoader.loading && activeTab === 'arbitrated' && <Spinner animation="border" size="sm" className="ms-2" />}
                    {tabCounts.arbitratedEscrows > 0 && (
                      <Badge bg="warning" className="ms-2">{tabCounts.arbitratedEscrows}</Badge>
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
                    escrows={escrowLoader.userEscrows} 
                    onViewDetails={viewEscrowDetails} 
                    loadingEscrows={escrowLoader.loading}
                    retryLoadingEscrows={() => escrowLoader.forceRefresh(wallet.contract!, wallet.account)}
                    account={wallet.account}
                    onAction={handleEscrowAction}
                  />
                )}

                {activeTab === 'arbitrated' && (
                  <ArbitratedEscrowsTab 
                    arbitratedEscrows={escrowLoader.arbitratedEscrows} 
                    onViewDetails={viewEscrowDetails} 
                    loadingArbitratedEscrows={escrowLoader.loading}
                    retryLoadingEscrows={() => escrowLoader.forceRefresh(wallet.contract!, wallet.account)}
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
              
              {/* Escrow Details Modal with better handling */}
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
            </>
          )}
        </Container>
      </div>
    </DarkModeWrapper>
  );
};

export default App;
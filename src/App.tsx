// src/App.tsx
import React, { Suspense, useState, useEffect, useContext } from 'react';
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
  }, [wallet]); // Added wallet as a dependency

  // Prefetch data for tabs
  useEffect(() => {
    // Prefetch data for tabs that aren't active yet
    const prefetchData = async () => {
      if (wallet.connected && wallet.contract) {
        if (activeTab !== 'my' && escrowLists.escrows.length === 0) {
          // Prefetch my escrows in the background
          try {
            await escrowLists.loadUserEscrows(wallet.contract, wallet.account);
          } catch (e) {
            // Silently handle errors
            console.warn('Prefetch failed:', e);
          }
        }
        
        if (activeTab !== 'arbitrated' && escrowLists.arbitratedEscrows.length === 0) {
          // Wait a bit before prefetching arbitrated escrows
          setTimeout(() => {
            if (wallet.contract) {
              escrowLists.loadArbitratedEscrows(wallet.contract, wallet.account).catch(e => {
                // Silently handle errors
                console.warn('Prefetch failed:', e);
              });
            }
          }, 2000);
        }
      }
    };
    
    // Start prefetching after a short delay
    const timerId = setTimeout(prefetchData, 3000);
    
    return () => clearTimeout(timerId);
  }, [
    wallet.connected, 
    wallet.contract, 
    wallet.account, 
    activeTab, 
    escrowLists.escrows.length, 
    escrowLists.arbitratedEscrows.length, 
    escrowLists.loadUserEscrows, 
    escrowLists.loadArbitratedEscrows,
    escrowLists // Added escrowLists as a dependency
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
        // Load user's escrows with retry logic
        await escrowLists.loadUserEscrows(wallet.contract, wallet.account);
        
        // Load escrows where user is arbiter with retry logic
        await escrowLists.loadArbitratedEscrows(wallet.contract, wallet.account);
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
      wallet.account // Pass the buyer's address (current connected wallet)
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

  // View escrow details
  const viewEscrowDetails = async (escrowId: string): Promise<void> => {
    if (!wallet.contract) return;
    
    const escrow = await escrowOps.viewEscrowDetails(wallet.contract, escrowId);
    
    if (escrow) {
      setShowDetailsModal(true);
    }
  };

  // Handle action on escrow
  const handleEscrowAction = async (action: string, escrowId: string, recipient: string | null = null): Promise<void> => {
    if (!wallet.contract) return;
    
    const success = await escrowOps.handleEscrowAction(wallet.contract, action, escrowId, recipient);
    
    if (success) {
      // Reload escrows
      await escrowLists.loadUserEscrows(wallet.contract, wallet.account);
      await escrowLists.loadArbitratedEscrows(wallet.contract, wallet.account);
      
      // If we were showing a modal for this escrow, refresh its details
      if (escrowOps.selectedEscrow && escrowOps.selectedEscrow.id === escrowId) {
        viewEscrowDetails(escrowId);
      }
    }
  };

  // Find escrow by ID
  const handleFindEscrow = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!escrowIdToView || !wallet.contract) {
      escrowOps.setError('Please enter an escrow ID');
      return;
    }
    
    try {
      await viewEscrowDetails(escrowIdToView);
      setEscrowIdToView('');
    } catch (error) {
      console.error("Error finding escrow", error);
    }
  };

  // Retry loading escrows button
  const retryLoadingEscrows = async (): Promise<void> => {
    if (wallet.contract && wallet.account) {
      // Clear rate limited state
      escrowOps.setRateLimited(false);
      
      // Reload escrows
      await escrowLists.loadUserEscrows(wallet.contract, wallet.account);
      await escrowLists.loadArbitratedEscrows(wallet.contract, wallet.account);
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
                  </Nav.Link>
                </Nav.Item>
                <Nav.Item>
                  <Nav.Link eventKey="arbitrated">
                    Arbitrated Escrows
                    {escrowLists.arbitratedEscrows.length > 0 && (
                      <Badge bg="primary" className="ms-2">{escrowLists.arbitratedEscrows.length}</Badge>
                    )}
                    {escrowLists.loadingArbitratedEscrows && <Spinner animation="border" size="sm" className="ms-2" />}
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
                    currentAccount={wallet.account} // Add this prop
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
              
              {/* Escrow Details Modal */}
              <Modal 
                show={showDetailsModal} 
                onHide={() => setShowDetailsModal(false)}
                contentClassName={darkMode ? "bg-dark text-light" : ""}
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
                  <Button variant="secondary" onClick={() => setShowDetailsModal(false)}>
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
                      e.preventDefault(); // prevent default to control the behavior
                      navigator.clipboard.writeText(CREATOR_WALLET); // copy to clipboard
                      window.open(e.currentTarget.href, "_blank"); // open in new tab
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
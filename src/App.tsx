// src/App.tsx - Redesigned with Minimalist UI/UX
import React, { Suspense, useState, useEffect, useContext, useCallback } from 'react';
import { Button, Container, Alert, Modal, Badge, Card, Row, Col, ProgressBar, Nav, Navbar } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import contexts
import { ThemeContext } from './contexts/ThemeContext';

// Import hooks
import useWallet from './hooks/useWallet';
import useOptimizedEscrowLoader from './hooks/useOptimizedEscrowLoader';
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
const HowToUseTab = React.lazy(() => import('./components/HowToUseTab'));

// Navigation configuration
const navigationTabs = [
  { id: 'guide', label: 'Guide', icon: '📚' },
  { id: 'create', label: 'Create', icon: '✨' },
  { id: 'my-escrows', label: 'My Escrows', icon: '📋' },
  { id: 'find', label: 'Find', icon: '🔍' },
  { id: 'contact', label: 'Contact', icon: '💬' }
];

// Main App component
const App: React.FC = () => {
  // Access theme context
  const { darkMode } = useContext(ThemeContext);
  
  // Use custom hooks
  const wallet = useWallet();
  const escrowLoader = useOptimizedEscrowLoader();
  const escrowOps = useEscrowOperations();
  
  // Local state
  const [activeTab, setActiveTab] = useState<string>('guide');
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState<boolean>(false);
  const [hasAcceptedSecurity, setHasAcceptedSecurity] = useState<boolean>(false);
  const [firstTimeUser, setFirstTimeUser] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string>('');
  const [toastVariant, setToastVariant] = useState<'success' | 'danger' | 'warning' | 'info'>('info');
  const [showToast, setShowToast] = useState<boolean>(false);
  const [chainId, setChainId] = useState<number | null>(null);

  // Form states
  const [sellerAddress, setSellerAddress] = useState<string>('');
  const [arbiterAddress, setArbiterAddress] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [escrowIdToView, setEscrowIdToView] = useState<string>('');

  // Suppress unused variable warning for darkMode (used in className)
  console.log('Theme:', darkMode ? 'dark' : 'light');

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

  // Initialize security settings
  useEffect(() => {
    const hasAccepted = localStorage.getItem('monad-escrow-security-accepted');
    const hasVisited = localStorage.getItem('monad-escrow-visited');
    
    if (hasAccepted === 'true') {
      setHasAcceptedSecurity(true);
      setFirstTimeUser(false);
    }
    
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
  }, [wallet.connected, wallet.contract, wallet.account, escrowLoader.refreshIfStale]);

  // Toast notification helpers
  const showToastNotification = useCallback((message: string, variant: 'success' | 'danger' | 'warning' | 'info') => {
    setToastMessage(message);
    setToastVariant(variant);
    setShowToast(true);
  }, []);

  const handleToastClose = useCallback(() => {
    setShowToast(false);
  }, []);

  // Connect wallet function
  const connectWallet = async (): Promise<void> => {
    if (firstTimeUser && !hasAcceptedSecurity) {
      setShowSecurityWarning(true);
      return;
    }

    try {
      const success = await wallet.connectWallet();
      if (success && wallet.contract) {
        showToastNotification('Wallet connected successfully!', 'success');
        localStorage.setItem('monad-escrow-visited', 'true');
        if (activeTab === 'guide') {
          setActiveTab('create');
        }
      }
    } catch (error) {
      console.error("Error in connect flow:", error);
      showToastNotification('Failed to connect wallet', 'danger');
    }
  };

  // Security warning handlers
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
      showToastNotification('Escrow created successfully!', 'success');
      await escrowLoader.refreshIfStale(wallet.contract, wallet.account);
    }
  };

  // Find escrow handler - FIXED
  const handleFindEscrow = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!escrowIdToView || !wallet.contract) return;
    
    try {
      console.log(`🔍 Finding escrow ID: ${escrowIdToView}`);
      
      // Fetch escrow details directly from contract
      const escrowData = await wallet.contract.getEscrow(escrowIdToView);
      
      const foundEscrow: Escrow = {
        id: escrowIdToView,
        buyer: escrowData[0],
        seller: escrowData[1],
        arbiter: escrowData[2],
        amount: ethers.formatEther(escrowData[3]),
        fundsDisbursed: escrowData[4],
        disputeRaised: escrowData[5]
      };
      
      console.log('✅ Found escrow:', foundEscrow);
      
      // Set the found escrow in escrow operations
      escrowOps.setSelectedEscrow(foundEscrow);
      setShowDetailsModal(true);
      showToastNotification(`Found escrow #${escrowIdToView}!`, 'success');
      
    } catch (error) {
      console.error(`❌ Error finding escrow ${escrowIdToView}:`, error);
      showToastNotification(`Escrow #${escrowIdToView} not found or invalid`, 'warning');
    }
  };

  // Action handlers
  const handleEscrowAction = async (action: string, escrowId: string, recipient?: string): Promise<void> => {
    if (!wallet.contract) return;
    
    const success = await escrowOps.handleEscrowAction(wallet.contract, action, escrowId, recipient || null);
    if (success) {
      showToastNotification(`${action} completed successfully!`, 'success');
      await escrowLoader.refreshIfStale(wallet.contract, wallet.account);
    }
  };

  const handleViewDetails = (escrowId: string): void => {
    setEscrowIdToView(escrowId);
    setShowDetailsModal(true);
  };

  // Network warning check
  const showNetworkWarning = chainId !== null && chainId !== 10143;

  return (
    <DarkModeWrapper>
      <div className="app-container">
        {/* Toast Notification */}
        {showToast && (
          <div className="toast-notification">
            <Alert variant={toastVariant} onClose={handleToastClose} dismissible>
              {toastMessage}
            </Alert>
          </div>
        )}

        {/* Header */}
        <header className="app-header">
          <Container>
            <div className="header-content">
              <div className="brand-section">
                <h1 className="brand-title">Monad Escrow</h1>
                <p className="brand-subtitle">Secure decentralized transactions</p>
              </div>
              
              <div className="header-actions">
                <ThemeToggle />
                
                {wallet.connected ? (
                  <div className="wallet-info">
                    <AddressDisplay address={wallet.account} />
                    <Badge bg="success" className="network-badge">
                      {chainId === 10143 ? 'Monad Testnet' : `Chain ${chainId}`}
                    </Badge>
                  </div>
                ) : (
                  <Button 
                    variant="primary" 
                    onClick={connectWallet}
                    className="connect-wallet-btn"
                  >
                    Connect Wallet
                  </Button>
                )}
              </div>
            </div>
          </Container>
        </header>

        {/* Network Warning */}
        {showNetworkWarning && (
          <div className="network-warning">
            <Container>
              <Alert variant="warning" className="mb-0">
                ⚠️ Please switch to Monad Testnet (Chain ID: 10143) for proper functionality
              </Alert>
            </Container>
          </div>
        )}

        {/* Navigation */}
        <nav className="app-navigation">
          <Container>
            <Nav className="nav-pills" activeKey={activeTab}>
              {navigationTabs.map((tab) => (
                <Nav.Item key={tab.id}>
                  <Nav.Link 
                    eventKey={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="nav-pill"
                  >
                    <span className="nav-icon">{tab.icon}</span>
                    <span className="nav-label">{tab.label}</span>
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>
          </Container>
        </nav>

        {/* Main Content */}
        <main className="main-content">
          <Container>
            <Suspense fallback={<LoadingIndicator />}>
              {activeTab === 'guide' && <HowToUseTab />}
              
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
              
              {activeTab === 'my-escrows' && (
                <MyEscrowsTab
                  escrows={escrowLoader.activeEscrows}
                  onViewDetails={handleViewDetails}
                  loadingEscrows={escrowLoader.loading}
                  retryLoadingEscrows={() => {
                    if (wallet.contract && wallet.account) {
                      escrowLoader.refreshIfStale(wallet.contract, wallet.account);
                    }
                  }}
                  account={wallet.account}
                  onAction={handleEscrowAction}
                  progress={escrowLoader.progress}
                  rateLimitInfo={escrowLoader.rateLimitInfo}
                  error={escrowLoader.error}
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
              
              {activeTab === 'contact' && <ContactForm />}
            </Suspense>
          </Container>
        </main>

        {/* Footer */}
        <footer className="app-footer">
          <Container>
            <div className="footer-content">
              <div className="footer-links">
                <a href="https://github.com/BluOwn/monadescrow" target="_blank" rel="noopener noreferrer">
                  GitHub
                </a>
                <a href={`https://testnet.monadexplorer.com/address/${CREATOR_WALLET}`} target="_blank" rel="noopener noreferrer">
                  Contract
                </a>
                <a href={`https://twitter.com/${CREATOR_TWITTER}`} target="_blank" rel="noopener noreferrer">
                  Twitter
                </a>
              </div>
              <p className="footer-text">
                Built with ❤️ for Monad Testnet
              </p>
            </div>
          </Container>
        </footer>

        {/* Modals */}
        <SecurityWarningModal
          show={showSecurityWarning}
          onAccept={handleSecurityAccept}
          onDecline={handleSecurityDecline}
        />

        {showDetailsModal && (
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
              <Suspense fallback={<EscrowDetailsSkeleton />}>
                <EscrowDetails
                  escrow={escrowOps.selectedEscrow}
                  account={wallet.account}
                  onAction={handleEscrowAction}
                  loading={escrowOps.loading}
                />
              </Suspense>
            </Modal.Body>
          </Modal>
        )}

        <RateLimitAlert
          isVisible={escrowOps.rateLimited}
          onDismiss={() => {}}
          onRetry={() => {}}
        />
      </div>
    </DarkModeWrapper>
  );
};

export default App;
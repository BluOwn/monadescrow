// src/App.tsx - Complete Enhanced Version with Modern UI/UX
import React, { Suspense, useState, useEffect, useContext, useCallback } from 'react';
import { Button, Container, Alert, Modal, Badge, Card, Row, Col, ProgressBar, Navbar, Nav } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import contexts
import { ThemeContext } from './contexts/ThemeContext';

// Import hooks (keeping your existing hooks)
import useWallet from './hooks/useWallet';
import useRobustEscrowLoader from './hooks/useRobustEscrowLoader';
import useEscrowOperations from './hooks/useEscrowOperations';

// Enhanced Components
import EnhancedNavPills from './components/EnhancedNavPills';
import EscrowDashboard from './components/EscrowDashboard';
import EnhancedEscrowCard from './components/EnhancedEscrowCard';
import OnboardingTour from './components/OnboardingTour';
import FloatingActionButton from './components/FloatingActionButton';
import AnimatedLoader from './components/AnimatedLoader';
import EnhancedThemeToggle from './components/EnhancedThemeToggle';
import TrustIndicators from './components/TrustIndicators';
import ActivityFeed from './components/ActivityFeed';
import EscrowStats from './components/EscrowStats';
import SearchAndFilter from './components/SearchAndFilter';
import EmptyStateIllustration from './components/EmptyStateIllustration';

// Import existing components (enhanced versions)
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

// Types
interface EscrowData {
  id: string;
  buyer: string;
  seller: string;
  arbiter: string;
  amount: string;
  status: 'pending' | 'funded' | 'completed' | 'disputed' | 'resolved';
  createdAt: Date;
  description?: string;
}

const App: React.FC = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  
  // Wallet and Escrow hooks
  const {
    account,
    isConnected,
    isConnecting,
    error: walletError,
    connectWallet,
    disconnectWallet,
    network
  } = useWallet();

  const {
    escrows,
    isLoading: escrowsLoading,
    error: escrowError,
    refetch: refetchEscrows
  } = useRobustEscrowLoader(account);

  const {
    createEscrow,
    fundEscrow,
    releaseEscrow,
    raiseDispute,
    resolveDispute,
    isOperating
  } = useEscrowOperations();

  // Enhanced State Management
  const [activeTab, setActiveTab] = useState<'dashboard' | 'my-escrows' | 'create' | 'activity'>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'status'>('date');
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [notifications, setNotifications] = useState<Array<{
    id: string;
    type: 'success' | 'error' | 'warning' | 'info';
    message: string;
    timestamp: Date;
  }>>([]);

  // Enhanced Effects
  useEffect(() => {
    const firstVisit = !localStorage.getItem('monad-escrow-visited');
    if (firstVisit && isConnected) {
      setIsFirstVisit(true);
      setShowOnboarding(true);
      localStorage.setItem('monad-escrow-visited', 'true');
    }

    const securityAccepted = localStorage.getItem('security-warning-accepted');
    if (!securityAccepted && isConnected) {
      setShowSecurityWarning(true);
    }
  }, [isConnected]);

  // Enhanced Handlers
  const handleSecurityAccept = useCallback(() => {
    localStorage.setItem('security-warning-accepted', 'true');
    setShowSecurityWarning(false);
  }, []);

  const handleNotification = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]); // Keep only 5 latest
    
    // Auto remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  const filteredEscrows = escrows?.filter(escrow => {
    const matchesSearch = escrow.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         escrow.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || escrow.status === filterStatus;
    return matchesSearch && matchesFilter;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'amount':
        return parseFloat(b.amount) - parseFloat(a.amount);
      case 'status':
        return a.status.localeCompare(b.status);
      case 'date':
      default:
        return b.createdAt.getTime() - a.createdAt.getTime();
    }
  });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', description: 'Overview and stats' },
    { id: 'my-escrows', label: 'My Escrows', icon: '🔐', description: 'Manage your escrows' },
    { id: 'create', label: 'Create New', icon: '➕', description: 'Start new escrow' },
    { id: 'activity', label: 'Activity', icon: '📈', description: 'Recent transactions' }
  ];

  // Loading States
  if (escrowsLoading && !escrows?.length) {
    return (
      <DarkModeWrapper>
        <div className="app-wrapper">
          <Container className="main-container">
            <div className="loading-state">
              <AnimatedLoader size="large" message="Loading your escrows..." />
              <EscrowDetailsSkeleton count={3} />
            </div>
          </Container>
        </div>
      </DarkModeWrapper>
    );
  }

  return (
    <DarkModeWrapper>
      <div className="app-wrapper">
        {/* Enhanced Header */}
        <Navbar className="enhanced-navbar" expand="lg">
          <Container>
            <Navbar.Brand className="brand-logo">
              <div className="logo-container">
                <div className="logo-icon">🔐</div>
                <div className="brand-text">
                  <h1>Monad Escrow</h1>
                  <span className="tagline">Secure. Trustless. Simple.</span>
                </div>
              </div>
            </Navbar.Brand>
            
            <div className="navbar-controls">
              <TrustIndicators contractAddress="0x44f703203A65b6b11ea3b4540cC30337F0630927" />
              <EnhancedThemeToggle />
              {isConnected && (
                <AddressDisplay 
                  address={account!} 
                  showCopy={true} 
                  showQR={true}
                  className="enhanced-address"
                />
              )}
            </div>
          </Container>
        </Navbar>

        {/* Security Banner */}
        <SecurityBanner />

        {/* Network Warning */}
        <NetworkWarning currentNetwork={network} expectedNetwork="Monad Testnet" />

        {/* Main Container */}
        <Container className="main-container">
          {/* Notifications */}
          <div className="notifications-container">
            {notifications.map(notification => (
              <Alert 
                key={notification.id}
                variant={notification.type}
                className="notification-alert"
                dismissible
                onClose={() => setNotifications(prev => prev.filter(n => n.id !== notification.id))}
              >
                {notification.message}
              </Alert>
            ))}
          </div>

          {!isConnected ? (
            // Enhanced Connection State
            <div className="connection-state">
              <Card className="welcome-card">
                <Card.Body className="text-center">
                  <div className="welcome-icon">🌟</div>
                  <h2>Welcome to Monad Escrow</h2>
                  <p className="lead">
                    The most secure and user-friendly escrow service on Monad Testnet
                  </p>
                  <div className="features-grid">
                    <div className="feature-item">
                      <div className="feature-icon">🔒</div>
                      <h5>Secure</h5>
                      <p>Smart contract protection</p>
                    </div>
                    <div className="feature-item">
                      <div className="feature-icon">⚡</div>
                      <h5>Fast</h5>
                      <p>Lightning-fast transactions</p>
                    </div>
                    <div className="feature-item">
                      <div className="feature-icon">🌍</div>
                      <h5>Trustless</h5>
                      <p>No intermediaries needed</p>
                    </div>
                  </div>
                  <Button 
                    variant="primary" 
                    size="lg"
                    onClick={connectWallet}
                    disabled={isConnecting}
                    className="connect-button"
                  >
                    {isConnecting ? (
                      <>
                        <div className="spinner-border spinner-border-sm me-2" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <span className="me-2">🦊</span>
                        Connect Wallet
                      </>
                    )}
                  </Button>
                  <div className="supported-wallets">
                    <small className="text-muted">Supports MetaMask and WalletConnect</small>
                  </div>
                </Card.Body>
              </Card>
            </div>
          ) : (
            // Enhanced Main Application
            <>
              {/* Enhanced Navigation */}
              <EnhancedNavPills 
                activeTab={activeTab}
                onTabChange={setActiveTab}
                tabs={tabs}
              />

              {/* Main Content */}
              <div className="main-content">
                {activeTab === 'dashboard' && (
                  <div className="dashboard-view">
                    <EscrowStats escrows={escrows || []} />
                    <Row className="g-4">
                      <Col lg={8}>
                        <EscrowDashboard 
                          escrows={filteredEscrows || []} 
                          onEscrowAction={(action, escrowId) => {
                            handleNotification('info', `${action} action triggered for escrow ${escrowId}`);
                          }}
                        />
                      </Col>
                      <Col lg={4}>
                        <ActivityFeed activities={[]} />
                      </Col>
                    </Row>
                  </div>
                )}

                {activeTab === 'my-escrows' && (
                  <div className="escrows-view">
                    <SearchAndFilter 
                      searchQuery={searchQuery}
                      onSearchChange={setSearchQuery}
                      filterStatus={filterStatus}
                      onFilterChange={setFilterStatus}
                      sortBy={sortBy}
                      onSortChange={setSortBy}
                    />
                    
                    {filteredEscrows?.length ? (
                      <div className="escrows-grid">
                        {filteredEscrows.map(escrow => (
                          <EnhancedEscrowCard 
                            key={escrow.id}
                            escrow={escrow}
                            currentUser={account!}
                            onAction={(action) => {
                              handleNotification('success', `${action} completed successfully`);
                              refetchEscrows();
                            }}
                          />
                        ))}
                      </div>
                    ) : (
                      <EmptyStateIllustration 
                        type="escrows"
                        onAction={() => setActiveTab('create')}
                      />
                    )}
                  </div>
                )}

                {activeTab === 'create' && (
                  <div className="create-view">
                    {/* Enhanced Create Escrow Form will be implemented */}
                    <Card className="create-card">
                      <Card.Header>
                        <h4>Create New Escrow</h4>
                        <p className="text-muted">Set up a secure transaction between parties</p>
                      </Card.Header>
                      <Card.Body>
                        <p>Enhanced create form coming in next component...</p>
                      </Card.Body>
                    </Card>
                  </div>
                )}

                {activeTab === 'activity' && (
                  <div className="activity-view">
                    <ActivityFeed activities={[]} expanded={true} />
                  </div>
                )}
              </div>
            </>
          )}
        </Container>

        {/* Floating Action Button */}
        {isConnected && activeTab !== 'create' && (
          <FloatingActionButton 
            onClick={() => setActiveTab('create')}
            icon="+"
            tooltip="Create New Escrow"
          />
        )}

        {/* Modals */}
        <SecurityWarningModal 
          show={showSecurityWarning}
          onAccept={handleSecurityAccept}
          onDecline={() => setShowSecurityWarning(false)}
        />

        <OnboardingTour 
          show={showOnboarding}
          onComplete={() => setShowOnboarding(false)}
          isFirstVisit={isFirstVisit}
        />

        {/* Enhanced Footer */}
        <footer className="enhanced-footer">
          <Container>
            <Row>
              <Col md={6}>
                <div className="footer-brand">
                  <h5>Monad Escrow</h5>
                  <p>Secure escrow services on Monad Testnet</p>
                </div>
              </Col>
              <Col md={6} className="text-end">
                <div className="footer-links">
                  <a href="https://github.com/BluOwn/monadescrow" target="_blank" rel="noopener noreferrer">
                    GitHub
                  </a>
                  <a href="https://twitter.com/Oprimedev" target="_blank" rel="noopener noreferrer">
                    Twitter
                  </a>
                  <a href="#" onClick={(e) => { e.preventDefault(); setShowSecurityWarning(true); }}>
                    Security
                  </a>
                </div>
              </Col>
            </Row>
          </Container>
        </footer>
      </div>
    </DarkModeWrapper>
  );
};

export default App;
// src/App.tsx - Updated with Enhanced Wallet Connection
import React, { Suspense, useState, useEffect, useContext, useCallback } from 'react';
import { Button, Container, Alert, Modal, Badge, Card, Row, Col, ProgressBar, Navbar, Nav } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

// Import contexts
import { ThemeContext } from './contexts/ThemeContext';

// Import hooks
import useWallet from './hooks/useWallet';
import useRobustEscrowLoader from './hooks/useRobustEscrowLoader';
import useEscrowOperations from './hooks/useEscrowOperations';

// Enhanced Components
import EnhancedNavPills from './components/EnhancedNavPills';
import EscrowDashboard from './components/EscrowDashboard';
import EnhancedEscrowCard from './components/EnhancedEscrowCard';
import EnhancedWalletConnection from './components/EnhancedWalletConnection';
import { OnboardingTour } from './components/OnboardingTour';
import { FloatingActionButton } from './components/FloatingActionButton';
import { AnimatedLoader } from './components/AnimatedLoader';
import { EnhancedThemeToggle } from './components/EnhancedThemeToggle';
import { TrustIndicators } from './components/TrustIndicators';
import { ActivityFeed } from './components/ActivityFeed';
import EscrowStats from './components/EscrowStats';
import SearchAndFilter from './components/SearchAndFilter';
import { EmptyStateIllustration } from './components/EmptyStateIllustration';

// Import existing components
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
type TabType = 'dashboard' | 'my-escrows' | 'create' | 'activity';
type SortBy = 'date' | 'amount' | 'status';

interface ExtendedEscrow {
  id: string;
  buyer: string;
  seller: string;
  arbiter: string;
  amount: string;
  status: 'pending' | 'funded' | 'completed' | 'disputed' | 'resolved';
  createdAt: Date;
  description?: string;
}

interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  timestamp: Date;
}

// Helper function to convert your Escrow type to ExtendedEscrow
const convertToExtendedEscrow = (escrow: any): ExtendedEscrow => {
  return {
    id: escrow.escrowId?.toString() || escrow.id?.toString() || Math.random().toString(),
    buyer: escrow.buyer || '',
    seller: escrow.seller || '',
    arbiter: escrow.arbiter || '',
    amount: escrow.amount || '0',
    status: escrow.state === 0 ? 'pending' : 
            escrow.state === 1 ? 'funded' : 
            escrow.state === 2 ? 'completed' : 
            escrow.state === 3 ? 'disputed' : 'resolved',
    createdAt: escrow.timestamp ? new Date(escrow.timestamp * 1000) : new Date(),
    description: escrow.description || `Escrow #${escrow.escrowId || escrow.id || ''}`,
  };
};

const App: React.FC = () => {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);
  
  // Wallet hook
  const walletHook = useWallet();
  const {
    account,
    connected,
    error: walletError,
    connectWallet,
    disconnectWallet
  } = walletHook;

  // Escrow loader hook
  const {
    activeEscrows,
    loading,
    error: escrowError,
    progress,
    stats
  } = useRobustEscrowLoader();

  // Escrow operations hook
  const {
    createEscrow,
    rateLimited
  } = useEscrowOperations();

  // Enhanced State Management
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortBy>('date');
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  // Convert escrows to the format expected by components
  const convertedEscrows = activeEscrows?.map(convertToExtendedEscrow) || [];

  // Enhanced Effects
  useEffect(() => {
    if (connected && connectionSuccess) {
      const firstVisit = !localStorage.getItem('monad-escrow-visited');
      if (firstVisit) {
        setIsFirstVisit(true);
        setShowOnboarding(true);
        localStorage.setItem('monad-escrow-visited', 'true');
      }

      const securityAccepted = localStorage.getItem('security-warning-accepted');
      if (!securityAccepted) {
        setShowSecurityWarning(true);
      }

      // Show success notification
      handleNotification('success', '🎉 Wallet connected successfully!');
    }
  }, [connected, connectionSuccess]);

  // Enhanced Handlers
  const handleSecurityAccept = useCallback(() => {
    localStorage.setItem('security-warning-accepted', 'true');
    setShowSecurityWarning(false);
  }, []);

  const handleNotification = useCallback((type: 'success' | 'error' | 'warning' | 'info', message: string) => {
    const notification: Notification = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date()
    };
    setNotifications(prev => [notification, ...prev.slice(0, 4)]);
    
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== notification.id));
    }, 5000);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab as TabType);
  };

  const handleConnectionSuccess = () => {
    setConnectionSuccess(true);
    handleNotification('success', 'Wallet connected successfully! 🎉');
  };

  const handleConnectionError = (error: string) => {
    handleNotification('error', `Connection failed: ${error}`);
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  const filteredEscrows = convertedEscrows?.filter((escrow: ExtendedEscrow) => {
    const matchesSearch = escrow.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         escrow.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || escrow.status === filterStatus;
    return matchesSearch && matchesFilter;
  }).sort((a: ExtendedEscrow, b: ExtendedEscrow) => {
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

  return (
    <DarkModeWrapper>
      <div className="app-wrapper">
        {/* Enhanced Header - Only show when connected */}
        {connected && (
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
                <EnhancedWalletConnection
                  connected={connected}
                  account={account}
                  error={walletError}
                  connectWallet={connectWallet}
                  disconnectWallet={disconnectWallet}
                  onConnectionSuccess={handleConnectionSuccess}
                  onConnectionError={handleConnectionError}
                />
              </div>
            </Container>
          </Navbar>
        )}

        {/* Security Banner - Only show when connected */}
        {connected && <SecurityBanner />}

        {/* Network Warning - Only show when connected */}
        {connected && <NetworkWarning currentNetwork="Current Network" expectedNetwork="Monad Testnet" />}

        {/* Rate Limit Alert */}
        {rateLimited && (
          <RateLimitAlert 
            isVisible={true}
            onDismiss={() => {}}
            onRetry={handleRefresh}
          />
        )}

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

          {!connected ? (
            // Enhanced Connection State
            <div className="connection-state">
              <EnhancedWalletConnection
                connected={connected}
                account={account}
                error={walletError}
                connectWallet={connectWallet}
                disconnectWallet={disconnectWallet}
                onConnectionSuccess={handleConnectionSuccess}
                onConnectionError={handleConnectionError}
              />
            </div>
          ) : (
            // Enhanced Main Application
            <>
              {/* Loading State */}
              {loading && !activeEscrows?.length ? (
                <div className="loading-state">
                  <AnimatedLoader size="large" message="Loading your escrows..." />
                  <EscrowDetailsSkeleton />
                </div>
              ) : (
                <>
                  {/* Enhanced Navigation */}
                  <EnhancedNavPills 
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    tabs={tabs}
                  />

                  {/* Main Content */}
                  <div className="main-content">
                    {activeTab === 'dashboard' && (
                      <div className="dashboard-view">
                        <EscrowStats escrows={convertedEscrows} />
                        <Row className="g-4">
                          <Col lg={8}>
                            <EscrowDashboard 
                              escrows={filteredEscrows} 
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
                            {filteredEscrows.map((escrow: ExtendedEscrow) => (
                              <EnhancedEscrowCard 
                                key={escrow.id}
                                escrow={escrow}
                                currentUser={account || ''}
                                onAction={(action) => {
                                  handleNotification('success', `${action} completed successfully`);
                                  handleRefresh();
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
                        <Card className="create-card">
                          <Card.Header>
                            <h4>Create New Escrow</h4>
                            <p className="text-muted">Set up a secure transaction between parties</p>
                          </Card.Header>
                          <Card.Body>
                            <p>Enhanced create form coming soon...</p>
                            {loading && <LoadingIndicator />}
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
            </>
          )}
        </Container>

        {/* Floating Action Button */}
        {connected && activeTab !== 'create' && (
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
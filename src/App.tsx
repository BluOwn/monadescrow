"use client"

// src/App.tsx - Complete with modern design and proper escrow loading
import React, { Suspense, useState, useEffect, useContext, useCallback } from "react"
import "./App.css"

// Import contexts
import { ThemeContext } from "./contexts/ThemeContext"

// Import hooks
import useWallet from "./hooks/useWallet"
import useRobustEscrowLoader from "./hooks/useRobustEscrowLoader"
import useEscrowOperations from "./hooks/useEscrowOperations"

// Import new components
import CustomNavPills from "./components/CustomNavPills"
import EscrowTimeline from "./components/EscrowTimeline"
import AnimatedProgress from "./components/AnimatedProgress"
import { ToastNotification } from "./components/AnimatedAlert"
import { WalletInfoSkeleton } from "./components/SkeletonShimmer"

// Import existing components
import ThemeToggle from "./components/ThemeToggle"
import DarkModeWrapper from "./components/DarkModeWrapper"
import LoadingIndicator from "./components/LoadingIndicator"
import AddressDisplay from "./components/AddressDisplay"
import { EscrowDetailsSkeleton } from "./components/SkeletonLoaders"
import RateLimitAlert from "./components/RateLimitAlert"
import { ContractInfo, SecurityWarningModal, SecurityBanner } from "./components/SecurityComponents"

// Creator Information
import { CREATOR_TWITTER } from "./constants/contractData"

// Lazy load components
const CreateEscrowTab = React.lazy(() => import("./components/CreateEscrowTab"))
const MyEscrowsTab = React.lazy(() => import("./components/MyEscrowsTab"))
const FindEscrowTab = React.lazy(() => import("./components/FindEscrowTab"))
const ContactForm = React.lazy(() => import("./components/ContactForm"))
const EscrowDetails = React.lazy(() => import("./components/EscrowDetails"))
const HowToUseTab = React.lazy(() => import("./components/HowToUseTab"))

// Navigation tabs configuration
const navigationTabs = [
  { id: "guide", label: "How to Use", icon: "📚" },
  { id: "create", label: "Create Escrow", icon: "➕" },
  { id: "my-escrows", label: "My Escrows", icon: "📋" },
  { id: "find", label: "Find Escrow", icon: "🔍" },
  { id: "contact", label: "Contact", icon: "📧" },
]

// Main App component
const App: React.FC = () => {
  // Access theme context
  const { darkMode } = useContext(ThemeContext)

  // Use custom hooks
  const wallet = useWallet()
  const escrowLoader = useRobustEscrowLoader()
  const escrowOps = useEscrowOperations()

  // Local state - Start with guide tab for new users
  const [activeTab, setActiveTab] = useState<string>("guide")
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false)
  const [showSecurityWarning, setShowSecurityWarning] = useState<boolean>(false)
  const [hasAcceptedSecurity, setHasAcceptedSecurity] = useState<boolean>(false)
  const [firstTimeUser, setFirstTimeUser] = useState<boolean>(true)
  const [toastMessage, setToastMessage] = useState<string>("")
  const [toastVariant, setToastVariant] = useState<"success" | "danger" | "warning" | "info">("info")
  const [showToast, setShowToast] = useState<boolean>(false)
  const [chainId, setChainId] = useState<number | null>(null)

  // Form states
  const [sellerAddress, setSellerAddress] = useState<string>("")
  const [arbiterAddress, setArbiterAddress] = useState<string>("")
  const [amount, setAmount] = useState<string>("")
  const [escrowIdToView, setEscrowIdToView] = useState<string>("")

  // Update chainId when provider changes
  useEffect(() => {
    if (wallet.provider) {
      wallet.provider
        .getNetwork()
        .then((network) => {
          setChainId(Number(network.chainId))
        })
        .catch(() => setChainId(null))
    } else {
      setChainId(null)
    }
  }, [wallet.provider])

  // Initialize security settings
  useEffect(() => {
    const hasAccepted = localStorage.getItem("monad-escrow-security-accepted")
    const hasVisited = localStorage.getItem("monad-escrow-visited")

    if (hasAccepted === "true") {
      setHasAcceptedSecurity(true)
      setFirstTimeUser(false)
    }

    // If returning user, start with create tab instead of guide
    if (hasVisited === "true" && hasAccepted === "true") {
      setActiveTab("create")
    }
  }, [])

  // Setup wallet listeners
  useEffect(() => {
    const cleanup = wallet.setupWalletListeners()
    return cleanup
  }, [wallet])

  // Load escrows when wallet connects
  useEffect(() => {
    let isEffectActive = true

    const loadData = async () => {
      if (wallet.connected && wallet.contract && wallet.account && isEffectActive) {
        console.log("👤 Wallet connected, loading escrows...")

        try {
          await escrowLoader.refreshIfStale(wallet.contract, wallet.account)
        } catch (error) {
          console.error("Error loading escrows:", error)
        }
      }
    }

    const timeoutId = setTimeout(loadData, 300)

    return () => {
      isEffectActive = false
      clearTimeout(timeoutId)
    }
  }, [wallet.connected, wallet.contract, wallet.account])

  // Show toast notification
  const showToastNotification = useCallback((message: string, variant: "success" | "danger" | "warning" | "info") => {
    setToastMessage(message)
    setToastVariant(variant)
    setShowToast(true)
  }, [])

  // Handle toast close
  const handleToastClose = useCallback(() => {
    setShowToast(false)
  }, [])

  // Connect to MetaMask
  const connectWallet = async (): Promise<void> => {
    if (firstTimeUser && !hasAcceptedSecurity) {
      setShowSecurityWarning(true)
      return
    }

    try {
      const success = await wallet.connectWallet()
      if (success && wallet.contract) {
        console.log("Wallet connected successfully")
        showToastNotification("Wallet connected successfully!", "success")
        // Mark as visited and switch to create tab
        localStorage.setItem("monad-escrow-visited", "true")
        if (activeTab === "guide") {
          setActiveTab("create")
        }
      }
    } catch (error) {
      console.error("Error in connect flow:", error)
      showToastNotification("Failed to connect wallet", "danger")
    }
  }

  // Handle security warning
  const handleSecurityAccept = (): void => {
    setHasAcceptedSecurity(true)
    setFirstTimeUser(false)
    setShowSecurityWarning(false)
    localStorage.setItem("monad-escrow-security-accepted", "true")
    localStorage.setItem("monad-escrow-visited", "true")
    connectWallet()
  }

  const handleSecurityDecline = (): void => {
    setShowSecurityWarning(false)
  }

  // Create escrow handler
  const handleCreateEscrow = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()

    if (!wallet.contract) return

    const success = await escrowOps.createEscrow(wallet.contract, sellerAddress, arbiterAddress, amount, wallet.account)

    if (success) {
      setSellerAddress("")
      setArbiterAddress("")
      setAmount("")
      showToastNotification("Escrow created successfully!", "success")

      // Switch to My Escrows tab and refresh
      setActiveTab("my-escrows")
      setTimeout(() => {
        escrowLoader.forceRefresh(wallet.contract!, wallet.account)
      }, 2000)
    }
  }

  // View escrow details
  const viewEscrowDetails = useCallback(
    async (escrowId: string): Promise<void> => {
      if (!wallet.contract) {
        escrowOps.setError("Wallet not connected")
        return
      }

      try {
        escrowOps.clearMessages()
        const escrow = await escrowOps.viewEscrowDetails(wallet.contract, escrowId)

        if (escrow) {
          setShowDetailsModal(true)
        } else {
          escrowOps.setError("Escrow not found")
        }
      } catch (error) {
        console.error("Error viewing escrow:", error)
        escrowOps.setError("Failed to load escrow details")
      }
    },
    [wallet.contract, escrowOps],
  )

  // Handle escrow actions
  const handleEscrowAction = useCallback(
    async (action: string, escrowId: string, recipient: string | null = null): Promise<void> => {
      if (!wallet.contract) return

      const success = await escrowOps.handleEscrowAction(wallet.contract, action, escrowId, recipient)

      if (success) {
        showToastNotification(`${action} completed successfully!`, "success")
        // Refresh after action
        setTimeout(() => {
          if (wallet.contract && wallet.account) {
            escrowLoader.forceRefresh(wallet.contract, wallet.account)
          }
        }, 2000)

        // Refresh modal if open
        if (showDetailsModal && escrowOps.selectedEscrow?.id === escrowId) {
          setTimeout(() => {
            viewEscrowDetails(escrowId)
          }, 3000)
        }
      }
    },
    [
      wallet.contract,
      wallet.account,
      showDetailsModal,
      escrowOps.selectedEscrow?.id,
      escrowLoader,
      viewEscrowDetails,
      showToastNotification,
    ],
  )

  // Handle find escrow
  const handleFindEscrow = useCallback(
    async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
      e.preventDefault()

      if (!escrowIdToView || !wallet.contract) {
        escrowOps.setError("Please enter an escrow ID")
        return
      }

      try {
        escrowOps.clearMessages()
        await viewEscrowDetails(escrowIdToView)
        setEscrowIdToView("")
      } catch (error) {
        console.error("Error finding escrow", error)
        escrowOps.setError("Failed to find escrow")
      }
    },
    [escrowIdToView, wallet.contract, escrowOps, viewEscrowDetails],
  )

  // Modal close handler
  const handleModalClose = useCallback(() => {
    setShowDetailsModal(false)
    setTimeout(() => {
      escrowOps.setSelectedEscrow(null)
      escrowOps.clearMessages()
    }, 150)
  }, [escrowOps])

  // Retry loading
  const retryLoadingEscrows = async (): Promise<void> => {
    if (wallet.contract && wallet.account) {
      escrowOps.setRateLimited(false)
      await escrowLoader.forceRefresh(wallet.contract, wallet.account)
    }
  }

  // Handle giveaway link click
  const handleGiveawayClick = (): void => {
    window.open("https://farcaster.xyz/miniapps/qpRLuEcePmk5/monad-slot-game", "_blank", "noopener,noreferrer")
  }

  // Loading Progress Component
  const LoadingProgress = () => {
    if (!escrowLoader.loading && !escrowLoader.progress.total) return null

    return (
      <div className="card mb-4">
        <div className="card-body">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h6 className="mb-0">{escrowLoader.loading ? "🔄 Loading Your Escrows..." : "📊 Loading Complete"}</h6>
            {escrowLoader.loading && (
              <button className="btn btn-outline-danger btn-sm" onClick={escrowLoader.cancelLoading}>
                Cancel
              </button>
            )}
          </div>

          {escrowLoader.progress.total > 0 && (
            <>
              <AnimatedProgress
                value={escrowLoader.progress.percentage}
                variant={escrowLoader.progress.failed > 0 ? "warning" : "primary"}
                label={`Progress: ${escrowLoader.progress.loaded}/${escrowLoader.progress.total} loaded`}
              />
              {escrowLoader.progress.failed > 0 && (
                <small className="text-warning">({escrowLoader.progress.failed} failed)</small>
              )}
            </>
          )}
        </div>
      </div>
    )
  }

  // Stats display component
  const StatsCard = () => {
    if (!escrowLoader.hasData) return null

    return (
      <div className="card mb-4">
        <div className="card-body">
          <h2 className="card-title">📊 Your Active Escrows</h2>
          <div className="row">
            <div className="col-xs-6 col-sm-3">
              <div className="text-center">
                <h3 className="text-primary">{escrowLoader.stats.total}</h3>
                <small>Total Active</small>
              </div>
            </div>
            <div className="col-xs-6 col-sm-3">
              <div className="text-center">
                <h3 className="text-info">{escrowLoader.stats.asBuyer}</h3>
                <small>As Buyer</small>
              </div>
            </div>
            <div className="col-xs-6 col-sm-3">
              <div className="text-center">
                <h3 className="text-success">{escrowLoader.stats.asSeller}</h3>
                <small>As Seller</small>
              </div>
            </div>
            <div className="col-xs-6 col-sm-3">
              <div className="text-center">
                <h3 className="text-warning">{escrowLoader.stats.asArbiter}</h3>
                <small>As Arbiter</small>
              </div>
            </div>
          </div>
          {escrowLoader.stats.disputed > 0 && (
            <div className="alert alert-warning mt-3 mb-0">
              <h4>⚠️ Wrong Network</h4>
              <p>
                {escrowLoader.stats.disputed} escrow{escrowLoader.stats.disputed > 1 ? "s" : ""} in dispute
              </p>
            </div>
          )}
          {escrowLoader.isPartiallyLoaded && (
            <div className="alert alert-info mt-3 mb-0">
              <h4>ℹ️ Some Escrows Failed to Load</h4>
              <p>Try refreshing for complete data.</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <DarkModeWrapper>
      <div className="app">
        {/* Header */}
        <header className="header">
          <div className="header-content">
            <h1 className="title">Monad Escrow</h1>
            <ThemeToggle />
          </div>
          <p className="subtitle">Secure, decentralized escrow on Monad Testnet</p>
        </header>

        {/* Security Warning Modal */}
        <SecurityWarningModal
          show={showSecurityWarning}
          onAccept={handleSecurityAccept}
          onDecline={handleSecurityDecline}
        />

        {!wallet.connected ? (
          <div className="connect-section">
            <SecurityBanner />
            <ContractInfo />
            <div className="connect-card">
              <h2>Connect Your Wallet</h2>
              <p>Connect your MetaMask wallet to start using the Monad Escrow Service</p>
              <button
                className={`btn btn-primary ${wallet.loading ? "loading" : ""}`}
                onClick={connectWallet}
                disabled={wallet.loading}
              >
                {wallet.loading ? <LoadingIndicator /> : "Connect Wallet"}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Network Warning */}
            {wallet.account && chainId && chainId !== 10143 && (
              <div className="alert alert-warning">
                <h4>⚠️ Wrong Network</h4>
                <p>Please switch to Monad Testnet (Chain ID: 10143) in your wallet.</p>
              </div>
            )}

            {/* Security Banner */}
            <SecurityBanner />

            {/* Wallet Info */}
            {wallet.loading ? (
              <WalletInfoSkeleton />
            ) : (
              <div className="wallet-card">
                <div className="wallet-info">
                  <div className="wallet-avatar">👤</div>
                  <div className="wallet-details">
                    <h6>Connected Wallet</h6>
                    <AddressDisplay address={wallet.account} />
                  </div>
                </div>
                <div className="wallet-status">
                  <span className="status-connected">Connected</span>
                  <div className="network-info">Monad Testnet</div>
                </div>
              </div>
            )}

            {/* Loading Progress */}
            <LoadingProgress />

            {/* Stats Card */}
            <StatsCard />

            {/* Error State */}
            {escrowLoader.error && (
              <div className={`alert ${escrowLoader.isPartiallyLoaded ? "alert-warning" : "alert-error"}`}>
                <strong>{escrowLoader.isPartiallyLoaded ? "Partial Load:" : "Error:"}</strong> {escrowLoader.error}
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => escrowLoader.forceRefresh(wallet.contract!, wallet.account)}
                >
                  {escrowLoader.isPartiallyLoaded ? "Retry Failed" : "Retry All"}
                </button>
              </div>
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

        {/* Navigation */}
        <nav className="navigation">
          <CustomNavPills
            activeTab={activeTab}
            onTabChange={setActiveTab}
            tabs={navigationTabs.map((tab) => ({
              ...tab,
              label:
                tab.id === "my-escrows" && wallet.connected && escrowLoader.stats.total > 0
                  ? `${tab.label} (${escrowLoader.stats.total})`
                  : tab.label,
            }))}
          />
        </nav>

        {/* Main Content */}
        <main className="main">
          <Suspense fallback={<LoadingIndicator />}>
            {activeTab === "guide" && <HowToUseTab />}

            {activeTab === "create" && wallet.connected && (
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

            {activeTab === "my-escrows" && wallet.connected && (
              <MyEscrowsTab
                escrows={escrowLoader.activeEscrows}
                onViewDetails={viewEscrowDetails}
                loadingEscrows={escrowLoader.loading}
                retryLoadingEscrows={() => escrowLoader.forceRefresh(wallet.contract!, wallet.account)}
                account={wallet.account}
                onAction={handleEscrowAction}
              />
            )}

            {activeTab === "find" && wallet.connected && (
              <FindEscrowTab
                escrowIdToView={escrowIdToView}
                setEscrowIdToView={setEscrowIdToView}
                handleFindEscrow={handleFindEscrow}
                loading={escrowOps.loading}
              />
            )}

            {activeTab === "contact" && <ContactForm />}
          </Suspense>

          {/* Show wallet connection prompt for disabled tabs */}
          {!wallet.connected && (activeTab === "create" || activeTab === "my-escrows" || activeTab === "find") && (
            <div className="connect-prompt">
              <h4>🔗 Connect Your Wallet</h4>
              <p>Please connect your MetaMask wallet to access this feature</p>
              <button
                className={`btn btn-primary ${wallet.loading ? "loading" : ""}`}
                onClick={connectWallet}
                disabled={wallet.loading}
              >
                {wallet.loading ? <LoadingIndicator /> : "Connect Wallet"}
              </button>
            </div>
          )}
        </main>

        {/* Contract Info */}
        <ContractInfo />

        {/* Footer */}
        <footer className="footer">
          <p>
            Built by{" "}
            <a href={CREATOR_TWITTER} target="_blank" rel="noopener noreferrer">
              @Oprimedev
            </a>{" "}
            | Open source on{" "}
            <a href="https://github.com/BluOwn/monadescrow" target="_blank" rel="noopener noreferrer">
              GitHub
            </a>
          </p>
        </footer>

        {/* Escrow Details Modal */}
        {wallet.connected && (
          <div className={`modal ${showDetailsModal ? "modal-open" : ""}`} onClick={handleModalClose}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Escrow Details</h3>
                  <button className="modal-close" onClick={handleModalClose}>
                    ×
                  </button>
                </div>
                <div className="modal-body">
                  <Suspense fallback={<EscrowDetailsSkeleton />}>
                    {escrowOps.selectedEscrow ? (
                      <>
                        <EscrowDetails
                          escrow={escrowOps.selectedEscrow}
                          account={wallet.account}
                          onAction={handleEscrowAction}
                          loading={escrowOps.loading}
                        />
                        <EscrowTimeline
                          escrowStatus={escrowOps.selectedEscrow.fundsDisbursed ? "completed" : "funded"}
                          disputeRaised={escrowOps.selectedEscrow.disputeRaised}
                        />
                      </>
                    ) : (
                      <EscrowDetailsSkeleton />
                    )}
                  </Suspense>
                </div>
                <div className="modal-footer">
                  <button className="btn btn-secondary" onClick={handleModalClose}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <ToastNotification
          message={toastMessage}
          variant={toastVariant}
          show={showToast}
          onClose={handleToastClose}
          position="top-right"
        />
      </div>
    </DarkModeWrapper>
  )
}

export default App

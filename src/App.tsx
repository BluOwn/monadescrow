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
      <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h6 className="text-lg font-semibold text-card-foreground mb-0">
            {escrowLoader.loading ? "🔄 Loading Your Escrows..." : "📊 Loading Complete"}
          </h6>
          {escrowLoader.loading && (
            <button
              className="px-4 py-2 text-sm border border-destructive text-destructive rounded-lg hover:bg-destructive hover:text-destructive-foreground transition-colors duration-200"
              onClick={escrowLoader.cancelLoading}
            >
              Cancel
            </button>
          )}
        </div>

        {escrowLoader.progress.total > 0 && (
          <div className="space-y-2">
            <AnimatedProgress
              value={escrowLoader.progress.percentage}
              variant={escrowLoader.progress.failed > 0 ? "warning" : "primary"}
              label={`Progress: ${escrowLoader.progress.loaded}/${escrowLoader.progress.total} loaded`}
            />
            {escrowLoader.progress.failed > 0 && (
              <small className="text-amber-600 dark:text-amber-400">({escrowLoader.progress.failed} failed)</small>
            )}
          </div>
        )}
      </div>
    )
  }

  // Stats display component
  const StatsCard = () => {
    if (!escrowLoader.hasData) return null

    return (
      <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm">
        <h2 className="text-2xl font-bold text-card-foreground mb-6">📊 Your Active Escrows</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary mb-2">{escrowLoader.stats.total}</div>
            <div className="text-sm text-muted-foreground">Total Active</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-500 mb-2">{escrowLoader.stats.asBuyer}</div>
            <div className="text-sm text-muted-foreground">As Buyer</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-accent mb-2">{escrowLoader.stats.asSeller}</div>
            <div className="text-sm text-muted-foreground">As Seller</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-500 mb-2">{escrowLoader.stats.asArbiter}</div>
            <div className="text-sm text-muted-foreground">As Arbiter</div>
          </div>
        </div>

        {escrowLoader.stats.disputed > 0 && (
          <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <h4 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">⚠️ Disputes Active</h4>
            <p className="text-amber-700 dark:text-amber-300">
              {escrowLoader.stats.disputed} escrow{escrowLoader.stats.disputed > 1 ? "s" : ""} in dispute
            </p>
          </div>
        )}

        {escrowLoader.isPartiallyLoaded && (
          <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-2">ℹ️ Partial Load</h4>
            <p className="text-blue-700 dark:text-blue-300">
              Some escrows failed to load. Try refreshing for complete data.
            </p>
          </div>
        )}
      </div>
    )
  }

  return (
    <DarkModeWrapper>
      <div className="min-h-screen bg-background">
        <header className="bg-card border-b border-border">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-foreground">Monad Escrow</h1>
                <p className="text-muted-foreground mt-1">Secure, decentralized escrow on Monad Testnet</p>
              </div>
              <ThemeToggle />
            </div>
          </div>
        </header>

        <SecurityWarningModal
          show={showSecurityWarning}
          onAccept={handleSecurityAccept}
          onDecline={handleSecurityDecline}
        />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {!wallet.connected ? (
            <div className="max-w-2xl mx-auto space-y-8">
              <SecurityBanner />
              <ContractInfo />
              <div className="bg-card border border-border rounded-lg p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-card-foreground mb-4">Connect Your Wallet</h2>
                <p className="text-muted-foreground mb-8">
                  Connect your MetaMask wallet to start using the Monad Escrow Service
                </p>
                <button
                  className={`btn-primary ${wallet.loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={connectWallet}
                  disabled={wallet.loading}
                >
                  {wallet.loading ? <LoadingIndicator /> : "Connect Wallet"}
                </button>
              </div>
            </div>
          ) : (
            <>
              {wallet.account && chainId && chainId !== 10143 && (
                <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                  <h4 className="text-lg font-semibold text-amber-800 dark:text-amber-200 mb-2">⚠️ Wrong Network</h4>
                  <p className="text-amber-700 dark:text-amber-300">
                    Please switch to Monad Testnet (Chain ID: 10143) in your wallet.
                  </p>
                </div>
              )}

              <SecurityBanner />

              {wallet.loading ? (
                <WalletInfoSkeleton />
              ) : (
                <div className="bg-card border border-border rounded-lg p-6 mb-6 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-2xl">👤</span>
                      </div>
                      <div>
                        <h6 className="text-lg font-semibold text-card-foreground">Connected Wallet</h6>
                        <AddressDisplay address={wallet.account} />
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
                        <div className="w-2 h-2 bg-primary rounded-full mr-2"></div>
                        Connected
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">Monad Testnet</div>
                    </div>
                  </div>
                </div>
              )}

              <LoadingProgress />

              <StatsCard />

              {escrowLoader.error && (
                <div
                  className={`mb-6 p-4 rounded-lg border ${escrowLoader.isPartiallyLoaded ? "bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800" : "bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"}`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <strong
                        className={
                          escrowLoader.isPartiallyLoaded
                            ? "text-amber-800 dark:text-amber-200"
                            : "text-red-800 dark:text-red-200"
                        }
                      >
                        {escrowLoader.isPartiallyLoaded ? "Partial Load:" : "Error:"}
                      </strong>
                      <p
                        className={`mt-1 ${escrowLoader.isPartiallyLoaded ? "text-amber-700 dark:text-amber-300" : "text-red-700 dark:text-red-300"}`}
                      >
                        {escrowLoader.error}
                      </p>
                    </div>
                    <button
                      className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
                      onClick={() => escrowLoader.forceRefresh(wallet.contract!, wallet.account)}
                    >
                      {escrowLoader.isPartiallyLoaded ? "Retry Failed" : "Retry All"}
                    </button>
                  </div>
                </div>
              )}

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

          <nav className="mb-8">
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

          <main className="space-y-6">
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

            {!wallet.connected && (activeTab === "create" || activeTab === "my-escrows" || activeTab === "find") && (
              <div className="bg-card border border-border rounded-lg p-8 text-center shadow-sm">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                </div>
                <h4 className="text-xl font-semibold text-card-foreground mb-4">🔗 Connect Your Wallet</h4>
                <p className="text-muted-foreground mb-6">Please connect your MetaMask wallet to access this feature</p>
                <button
                  className={`btn-primary ${wallet.loading ? "opacity-50 cursor-not-allowed" : ""}`}
                  onClick={connectWallet}
                  disabled={wallet.loading}
                >
                  {wallet.loading ? <LoadingIndicator /> : "Connect Wallet"}
                </button>
              </div>
            )}
          </main>

          <div className="mt-12">
            <ContractInfo />
          </div>
        </div>

        <footer className="bg-card border-t border-border mt-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="text-center text-muted-foreground">
              <p>
                Built by{" "}
                <a
                  href={CREATOR_TWITTER}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors duration-200"
                >
                  @Oprimedev
                </a>{" "}
                | Open source on{" "}
                <a
                  href="https://github.com/BluOwn/monadescrow"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80 transition-colors duration-200"
                >
                  GitHub
                </a>
              </p>
            </div>
          </div>
        </footer>

        {wallet.connected && (
          <div className={`fixed inset-0 z-50 ${showDetailsModal ? "block" : "hidden"}`}>
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={handleModalClose}></div>
            <div className="fixed inset-0 flex items-center justify-center p-4">
              <div
                className="bg-card border border-border rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-6 border-b border-border">
                  <h3 className="text-2xl font-bold text-card-foreground">Escrow Details</h3>
                  <button
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted transition-colors duration-200"
                    onClick={handleModalClose}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                  <Suspense fallback={<EscrowDetailsSkeleton />}>
                    {escrowOps.selectedEscrow ? (
                      <div className="space-y-6">
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
                      </div>
                    ) : (
                      <EscrowDetailsSkeleton />
                    )}
                  </Suspense>
                </div>
                <div className="flex justify-end p-6 border-t border-border">
                  <button className="btn-secondary" onClick={handleModalClose}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

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

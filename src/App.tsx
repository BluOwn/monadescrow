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

const App: React.FC = () => {
  const { darkMode } = useContext(ThemeContext)
  const wallet = useWallet()
  const escrowLoader = useRobustEscrowLoader()
  const escrowOps = useEscrowOperations()

  // Local state
  const [activeTab, setActiveTab] = useState<string>("guide")
  const [showDetailsModal, setShowDetailsModal] = useState<boolean>(false)
  const [showSecurityWarning, setShowSecurityWarning] = useState<boolean>(false)
  const [hasAcceptedSecurity, setHasAcceptedSecurity] = useState<boolean>(false)
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
    }

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

  const handleToastClose = useCallback(() => {
    setShowToast(false)
  }, [])

  // Connect to MetaMask
  const connectWallet = async (): Promise<void> => {
    if (!hasAcceptedSecurity) {
      setShowSecurityWarning(true)
      return
    }

    try {
      const success = await wallet.connectWallet()
      if (success && wallet.contract) {
        showToastNotification("Wallet connected successfully!", "success")
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
    setShowSecurityWarning(false)
    localStorage.setItem("monad-escrow-security-accepted", "true")
    localStorage.setItem("monad-escrow-visited", "true")
    connectWallet()
  }

  const handleSecurityDecline = (): void => {
    setShowSecurityWarning(false)
  }

  return (
    <DarkModeWrapper>
      <div className="app">
        <header className="header">
          <div className="header-content">
            <div>
              <h1 className="title">Monad Escrow</h1>
              <p className="subtitle">Secure, decentralized escrow on Monad Testnet</p>
            </div>
            <ThemeToggle />
          </div>
        </header>

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
            {wallet.account && chainId && chainId !== 10143 && (
              <div className="alert alert-warning">
                <div>
                  <strong>⚠️ Wrong Network</strong>
                  <p>Please switch to Monad Testnet (Chain ID: 10143) in your wallet.</p>
                </div>
              </div>
            )}

            <SecurityBanner />

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
                  <div className="status-connected">Connected</div>
                  <div className="network-info">Monad Testnet</div>
                </div>
              </div>
            )}

            {(escrowLoader.loading || escrowLoader.progress.total > 0) && (
              <div className="card">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <h6 className="card-title mb-0">
                      {escrowLoader.loading ? "🔄 Loading Your Escrows..." : "📊 Loading Complete"}
                    </h6>
                    {escrowLoader.loading && (
                      <button className="btn btn-outline btn-sm" onClick={escrowLoader.cancelLoading}>
                        Cancel
                      </button>
                    )}
                  </div>
                  {escrowLoader.progress.total > 0 && (
                    <AnimatedProgress
                      value={escrowLoader.progress.percentage}
                      variant={escrowLoader.progress.failed > 0 ? "warning" : "primary"}
                      label={`Progress: ${escrowLoader.progress.loaded}/${escrowLoader.progress.total} loaded`}
                    />
                  )}
                </div>
              </div>
            )}

            {escrowLoader.hasData && (
              <div className="card">
                <div className="card-body">
                  <h2 className="card-title">📊 Your Active Escrows</h2>
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="text-center">
                      <div className="text-primary" style={{ fontSize: "2rem", fontWeight: "bold" }}>
                        {escrowLoader.stats.total}
                      </div>
                      <small className="text-muted">Total Active</small>
                    </div>
                    <div className="text-center">
                      <div className="text-info" style={{ fontSize: "2rem", fontWeight: "bold" }}>
                        {escrowLoader.stats.asBuyer}
                      </div>
                      <small className="text-muted">As Buyer</small>
                    </div>
                    <div className="text-center">
                      <div className="text-warning" style={{ fontSize: "2rem", fontWeight: "bold" }}>
                        {escrowLoader.stats.asSeller}
                      </div>
                      <small className="text-muted">As Seller</small>
                    </div>
                    <div className="text-center">
                      <div className="text-success" style={{ fontSize: "2rem", fontWeight: "bold" }}>
                        {escrowLoader.stats.asArbiter}
                      </div>
                      <small className="text-muted">As Arbiter</small>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {escrowLoader.error && (
              <div className={`alert ${escrowLoader.isPartiallyLoaded ? "alert-warning" : "alert-error"}`}>
                <div>
                  <strong>{escrowLoader.isPartiallyLoaded ? "Partial Load:" : "Error:"}</strong>
                  <p>{escrowLoader.error}</p>
                </div>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => escrowLoader.forceRefresh(wallet.contract!, wallet.account)}
                >
                  {escrowLoader.isPartiallyLoaded ? "Retry Failed" : "Retry All"}
                </button>
              </div>
            )}

            {escrowOps.rateLimited && (
              <RateLimitAlert
                isVisible={escrowOps.rateLimited}
                onDismiss={() => escrowOps.setRateLimited(false)}
                onRetry={() => escrowLoader.forceRefresh(wallet.contract!, wallet.account)}
                progress={escrowOps.autoRetry.progress}
                autoRetryIn={escrowOps.autoRetry.countdown}
              />
            )}
          </>
        )}

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

        <main className="main">
          <Suspense fallback={<LoadingIndicator />}>
            {activeTab === "guide" && <HowToUseTab />}

            {activeTab === "create" && wallet.connected && (
              <CreateEscrowTab
                handleCreateEscrow={async (e) => {
                  e.preventDefault()
                  if (!wallet.contract) return
                  const success = await escrowOps.createEscrow(
                    wallet.contract,
                    sellerAddress,
                    arbiterAddress,
                    amount,
                    wallet.account,
                  )
                  if (success) {
                    setSellerAddress("")
                    setArbiterAddress("")
                    setAmount("")
                    showToastNotification("Escrow created successfully!", "success")
                    setActiveTab("my-escrows")
                    setTimeout(() => {
                      escrowLoader.forceRefresh(wallet.contract!, wallet.account)
                    }, 2000)
                  }
                }}
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
                onViewDetails={async (escrowId) => {
                  if (!wallet.contract) return
                  try {
                    escrowOps.clearMessages()
                    const escrow = await escrowOps.viewEscrowDetails(wallet.contract, escrowId)
                    if (escrow) {
                      setShowDetailsModal(true)
                    }
                  } catch (error) {
                    console.error("Error viewing escrow:", error)
                  }
                }}
                loadingEscrows={escrowLoader.loading}
                retryLoadingEscrows={() => escrowLoader.forceRefresh(wallet.contract!, wallet.account)}
                account={wallet.account}
                onAction={async (action, escrowId, recipient = null) => {
                  if (!wallet.contract) return
                  const success = await escrowOps.handleEscrowAction(wallet.contract, action, escrowId, recipient)
                  if (success) {
                    showToastNotification(`${action} completed successfully!`, "success")
                    setTimeout(() => {
                      if (wallet.contract && wallet.account) {
                        escrowLoader.forceRefresh(wallet.contract, wallet.account)
                      }
                    }, 2000)
                  }
                }}
              />
            )}

            {activeTab === "find" && wallet.connected && (
              <FindEscrowTab
                escrowIdToView={escrowIdToView}
                setEscrowIdToView={setEscrowIdToView}
                handleFindEscrow={async (e) => {
                  e.preventDefault()
                  if (!escrowIdToView || !wallet.contract) return
                  try {
                    escrowOps.clearMessages()
                    const escrow = await escrowOps.viewEscrowDetails(wallet.contract, escrowIdToView)
                    if (escrow) {
                      setShowDetailsModal(true)
                      setEscrowIdToView("")
                    }
                  } catch (error) {
                    console.error("Error finding escrow", error)
                  }
                }}
                loading={escrowOps.loading}
              />
            )}

            {activeTab === "contact" && <ContactForm />}
          </Suspense>

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

        <ContractInfo />

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

        {wallet.connected && (
          <div className={`modal ${showDetailsModal ? "modal-open" : ""}`}>
            <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
              <div className="modal-content">
                <div className="modal-header">
                  <h3>Escrow Details</h3>
                  <button
                    className="modal-close"
                    onClick={() => {
                      setShowDetailsModal(false)
                      setTimeout(() => {
                        escrowOps.setSelectedEscrow(null)
                        escrowOps.clearMessages()
                      }, 150)
                    }}
                  >
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
                          onAction={async (action, escrowId, recipient = null) => {
                            if (!wallet.contract) return
                            const success = await escrowOps.handleEscrowAction(
                              wallet.contract,
                              action,
                              escrowId,
                              recipient,
                            )
                            if (success) {
                              showToastNotification(`${action} completed successfully!`, "success")
                              setTimeout(() => {
                                if (wallet.contract && wallet.account) {
                                  escrowLoader.forceRefresh(wallet.contract, wallet.account)
                                }
                              }, 2000)
                            }
                          }}
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
                  <button
                    className="btn btn-secondary"
                    onClick={() => {
                      setShowDetailsModal(false)
                      setTimeout(() => {
                        escrowOps.setSelectedEscrow(null)
                        escrowOps.clearMessages()
                      }, 150)
                    }}
                  >
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

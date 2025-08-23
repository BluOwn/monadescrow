"use client"

import type React from "react"
import LoadingIndicator from "./LoadingIndicator"
import AddressDisplay from "./AddressDisplay"

interface EscrowData {
  id: string
  buyer: string
  seller: string
  arbiter: string
  amount: string
  fundsDisbursed: boolean
  disputeRaised: boolean
}

interface MyEscrowsTabProps {
  escrows: EscrowData[]
  onViewDetails: (escrowId: string) => void
  loadingEscrows: boolean
  retryLoadingEscrows: () => void
  account: string
  onAction: (action: string, escrowId: string, recipient?: string) => void
}

const MyEscrowsTab: React.FC<MyEscrowsTabProps> = ({
  escrows,
  onViewDetails,
  loadingEscrows,
  retryLoadingEscrows,
  account,
  onAction,
}) => {
  const getRole = (escrow: EscrowData) => {
    const lowerAccount = account.toLowerCase()
    if (escrow.buyer.toLowerCase() === lowerAccount) return "Buyer"
    if (escrow.seller.toLowerCase() === lowerAccount) return "Seller"
    if (escrow.arbiter.toLowerCase() === lowerAccount) return "Arbiter"
    return "Unknown"
  }

  const getStatusBadge = (escrow: EscrowData) => {
    if (escrow.fundsDisbursed) {
      return (
        <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
          Completed
        </span>
      )
    }
    if (escrow.disputeRaised) {
      return (
        <span className="px-2 py-1 bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-200 text-xs font-medium rounded-full">
          Disputed
        </span>
      )
    }
    return (
      <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200 text-xs font-medium rounded-full">
        Active
      </span>
    )
  }

  if (loadingEscrows) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center shadow-sm">
        <LoadingIndicator size={"lg" as const} />
        <p className="text-muted-foreground mt-4">Loading your escrows...</p>
      </div>
    )
  }

  if (escrows.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center shadow-sm">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-card-foreground mb-2">No Escrows Found</h3>
        <p className="text-muted-foreground mb-4">You don't have any active escrows yet.</p>
        <button onClick={retryLoadingEscrows} className="btn-secondary">
          Refresh
        </button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">My Escrows</h2>
        <button onClick={retryLoadingEscrows} className="btn-secondary">
          Refresh
        </button>
      </div>

      <div className="grid gap-4">
        {escrows.map((escrow) => (
          <div key={escrow.id} className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="text-lg font-semibold text-card-foreground">Escrow #{escrow.id}</div>
                {getStatusBadge(escrow)}
                <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                  {getRole(escrow)}
                </span>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-foreground">{escrow.amount} ETH</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <div className="text-xs text-muted-foreground mb-1">Buyer</div>
                <AddressDisplay address={escrow.buyer} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Seller</div>
                <AddressDisplay address={escrow.seller} />
              </div>
              <div>
                <div className="text-xs text-muted-foreground mb-1">Arbiter</div>
                <AddressDisplay address={escrow.arbiter} />
              </div>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => onViewDetails(escrow.id)}
                className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors duration-200"
              >
                View Details
              </button>
              {!escrow.fundsDisbursed && (
                <button onClick={() => onAction("release", escrow.id)} className="btn-primary text-sm">
                  Quick Action
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default MyEscrowsTab

"use client"

import type React from "react"
import AddressDisplay from "./AddressDisplay"
import LoadingIndicator from "./LoadingIndicator"

interface EscrowData {
  id: string
  buyer: string
  seller: string
  arbiter: string
  amount: string
  fundsDisbursed: boolean
  disputeRaised: boolean
}

interface EscrowDetailsProps {
  escrow: EscrowData
  account: string
  onAction: (action: string, escrowId: string, recipient?: string) => void
  loading: boolean
}

const EscrowDetails: React.FC<EscrowDetailsProps> = ({ escrow, account, onAction, loading }) => {
  const getRole = () => {
    const lowerAccount = account.toLowerCase()
    if (escrow.buyer.toLowerCase() === lowerAccount) return "buyer"
    if (escrow.seller.toLowerCase() === lowerAccount) return "seller"
    if (escrow.arbiter.toLowerCase() === lowerAccount) return "arbiter"
    return "observer"
  }

  const role = getRole()

  const getStatusInfo = () => {
    if (escrow.fundsDisbursed) {
      return {
        status: "Completed",
        color: "text-green-600 dark:text-green-400",
        bgColor: "bg-green-100 dark:bg-green-900/20",
        description: "Funds have been released to the seller",
      }
    }
    if (escrow.disputeRaised) {
      return {
        status: "Disputed",
        color: "text-red-600 dark:text-red-400",
        bgColor: "bg-red-100 dark:bg-red-900/20",
        description: "A dispute has been raised and requires arbiter resolution",
      }
    }
    return {
      status: "Active",
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/20",
      description: "Escrow is active and awaiting completion",
    }
  }

  const statusInfo = getStatusInfo()

  const getAvailableActions = () => {
    if (escrow.fundsDisbursed) return []

    const actions = []

    if (role === "buyer" && !escrow.disputeRaised) {
      actions.push({ label: "Release to Seller", action: "release", variant: "primary" })
      actions.push({ label: "Raise Dispute", action: "dispute", variant: "danger" })
    }

    if (role === "seller" && !escrow.disputeRaised) {
      actions.push({ label: "Request Release", action: "request", variant: "secondary" })
    }

    if (role === "arbiter" && escrow.disputeRaised) {
      actions.push({ label: "Release to Seller", action: "arbiter-release-seller", variant: "primary" })
      actions.push({ label: "Refund to Buyer", action: "arbiter-release-buyer", variant: "secondary" })
    }

    return actions
  }

  const availableActions = getAvailableActions()

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-2xl font-bold text-foreground mb-2">Escrow #{escrow.id}</h3>
          <div
            className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusInfo.bgColor} ${statusInfo.color}`}
          >
            {statusInfo.status}
          </div>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold text-foreground">{escrow.amount} ETH</div>
          <div className="text-sm text-muted-foreground">Escrow Amount</div>
        </div>
      </div>

      <div className={`p-4 rounded-lg ${statusInfo.bgColor}`}>
        <p className={`text-sm ${statusInfo.color}`}>{statusInfo.description}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <h4 className="font-medium text-foreground">Buyer</h4>
            {role === "buyer" && <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">You</span>}
          </div>
          <AddressDisplay address={escrow.buyer} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <h4 className="font-medium text-foreground">Seller</h4>
            {role === "seller" && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">You</span>
            )}
          </div>
          <AddressDisplay address={escrow.seller} />
        </div>

        <div className="space-y-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-amber-500 rounded-full"></div>
            <h4 className="font-medium text-foreground">Arbiter</h4>
            {role === "arbiter" && (
              <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">You</span>
            )}
          </div>
          <AddressDisplay address={escrow.arbiter} />
        </div>
      </div>

      {availableActions.length > 0 && (
        <div className="border-t border-border pt-6">
          <h4 className="font-medium text-foreground mb-4">Available Actions</h4>
          <div className="flex flex-wrap gap-3">
            {availableActions.map((actionItem, index) => (
              <button
                key={index}
                onClick={() => onAction(actionItem.action, escrow.id)}
                disabled={loading}
                className={`px-4 py-2 rounded-lg font-medium transition-colors duration-200 ${
                  loading ? "opacity-50 cursor-not-allowed" : ""
                } ${
                  actionItem.variant === "primary"
                    ? "btn-primary"
                    : actionItem.variant === "danger"
                      ? "bg-red-600 text-white hover:bg-red-700"
                      : "btn-secondary"
                }`}
              >
                {loading ? <LoadingIndicator size={"sm" as const} /> : actionItem.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {role === "observer" && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            You are viewing this escrow as an observer. You cannot perform any actions on this transaction.
          </p>
        </div>
      )}
    </div>
  )
}

export default EscrowDetails

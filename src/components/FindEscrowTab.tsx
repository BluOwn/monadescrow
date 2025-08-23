"use client"

import type React from "react"
import LoadingIndicator from "./LoadingIndicator"

interface FindEscrowTabProps {
  escrowIdToView: string
  setEscrowIdToView: (id: string) => void
  handleFindEscrow: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
  loading: boolean
}

const FindEscrowTab: React.FC<FindEscrowTabProps> = ({
  escrowIdToView,
  setEscrowIdToView,
  handleFindEscrow,
  loading,
}) => {
  return (
    <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">Find Escrow</h2>
        <p className="text-muted-foreground">Enter an escrow ID to view its details and current status.</p>
      </div>

      <form onSubmit={handleFindEscrow} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="escrowId" className="text-sm font-medium text-foreground">
            Escrow ID
          </label>
          <input
            id="escrowId"
            type="text"
            value={escrowIdToView}
            onChange={(e) => setEscrowIdToView(e.target.value)}
            placeholder="Enter escrow ID (e.g., 1, 2, 3...)"
            className="input-field w-full"
            required
          />
          <p className="text-xs text-muted-foreground">
            The unique identifier for the escrow transaction you want to view
          </p>
        </div>

        <button
          type="submit"
          disabled={loading || !escrowIdToView.trim()}
          className={`btn-primary w-full ${loading || !escrowIdToView.trim() ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <LoadingIndicator size={"sm" as const} />
              <span>Searching...</span>
            </div>
          ) : (
            "Find Escrow"
          )}
        </button>
      </form>

      <div className="mt-8 p-4 bg-muted rounded-lg">
        <h4 className="font-medium text-foreground mb-2">How to Find Escrow IDs</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Check your transaction history for escrow creation</li>
          <li>• Ask the other party for the escrow ID</li>
          <li>• Look in your "My Escrows" tab for active escrows</li>
          <li>• Check blockchain explorer for contract interactions</li>
        </ul>
      </div>
    </div>
  )
}

export default FindEscrowTab

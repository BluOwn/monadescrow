"use client"

import type React from "react"
import LoadingIndicator from "./LoadingIndicator"

interface CreateEscrowTabProps {
  handleCreateEscrow: (e: React.FormEvent<HTMLFormElement>) => Promise<void>
  sellerAddress: string
  setSellerAddress: (address: string) => void
  arbiterAddress: string
  setArbiterAddress: (address: string) => void
  amount: string
  setAmount: (amount: string) => void
  loading: boolean
  currentAccount: string
}

const CreateEscrowTab: React.FC<CreateEscrowTabProps> = ({
  handleCreateEscrow,
  sellerAddress,
  setSellerAddress,
  arbiterAddress,
  setArbiterAddress,
  amount,
  setAmount,
  loading,
  currentAccount,
}) => {
  return (
    <div className="bg-card border border-border rounded-lg p-8 shadow-sm">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-card-foreground mb-2">Create New Escrow</h2>
        <p className="text-muted-foreground">
          Set up a secure escrow transaction with a seller and arbiter. You will be the buyer.
        </p>
      </div>

      <form onSubmit={handleCreateEscrow} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="seller" className="text-sm font-medium text-foreground">
              Seller Address
            </label>
            <input
              id="seller"
              type="text"
              value={sellerAddress}
              onChange={(e) => setSellerAddress(e.target.value)}
              placeholder="0x..."
              className="input-field w-full"
              required
            />
            <p className="text-xs text-muted-foreground">The address that will receive funds upon completion</p>
          </div>

          <div className="space-y-2">
            <label htmlFor="arbiter" className="text-sm font-medium text-foreground">
              Arbiter Address
            </label>
            <input
              id="arbiter"
              type="text"
              value={arbiterAddress}
              onChange={(e) => setArbiterAddress(e.target.value)}
              placeholder="0x..."
              className="input-field w-full"
              required
            />
            <p className="text-xs text-muted-foreground">Neutral party who can resolve disputes</p>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="amount" className="text-sm font-medium text-foreground">
            Amount (ETH)
          </label>
          <input
            id="amount"
            type="number"
            step="0.001"
            min="0"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0.0"
            className="input-field w-full"
            required
          />
          <p className="text-xs text-muted-foreground">Amount to be held in escrow</p>
        </div>

        <div className="bg-muted p-4 rounded-lg">
          <h4 className="font-medium text-foreground mb-2">Transaction Summary</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <div className="flex justify-between">
              <span>Buyer (You):</span>
              <span className="font-mono">
                {currentAccount ? `${currentAccount.slice(0, 6)}...${currentAccount.slice(-4)}` : "Not connected"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Seller:</span>
              <span className="font-mono">{sellerAddress || "Not set"}</span>
            </div>
            <div className="flex justify-between">
              <span>Arbiter:</span>
              <span className="font-mono">{arbiterAddress || "Not set"}</span>
            </div>
            <div className="flex justify-between font-medium text-foreground">
              <span>Amount:</span>
              <span>{amount || "0"} ETH</span>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || !sellerAddress || !arbiterAddress || !amount}
          className={`btn-primary w-full ${loading || !sellerAddress || !arbiterAddress || !amount ? "opacity-50 cursor-not-allowed" : ""}`}
        >
          {loading ? (
            <div className="flex items-center justify-center space-x-2">
              <LoadingIndicator size={"sm" as const} />
              <span>Creating Escrow...</span>
            </div>
          ) : (
            "Create Escrow"
          )}
        </button>
      </form>
    </div>
  )
}

export default CreateEscrowTab

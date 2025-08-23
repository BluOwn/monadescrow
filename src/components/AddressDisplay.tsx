"use client"

import type React from "react"
import { useState } from "react"

interface AddressDisplayProps {
  address: string
  className?: string
}

const AddressDisplay: React.FC<AddressDisplayProps> = ({ address, className = "" }) => {
  const [copied, setCopied] = useState(false)

  const formatAddress = (addr: string) => {
    if (!addr) return ""
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy address:", err)
    }
  }

  return (
    <button
      onClick={copyToClipboard}
      className={`inline-flex items-center space-x-2 px-3 py-1.5 bg-muted hover:bg-accent rounded-lg transition-colors duration-200 text-sm font-mono ${className}`}
      title={`Click to copy: ${address}`}
    >
      <span className="text-muted-foreground">{formatAddress(address)}</span>
      {copied ? (
        <svg className="w-4 h-4 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      )}
    </button>
  )
}

export default AddressDisplay

"use client"

import type React from "react"

interface EscrowTimelineProps {
  escrowStatus: "created" | "funded" | "completed" | "disputed"
  disputeRaised?: boolean
}

const EscrowTimeline: React.FC<EscrowTimelineProps> = ({ escrowStatus, disputeRaised = false }) => {
  const steps = [
    {
      id: "created",
      title: "Escrow Created",
      description: "Escrow contract has been initialized",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
      ),
    },
    {
      id: "funded",
      title: "Funds Deposited",
      description: "Buyer has deposited funds into escrow",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
    },
    {
      id: "completed",
      title: "Transaction Complete",
      description: "Funds have been released to seller",
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      ),
    },
  ]

  const disputeStep = {
    id: "disputed",
    title: "Dispute Raised",
    description: "Transaction is under dispute resolution",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
        />
      </svg>
    ),
  }

  const getStepStatus = (stepId: string) => {
    const statusOrder = ["created", "funded", "completed"]
    const currentIndex = statusOrder.indexOf(escrowStatus)
    const stepIndex = statusOrder.indexOf(stepId)

    if (disputeRaised && stepId === "disputed") return "current"
    if (stepIndex <= currentIndex) return "completed"
    if (stepIndex === currentIndex + 1) return "current"
    return "upcoming"
  }

  const getStepClasses = (status: string) => {
    switch (status) {
      case "completed":
        return {
          container: "text-green-600 dark:text-green-400",
          icon: "bg-green-600 text-white",
          line: "bg-green-600",
        }
      case "current":
        return {
          container: "text-primary",
          icon: "bg-primary text-primary-foreground",
          line: "bg-muted",
        }
      case "upcoming":
        return {
          container: "text-muted-foreground",
          icon: "bg-muted text-muted-foreground",
          line: "bg-muted",
        }
      default:
        return {
          container: "text-muted-foreground",
          icon: "bg-muted text-muted-foreground",
          line: "bg-muted",
        }
    }
  }

  const allSteps = disputeRaised ? [...steps.slice(0, 2), disputeStep, steps[2]] : steps

  return (
    <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
      <h4 className="text-lg font-semibold text-card-foreground mb-6">Transaction Timeline</h4>

      <div className="space-y-6">
        {allSteps.map((step, index) => {
          const status = step.id === "disputed" ? (disputeRaised ? "current" : "upcoming") : getStepStatus(step.id)
          const classes = getStepClasses(status)
          const isLast = index === allSteps.length - 1

          return (
            <div key={step.id} className="flex items-start space-x-4">
              <div className="flex flex-col items-center">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center ${classes.icon} transition-colors duration-200`}
                >
                  {step.icon}
                </div>
                {!isLast && <div className={`w-0.5 h-8 mt-2 ${classes.line} transition-colors duration-200`} />}
              </div>

              <div className={`flex-1 ${classes.container} transition-colors duration-200`}>
                <h5 className="font-medium text-base mb-1">{step.title}</h5>
                <p className="text-sm opacity-75">{step.description}</p>
                {status === "current" && (
                  <div className="mt-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-current rounded-full animate-pulse" />
                      <span className="text-xs font-medium">In Progress</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {disputeRaised && (
        <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <div className="flex items-center space-x-2 mb-2">
            <svg
              className="w-5 h-5 text-red-600 dark:text-red-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <h6 className="font-medium text-red-800 dark:text-red-200">Dispute Active</h6>
          </div>
          <p className="text-sm text-red-700 dark:text-red-300">
            This transaction is currently under dispute. The arbiter will need to resolve this issue before funds can be
            released.
          </p>
        </div>
      )}
    </div>
  )
}

export default EscrowTimeline

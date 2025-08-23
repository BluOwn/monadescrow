"use client"

import type React from "react"

interface AnimatedProgressProps {
  value: number
  variant?: "primary" | "warning" | "success" | "danger"
  label?: string
  className?: string
}

const AnimatedProgress: React.FC<AnimatedProgressProps> = ({ value, variant = "primary", label, className = "" }) => {
  const variantClasses = {
    primary: "bg-primary",
    warning: "bg-amber-500",
    success: "bg-green-500",
    danger: "bg-red-500",
  }

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">{label}</span>
          <span className="text-foreground font-medium">{Math.round(value)}%</span>
        </div>
      )}
      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
        <div
          className={`h-full ${variantClasses[variant]} transition-all duration-300 ease-out rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  )
}

export default AnimatedProgress

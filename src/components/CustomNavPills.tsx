"use client"

import type React from "react"

interface Tab {
  id: string
  label: string
  icon: string
}

interface CustomNavPillsProps {
  activeTab: string
  onTabChange: (tabId: string) => void
  tabs: Tab[]
}

const CustomNavPills: React.FC<CustomNavPillsProps> = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="flex flex-wrap gap-2 p-1 bg-muted rounded-lg">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all duration-200 ${
            activeTab === tab.id
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
          }`}
        >
          <span className="text-lg">{tab.icon}</span>
          <span className="text-sm">{tab.label}</span>
        </button>
      ))}
    </div>
  )
}

export default CustomNavPills

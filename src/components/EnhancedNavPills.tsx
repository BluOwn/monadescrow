// src/components/EnhancedNavPills.tsx
import React from 'react';

interface Tab {
  id: string;
  label: string;
  icon: string;
  description?: string;
}

interface EnhancedNavPillsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Tab[];
}

const EnhancedNavPills: React.FC<EnhancedNavPillsProps> = ({ 
  activeTab, 
  onTabChange, 
  tabs 
}) => {
  return (
    <div className="enhanced-nav-pills">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`enhanced-nav-pill ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          type="button"
        >
          <div className="enhanced-nav-pill-content">
            <span className="enhanced-nav-pill-icon">{tab.icon}</span>
            <div className="enhanced-nav-pill-text">
              <div className="enhanced-nav-pill-label">{tab.label}</div>
              {tab.description && (
                <p className="enhanced-nav-pill-description">{tab.description}</p>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default EnhancedNavPills;
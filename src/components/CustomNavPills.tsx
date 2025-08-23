// src/components/CustomNavPills.tsx
import React from 'react';

interface NavPillsProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  tabs: Array<{
    id: string;
    label: string;
    icon?: string;
  }>;
}

const CustomNavPills: React.FC<NavPillsProps> = ({ activeTab, onTabChange, tabs }) => {
  return (
    <div className="custom-nav-pills">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          className={`nav-pill ${activeTab === tab.id ? 'active' : ''}`}
          onClick={() => onTabChange(tab.id)}
          type="button"
        >
          {tab.icon && <span className="me-2">{tab.icon}</span>}
          {tab.label}
        </button>
      ))}
    </div>
  );
};

export default CustomNavPills;
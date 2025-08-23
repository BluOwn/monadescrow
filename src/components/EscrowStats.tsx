// src/components/EscrowStats.tsx
import React from 'react';
import { Card } from 'react-bootstrap';

interface EscrowData {
  id: string;
  buyer: string;
  seller: string;
  arbiter: string;
  amount: string;
  status: 'pending' | 'funded' | 'completed' | 'disputed' | 'resolved';
  createdAt: Date;
  description?: string;
}

interface EscrowStatsProps {
  escrows: EscrowData[];
}

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  color?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

const StatCard: React.FC<StatCardProps> = ({ 
  icon, 
  value, 
  label, 
  color = '#6366f1',
  trend 
}) => (
  <Card className="stat-card">
    <div className="stat-icon" style={{ color }}>{icon}</div>
    <div className="stat-value">{value}</div>
    <div className="stat-label">{label}</div>
    {trend && (
      <div className={`stat-trend ${trend.isPositive ? 'positive' : 'negative'}`}>
        <span className="trend-icon">
          {trend.isPositive ? '↗️' : '↘️'}
        </span>
        <span className="trend-value">{Math.abs(trend.value)}%</span>
      </div>
    )}
  </Card>
);

const EscrowStats: React.FC<EscrowStatsProps> = ({ escrows }) => {
  const totalEscrows = escrows.length;
  
  const statusCounts = escrows.reduce((acc, escrow) => {
    acc[escrow.status] = (acc[escrow.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const totalValue = escrows.reduce((sum, escrow) => {
    return sum + parseFloat(escrow.amount || '0');
  }, 0);

  const completedEscrows = statusCounts.completed || 0;
  const successRate = totalEscrows > 0 ? (completedEscrows / totalEscrows) * 100 : 0;

  const activeEscrows = (statusCounts.pending || 0) + (statusCounts.funded || 0);
  const disputedEscrows = statusCounts.disputed || 0;

  const stats = [
    {
      icon: '📊',
      value: totalEscrows,
      label: 'Total Escrows',
      color: '#6366f1',
      trend: { value: 12, isPositive: true }
    },
    {
      icon: '💰',
      value: `${totalValue.toFixed(2)} MON`,
      label: 'Total Value',
      color: '#10b981',
      trend: { value: 8, isPositive: true }
    },
    {
      icon: '✅',
      value: `${successRate.toFixed(1)}%`,
      label: 'Success Rate',
      color: '#059669',
      trend: { value: 5, isPositive: true }
    },
    {
      icon: '⚡',
      value: activeEscrows,
      label: 'Active Escrows',
      color: '#f59e0b',
      trend: { value: 3, isPositive: false }
    },
    {
      icon: '⚠️',
      value: disputedEscrows,
      label: 'Disputed',
      color: '#ef4444',
      trend: disputedEscrows > 0 ? { value: 2, isPositive: false } : undefined
    }
  ];

  return (
    <div className="escrow-stats">
      <div className="stats-header mb-4">
        <h4>Your Escrow Statistics</h4>
        <p className="text-muted">Overview of your escrow activity</p>
      </div>
      
      <div className="stats-grid">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>
    </div>
  );
};

export default EscrowStats;
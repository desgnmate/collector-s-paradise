'use client';

import { useAdminData } from '@/contexts/AdminDataContext';

export default function DashboardContent() {
  const { stats, loading, error, refreshData } = useAdminData();

  // Fallback stats while loading or if stats is null
  const displayStats = stats || {
    totalVendors: 0,
    pendingVendors: 0,
    approvedVendors: 0,
    totalEvents: 0,
  };

  const statCards = [
    {
      label: 'Total Vendors',
      value: displayStats.totalVendors,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      color: '#F4C542',
      bg: 'rgba(244, 197, 66, 0.1)',
    },
    {
      label: 'Pending',
      value: displayStats.pendingVendors,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      color: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.1)',
    },
    {
      label: 'Approved',
      value: displayStats.approvedVendors,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      color: '#10b981',
      bg: 'rgba(16, 185, 129, 0.1)',
    },
    {
      label: 'Events',
      value: displayStats.totalEvents,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      color: '#3b82f6',
      bg: 'rgba(59, 130, 246, 0.1)',
    },
  ];

  if (loading && !stats) {
    return (
      <div className="admin-page">
        <div className="admin-dashboard-loading">
          <div className="admin-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">Welcome to Collector&apos;s Paradise Admin Panel.</p>
      </div>

      <div className="admin-stats-grid">
        {statCards.map((card, index) => (
          <div key={index} className="admin-stat-card">
            <div className="admin-stat-icon" style={{ color: card.color, background: card.bg }}>
              {card.icon}
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{card.value}</span>
              <span className="admin-stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-dashboard-section">
        <h2 className="admin-section-title">Quick Actions</h2>
        <div className="admin-quick-actions">
          <a href="/admin/vendors" className="admin-action-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Manage Vendors</span>
          </a>
          <a href="/admin/events" className="admin-action-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>View Events</span>
          </a>
        </div>
      </div>
    </div>
  );
}

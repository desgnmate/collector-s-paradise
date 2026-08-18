'use client';

import { useAdminData } from '@/contexts/AdminDataContext';

export default function AdminHeader() {
  const {
    refreshData,
    refreshing,
    error,
    configurationError,
    lastFetchedAt,
  } = useAdminData();
  
  const handleRefresh = async () => {
    await refreshData();
  };

  const formatTime = (timestamp: number) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  const lastUpdated = lastFetchedAt;

  return (
    <div className="admin-header">
      <div className="admin-header-info">
        <h1 className="admin-header-title">Admin Panel</h1>
        {lastUpdated > 0 && (
          <span className="admin-header-cache-info">
            {refreshing ? 'Syncing in the background…' : `Last synced: ${formatTime(lastUpdated)}`}
          </span>
        )}
        {error && !refreshing && (
          <span className="admin-header-cache-info" role="status">Some data could not sync</span>
        )}
        {configurationError && (
          <span className="admin-header-cache-info" role="status">Server configuration required</span>
        )}
      </div>
      
      <button 
        className={`admin-refresh-btn ${refreshing ? 'loading' : ''}`}
        onClick={handleRefresh}
        disabled={refreshing || Boolean(configurationError)}
        title={configurationError ? 'Admin data access is not configured' : 'Refresh all data'}
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className={refreshing ? 'spinning' : ''}
        >
          <polyline points="23 4 23 10 17 10" />
          <polyline points="1 20 1 14 7 14" />
          <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
        </svg>
        {refreshing ? 'Syncing…' : 'Refresh'}
      </button>
    </div>
  );
}

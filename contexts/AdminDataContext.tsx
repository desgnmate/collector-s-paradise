'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from 'react';
import { Vendor } from '@/app/actions/vendors';
import { Volunteer } from '@/app/actions/volunteers';
import { Sponsor } from '@/app/actions/sponsors';
import { getAllVendors } from '@/app/actions/vendors';
import { getAllVolunteers } from '@/app/actions/volunteers';
import { getAllSponsors } from '@/app/actions/sponsors';
import { getDashboardStats } from '@/app/actions/dashboard';

interface DashboardStats {
  totalVendors: number;
  pendingVendors: number;
  approvedVendors: number;
  totalEvents: number;
}

interface AdminDataContextType {
  vendors: Vendor[];
  volunteers: Volunteer[];
  sponsors: Sponsor[];
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  lastFetchedAt: number;
  
  setVendors: (vendors: Vendor[]) => void;
  setVolunteers: (volunteers: Volunteer[]) => void;
  setSponsors: (sponsors: Sponsor[]) => void;
  setStats: (stats: DashboardStats) => void;
  invalidateCache: (type: 'vendors' | 'volunteers' | 'sponsors' | 'stats') => void;
  refreshData: () => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);

// Cache duration in milliseconds
const CACHE_DURATION = {
  vendors: 2 * 60 * 1000, // 2 minutes
  volunteers: 2 * 60 * 1000, // 2 minutes
  sponsors: 2 * 60 * 1000, // 2 minutes
  stats: 5 * 60 * 1000,   // 5 minutes
};

export function AdminDataProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [volunteers, setVolunteers] = useState<Volunteer[]>([]);
  const [sponsors, setSponsors] = useState<Sponsor[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(0);
  
  const fetchLock = useRef(false);

  const fetchAllData = useCallback(async () => {
    if (fetchLock.current) return;
    fetchLock.current = true;
    setLoading(true);
    setError(null);

    try {
      const [vendorsData, volunteersData, sponsorsData, statsData] = await Promise.all([
        getAllVendors(),
        getAllVolunteers(),
        getAllSponsors(),
        getDashboardStats(),
      ]);

      setVendors(vendorsData);
      setVolunteers(volunteersData);
      setSponsors(sponsorsData);
      setStats(statsData);
      setLastFetchedAt(Date.now());
    } catch (err) {
      console.error('Failed to fetch admin data:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
      fetchLock.current = false;
    }
  }, []);

  const invalidateCache = useCallback((type: 'vendors' | 'volunteers' | 'sponsors' | 'stats') => {
    if (type === 'vendors') {
      setVendors([]);
      fetchAllData();
    } else if (type === 'volunteers') {
      setVolunteers([]);
      fetchAllData();
    } else if (type === 'sponsors') {
      setSponsors([]);
      fetchAllData();
    } else if (type === 'stats') {
      setLastFetchedAt(0);
      fetchAllData();
    }
  }, [fetchAllData]);

  const refreshData = useCallback(async () => {
    setLastFetchedAt(0);
    await fetchAllData();
  }, [fetchAllData]);

  // Initial fetch
  useEffect(() => {
    fetchAllData();
  }, []);

  return (
    <AdminDataContext.Provider
      value={{
        vendors,
        volunteers,
        sponsors,
        stats,
        loading,
        error,
        lastFetchedAt,
        setVendors,
        setVolunteers,
        setSponsors,
        setStats,
        invalidateCache,
        refreshData,
      }}
    >
      {children}
    </AdminDataContext.Provider>
  );
}

export function useAdminData() {
  const context = useContext(AdminDataContext);
  if (context === undefined) {
    throw new Error('useAdminData must be used within an AdminDataProvider');
  }
  return context;
}

'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from 'react';
import { syncAdminData } from '@/app/actions/admin-data';
import type { Vendor } from '@/app/actions/vendors';
import type { Volunteer } from '@/app/actions/volunteers';
import type { Sponsor } from '@/app/actions/sponsors';
import type { Event } from '@/app/actions/events';
import type { AdminDataSection, AdminDataSnapshot } from '@/lib/admin/data';

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
  events: Event[];
  stats: DashboardStats;
  loading: boolean;
  refreshing: boolean;
  refreshingSections: AdminDataSection[];
  error: string | null;
  errors: Partial<Record<AdminDataSection, string>>;
  lastFetchedAt: number;
  setVendors: Dispatch<SetStateAction<Vendor[]>>;
  setVolunteers: Dispatch<SetStateAction<Volunteer[]>>;
  setSponsors: Dispatch<SetStateAction<Sponsor[]>>;
  setEvents: Dispatch<SetStateAction<Event[]>>;
  refreshData: (sections?: AdminDataSection[]) => Promise<void>;
}

const AdminDataContext = createContext<AdminDataContextType | undefined>(undefined);
const ALL_SECTIONS: AdminDataSection[] = ['vendors', 'volunteers', 'sponsors', 'events'];
const FOCUS_REFRESH_INTERVAL = 5 * 60 * 1000;

export function AdminDataProvider({
  children,
  initialData,
}: {
  children: ReactNode;
  initialData?: AdminDataSnapshot;
}) {
  const [vendors, setVendors] = useState<Vendor[]>(initialData?.vendors || []);
  const [volunteers, setVolunteers] = useState<Volunteer[]>(initialData?.volunteers || []);
  const [sponsors, setSponsors] = useState<Sponsor[]>(initialData?.sponsors || []);
  const [events, setEvents] = useState<Event[]>(initialData?.events || []);
  const [loading, setLoading] = useState(!initialData);
  const [refreshingSections, setRefreshingSections] = useState<AdminDataSection[]>([]);
  const [errors, setErrors] = useState<Partial<Record<AdminDataSection, string>>>(
    initialData?.errors || {},
  );
  const [lastFetchedAt, setLastFetchedAt] = useState(initialData?.syncedAt || 0);
  const latestRequestBySection = useRef<Partial<Record<AdminDataSection, number>>>({});
  const activeCountBySection = useRef<Partial<Record<AdminDataSection, number>>>({});
  const requestCounter = useRef(0);
  const refreshingRef = useRef(false);
  const lastFetchedAtRef = useRef(initialData?.syncedAt || 0);

  const stats = useMemo<DashboardStats>(() => ({
    totalVendors: vendors.length,
    pendingVendors: vendors.filter((vendor) => vendor.application_status === 'pending').length,
    approvedVendors: vendors.filter((vendor) => vendor.application_status === 'approved').length,
    totalEvents: events.length,
  }), [events.length, vendors]);

  const refreshData = useCallback(async (requestedSections: AdminDataSection[] = ALL_SECTIONS) => {
    const sections = [...new Set(requestedSections)];
    const requestId = ++requestCounter.current;
    sections.forEach((section) => {
      latestRequestBySection.current[section] = requestId;
      activeCountBySection.current[section] = (activeCountBySection.current[section] || 0) + 1;
    });
    refreshingRef.current = true;
    setRefreshingSections(ALL_SECTIONS.filter((section) => (
      (activeCountBySection.current[section] || 0) > 0
    )));

    try {
      const snapshot = await syncAdminData(sections);
      let appliedSection = false;

      for (const section of sections) {
        if (latestRequestBySection.current[section] !== requestId) continue;

        if (section === 'vendors' && snapshot.vendors) setVendors(snapshot.vendors);
        if (section === 'volunteers' && snapshot.volunteers) setVolunteers(snapshot.volunteers);
        if (section === 'sponsors' && snapshot.sponsors) setSponsors(snapshot.sponsors);
        if (section === 'events' && snapshot.events) setEvents(snapshot.events);
        if (!snapshot.errors[section]) appliedSection = true;
      }

      setErrors((current) => {
        const next = { ...current };
        sections.forEach((section) => {
          if (latestRequestBySection.current[section] !== requestId) return;
          if (snapshot.errors[section]) next[section] = snapshot.errors[section];
          else delete next[section];
        });
        return next;
      });

      if (appliedSection) {
        lastFetchedAtRef.current = snapshot.syncedAt;
        setLastFetchedAt(snapshot.syncedAt);
      }
    } catch (syncError) {
      console.error('Failed to refresh admin data:', syncError);
      setErrors((current) => {
        const next = { ...current };
        sections.forEach((section) => {
          if (latestRequestBySection.current[section] === requestId) {
            next[section] = `Could not sync ${section}. Please try again.`;
          }
        });
        return next;
      });
    } finally {
      setLoading(false);
      sections.forEach((section) => {
        activeCountBySection.current[section] = Math.max(
          0,
          (activeCountBySection.current[section] || 0) - 1,
        );
      });
      const activeSections = ALL_SECTIONS.filter((section) => (
        (activeCountBySection.current[section] || 0) > 0
      ));
      setRefreshingSections(activeSections);
      refreshingRef.current = activeSections.length > 0;
    }
  }, []);

  useEffect(() => {
    if (!initialData) void refreshData();
  }, [initialData, refreshData]);

  useEffect(() => {
    const refreshWhenStale = () => {
      const isVisible = document.visibilityState === 'visible';
      const isStale = Date.now() - lastFetchedAtRef.current >= FOCUS_REFRESH_INTERVAL;
      if (isVisible && isStale && !refreshingRef.current) void refreshData();
    };

    window.addEventListener('focus', refreshWhenStale);
    document.addEventListener('visibilitychange', refreshWhenStale);
    return () => {
      window.removeEventListener('focus', refreshWhenStale);
      document.removeEventListener('visibilitychange', refreshWhenStale);
    };
  }, [refreshData]);

  const error = Object.values(errors)[0] || null;
  const refreshing = refreshingSections.length > 0;

  return (
    <AdminDataContext.Provider
      value={{
        vendors,
        volunteers,
        sponsors,
        events,
        stats,
        loading,
        refreshing,
        refreshingSections,
        error,
        errors,
        lastFetchedAt,
        setVendors,
        setVolunteers,
        setSponsors,
        setEvents,
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

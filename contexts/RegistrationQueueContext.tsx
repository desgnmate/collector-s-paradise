'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  getVendorRegistrations,
  removeDirectoryApproval,
  reviewVendorRegistration,
  type RegistrationRequest,
} from '@/app/actions/vendor-registrations';
import { useAdminData } from '@/contexts/AdminDataContext';

type Notice = { type: 'success' | 'error'; message: string } | null;

type RegistrationQueue = {
  requests: RegistrationRequest[];
  approved: { id: string; business_name: string }[];
  notice: Notice;
  loading: boolean;
  busy: boolean;
  refresh: () => void;
  review: (request: RegistrationRequest, target: string, decline: boolean) => Promise<boolean>;
  removeApproval: (id: string) => Promise<void>;
};

const RegistrationQueueContext = createContext<RegistrationQueue | null>(null);

/**
 * The manual vendor review queue (directory-only registrations and event
 * applications that match an existing vendor). Shared by the sidebar badge,
 * the dashboard's "Needs your attention" list and Vendor Management, and
 * reloaded whenever the admin data is refreshed.
 */
export function RegistrationQueueProvider({ children }: { children: ReactNode }) {
  const { refreshData, lastFetchedAt, configurationError } = useAdminData();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [approved, setApproved] = useState<{ id: string; business_name: string }[]>([]);
  const [notice, setNotice] = useState<Notice>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getVendorRegistrations();
      setRequests(result.requests);
      setApproved(result.approved || []);
      if (result.error) setNotice({ type: 'error', message: result.error });
    } catch {
      setNotice({ type: 'error', message: 'Could not load registration requests. Try refreshing.' });
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on mount and again after every admin data refresh.
  useEffect(() => {
    if (configurationError) { setLoading(false); return; }
    void load();
  }, [load, lastFetchedAt, configurationError]);

  const review = useCallback(async (request: RegistrationRequest, target: string, decline: boolean) => {
    if (!decline && !target) {
      setNotice({ type: 'error', message: 'Choose an existing vendor or create a new profile first.' });
      return false;
    }
    if (!window.confirm(decline ? 'Decline this registration request?' : request.kind === 'directory'
      ? 'Approve this public directory listing? Confirm the submitted business identity before linking an existing profile.'
      : 'Link this request and create pending event applications? Existing profiles and event decisions will be preserved.')) return false;
    setBusy(true);
    try {
      const result = await reviewVendorRegistration(request.id, target && target !== 'new' ? target : null, decline);
      setNotice({ type: result.success ? 'success' : 'error', message: result.message });
      if (result.success) { await load(); await refreshData(['vendors']); }
      return result.success;
    } catch {
      setNotice({ type: 'error', message: 'Review failed. Refresh to check whether it was saved before retrying.' });
      return false;
    } finally {
      setBusy(false);
    }
  }, [load, refreshData]);

  const removeApproval = useCallback(async (id: string) => {
    if (!window.confirm('Remove directory-only approval for this vendor? Event approvals will remain unchanged.')) return;
    setBusy(true);
    try {
      const result = await removeDirectoryApproval(id);
      setNotice({ type: result.success ? 'success' : 'error', message: result.message });
      if (result.success) { await load(); await refreshData(['vendors']); }
    } catch {
      setNotice({ type: 'error', message: 'Could not remove approval. Refresh and try again.' });
    } finally {
      setBusy(false);
    }
  }, [load, refreshData]);

  const refresh = useCallback(() => { setNotice(null); void load(); }, [load]);

  const value = useMemo(
    () => ({ requests, approved, notice, loading, busy, refresh, review, removeApproval }),
    [requests, approved, notice, loading, busy, refresh, review, removeApproval],
  );
  return <RegistrationQueueContext.Provider value={value}>{children}</RegistrationQueueContext.Provider>;
}

export function useRegistrationQueue() {
  const context = useContext(RegistrationQueueContext);
  if (!context) throw new Error('useRegistrationQueue must be used within RegistrationQueueProvider');
  return context;
}

/** Remember which Vendor Management tab to open after navigating there. */
export const VENDOR_VIEW_STORAGE_KEY = 'admin-vendors-view';
export function requestVendorView(view: 'events' | 'unassigned' | 'vendors' | 'review') {
  try { sessionStorage.setItem(VENDOR_VIEW_STORAGE_KEY, view); } catch { /* storage unavailable */ }
}

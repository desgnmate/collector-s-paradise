'use client';

import { useCallback, useEffect, useState } from 'react';
import { getVendorRegistrations, reviewVendorRegistration, removeDirectoryApproval, type RegistrationRequest } from '@/app/actions/vendor-registrations';
import { useAdminData } from '@/contexts/AdminDataContext';

export default function VendorRegistrationQueue() {
  const { vendors, events, refreshData } = useAdminData();
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [approved, setApproved] = useState<{ id: string; business_name: string }[]>([]);
  const [targets, setTargets] = useState<Record<string, string>>({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getVendorRegistrations();
      setRequests(result.requests);
      setApproved(result.approved || []);
      if (result.error) setMessage(result.error);
    } catch { setMessage('Could not load registration requests. Try refreshing.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void load(); }, [load]);
  async function review(request: RegistrationRequest, decline: boolean) {
    const target = targets[request.id];
    if (!decline && !target) { setMessage('Choose an existing vendor or create a new profile first.'); return; }
    if (!window.confirm(decline ? 'Decline this registration request?' : request.kind === 'directory'
      ? 'Approve this public directory listing? Confirm the submitted business identity before linking an existing profile.'
      : 'Link this request and create pending event applications? Existing profiles and event decisions will be preserved.')) return;
    setBusy(true);
    try {
      const result = await reviewVendorRegistration(request.id, target && target !== 'new' ? target : null, decline);
      setMessage(result.message);
      if (result.success) { await load(); await refreshData(['vendors']); }
    } catch { setMessage('Review failed. Refresh to check whether it was saved before retrying.'); }
    finally { setBusy(false); }
  }
  async function removeApproval(id: string) {
    if (!window.confirm('Remove directory-only approval for this vendor? Event approvals will remain unchanged.')) return;
    setBusy(true);
    try {
      const result = await removeDirectoryApproval(id);
      setMessage(result.message);
      if (result.success) { await load(); await refreshData(['vendors']); }
    } catch { setMessage('Could not remove approval. Refresh and try again.'); }
    finally { setBusy(false); }
  }
  return <section className="vendor-form-section" aria-label="Registration review">
    <h3>Directory registrations &amp; repeat applications</h3>
    <p>Review submitted details before linking a profile. Directory approval does not approve attendance. No automated event emails are sent by these review buttons.</p>
    <button type="button" disabled={loading || busy} onClick={() => { setMessage(''); void load(); }}>Refresh requests</button>
    {message && <p role="status">{message}</p>}
    {loading ? <p>Loading requests…</p> : requests.length === 0 ? <p>No pending registrations.</p> : <p>Showing the oldest {requests.length} pending requests.</p>}
    {approved.length > 0 && <details><summary>Approved directory listings ({approved.length}, up to 100)</summary>
      <ul>{approved.map(v => <li key={v.id}>{v.business_name}{' '}<button type="button" disabled={busy || loading} onClick={() => void removeApproval(v.id)}>Remove directory approval</button></li>)}</ul>
    </details>}
    {requests.map(request => {
      const d = request.details;
      const matches = vendors.filter(v => v.email.trim().toLowerCase() === d.email.trim().toLowerCase() || v.business_name.trim().replace(/\s+/g, ' ').toLowerCase() === d.business_name.trim().replace(/\s+/g, ' ').toLowerCase());
      return <details key={request.id} style={{ marginTop: 16, padding: 16, border: '1px solid #888', borderRadius: 8 }}>
        <summary>{d.business_name} — {request.kind === 'directory' ? 'Directory only' : 'Event application'} — {new Date(request.created_at).toLocaleDateString()}</summary>
        <p>{d.contact_name} · {d.email} · {d.phone} · {d.location_state}</p>
        <p>{d.description}</p>
        <p>Categories: {d.categories.join(', ')} · Website/social: {d.social_links}</p>
        <p>Submitted logo: <a href={/^https?:\/\//.test(d.logo_url) ? d.logo_url : undefined} target="_blank" rel="noopener noreferrer">View image</a></p>
        {request.kind === 'events' && <p>Events: {request.event_ids.map(id => events.find(e => e.id === id)?.title || id).join(', ')}<br />Tables: {d.tables_requested} · Power: {d.power_requirements || 'None specified'}</p>}
        <p>Notes: {d.additional_notes || 'None'}</p>
        {matches.length > 0 && <p>Possible matches (verify before linking): {matches.map(v => `${v.business_name} (${v.email}, ${v.id})`).join('; ')}</p>}
        <label>Profile to use <select value={targets[request.id] || ''} disabled={busy} onChange={e => setTargets(t => ({ ...t, [request.id]: e.target.value }))}>
          <option value="">Select after reviewing</option>
          <option value="new">Create new profile (only if no matching identity exists)</option>
          {vendors.map(v => <option key={v.id} value={v.id}>{v.business_name} — {v.email} — {v.id.slice(0, 8)}</option>)}
        </select></label>
        <p>Linking retains the existing profile’s contact details, logo, and prior decisions. Follow up manually if identity is uncertain.</p>
        <button type="button" disabled={busy || loading} onClick={() => void review(request, false)}>{request.kind === 'directory' ? 'Approve directory listing' : 'Create pending event applications'}</button>{' '}
        <button type="button" disabled={busy || loading} onClick={() => void review(request, true)}>Decline request</button>
      </details>;
    })}
  </section>;
}

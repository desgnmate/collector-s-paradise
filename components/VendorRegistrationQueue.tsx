'use client';

import { useCallback, useMemo, useState } from 'react';
import Image from 'next/image';
import type { RegistrationRequest } from '@/app/actions/vendor-registrations';
import { useAdminData } from '@/contexts/AdminDataContext';
import { useRegistrationQueue } from '@/contexts/RegistrationQueueContext';
import { FilterSelect, RowChevron, SearchField, useEscapeToClose } from '@/components/admin/ui';

type KindFilter = 'all' | 'events' | 'directory';

const PAGE_SIZE = 20;
const KIND_LABELS: Record<RegistrationRequest['kind'], string> = {
  events: 'Event application',
  directory: 'Directory only',
};

const normaliseName = (value: string) => value.trim().replace(/\s+/g, ' ').toLowerCase();
const normaliseEmail = (value: string) => value.trim().toLowerCase();
const isHttpUrl = (value: string | undefined) => Boolean(value && /^https?:\/\//i.test(value));
const formatDate = (value: string) => new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

export default function VendorRegistrationQueue() {
  const { vendors, events } = useAdminData();
  const { requests, approved, notice, loading, busy, review, removeApproval } = useRegistrationQueue();
  const [kind, setKind] = useState<KindFilter>('all');
  const [search, setSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [targets, setTargets] = useState<Record<string, string>>({});

  const matchesFor = useCallback((request: RegistrationRequest) => vendors.filter((vendor) =>
    normaliseEmail(vendor.email) === normaliseEmail(request.details.email)
    || normaliseName(vendor.business_name) === normaliseName(request.details.business_name)), [vendors]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return requests.filter((request) => (kind === 'all' || request.kind === kind) && (!query || [
      request.details.business_name, request.details.contact_name, request.details.email,
    ].some((value) => value.toLowerCase().includes(query))));
  }, [requests, kind, search]);

  const active = requests.find((request) => request.id === activeId) || null;
  useEscapeToClose(Boolean(active), () => setActiveId(null), busy);
  const activeMatches = active ? matchesFor(active) : [];
  const counts = {
    all: requests.length,
    events: requests.filter((request) => request.kind === 'events').length,
    directory: requests.filter((request) => request.kind === 'directory').length,
  };

  async function decide(decline: boolean) {
    if (!active) return;
    const done = await review(active, targets[active.id] || '', decline);
    if (done) setActiveId(null);
  }

  return (
    <section aria-label="Registration review">
      <p className="admin-section-intro">
        Directory-only sign-ups, plus event applications whose email or business name matches an existing vendor.
        Link each one to the right profile before it joins an event roster. Nothing here sends an email.
      </p>

      {notice && <div className={`admin-alert admin-alert-${notice.type}`} role="status">{notice.message}</div>}

      <div className="admin-filter-bar">
        <SearchField value={search} onChange={(value) => { setSearch(value); setVisibleCount(PAGE_SIZE); }} placeholder="Search requests" label="Search review requests" />
        <FilterSelect
          label="Type"
          value={kind}
          onChange={(value) => { setKind(value); setVisibleCount(PAGE_SIZE); }}
          options={[
            { value: 'all', label: 'All requests', count: counts.all },
            { value: 'events', label: 'Event applications', count: counts.events },
            { value: 'directory', label: 'Directory only', count: counts.directory },
          ]}
        />
      </div>

      <div className="vendor-management-directory vendor-review-list" aria-busy={loading}>
        {loading && requests.length === 0 ? (
          <div className="vendor-management-empty">Loading requests…</div>
        ) : filtered.length === 0 ? (
          <div className="vendor-management-empty">
            {requests.length === 0 ? 'All caught up — no submissions are waiting for review.' : 'No requests match this view.'}
          </div>
        ) : filtered.slice(0, visibleCount).map((request) => {
          const details = request.details;
          const hasMatch = matchesFor(request).length > 0;
          return (
            <div key={request.id} className="vendor-management-profile-card vendor-review-row is-clickable" onClick={() => setActiveId(request.id)}>
              <span className="vendor-management-avatar">
                {isHttpUrl(details.logo_url)
                  ? <Image src={details.logo_url} alt="" fill unoptimized sizes="48px" />
                  : details.business_name.slice(0, 2).toUpperCase()}
              </span>
              <span className="vendor-management-profile-copy">
                <strong>{details.business_name}</strong>
                <span>{details.contact_name} · {details.email}</span>
              </span>
              <span className="vendor-review-meta">
                <span className={`vendor-review-kind is-${request.kind}`}>{KIND_LABELS[request.kind]}</span>
                {hasMatch && <span className="vendor-review-kind is-match">Possible match</span>}
                <small>{formatDate(request.created_at)}</small>
              </span>
              <button
                type="button"
                className="admin-row-open"
                aria-label={`Review ${details.business_name} — ${KIND_LABELS[request.kind]}`}
                onClick={(event) => { event.stopPropagation(); setActiveId(request.id); }}
              >
                <RowChevron />
              </button>
            </div>
          );
        })}
      </div>
      {filtered.length > visibleCount && (
        <div className="vendor-review-more">
          <span>Showing {visibleCount} of {filtered.length}</span>
          <button type="button" className="admin-text-button" onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}>
            Show {Math.min(PAGE_SIZE, filtered.length - visibleCount)} more
          </button>
        </div>
      )}
      {requests.length >= 100 && (
        <p className="vendor-review-footnote">The oldest 100 requests are shown. Process some and refresh to load the next batch.</p>
      )}

      {approved.length > 0 && (
        <details className="vendor-review-approved">
          <summary>Approved directory listings ({approved.length}{approved.length >= 100 ? ', first 100' : ''})</summary>
          <ul>
            {approved.map((vendor) => (
              <li key={vendor.id}>
                <span>{vendor.business_name}</span>
                <button type="button" className="admin-text-button is-danger" disabled={busy || loading} onClick={() => void removeApproval(vendor.id)}>
                  Remove directory approval
                </button>
              </li>
            ))}
          </ul>
        </details>
      )}

      {active && (
        <div className="modal-overlay" onClick={() => !busy && setActiveId(null)}>
          <div className="modal-content modal-lg vendor-management-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="registration-review-title">
            <div className="modal-header">
              <button type="button" className="modal-close-btn" onClick={() => setActiveId(null)} disabled={busy} aria-label="Close">✕</button>
              <p className="vendor-management-modal-kicker">{KIND_LABELS[active.kind]} · {formatDate(active.created_at)}</p>
              <h3 className="modal-title" id="registration-review-title">{active.details.business_name}</h3>
              <p className="modal-vendor-name">{active.details.contact_name} · {active.details.email}</p>
            </div>
            <div className="modal-body vendor-management-review-grid">
              <div className="vendor-management-review-profile">
                <h4>Submitted details</h4>
                <p>{active.details.description || 'No business description.'}</p>
                <dl>
                  <div><dt>Phone</dt><dd>{active.details.phone || 'Not provided'}</dd></div>
                  <div><dt>State</dt><dd>{active.details.location_state || 'Not provided'}</dd></div>
                  <div><dt>Categories</dt><dd>{active.details.categories.join(', ') || 'Not provided'}</dd></div>
                  <div>
                    <dt>Social</dt>
                    <dd>{isHttpUrl(active.details.social_links)
                      ? <a href={active.details.social_links} target="_blank" rel="noopener noreferrer">{active.details.social_links}</a>
                      : active.details.social_links || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt>Logo</dt>
                    <dd>{isHttpUrl(active.details.logo_url)
                      ? <a href={active.details.logo_url} target="_blank" rel="noopener noreferrer">View submitted logo</a>
                      : 'Not provided'}</dd>
                  </div>
                  {active.kind === 'events' && (
                    <>
                      <div><dt>Events</dt><dd>{active.event_ids.map((id) => events.find((event) => event.id === id)?.title || id).join(', ')}</dd></div>
                      <div><dt>Tables</dt><dd>{active.details.tables_requested || 'Not specified'}</dd></div>
                      <div><dt>Power</dt><dd>{active.details.power_requirements || 'None specified'}</dd></div>
                    </>
                  )}
                  <div><dt>Notes</dt><dd>{active.details.additional_notes || 'None'}</dd></div>
                </dl>
              </div>

              <div className="vendor-management-decision-form">
                {activeMatches.length > 0 && (
                  <div className="vendor-review-matches">
                    <strong>Possible existing profile{activeMatches.length === 1 ? '' : 's'}</strong>
                    <p>Matched on email or business name. Verify before linking.</p>
                    <ul>
                      {activeMatches.map((vendor) => (
                        <li key={vendor.id}>
                          <span><b>{vendor.business_name}</b><small>{vendor.email}</small></span>
                          <button
                            type="button"
                            className="vendor-management-row-action"
                            disabled={busy}
                            aria-pressed={targets[active.id] === vendor.id}
                            onClick={() => setTargets((current) => ({ ...current, [active.id]: vendor.id }))}
                          >
                            {targets[active.id] === vendor.id ? 'Selected' : 'Use this profile'}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <label>
                  Profile to use
                  <select
                    value={targets[active.id] || ''}
                    disabled={busy}
                    onChange={(event) => setTargets((current) => ({ ...current, [active.id]: event.target.value }))}
                  >
                    <option value="">Select after reviewing</option>
                    <option value="new">Create new profile (only if no matching identity exists)</option>
                    {vendors.map((vendor) => (
                      <option key={vendor.id} value={vendor.id}>{vendor.business_name} — {vendor.email}</option>
                    ))}
                  </select>
                </label>
                <p className="vendor-review-hint">
                  Linking keeps the existing profile’s contact details, logo and earlier decisions.
                  {active.kind === 'events' && ' Event applications are created as pending, for a separate decision on each event roster.'}
                </p>
              </div>
            </div>
            <div className="modal-footer vendor-management-modal-actions">
              <button type="button" className="modal-footer-btn modal-footer-danger" disabled={busy} onClick={() => void decide(true)}>Decline request</button>
              <div>
                <button type="button" className="modal-footer-btn modal-footer-secondary" disabled={busy} onClick={() => setActiveId(null)}>Cancel</button>
                <button type="button" className="modal-footer-btn modal-footer-primary" disabled={busy || !targets[active.id]} onClick={() => void decide(false)}>
                  {busy ? 'Saving…' : active.kind === 'directory' ? 'Approve directory listing' : 'Create pending event applications'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

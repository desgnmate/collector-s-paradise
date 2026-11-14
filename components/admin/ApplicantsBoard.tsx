'use client';

import { useMemo, useState, type ReactNode } from 'react';
import {
  ActionMenu,
  DecisionControl,
  RowChevron,
  SearchField,
  SidePanel,
  StatusPill,
  UnderlineTabs,
  type DecisionTone,
  type PillTone,
} from '@/components/admin/ui';

export type ApplicantStatusConfig<S extends string> = {
  value: S;
  /** Tab and pill label, e.g. "Approved". */
  label: string;
  /** Verb in the decision control, e.g. "Approve". */
  decisionLabel: string;
  tone: DecisionTone;
  pill: PillTone;
  /** Whether saving this decision emails the applicant. */
  emails: boolean;
};

export type ActionResult = { success?: boolean; message: string; email_error?: string };

type Notice = { type: 'success' | 'error' | 'warning'; message: string } | null;

/**
 * Sponsor and volunteer applications share this layout: one row of status
 * tabs, quiet rows with no buttons, and a side panel where the decision is
 * one choice plus one Save. Delete lives in the panel's ⋯ menu.
 */
export default function ApplicantsBoard<T, S extends string>({
  title,
  subtitle,
  noun,
  items,
  statuses,
  getId,
  getName,
  getStatus,
  getSearchText,
  renderRowMeta,
  renderRowExtra,
  renderDetails,
  decide,
  remove,
  applyStatus,
  removeItem,
  loading,
  error,
  onRetry,
}: {
  title: string;
  subtitle: string;
  /** Singular noun used in copy, e.g. "sponsor". */
  noun: string;
  items: T[];
  statuses: ApplicantStatusConfig<S>[];
  getId: (item: T) => string;
  getName: (item: T) => string;
  getStatus: (item: T) => S;
  getSearchText: (item: T) => string;
  renderRowMeta: (item: T) => ReactNode;
  renderRowExtra?: (item: T) => ReactNode;
  renderDetails: (item: T) => ReactNode;
  decide: (item: T, status: S, reason: string) => Promise<ActionResult>;
  remove: (item: T) => Promise<ActionResult>;
  applyStatus: (id: string, status: S, reason: string | null) => void;
  removeItem: (id: string) => void;
  loading: boolean;
  error?: string;
  onRetry: () => void;
}) {
  const [tab, setTab] = useState<'all' | S>('all');
  const [search, setSearch] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [nextStatus, setNextStatus] = useState<S | null>(null);
  const [reason, setReason] = useState('');
  const [processing, setProcessing] = useState(false);
  const [panelNotice, setPanelNotice] = useState<Notice>(null);
  const [pageNotice, setPageNotice] = useState<Notice>(null);

  const statusByValue = useMemo(() => new Map(statuses.map((status) => [status.value, status])), [statuses]);
  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((item) => (tab === 'all' || getStatus(item) === tab)
      && (!query || getSearchText(item).toLowerCase().includes(query)));
  }, [items, tab, search, getStatus, getSearchText]);

  const active = activeId ? items.find((item) => getId(item) === activeId) || null : null;
  const currentStatus = active ? getStatus(active) : null;
  const chosen = nextStatus ?? currentStatus;
  const chosenConfig = chosen ? statusByValue.get(chosen) : undefined;
  // There is no "back to pending" action, so Pending is only offered while it is current.
  const decisionOptions = statuses
    .filter((status) => status.value !== statuses[0].value || currentStatus === statuses[0].value)
    .map((status) => ({ value: status.value, label: status.decisionLabel, tone: status.tone }));

  const openPanel = (item: T) => {
    setActiveId(getId(item));
    setNextStatus(null);
    setReason('');
    setPanelNotice(null);
  };
  const closePanel = () => { if (!processing) setActiveId(null); };

  const save = async () => {
    if (!active || !chosen || chosen === currentStatus) return;
    setProcessing(true);
    setPanelNotice(null);
    try {
      const result = await decide(active, chosen, reason.trim());
      if (!result.success) {
        setPanelNotice({ type: 'error', message: result.message || 'The decision could not be saved.' });
        return;
      }
      applyStatus(getId(active), chosen, chosen === 'rejected' ? reason.trim() || null : null);
      if (result.email_error) {
        setPanelNotice({ type: 'warning', message: result.message });
        setNextStatus(null);
      } else {
        setPageNotice({ type: 'success', message: result.message });
        setActiveId(null);
      }
    } catch {
      setPanelNotice({ type: 'error', message: 'Something went wrong. Refresh to check whether it was saved.' });
    } finally {
      setProcessing(false);
    }
  };

  const deleteActive = async () => {
    if (!active) return;
    if (!window.confirm(`Permanently delete ${getName(active)}? This cannot be undone.`)) return;
    setProcessing(true);
    try {
      const result = await remove(active);
      if (result.success) {
        removeItem(getId(active));
        setPageNotice({ type: 'success', message: result.message || `${getName(active)} deleted.` });
        setActiveId(null);
      } else {
        setPanelNotice({ type: 'error', message: result.message || 'Delete failed.' });
      }
    } catch {
      setPanelNotice({ type: 'error', message: 'Delete failed. Refresh and try again.' });
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-content-panel vendor-management-loading">
        <div className="admin-spinner" /><span>Loading {noun}s…</span>
      </div>
    );
  }

  if (error && items.length === 0) {
    return (
      <div className="admin-content-panel">
        <div className="admin-alert admin-alert-error" role="alert">
          Could not load {noun}s: {error}{' '}
          <button type="button" className="admin-text-button" onClick={onRetry}>Try again</button>
        </div>
      </div>
    );
  }

  const saveLabel = !chosenConfig || chosen === currentStatus
    ? 'Save decision'
    : chosenConfig.emails ? `${chosenConfig.decisionLabel} & email ${noun}` : `Mark as ${chosenConfig.label.toLowerCase()}`;

  return (
    <div className="admin-content-panel">
      <div className="vendor-page-header">
        <div>
          <h2 className="vendor-page-title">{title}</h2>
          <p className="vendor-page-subtitle">{subtitle}</p>
        </div>
      </div>

      {pageNotice && <div className={`admin-alert admin-alert-${pageNotice.type}`} role="status">{pageNotice.message}</div>}

      <UnderlineTabs
        label={`${title} by status`}
        active={tab}
        onChange={(next) => setTab(next)}
        tabs={[
          { key: 'all' as const, label: 'All', count: items.length },
          ...statuses.map((status) => ({
            key: status.value,
            label: status.label,
            count: items.filter((item) => getStatus(item) === status.value).length,
            attention: status.value === statuses[0].value,
          })),
        ]}
      />

      <div className="admin-filter-bar">
        <SearchField value={search} onChange={setSearch} placeholder={`Search ${noun}s`} label={`Search ${noun}s`} />
      </div>

      <div className="admin-row-list">
        {visible.length === 0 ? (
          <p className="vendor-management-empty">{items.length === 0 ? `No ${noun} applications yet.` : `No ${noun}s match this view.`}</p>
        ) : visible.map((item) => {
          const status = statusByValue.get(getStatus(item));
          return (
            <button key={getId(item)} type="button" className="admin-row" onClick={() => openPanel(item)}>
              <span className="admin-row-copy">
                <strong>{getName(item)}</strong>
                <span>{renderRowMeta(item)}</span>
              </span>
              {renderRowExtra?.(item)}
              {status && <StatusPill tone={status.pill}>{status.label}</StatusPill>}
              <RowChevron />
            </button>
          );
        })}
      </div>

      {active && (
        <SidePanel
          onClose={closePanel}
          busy={processing}
          kicker={`${noun} application`}
          title={getName(active)}
          menu={<ActionMenu items={[{ label: 'Delete permanently…', onSelect: () => void deleteActive(), danger: true, disabled: processing }]} />}
          footer={(
            <>
              <button type="button" className="admin-button is-secondary" onClick={closePanel} disabled={processing}>Cancel</button>
              <button type="button" className="admin-button is-primary" onClick={() => void save()} disabled={processing || !chosen || chosen === currentStatus}>
                {processing ? 'Saving…' : saveLabel}
              </button>
            </>
          )}
        >
          {panelNotice && <div className={`admin-alert admin-alert-${panelNotice.type}`} role="alert">{panelNotice.message}</div>}
          {chosen && (
            <DecisionControl legend="Decision" value={chosen} options={decisionOptions} onChange={setNextStatus} disabled={processing} />
          )}
          {chosen === 'rejected' && chosen !== currentStatus && (
            <label className="admin-field">
              <span>Reason <small>(optional, included in the email)</small></span>
              <textarea rows={3} value={reason} onChange={(event) => setReason(event.target.value)} disabled={processing} />
            </label>
          )}
          {chosenConfig && chosen !== currentStatus && (
            <p className="admin-quiet-note">
              {chosenConfig.emails
                ? `Saving emails the ${noun} to let them know they’re ${chosenConfig.label.toLowerCase()}.`
                : 'Saving updates the status only. No email is sent.'}
            </p>
          )}
          {renderDetails(active)}
        </SidePanel>
      )}
    </div>
  );
}

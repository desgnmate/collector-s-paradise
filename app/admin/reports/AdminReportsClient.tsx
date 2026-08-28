'use client';

import { useDeferredValue, useMemo, useState, useTransition } from 'react';
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  Clock3,
  Mail,
  RefreshCw,
  Search,
  Send,
} from 'lucide-react';
import { retryReportNotification, updateSupportReport } from '@/app/actions/reports';
import { useAdminData } from '@/contexts/AdminDataContext';
import {
  REPORT_CATEGORY_OPTIONS,
  REPORT_PRIORITY_OPTIONS,
  REPORT_STATUS_OPTIONS,
  reportOptionLabel,
  type ReportPriority,
  type ReportStatus,
  type SupportReport,
} from '@/lib/reports';

const OPEN_STATUSES: ReportStatus[] = ['new', 'in_progress', 'waiting_on_reporter'];

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function notificationLabel(report: SupportReport) {
  if (report.admin_notification_status === 'sent') return 'Admin notified';
  if (report.admin_notification_status === 'failed') return 'Email failed';
  return 'Notification pending';
}

export default function AdminReportsClient() {
  const {
    reports,
    setReports,
    errors,
    refreshingSections,
    refreshData,
  } = useAdminData();
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | ReportStatus>('open');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [search, setSearch] = useState('');
  const deferredSearch = useDeferredValue(search.trim().toLowerCase());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draftStatus, setDraftStatus] = useState<ReportStatus | null>(null);
  const [draftPriority, setDraftPriority] = useState<ReportPriority | null>(null);
  const [draftNotes, setDraftNotes] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; message: string } | null>(null);
  const [isSaving, startSaving] = useTransition();
  const [isRetrying, startRetrying] = useTransition();

  const filteredReports = useMemo(() => reports.filter((report) => {
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'open' && OPEN_STATUSES.includes(report.status))
      || report.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || report.category === categoryFilter;
    const haystack = [
      report.ticket_number,
      report.reporter_name,
      report.reporter_email,
      report.subject,
      report.description,
    ].join(' ').toLowerCase();
    return matchesStatus && matchesCategory && (!deferredSearch || haystack.includes(deferredSearch));
  }), [categoryFilter, deferredSearch, reports, statusFilter]);

  const selectedReport = reports.find((report) => report.id === selectedId)
    || filteredReports[0]
    || null;
  const currentStatus = draftStatus ?? selectedReport?.status ?? 'new';
  const currentPriority = draftPriority ?? selectedReport?.priority ?? 'normal';
  const currentNotes = draftNotes ?? selectedReport?.admin_notes ?? '';
  const isRefreshing = refreshingSections.includes('reports');

  const selectReport = (report: SupportReport) => {
    setSelectedId(report.id);
    setDraftStatus(report.status);
    setDraftPriority(report.priority);
    setDraftNotes(report.admin_notes || '');
    setNotice(null);
  };

  const replaceReport = (updated: SupportReport) => {
    setReports((current) => current.map((report) => (
      report.id === updated.id ? updated : report
    )));
  };

  const saveReport = () => {
    if (!selectedReport) return;
    setNotice(null);
    startSaving(async () => {
      const result = await updateSupportReport({
        reportId: selectedReport.id,
        status: currentStatus,
        priority: currentPriority,
        admin_notes: currentNotes,
      });
      if (result.report) replaceReport(result.report);
      setNotice({ tone: result.success ? 'success' : 'error', message: result.message });
    });
  };

  const retryNotification = () => {
    if (!selectedReport) return;
    setNotice(null);
    startRetrying(async () => {
      const result = await retryReportNotification(selectedReport.id);
      if (result.report) replaceReport(result.report);
      setNotice({ tone: result.success ? 'success' : 'error', message: result.message });
    });
  };

  return (
    <div className="admin-page admin-reports-page">
      <div className="admin-page-header-row admin-reports-header">
        <div>
          <h1 className="admin-page-title">Reports</h1>
          <p className="admin-page-subtitle">Review website problems and support requests filed by visitors.</p>
        </div>
        <button
          type="button"
          className="admin-reports-refresh"
          onClick={() => void refreshData(['reports'])}
          disabled={isRefreshing}
        >
          <RefreshCw className={isRefreshing ? 'is-spinning' : ''} aria-hidden="true" />
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="admin-report-summary" aria-label="Report summary">
        <div><span>Total</span><strong>{reports.length}</strong></div>
        <div><span>Open</span><strong>{reports.filter((report) => OPEN_STATUSES.includes(report.status)).length}</strong></div>
        <div><span>Urgent</span><strong>{reports.filter((report) => report.priority === 'urgent' && OPEN_STATUSES.includes(report.status)).length}</strong></div>
        <div><span>Email failures</span><strong>{reports.filter((report) => report.admin_notification_status === 'failed').length}</strong></div>
      </div>

      <div className="admin-report-filters">
        <label className="admin-report-search">
          <Search aria-hidden="true" />
          <span className="sr-only">Search reports</span>
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search ticket, person, email, or issue…"
          />
        </label>
        <label>
          <span className="sr-only">Filter by status</span>
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)}>
            <option value="open">Open reports</option>
            <option value="all">All statuses</option>
            {REPORT_STATUS_OPTIONS.map((option) => (
              <option value={option.value} key={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
        <label>
          <span className="sr-only">Filter by category</span>
          <select value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)}>
            <option value="all">All categories</option>
            {REPORT_CATEGORY_OPTIONS.map((option) => (
              <option value={option.value} key={option.value}>{option.label}</option>
            ))}
          </select>
        </label>
      </div>

      {errors.reports && (
        <div className="admin-report-notice admin-report-notice--error" role="alert">
          <AlertTriangle aria-hidden="true" /> {errors.reports}
        </div>
      )}

      <div className="admin-reports-workspace">
        <section className="admin-report-queue" aria-label="Support report queue">
          <div className="admin-report-queue-heading">
            <span>{filteredReports.length} {filteredReports.length === 1 ? 'report' : 'reports'}</span>
            <span>Newest first</span>
          </div>
          <div className="admin-report-list">
            {filteredReports.length ? filteredReports.map((report) => (
              <button
                type="button"
                className={`admin-report-card ${selectedReport?.id === report.id ? 'is-selected' : ''}`}
                onClick={() => selectReport(report)}
                key={report.id}
              >
                <div className="admin-report-card-topline">
                  <span className={`admin-report-priority admin-report-priority--${report.priority}`}>{report.priority}</span>
                  <time dateTime={report.created_at}>{formatDate(report.created_at)}</time>
                </div>
                <strong>{report.subject}</strong>
                <p>{report.description}</p>
                <div className="admin-report-card-meta">
                  <span>{report.ticket_number}</span>
                  <span className={`admin-report-status admin-report-status--${report.status}`}>{reportOptionLabel(REPORT_STATUS_OPTIONS, report.status)}</span>
                </div>
              </button>
            )) : (
              <div className="admin-report-empty">
                <CheckCircle2 aria-hidden="true" />
                <strong>No reports match these filters.</strong>
                <span>Try another status, category, or search phrase.</span>
              </div>
            )}
          </div>
        </section>

        <section className="admin-report-detail" aria-label="Selected report details">
          {selectedReport ? (
            <>
              <div className="admin-report-detail-heading">
                <div>
                  <span className="admin-report-ticket">{selectedReport.ticket_number}</span>
                  <h2>{selectedReport.subject}</h2>
                </div>
                <span className={`admin-report-priority admin-report-priority--${selectedReport.priority}`}>{selectedReport.priority}</span>
              </div>

              <div className="admin-report-detail-meta">
                <div><span>Reporter</span><strong>{selectedReport.reporter_name}</strong></div>
                <div><span>Filed</span><strong>{formatDate(selectedReport.created_at)}</strong></div>
                <div><span>Category</span><strong>{reportOptionLabel(REPORT_CATEGORY_OPTIONS, selectedReport.category)}</strong></div>
                <div><span>Impact</span><strong>{selectedReport.impact}</strong></div>
              </div>

              <div className="admin-report-description">
                <span>What happened</span>
                <p>{selectedReport.description}</p>
              </div>

              <div className="admin-report-links">
                <a href={`mailto:${selectedReport.reporter_email}?subject=${encodeURIComponent(`[${selectedReport.ticket_number}] ${selectedReport.subject}`)}`}>
                  <Mail aria-hidden="true" /> Reply to {selectedReport.reporter_email}
                </a>
                {selectedReport.page_url && (
                  <a href={selectedReport.page_url} target="_blank" rel="noopener noreferrer">
                    <ArrowUpRight aria-hidden="true" /> Open affected page
                  </a>
                )}
              </div>

              {selectedReport.browser_details && (
                <details className="admin-report-browser">
                  <summary>Browser and device details</summary>
                  <code>{selectedReport.browser_details}</code>
                </details>
              )}

              <div className="admin-report-editor">
                <div className="admin-report-editor-row">
                  <label>
                    <span>Status</span>
                    <select value={currentStatus} onChange={(event) => setDraftStatus(event.target.value as ReportStatus)}>
                      {REPORT_STATUS_OPTIONS.map((option) => (
                        <option value={option.value} key={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span>Priority</span>
                    <select value={currentPriority} onChange={(event) => setDraftPriority(event.target.value as ReportPriority)}>
                      {REPORT_PRIORITY_OPTIONS.map((option) => (
                        <option value={option.value} key={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <label>
                  <span>Internal notes</span>
                  <textarea
                    rows={5}
                    value={currentNotes}
                    onChange={(event) => setDraftNotes(event.target.value)}
                    placeholder="Add investigation details, follow-up notes, or resolution information…"
                    maxLength={5000}
                  />
                </label>
                <button type="button" className="admin-report-save" onClick={saveReport} disabled={isSaving}>
                  {isSaving ? <RefreshCw className="is-spinning" aria-hidden="true" /> : <CheckCircle2 aria-hidden="true" />}
                  {isSaving ? 'Saving…' : 'Save report'}
                </button>
              </div>

              <div className={`admin-report-email admin-report-email--${selectedReport.admin_notification_status}`}>
                <div>
                  {selectedReport.admin_notification_status === 'sent' ? <CheckCircle2 aria-hidden="true" /> : selectedReport.admin_notification_status === 'failed' ? <AlertTriangle aria-hidden="true" /> : <Clock3 aria-hidden="true" />}
                  <span>
                    <strong>{notificationLabel(selectedReport)}</strong>
                    <small>
                      {selectedReport.admin_notification_status === 'sent' && selectedReport.admin_notification_sent_at
                        ? `Sent ${formatDate(selectedReport.admin_notification_sent_at)}`
                        : selectedReport.admin_notification_error || 'The delivery result has not been recorded yet.'}
                    </small>
                  </span>
                </div>
                {selectedReport.admin_notification_status !== 'sent' && (
                  <button type="button" onClick={retryNotification} disabled={isRetrying}>
                    {isRetrying ? <RefreshCw className="is-spinning" aria-hidden="true" /> : <Send aria-hidden="true" />}
                    {isRetrying ? 'Sending…' : 'Retry email'}
                  </button>
                )}
              </div>

              {notice && (
                <div className={`admin-report-notice admin-report-notice--${notice.tone}`} role="status">{notice.message}</div>
              )}
            </>
          ) : (
            <div className="admin-report-empty admin-report-empty--detail">
              <Search aria-hidden="true" />
              <strong>Select a report to see its details.</strong>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

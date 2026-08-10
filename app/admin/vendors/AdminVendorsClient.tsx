'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { useAdminData } from '@/contexts/AdminDataContext';
import {
  assignVendorsToEvents,
  deleteVendor,
  removeVendorEventApplication,
  syncAllVendorsToSheet,
  updateVendor,
  updateVendorEventApplication,
  type Vendor,
  type VendorApplicationStatus,
  type VendorEventApplication,
  type VendorUpdateData,
} from '@/app/actions/vendors';

type View = 'events' | 'unassigned' | 'vendors';
type StatusFilter = 'all' | VendorApplicationStatus;
type ApplicationRow = VendorEventApplication & { vendor: Vendor };

type Notice = { type: 'success' | 'error'; message: string };

const vendorsPerPage = 20;

const statusLabels: Record<VendorApplicationStatus, string> = {
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  waitlisted: 'Waitlisted',
};

const australianStates = [
  'New South Wales',
  'Victoria',
  'Queensland',
  'Western Australia',
  'South Australia',
  'Tasmania',
  'Australian Capital Territory',
  'Northern Territory',
];

const vendorCategories = [
  'Pokémon TCG',
  'Yu-Gi-Oh!',
  'Magic: The Gathering',
  'One Piece TCG',
  'Dragon Ball Super',
  'Sports Cards',
  'Vintage / Retro Cards',
  'Card Accessories & Supplies',
  'Graded Cards',
  'Art',
  'Other Collectibles',
];

function formatEventDate(value: string) {
  if (!value) return 'Date unavailable';
  return new Date(`${value}T00:00:00`).toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function StatusBadge({ status }: { status: VendorApplicationStatus }) {
  return <span className={`vendor-management-status is-${status}`}>{statusLabels[status]}</span>;
}

function Pagination({
  currentPage,
  totalItems,
  onPageChange,
}: {
  currentPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / vendorsPerPage));
  if (totalPages <= 1) return null;

  const start = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const pageNumbers = Array.from(
    { length: Math.min(5, totalPages) },
    (_, index) => start + index,
  );

  return (
    <nav className="vendor-management-pagination" aria-label="Vendor pages">
      <span className="vendor-management-pagination-summary">
        Page {currentPage} of {totalPages}
      </span>
      <div className="vendor-management-pagination-controls">
        <button type="button" onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1}>
          Previous
        </button>
        <div className="vendor-management-pagination-pages">
          {pageNumbers.map((page) => (
            <button
              key={page}
              type="button"
              className={page === currentPage ? 'is-active' : ''}
              aria-current={page === currentPage ? 'page' : undefined}
              onClick={() => onPageChange(page)}
            >
              {page}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages}>
          Next
        </button>
      </div>
    </nav>
  );
}

export default function AdminVendorsClient() {
  const { vendors, events, loading, errors, setVendors, refreshData } = useAdminData();
  const [view, setView] = useState<View>('unassigned');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [search, setSearch] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [activeApplication, setActiveApplication] = useState<ApplicationRow | null>(null);
  const [nextStatus, setNextStatus] = useState<VendorApplicationStatus>('pending');
  const [boothAssignment, setBoothAssignment] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [editData, setEditData] = useState<VendorUpdateData | null>(null);
  const [selectedVendorIds, setSelectedVendorIds] = useState<string[]>([]);
  const [showAssignment, setShowAssignment] = useState(false);
  const [assignmentEventIds, setAssignmentEventIds] = useState<string[]>([]);
  const [assignmentStatus, setAssignmentStatus] = useState<VendorApplicationStatus | 'preserve'>('pending');
  const [currentPage, setCurrentPage] = useState(1);
  const [processing, setProcessing] = useState(false);

  const applications = useMemo<ApplicationRow[]>(
    () => vendors.flatMap((vendor) =>
      vendor.event_applications.map((application) => ({ ...application, vendor })),
    ),
    [vendors],
  );

  const manageableEvents = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events
      .filter((event) => (
        event.event_date >= today &&
        (event.status === 'upcoming' || event.status === 'active')
      ))
      .sort((a, b) => a.event_date.localeCompare(b.event_date));
  }, [events]);
  const eventSummaries = useMemo(() => manageableEvents.map((event) => {
    const eventApplications = applications.filter((application) => application.event_id === event.id);
    return {
      event,
      applications: eventApplications,
      pending: eventApplications.filter((application) => application.application_status === 'pending').length,
      approved: eventApplications.filter((application) => application.application_status === 'approved').length,
      waitlisted: eventApplications.filter((application) => application.application_status === 'waitlisted').length,
      rejected: eventApplications.filter((application) => application.application_status === 'rejected').length,
    };
  }), [applications, manageableEvents]);

  const selectedEvent = eventSummaries.find(({ event }) => event.id === selectedEventId);
  const normalizedSearch = search.trim().toLowerCase();
  const visibleApplications = (selectedEvent?.applications || []).filter((application) => {
    const matchesStatus = statusFilter === 'all' || application.application_status === statusFilter;
    const matchesSearch = !normalizedSearch || [
      application.vendor.business_name,
      application.vendor.contact_name,
      application.vendor.email,
      ...(application.vendor.categories || []),
    ].some((value) => value?.toLowerCase().includes(normalizedSearch));
    return matchesStatus && matchesSearch;
  });
  const unassignedVendors = vendors.filter((vendor) => vendor.event_applications.length === 0);
  const filterVendor = (vendor: Vendor) => !normalizedSearch || [
    vendor.business_name,
    vendor.contact_name,
    vendor.email,
    ...(vendor.categories || []),
  ].some((value) => value?.toLowerCase().includes(normalizedSearch));
  const visibleVendors = vendors.filter(filterVendor);
  const visibleUnassignedVendors = unassignedVendors.filter((vendor) => (
    (statusFilter === 'all' || vendor.application_status === statusFilter) && filterVendor(vendor)
  ));
  const paginate = <T,>(items: T[]) => items.slice(
    (currentPage - 1) * vendorsPerPage,
    currentPage * vendorsPerPage,
  );
  const paginatedApplications = paginate(visibleApplications);
  const paginatedVendors = paginate(visibleVendors);
  const paginatedUnassignedVendors = paginate(visibleUnassignedVendors);

  const changePage = (page: number, totalItems: number) => {
    const totalPages = Math.max(1, Math.ceil(totalItems / vendorsPerPage));
    setCurrentPage(Math.min(Math.max(page, 1), totalPages));
    document.querySelector('.vendor-management')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const toggleSelectedVendor = (vendorId: string) => {
    setSelectedVendorIds((current) => current.includes(vendorId)
      ? current.filter((id) => id !== vendorId)
      : [...current, vendorId]);
  };

  const openAssignment = (vendorIds: string[]) => {
    setSelectedVendorIds(vendorIds);
    setAssignmentEventIds([]);
    setAssignmentStatus('pending');
    setShowAssignment(true);
    setNotice(null);
  };

  const saveAssignments = async () => {
    setProcessing(true);
    const result = await assignVendorsToEvents({
      vendor_ids: selectedVendorIds,
      event_ids: assignmentEventIds,
      starting_status: assignmentStatus,
    });
    setProcessing(false);
    if (!result.success) {
      setNotice({ type: 'error', message: result.message });
      return;
    }
    setShowAssignment(false);
    setSelectedVendorIds([]);
    setNotice({ type: 'success', message: result.message });
    void refreshData(['vendors']);
  };

  const openApplication = (application: ApplicationRow) => {
    setActiveApplication(application);
    setNextStatus(application.application_status);
    setBoothAssignment(application.booth_assignment || '');
    setRejectionReason(application.rejection_reason || '');
    setNotice(null);
  };

  const openVendor = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setEditData(null);
    setNotice(null);
  };

  const startVendorEdit = () => {
    if (!selectedVendor) return;
    setEditData({
      business_name: selectedVendor.business_name,
      contact_name: selectedVendor.contact_name,
      email: selectedVendor.email,
      phone: selectedVendor.phone || '',
      location_state: selectedVendor.location_state || '',
      description: selectedVendor.description || '',
      categories: selectedVendor.categories || [],
      social_links: selectedVendor.social_links || '',
      tables_requested: selectedVendor.tables_requested || '',
      power_requirements: selectedVendor.power_requirements || '',
      additional_notes: selectedVendor.additional_notes || '',
      booth_assignment: selectedVendor.booth_assignment || '',
    });
  };

  const saveApplication = async () => {
    if (!activeApplication) return;
    setProcessing(true);
    const result = await updateVendorEventApplication(activeApplication.id, {
      status: nextStatus,
      booth_assignment: boothAssignment,
      rejection_reason: rejectionReason,
    });
    setProcessing(false);
    if (!result.success) {
      setNotice({ type: 'error', message: result.message });
      return;
    }
    const applicationId = activeApplication.id;
    const updatedAt = new Date().toISOString();
    setActiveApplication(null);
    setNotice({ type: 'success', message: result.message });
    setVendors((current) => current.map((vendor) => ({
      ...vendor,
      event_applications: vendor.event_applications.map((application) => (
        application.id === applicationId
          ? {
              ...application,
              application_status: nextStatus,
              booth_assignment: boothAssignment || null,
              rejection_reason: nextStatus === 'rejected' ? rejectionReason || null : null,
              updated_at: updatedAt,
            }
          : application
      )),
    })));
  };

  const removeApplication = async () => {
    if (!activeApplication) return;
    if (!window.confirm(`Remove ${activeApplication.vendor.business_name} from ${activeApplication.event_name}? Vendor profile will remain.`)) return;
    setProcessing(true);
    const result = await removeVendorEventApplication(activeApplication.id);
    setProcessing(false);
    if (!result.success) {
      setNotice({ type: 'error', message: result.message });
      return;
    }
    const applicationId = activeApplication.id;
    setActiveApplication(null);
    setNotice({ type: 'success', message: result.message });
    setVendors((current) => current.map((vendor) => ({
      ...vendor,
      event_name: vendor.event_applications
        .filter((application) => application.id !== applicationId)
        .map((application) => application.event_name)
        .join(', ') || null,
      event_applications: vendor.event_applications.filter((application) => application.id !== applicationId),
    })));
  };

  const saveVendor = async () => {
    if (!selectedVendor || !editData) return;
    setProcessing(true);
    const cleanData = {
      ...editData,
      categories: editData.categories.map((category) => category.trim()).filter(Boolean),
    };
    const result = await updateVendor(selectedVendor.id, cleanData);
    setProcessing(false);
    if (!result.success) {
      setNotice({ type: 'error', message: result.message });
      return;
    }
    setSelectedVendor(null);
    setEditData(null);
    setNotice({ type: 'success', message: result.message });
    setVendors((current) => current.map((vendor) => (
      vendor.id === selectedVendor.id
        ? {
            ...vendor,
            ...cleanData,
            phone: cleanData.phone || null,
            description: cleanData.description || null,
            social_links: cleanData.social_links || null,
            tables_requested: cleanData.tables_requested || null,
            power_requirements: cleanData.power_requirements || null,
            additional_notes: cleanData.additional_notes || null,
            booth_assignment: cleanData.booth_assignment || null,
          }
        : vendor
    )));
  };

  const permanentlyDeleteVendor = async () => {
    if (!selectedVendor) return;
    const confirmed = window.confirm(
      `Permanently delete ${selectedVendor.business_name} and every event application? This cannot be undone.`,
    );
    if (!confirmed) return;
    setProcessing(true);
    const result = await deleteVendor(selectedVendor.id);
    setProcessing(false);
    if (!result.success) {
      setNotice({ type: 'error', message: result.message });
      return;
    }
    const deletedVendorId = selectedVendor.id;
    setSelectedVendor(null);
    setNotice({ type: 'success', message: result.message });
    setVendors((current) => current.filter((vendor) => vendor.id !== deletedVendorId));
  };

  const exportEventCsv = () => {
    if (!selectedEvent) return;
    const escapeCsv = (value: unknown) => {
      const text = String(value ?? '');
      return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
    };
    const headers = ['Business', 'Contact', 'Email', 'Phone', 'Categories', 'Tables', 'Power', 'Booth', 'Status'];
    const rows = visibleApplications.map((application) => [
      application.vendor.business_name,
      application.vendor.contact_name,
      application.vendor.email,
      application.vendor.phone,
      application.vendor.categories.join('; '),
      application.tables_requested,
      application.power_requirements,
      application.booth_assignment,
      application.application_status,
    ].map(escapeCsv).join(','));
    const blob = new Blob([`\uFEFF${[headers.join(','), ...rows].join('\n')}`], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${selectedEvent.event.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-vendors.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="admin-content-panel vendor-management-loading"><div className="admin-spinner" /><span>Loading vendor management...</span></div>;
  }

  if (errors.vendors || errors.events) {
    return <div className="admin-content-panel"><div className="admin-alert admin-alert-error">{errors.vendors || errors.events}</div></div>;
  }

  return (
    <div className="admin-content-panel vendor-management">
      <header className="vendor-page-header">
        <div>
          <h2 className="vendor-page-title">Vendor Management</h2>
          <p className="vendor-page-subtitle">Review vendors by event, then manage reusable vendor profiles.</p>
        </div>
        <button
          type="button"
          className="vendor-management-secondary-button"
          onClick={async () => {
            setProcessing(true);
            const result = await syncAllVendorsToSheet();
            setProcessing(false);
            setNotice({ type: result.success ? 'success' : 'error', message: result.message });
          }}
          disabled={processing}
        >
          Sync to Sheet
        </button>
      </header>

      {notice && <div className={`admin-alert admin-alert-${notice.type}`}>{notice.message}</div>}

      <div className="vendor-management-view-switch" role="tablist" aria-label="Vendor management views">
        <button type="button" role="tab" aria-selected={view === 'events'} className={view === 'events' ? 'active' : ''} onClick={() => { setView('events'); setSelectedEventId(null); setSelectedVendorIds([]); setSearch(''); setCurrentPage(1); }}>
          By event <span>{applications.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={view === 'unassigned'} className={view === 'unassigned' ? 'active' : ''} onClick={() => { setView('unassigned'); setSelectedEventId(null); setSelectedVendorIds([]); setStatusFilter('all'); setSearch(''); setCurrentPage(1); }}>
          Unassigned <span>{unassignedVendors.length}</span>
        </button>
        <button type="button" role="tab" aria-selected={view === 'vendors'} className={view === 'vendors' ? 'active' : ''} onClick={() => { setView('vendors'); setSelectedEventId(null); setSelectedVendorIds([]); setSearch(''); setCurrentPage(1); }}>
          All profiles <span>{vendors.length}</span>
        </button>
      </div>

      {view === 'events' && !selectedEvent && (
        <section className="vendor-management-event-grid">
          {eventSummaries.length === 0 ? (
            <div className="empty-state"><p>No events created yet.</p></div>
          ) : eventSummaries.map((summary) => (
            <button key={summary.event.id} type="button" className="vendor-management-event-card" onClick={() => { setSelectedEventId(summary.event.id); setCurrentPage(1); }}>
              <span className={`vendor-management-event-state is-${summary.event.status}`}>{summary.event.status}</span>
              <strong>{summary.event.title}</strong>
              <span className="vendor-management-event-meta">{formatEventDate(summary.event.event_date)}</span>
              <span className="vendor-management-event-meta">{summary.event.venue || 'Venue not set'}</span>
              <span className="vendor-management-event-counts">
                <span><b>{summary.pending}</b> pending</span>
                <span><b>{summary.approved}</b> approved</span>
                <span><b>{summary.waitlisted}</b> waitlisted</span>
                <span><b>{summary.rejected}</b> rejected</span>
              </span>
              <span className="vendor-management-card-link">View applications →</span>
            </button>
          ))}
        </section>
      )}

      {view === 'events' && selectedEvent && (
        <section>
          <div className="vendor-management-roster-header">
            <button type="button" className="vendor-management-back" onClick={() => { setSelectedEventId(null); setStatusFilter('all'); setSearch(''); setCurrentPage(1); }}>← All events</button>
            <div>
              <h3>{selectedEvent.event.title}</h3>
              <p>{formatEventDate(selectedEvent.event.event_date)} · {selectedEvent.event.venue || 'Venue not set'}</p>
            </div>
            <button type="button" className="vendor-management-secondary-button" onClick={exportEventCsv}>Export roster</button>
          </div>

          <div className="vendor-management-toolbar">
            <div className="admin-tabs">
              {(['all', 'pending', 'approved', 'waitlisted', 'rejected'] as StatusFilter[]).map((status) => (
                <button key={status} type="button" className={`admin-tab ${statusFilter === status ? 'active' : ''}`} onClick={() => { setStatusFilter(status); setCurrentPage(1); }}>
                  {status === 'all' ? 'All' : statusLabels[status]}
                  <span className="tab-count">{status === 'all' ? selectedEvent.applications.length : selectedEvent.applications.filter((application) => application.application_status === status).length}</span>
                </button>
              ))}
            </div>
            <input className="vendor-management-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search this roster" aria-label="Search this event roster" />
          </div>

          <div className="vendor-management-table-wrap">
            <table className="vendor-management-table">
              <thead><tr><th>Vendor</th><th>Categories</th><th>Requirements</th><th>Booth</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
              <tbody>
                {paginatedApplications.map((application) => (
                  <tr key={application.id}>
                    <td><strong>{application.vendor.business_name}</strong><span>{application.vendor.contact_name}<br />{application.vendor.email}</span></td>
                    <td>{application.vendor.categories.slice(0, 3).join(', ') || 'Not provided'}</td>
                    <td>{application.tables_requested || '—'} table(s)<br /><span>{application.power_requirements || 'No power request'}</span></td>
                    <td>{application.booth_assignment || 'Unassigned'}</td>
                    <td><StatusBadge status={application.application_status} /></td>
                    <td><button type="button" className="vendor-management-row-action" onClick={() => openApplication(application)}>Review</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleApplications.length === 0 && <div className="vendor-management-empty">No applications match this view.</div>}
          </div>
          <Pagination currentPage={currentPage} totalItems={visibleApplications.length} onPageChange={(page) => changePage(page, visibleApplications.length)} />
        </section>
      )}

      {view === 'unassigned' && (
        <section>
          <div className="vendor-management-directory-header">
            <div>
              <h3>Unassigned vendors</h3>
              <p>Legacy status preserved. Assign vendors to events without changing existing profile data.</p>
            </div>
            <button
              type="button"
              className="vendor-management-secondary-button"
              disabled={selectedVendorIds.length === 0}
              onClick={() => openAssignment(selectedVendorIds)}
            >
              Assign selected ({selectedVendorIds.length})
            </button>
          </div>
          <div className="vendor-management-toolbar vendor-management-unassigned-toolbar">
            <div className="admin-tabs">
              {(['all', 'pending', 'approved', 'waitlisted', 'rejected'] as StatusFilter[]).map((status) => (
                <button key={status} type="button" className={`admin-tab ${statusFilter === status ? 'active' : ''}`} onClick={() => { setStatusFilter(status); setCurrentPage(1); }}>
                  {status === 'all' ? 'All statuses' : statusLabels[status]}
                  <span className="tab-count">{status === 'all' ? unassignedVendors.length : unassignedVendors.filter((vendor) => vendor.application_status === status).length}</span>
                </button>
              ))}
            </div>
            <input className="vendor-management-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search unassigned vendors" aria-label="Search unassigned vendors" />
          </div>
          <div className="vendor-management-bulk-bar">
            <label>
              <input
                type="checkbox"
                checked={paginatedUnassignedVendors.length > 0 && paginatedUnassignedVendors.every((vendor) => selectedVendorIds.includes(vendor.id))}
                onChange={(event) => {
                  const pageIds = paginatedUnassignedVendors.map((vendor) => vendor.id);
                  setSelectedVendorIds((current) => event.target.checked
                    ? [...new Set([...current, ...pageIds])]
                    : current.filter((id) => !pageIds.includes(id)));
                }}
              />
              Select this page
            </label>
            <span>{visibleUnassignedVendors.length} vendor{visibleUnassignedVendors.length === 1 ? '' : 's'} · 20 per page</span>
          </div>
          <div className="vendor-management-directory vendor-management-unassigned-list">
            {paginatedUnassignedVendors.map((vendor) => (
              <div key={vendor.id} className={`vendor-management-profile-card ${selectedVendorIds.includes(vendor.id) ? 'is-selected' : ''}`}>
                <input type="checkbox" checked={selectedVendorIds.includes(vendor.id)} onChange={() => toggleSelectedVendor(vendor.id)} aria-label={`Select ${vendor.business_name}`} />
                <span className="vendor-management-avatar">
                  {vendor.logo_url ? <Image src={vendor.logo_url} alt="" fill unoptimized sizes="48px" /> : vendor.business_name.slice(0, 2).toUpperCase()}
                </span>
                <button type="button" className="vendor-management-profile-copy" onClick={() => openVendor(vendor)}>
                  <strong>{vendor.business_name}</strong><span>{vendor.contact_name} · {vendor.email}</span>
                </button>
                <span className="vendor-management-legacy-status"><small>Legacy status</small><StatusBadge status={vendor.application_status} /></span>
                <button type="button" className="vendor-management-row-action" onClick={() => openAssignment([vendor.id])}>Assign</button>
              </div>
            ))}
            {visibleUnassignedVendors.length === 0 && <div className="vendor-management-empty">No unassigned vendors match this view.</div>}
          </div>
          <Pagination currentPage={currentPage} totalItems={visibleUnassignedVendors.length} onPageChange={(page) => changePage(page, visibleUnassignedVendors.length)} />
        </section>
      )}

      {view === 'vendors' && (
        <section>
          <div className="vendor-management-directory-header">
            <div><h3>Vendor directory</h3><p>Profiles stay separate from decisions made for each event.</p></div>
            <input className="vendor-management-search" type="search" value={search} onChange={(event) => { setSearch(event.target.value); setCurrentPage(1); }} placeholder="Search all vendors" aria-label="Search all vendors" />
          </div>
          <div className="vendor-management-directory">
            {paginatedVendors.map((vendor) => (
              <button key={vendor.id} type="button" className="vendor-management-profile-card" onClick={() => openVendor(vendor)}>
                <span className="vendor-management-avatar">
                  {vendor.logo_url ? <Image src={vendor.logo_url} alt="" fill unoptimized sizes="48px" /> : vendor.business_name.slice(0, 2).toUpperCase()}
                </span>
                <span className="vendor-management-profile-copy"><strong>{vendor.business_name}</strong><span>{vendor.contact_name} · {vendor.email}</span></span>
                <span className="vendor-management-profile-summary"><StatusBadge status={vendor.application_status} /><small>{vendor.event_applications.length} event{vendor.event_applications.length === 1 ? '' : 's'}</small></span>
                <span aria-hidden="true">→</span>
              </button>
            ))}
            {visibleVendors.length === 0 && <div className="vendor-management-empty">No vendor profiles match your search.</div>}
          </div>
          <Pagination currentPage={currentPage} totalItems={visibleVendors.length} onPageChange={(page) => changePage(page, visibleVendors.length)} />
        </section>
      )}

      {showAssignment && (
        <div className="modal-overlay" onClick={() => setShowAssignment(false)}>
          <div className="modal-content modal-lg vendor-management-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="assignment-title">
            <div className="modal-header">
              <button type="button" className="modal-close-btn" onClick={() => setShowAssignment(false)} aria-label="Close">✕</button>
              <p className="vendor-management-modal-kicker">Event assignment</p>
              <h3 className="modal-title" id="assignment-title">Assign {selectedVendorIds.length} vendor{selectedVendorIds.length === 1 ? '' : 's'}</h3>
              <p className="modal-vendor-name">Existing profiles and legacy statuses remain stored.</p>
            </div>
            <div className="modal-body vendor-management-assignment-form">
              <fieldset>
                <legend>Choose one or more events</legend>
                <div className="vendor-management-assignment-events">
                  {manageableEvents.map((event) => (
                    <label key={event.id}>
                      <input
                        type="checkbox"
                        checked={assignmentEventIds.includes(event.id)}
                        onChange={(changeEvent) => setAssignmentEventIds((current) => changeEvent.target.checked ? [...current, event.id] : current.filter((id) => id !== event.id))}
                      />
                      <span><strong>{event.title}</strong><small>{formatEventDate(event.event_date)} · {event.venue || 'Venue not set'}</small></span>
                    </label>
                  ))}
                  {manageableEvents.length === 0 && (
                    <p className="vendor-management-assignment-empty">No current or upcoming events available.</p>
                  )}
                </div>
              </fieldset>
              <fieldset>
                <legend>Starting status for selected events</legend>
                <label className="vendor-management-status-choice"><input type="radio" name="starting_status" checked={assignmentStatus === 'pending'} onChange={() => setAssignmentStatus('pending')} /><span><strong>Pending</strong><small>Recommended. Review each vendor for each event.</small></span></label>
                <label className="vendor-management-status-choice"><input type="radio" name="starting_status" checked={assignmentStatus === 'preserve'} onChange={() => setAssignmentStatus('preserve')} /><span><strong>Preserve legacy status</strong><small>Copies each vendor&apos;s old approved, pending, waitlisted, or rejected status.</small></span></label>
              </fieldset>
              <p className="vendor-management-assignment-note">Existing assignments are never overwritten. Approval and rejection emails are not sent during migration assignment.</p>
            </div>
            <div className="modal-footer vendor-management-modal-actions">
              <span />
              <div><button type="button" className="modal-footer-btn modal-footer-secondary" onClick={() => setShowAssignment(false)} disabled={processing}>Cancel</button><button type="button" className="modal-footer-btn modal-footer-primary" onClick={saveAssignments} disabled={processing || assignmentEventIds.length === 0}>{processing ? 'Assigning...' : 'Assign vendors'}</button></div>
            </div>
          </div>
        </div>
      )}

      {activeApplication && (
        <div className="modal-overlay" onClick={() => setActiveApplication(null)}>
          <div className="modal-content modal-lg vendor-management-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="application-review-title">
            <div className="modal-header">
              <button type="button" className="modal-close-btn" onClick={() => setActiveApplication(null)} aria-label="Close">✕</button>
              <p className="vendor-management-modal-kicker">{activeApplication.event_name}</p>
              <h3 className="modal-title" id="application-review-title">{activeApplication.vendor.business_name}</h3>
              <p className="modal-vendor-name">{activeApplication.vendor.contact_name} · {activeApplication.vendor.email}</p>
            </div>
            <div className="modal-body vendor-management-review-grid">
              <div className="vendor-management-review-profile">
                <h4>Vendor profile</h4>
                <p>{activeApplication.vendor.description || 'No business description.'}</p>
                <dl>
                  <div><dt>Categories</dt><dd>{activeApplication.vendor.categories.join(', ') || 'Not provided'}</dd></div>
                  <div><dt>Tables</dt><dd>{activeApplication.tables_requested || 'Not specified'}</dd></div>
                  <div><dt>Power</dt><dd>{activeApplication.power_requirements || 'Not specified'}</dd></div>
                  <div><dt>Applied</dt><dd>{new Date(activeApplication.applied_at).toLocaleDateString('en-AU')}</dd></div>
                </dl>
              </div>
              <div className="vendor-management-decision-form">
                <label>Status<select value={nextStatus} onChange={(event) => setNextStatus(event.target.value as VendorApplicationStatus)}><option value="pending">Pending</option><option value="approved">Approved</option><option value="waitlisted">Waitlisted</option><option value="rejected">Rejected</option></select></label>
                <label>Booth assignment<input value={boothAssignment} onChange={(event) => setBoothAssignment(event.target.value)} placeholder="e.g. B12" /></label>
                {nextStatus === 'rejected' && <label>Rejection reason<textarea value={rejectionReason} onChange={(event) => setRejectionReason(event.target.value)} rows={4} placeholder="Optional reason included in email" /></label>}
              </div>
            </div>
            <div className="modal-footer vendor-management-modal-actions">
              <button type="button" className="modal-footer-btn modal-footer-danger" onClick={removeApplication} disabled={processing}>Remove from event</button>
              <div><button type="button" className="modal-footer-btn modal-footer-secondary" onClick={() => setActiveApplication(null)} disabled={processing}>Cancel</button><button type="button" className="modal-footer-btn modal-footer-primary" onClick={saveApplication} disabled={processing}>{processing ? 'Saving...' : 'Save decision'}</button></div>
            </div>
          </div>
        </div>
      )}

      {selectedVendor && (
        <div className="modal-overlay" onClick={() => setSelectedVendor(null)}>
          <div className="modal-content modal-lg vendor-management-modal" onClick={(event) => event.stopPropagation()} role="dialog" aria-modal="true" aria-labelledby="vendor-profile-title">
            <div className="modal-header">
              <button type="button" className="modal-close-btn" onClick={() => setSelectedVendor(null)} aria-label="Close">✕</button>
              <p className="vendor-management-modal-kicker">Vendor profile</p>
              <h3 className="modal-title" id="vendor-profile-title">{selectedVendor.business_name}</h3>
            </div>
            <div className="modal-body">
              {editData ? (
                <form className="vendor-management-edit-form" onSubmit={(event) => { event.preventDefault(); saveVendor(); }}>
                  <label>Business name<input required value={editData.business_name} onChange={(event) => setEditData({ ...editData, business_name: event.target.value })} /></label>
                  <label>Contact name<input required value={editData.contact_name} onChange={(event) => setEditData({ ...editData, contact_name: event.target.value })} /></label>
                  <label>Email<input required type="email" value={editData.email} onChange={(event) => setEditData({ ...editData, email: event.target.value })} /></label>
                  <label>Phone<input value={editData.phone} onChange={(event) => setEditData({ ...editData, phone: event.target.value })} /></label>
                  <label>State
                    <select required value={editData.location_state} onChange={(event) => setEditData({ ...editData, location_state: event.target.value })}>
                      <option value="">Select state</option>
                      {australianStates.map((state) => <option key={state} value={state}>{state}</option>)}
                    </select>
                  </label>
                  <label>Social link<input type="url" value={editData.social_links} onChange={(event) => setEditData({ ...editData, social_links: event.target.value })} /></label>
                  <div className="full vendor-management-edit-categories">
                    <span className="vendor-management-edit-label">Categories</span>
                    <details className="vendor-management-category-select">
                      <summary>
                        <span>{editData.categories.length > 0 ? editData.categories.join(', ') : 'Select categories'}</span>
                        <span aria-hidden="true">⌄</span>
                      </summary>
                      <div className="vendor-management-category-menu">
                        {vendorCategories.map((category) => (
                          <label key={category}>
                            <input
                              type="checkbox"
                              checked={editData.categories.includes(category)}
                              onChange={(event) => setEditData({
                                ...editData,
                                categories: event.target.checked
                                  ? [...editData.categories, category]
                                  : editData.categories.filter((item) => item !== category),
                              })}
                            />
                            <span>{category}</span>
                          </label>
                        ))}
                      </div>
                    </details>
                    {editData.categories.length === 0 && <span className="vendor-management-field-error">Select at least one category.</span>}
                  </div>
                  <label className="full">Description<textarea rows={4} value={editData.description} onChange={(event) => setEditData({ ...editData, description: event.target.value })} /></label>
                  <label className="full">Additional notes<textarea rows={3} value={editData.additional_notes} onChange={(event) => setEditData({ ...editData, additional_notes: event.target.value })} /></label>
                </form>
              ) : (
                <div className="vendor-management-profile-detail">
                  <div className="vendor-management-profile-facts"><span><b>Contact</b>{selectedVendor.contact_name}</span><span><b>Email</b>{selectedVendor.email}</span><span><b>Phone</b>{selectedVendor.phone || 'Not provided'}</span><span><b>State</b>{selectedVendor.location_state}</span><span><b>Legacy status</b><StatusBadge status={selectedVendor.application_status} /></span><span><b>Event assignments</b>{selectedVendor.event_applications.length}</span></div>
                  <p>{selectedVendor.description || 'No business description.'}</p>
                  {selectedVendor.event_applications.length === 0 && (
                    <div className="vendor-management-profile-empty">
                      <span>No event applications yet</span>
                      <button type="button" className="vendor-management-secondary-button" onClick={() => { setSelectedVendor(null); openAssignment([selectedVendor.id]); }}>Assign to events</button>
                    </div>
                  )}
                  <h4>Event applications</h4>
                  <div className="vendor-management-profile-application-list">
                    {selectedVendor.event_applications.map((application) => <div key={application.id}><span><strong>{application.event_name}</strong><small>{formatEventDate(application.event_date)}</small></span><StatusBadge status={application.application_status} /></div>)}
                    {selectedVendor.event_applications.length === 0 && <p>No event applications.</p>}
                  </div>
                  <section className="vendor-management-danger-zone" aria-labelledby="vendor-danger-title">
                    <div>
                      <h4 id="vendor-danger-title">Delete vendor profile</h4>
                      <p>Removes profile and every event application permanently.</p>
                    </div>
                    <button type="button" className="modal-footer-btn modal-footer-danger" onClick={permanentlyDeleteVendor} disabled={processing}>Delete permanently</button>
                  </section>
                </div>
              )}
            </div>
            <div className="modal-footer vendor-management-modal-actions vendor-management-profile-actions">
              <div>
                {editData ? <><button type="button" className="modal-footer-btn modal-footer-secondary" onClick={() => setEditData(null)} disabled={processing}>Cancel edit</button><button type="button" className="modal-footer-btn modal-footer-primary" onClick={saveVendor} disabled={processing}>{processing ? 'Saving...' : 'Save profile'}</button></> : <button type="button" className="modal-footer-btn modal-footer-primary" onClick={startVendorEdit}>Edit profile</button>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

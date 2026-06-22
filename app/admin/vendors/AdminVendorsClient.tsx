'use client';

import { useState, useEffect } from 'react';
import { useAdminData } from '@/contexts/AdminDataContext';
import { approveVendor, rejectVendor, waitlistVendor, deleteVendor, syncAllVendorsToSheet } from '@/app/actions/vendors';
import type { Vendor } from '@/app/actions/vendors';

type TabType = 'all' | 'pending' | 'approved' | 'rejected' | 'waitlisted';

export default function AdminVendorsClient() {
  const { vendors, loading, error, invalidateCache, refreshData } = useAdminData();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'waitlist' | 'delete' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: vendors.length },
    { key: 'pending', label: 'Pending', count: vendors.filter(v => v.application_status === 'pending').length },
    { key: 'approved', label: 'Approved', count: vendors.filter(v => v.application_status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: vendors.filter(v => v.application_status === 'rejected').length },
    { key: 'waitlisted', label: 'Waitlisted', count: vendors.filter(v => v.application_status === 'waitlisted').length },
  ];

  const filteredVendors = vendors.filter(v => 
    activeTab === 'all' || v.application_status === activeTab
  );

  const handleAction = async (vendor: Vendor, action: 'approve' | 'reject' | 'waitlist' | 'delete') => {
    setSelectedVendor(vendor);
    setModalAction(action);
    setRejectionReason('');
    setShowModal(true);
  };

  const handleViewInfo = (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setShowViewModal(true);
  };

  const confirmAction = async () => {
    if (!selectedVendor || !modalAction) return;
    
    setProcessingId(selectedVendor.id);
    
    try {
      let result;
      switch (modalAction) {
        case 'approve':
          result = await approveVendor(selectedVendor.id);
          break;
        case 'reject':
          result = await rejectVendor(selectedVendor.id, rejectionReason || undefined);
          break;
        case 'waitlist':
          result = await waitlistVendor(selectedVendor.id);
          break;
        case 'delete':
          result = await deleteVendor(selectedVendor.id);
          break;
      }
      
      if (result?.success) {
        invalidateCache('vendors');
        invalidateCache('stats');
      } else {
        alert(result?.message || 'Action failed');
      }
    } catch (err) {
      console.error('Action error:', err);
      alert('Something went wrong. Please try again.');
    } finally {
      setProcessingId(null);
      setShowModal(false);
      setSelectedVendor(null);
      setModalAction(null);
      setRejectionReason('');
    }
  };

  const getStatusBadge = (status: Vendor['application_status']) => {
    const config = {
      pending: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)', label: 'Pending' },
      approved: { bg: 'rgba(34, 197, 94, 0.12)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.25)', label: 'Approved' },
      rejected: { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.25)', label: 'Rejected' },
      waitlisted: { bg: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa', border: 'rgba(139, 92, 246, 0.25)', label: 'Waitlisted' },
    };
    const c = config[status];
    return (
      <span className="status-badge" style={{ background: c.bg, color: c.color, border: `1px solid ${c.border}` }}>
        {c.label}
      </span>
    );
  };

  const handleExportCSV = () => {
    const exportData = activeTab === 'all' ? vendors : filteredVendors;

    const headers = [
      'Business Name', 'Contact Name', 'Email', 'Phone', 'State',
      'Categories', 'Status', 'Tables', 'Power', 'Social Links',
      'Description', 'Logo URL', 'Applied At',
    ];

    const escapeCsv = (val: unknown): string => {
      const str = String(val ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const rows = exportData.map((v) => [
      escapeCsv(v.business_name),
      escapeCsv(v.contact_name),
      escapeCsv(v.email),
      escapeCsv(v.phone),
      escapeCsv((v as any).location_state),
      escapeCsv((v.categories || []).join('; ')),
      escapeCsv(v.application_status),
      escapeCsv(v.tables_requested),
      escapeCsv(v.power_requirements),
      escapeCsv(v.social_links),
      escapeCsv(v.description),
      escapeCsv(v.logo_url),
      escapeCsv(v.applied_at ? new Date(v.applied_at).toLocaleDateString('en-AU') : ''),
    ]);

    const bom = '\uFEFF';
    const csv = bom + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vendor-applications-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="admin-content-panel">
        <div className="flex items-center justify-center h-64">
          <div className="admin-vendor-loading-spinner"></div>
          <span className="ml-3 text-gray-600">Loading vendors...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-content-panel">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error loading vendors</p>
          <p className="text-red-600 text-sm mt-1">{error}</p>
          <button 
            onClick={() => refreshData()} 
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content-panel">
      <div className="vendor-page-header">
        <div>
          <h2 className="vendor-page-title">Vendor Applications</h2>
          <p className="vendor-page-subtitle">Review and manage vendor applications</p>
        </div>
        {vendors.length > 0 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <button
              onClick={handleExportCSV}
              className="admin-tab"
              style={{ padding: '8px 16px', gap: '8px', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius-sm)', cursor: 'pointer', background: 'var(--admin-surface)', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', fontFamily: 'inherit', fontSize: '0.8125rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              Export CSV
            </button>
            <button
              onClick={async () => {
                const result = await syncAllVendorsToSheet();
                alert(result.message || 'Sync completed.');
              }}
              className="admin-tab"
              style={{ padding: '8px 16px', gap: '8px', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius-sm)', cursor: 'pointer', background: 'var(--admin-surface)', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', fontFamily: 'inherit', fontSize: '0.8125rem' }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              Sync to Sheet
            </button>
            {process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL && (
              <a
                href={process.env.NEXT_PUBLIC_GOOGLE_SHEET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="admin-tab"
                style={{ padding: '8px 16px', gap: '8px', border: '1px solid var(--admin-border)', borderRadius: 'var(--admin-radius-sm)', cursor: 'pointer', background: 'var(--admin-surface)', color: 'var(--admin-text-secondary)', display: 'flex', alignItems: 'center', textDecoration: 'none', fontFamily: 'inherit', fontSize: '0.8125rem' }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="3" y1="9" x2="21" y2="9" />
                  <line x1="9" y1="21" x2="9" y2="9" />
                </svg>
                View Sheet
              </a>
            )}
          </div>
        )}
      </div>

      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`admin-tab ${activeTab === tab.key ? 'active' : ''}`}
          >
            {tab.label}
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      <div className="admin-vendor-list">
        {filteredVendors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 15h8" />
                <circle cx="9" cy="9" r="1" />
                <circle cx="15" cy="9" r="1" />
              </svg>
            </div>
            <p>No vendors found for this status.</p>
          </div>
        ) : (
          filteredVendors.map(vendor => (
            <div key={vendor.id} className="admin-vendor-card">
              <div className="vendor-header">
                <div className="vendor-info">
                  <div className="vendor-name-row">
                    <h3 className="vendor-name">{vendor.business_name}</h3>
                    {getStatusBadge(vendor.application_status)}
                  </div>
                  <p className="vendor-contact">{vendor.contact_name} • {vendor.email}</p>
                  {vendor.phone && <p className="vendor-phone">{vendor.phone}</p>}
                </div>
                <span className="vendor-date">
                  {new Date(vendor.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              
              {vendor.description && (
                <p className="vendor-description">{vendor.description}</p>
              )}
              
              {vendor.categories && vendor.categories.length > 0 && (
                <div className="vendor-categories">
                  {vendor.categories.map((cat, i) => (
                    <span key={i} className="category-tag">{cat}</span>
                  ))}
                </div>
              )}
              
              <div className="vendor-event-requirements" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                {(vendor.tables_requested || vendor.power_requirements) && (
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                    {vendor.tables_requested && (
                      <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>
                        📦 Tables: {vendor.tables_requested}
                      </span>
                    )}
                    {vendor.power_requirements && (
                      <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>
                        ⚡ Power: {vendor.power_requirements}
                      </span>
                    )}
                  </div>
                )}
                {vendor.social_links && (
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                    🔗 <a href={vendor.social_links} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-dark)', textDecoration: 'underline' }}>Social Profile</a>
                  </div>
                )}
                {vendor.additional_notes && (
                  <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                     {vendor.additional_notes}
                  </div>
                )}
              </div>
              
              {vendor.rejection_reason && (
                <div className="rejection-reason">
                  <strong>Rejection Reason:</strong> {vendor.rejection_reason}
                </div>
              )}
              
              <div className="vendor-actions">
                <button
                  onClick={() => handleViewInfo(vendor)}
                  className="btn-view-info"
                  style={{
                    background: 'var(--color-dark)',
                    color: 'white',
                    border: '2px solid var(--color-dark)',
                    padding: '0.5rem 1rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  👁 View Information
                </button>
                {vendor.application_status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(vendor, 'approve')}
                      disabled={processingId === vendor.id}
                      className="btn-approve"
                    >
                      {processingId === vendor.id ? 'Processing...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(vendor, 'reject')}
                      disabled={processingId === vendor.id}
                      className="btn-reject"
                    >
                      ✕ Reject
                    </button>
                    <button
                      onClick={() => handleAction(vendor, 'waitlist')}
                      disabled={processingId === vendor.id}
                      className="btn-waitlist"
                    >
                       Waitlist
                    </button>
                  </>
                )}
                {vendor.application_status === 'approved' && (
                  <>
                    <button
                      onClick={() => handleAction(vendor, 'reject')}
                      disabled={processingId === vendor.id}
                      className="btn-reject"
                    >
                      ✕ Unapprove
                    </button>
                    <button
                      onClick={() => handleAction(vendor, 'waitlist')}
                      disabled={processingId === vendor.id}
                      className="btn-waitlist"
                    >
                       Waitlist
                    </button>
                    <button
                      onClick={() => handleAction(vendor, 'delete')}
                      disabled={processingId === vendor.id}
                      className="btn-delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      Delete
                    </button>
                  </>
                )}
                {vendor.application_status === 'rejected' && (
                  <>
                    <button
                      onClick={() => handleAction(vendor, 'approve')}
                      disabled={processingId === vendor.id}
                      className="btn-approve"
                    >
                      {processingId === vendor.id ? 'Processing...' : '✓ Re-approve'}
                    </button>
                    <button
                      onClick={() => handleAction(vendor, 'waitlist')}
                      disabled={processingId === vendor.id}
                      className="btn-waitlist"
                    >
                       Waitlist
                    </button>
                    <button
                      onClick={() => handleAction(vendor, 'delete')}
                      disabled={processingId === vendor.id}
                      className="btn-delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      Delete
                    </button>
                  </>
                )}
                {vendor.application_status === 'waitlisted' && (
                  <>
                    <button
                      onClick={() => handleAction(vendor, 'approve')}
                      disabled={processingId === vendor.id}
                      className="btn-approve"
                    >
                      {processingId === vendor.id ? 'Processing...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(vendor, 'reject')}
                      disabled={processingId === vendor.id}
                      className="btn-reject"
                    >
                      ✕ Reject
                    </button>
                    <button
                      onClick={() => handleAction(vendor, 'delete')}
                      disabled={processingId === vendor.id}
                      className="btn-delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      Delete
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {showModal && selectedVendor && modalAction && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={modalAction === 'delete' ? { color: '#f87171' } : {}}>
                {modalAction === 'approve' && 'Approve Vendor'}
                {modalAction === 'reject' && 'Reject Application'}
                {modalAction === 'waitlist' && 'Waitlist Vendor'}
                {modalAction === 'delete' && 'Delete Vendor'}
              </h3>
            </div>
            
            <div className="modal-body">
              <p className="modal-vendor-name" style={{ margin: 0, marginBottom: modalAction === 'reject' || modalAction === 'delete' ? '12px' : '0' }}>
                {modalAction === 'delete' ? 
                  `Are you sure you want to delete "${selectedVendor.business_name}"?` :
                  selectedVendor.business_name
                }
              </p>
              
              {modalAction === 'delete' && (
                <p className="modal-warning" style={{ margin: 0, color: '#f87171', fontSize: '0.9rem' }}>
                  This will permanently remove this vendor from the database. This action cannot be undone.
                </p>
              )}
              
              {modalAction === 'reject' && (
                <div className="modal-field">
                  <label>Rejection Reason (Optional):</label>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Provide a reason for rejection..."
                    rows={3}
                    className="modal-textarea"
                  />
                </div>
              )}
            </div>
            
            <div className="modal-footer">
              <div className="modal-actions" style={{ marginTop: 0 }}>
                <button onClick={() => setShowModal(false)} className="btn-cancel">
                  Cancel
                </button>
                <button 
                  onClick={confirmAction} 
                  className={
                    modalAction === 'approve' ? 'btn-confirm-approve' :
                    modalAction === 'reject' ? 'btn-confirm-reject' :
                    modalAction === 'delete' ? 'btn-confirm-reject' :
                    'btn-confirm-waitlist'
                  }
                  disabled={processingId !== null}
                >
                  {processingId ? 'Processing...' : modalAction === 'delete' ? 'Delete Permanently' : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* View Information Modal */}
      {showViewModal && selectedVendor && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header" style={{ borderBottom: '2px solid var(--color-dark)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="modal-title" style={{ margin: 0 }}>Vendor Application Details</h3>
                <button 
                  onClick={() => setShowViewModal(false)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    fontSize: '1.5rem',
                    cursor: 'pointer',
                    color: '#666',
                    padding: '0.25rem',
                    lineHeight: 1
                  }}
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
              {/* Business Info Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 800, 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px',
                  color: '#666',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '2px solid var(--color-yellow)'
                }}>
                  Business Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Business Name</p>
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedVendor.business_name}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Contact Person</p>
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedVendor.contact_name}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Email Address</p>
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedVendor.email}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Phone Number</p>
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedVendor.phone || 'Not provided'}</p>
                  </div>
                </div>
                {selectedVendor.logo_url && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Business Logo</p>
                    <img 
                      src={selectedVendor.logo_url} 
                      alt={`${selectedVendor.business_name} logo`}
                      style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '2px solid var(--color-dark)' }}
                    />
                  </div>
                )}
              </div>

              {/* Social Media Section */}
              {selectedVendor.social_links && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    color: '#666',
                    marginBottom: '0.75rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '2px solid var(--color-yellow)'
                  }}>
                    Social Media
                  </h4>
                  <a 
                    href={selectedVendor.social_links} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    style={{ 
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: 'var(--color-dark)',
                      textDecoration: 'underline',
                      fontWeight: 500
                    }}
                  >
                     {selectedVendor.social_links}
                  </a>
                </div>
              )}

              {/* Products & Categories Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 800, 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px',
                  color: '#666',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '2px solid var(--color-yellow)'
                }}>
                  Products & Categories
                </h4>
                {selectedVendor.categories && selectedVendor.categories.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {selectedVendor.categories.map((cat, i) => (
                      <span 
                        key={i}
                        style={{
                          background: 'var(--color-yellow)',
                          color: 'var(--color-dark)',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '4px',
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          border: '1px solid var(--color-dark)'
                        }}
                      >
                        {cat}
                      </span>
                    ))}
                  </div>
                )}
                {selectedVendor.description && (
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Business Description</p>
                    <p style={{ lineHeight: 1.6, fontSize: '0.95rem' }}>{selectedVendor.description}</p>
                  </div>
                )}
              </div>

              {/* Event Requirements Section */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ 
                  fontSize: '0.75rem', 
                  fontWeight: 800, 
                  textTransform: 'uppercase', 
                  letterSpacing: '1px',
                  color: '#666',
                  marginBottom: '0.75rem',
                  paddingBottom: '0.5rem',
                  borderBottom: '2px solid var(--color-yellow)'
                }}>
                  Event Requirements
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Tables Requested</p>
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>
                      {selectedVendor.tables_requested ? `📦 ${selectedVendor.tables_requested}` : 'Not specified'}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Power Requirements</p>
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>
                      {selectedVendor.power_requirements ? `⚡ ${selectedVendor.power_requirements}` : 'Not specified'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Additional Notes Section */}
              {selectedVendor.additional_notes && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <h4 style={{ 
                    fontSize: '0.75rem', 
                    fontWeight: 800, 
                    textTransform: 'uppercase', 
                    letterSpacing: '1px',
                    color: '#666',
                    marginBottom: '0.75rem',
                    paddingBottom: '0.5rem',
                    borderBottom: '2px solid var(--color-yellow)'
                  }}>
                    Additional Notes
                  </h4>
                  <p style={{ 
                    lineHeight: 1.6, 
                    fontSize: '0.95rem',
                    background: 'rgba(244, 197, 66, 0.1)',
                    padding: '1rem',
                    borderRadius: '6px',
                    border: '1px dashed var(--color-dark)'
                  }}>
                    {selectedVendor.additional_notes}
                  </p>
                </div>
              )}

              {/* Application Status Section */}
              <div style={{ 
                background: 'rgba(0,0,0,0.05)', 
                padding: '1rem', 
                borderRadius: '6px',
                marginTop: '1.5rem'
              }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Application Status</p>
                    <p style={{ 
                      fontWeight: 700, 
                      fontSize: '1rem',
                      textTransform: 'uppercase',
                      color: selectedVendor.application_status === 'approved' ? '#22c55e' :
                             selectedVendor.application_status === 'rejected' ? '#ef4444' :
                             selectedVendor.application_status === 'waitlisted' ? '#8b5cf6' : '#f59e0b'
                    }}>
                      {selectedVendor.application_status}
                    </p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Applied On</p>
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>
                      {new Date(selectedVendor.applied_at).toLocaleDateString('en-US', { 
                        month: 'long', 
                        day: 'numeric', 
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                {selectedVendor.booth_assignment && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Booth Assignment</p>
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedVendor.booth_assignment}</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="modal-footer" style={{ borderTop: '1px solid #e5e5e5', paddingTop: '1rem', marginTop: '1.5rem' }}>
              <button 
                onClick={() => setShowViewModal(false)} 
                className="btn-cancel"
                style={{
                  background: 'var(--color-dark)',
                  color: 'white',
                  border: '2px solid var(--color-dark)',
                  padding: '0.65rem 1.5rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                  cursor: 'pointer'
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

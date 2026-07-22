'use client';

import { useState } from 'react';
import { useAdminData } from '@/contexts/AdminDataContext';
import { approveVendor, rejectVendor, waitlistVendor, deleteVendor, updateVendor, syncAllVendorsToSheet } from '@/app/actions/vendors';
import type { Vendor, VendorUpdateData } from '@/app/actions/vendors';
import Image from 'next/image';


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
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<VendorUpdateData | null>(null);
  const [savingEdit, setSavingEdit] = useState(false);
  const [editStatus, setEditStatus] = useState<{ success: boolean; message: string } | null>(null);

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
    setIsEditing(false);
    setEditData(null);
    setEditStatus(null);
    setSelectedVendor(vendor);
    setShowViewModal(true);
  };

  const handleEdit = (vendor: Vendor) => {
    setEditData({
      business_name: vendor.business_name,
      contact_name: vendor.contact_name,
      email: vendor.email,
      phone: vendor.phone || '',
      location_state: vendor.location_state || '',
      description: vendor.description || '',
      categories: vendor.categories || [],
      social_links: vendor.social_links || '',
      tables_requested: vendor.tables_requested || '',
      power_requirements: vendor.power_requirements || '',
      additional_notes: vendor.additional_notes || '',
      booth_assignment: vendor.booth_assignment || '',
    });
    setEditStatus(null);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedVendor || !editData) return;
    setSavingEdit(true);
    setEditStatus(null);

    // Sanitize categories — trim whitespace and remove empties
    const cleanData: VendorUpdateData = {
      ...editData,
      categories: editData.categories.map(s => s.trim()).filter(Boolean),
    };

    try {
      const result = await updateVendor(selectedVendor.id, cleanData);
      if (result?.success) {
        invalidateCache('vendors');
        setShowViewModal(false);
        setIsEditing(false);
        setEditData(null);
        setEditStatus(null);
      } else {
        setEditStatus({ success: false, message: result?.message || 'Update failed.' });
      }
    } catch (err) {
      console.error('Edit save error:', err);
      setEditStatus({ success: false, message: 'Something went wrong. Please try again.' });
    } finally {
      setSavingEdit(false);
    }
  };
  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditData(null);
    setEditStatus(null);
  };

  const closeViewModal = () => {
    setIsEditing(false);
    setEditData(null);
    setEditStatus(null);
    setShowViewModal(false);
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
      escapeCsv(v.location_state),
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
              
              <div className="vendor-event-reqs">
                {(vendor.tables_requested || vendor.power_requirements) && (
                  <div className="vendor-req-row">
                    {vendor.tables_requested && (
                      <span className="vendor-req-item">
                        Tables: {vendor.tables_requested}
                      </span>
                    )}
                    {vendor.power_requirements && (
                      <span className="vendor-req-item">
                        Power: {vendor.power_requirements}
                      </span>
                    )}
                  </div>
                )}
                {vendor.social_links && (
                  <div className="vendor-req-item" style={{ marginBottom: '4px' }}>
                    <a href={vendor.social_links} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--admin-yellow)', textDecoration: 'underline' }}>Social Profile</a>
                  </div>
                )}
                {vendor.additional_notes && (
                  <div className="vendor-req-item" style={{ fontStyle: 'italic' }}>
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
                >
                  View Information
                </button>
                {vendor.application_status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(vendor, 'approve')}
                      disabled={processingId === vendor.id}
                      className="btn-approve"
                    >
                      {processingId === vendor.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(vendor, 'reject')}
                      disabled={processingId === vendor.id}
                      className="btn-reject"
                    >
                      Reject
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
                      Unapprove
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
                      {processingId === vendor.id ? 'Processing...' : 'Re-approve'}
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
                      {processingId === vendor.id ? 'Processing...' : 'Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(vendor, 'reject')}
                      disabled={processingId === vendor.id}
                      className="btn-reject"
                    >
                      Reject
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
        <div className="modal-overlay" onClick={closeViewModal}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }} role="dialog" aria-modal="true" aria-labelledby="vendor-detail-title">
            <div className="modal-header">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="modal-title" style={{ margin: 0 }} id="vendor-detail-title">Vendor Application Details</h3>
                <button onClick={closeViewModal} className="modal-close-btn" aria-label="Close vendor details">
                  ✕
                </button>
              </div>
            </div>
            
            <div className="modal-body">
              {isEditing && editData ? (
                /* ── Edit Mode ── */
                <form id="vendor-edit-form" onSubmit={(e) => { e.preventDefault(); handleSaveEdit(); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  <div className="edit-form-grid">
                    <div>
                      <label className="vendor-edit-label">Business Name</label>
                      <input value={editData.business_name} onChange={e => setEditData({ ...editData, business_name: e.target.value })} className="vendor-edit-input" />
                    </div>
                    <div>
                      <label className="vendor-edit-label">Contact Person</label>
                      <input value={editData.contact_name} onChange={e => setEditData({ ...editData, contact_name: e.target.value })} className="vendor-edit-input" />
                    </div>
                    <div>
                      <label className="vendor-edit-label">Email Address</label>
                      <input value={editData.email} onChange={e => setEditData({ ...editData, email: e.target.value })} className="vendor-edit-input" />
                    </div>
                    <div>
                      <label className="vendor-edit-label">Phone Number</label>
                      <input value={editData.phone} onChange={e => setEditData({ ...editData, phone: e.target.value })} className="vendor-edit-input" />
                    </div>
                  </div>
                  <div className="edit-form-grid">
                    <div>
                      <label className="vendor-edit-label">State</label>
                      <input value={editData.location_state} onChange={e => setEditData({ ...editData, location_state: e.target.value })} className="vendor-edit-input" />
                    </div>
                    <div>
                      <label className="vendor-edit-label">Social Links</label>
                      <input value={editData.social_links} onChange={e => setEditData({ ...editData, social_links: e.target.value })} className="vendor-edit-input" />
                    </div>
                  </div>
                  <div>
                    <label className="vendor-edit-label">Categories (comma-separated)</label>
                    <input value={editData.categories.join(', ')} onChange={e => setEditData({ ...editData, categories: e.target.value.split(',').map(s => s.trim()) })} className="vendor-edit-input" />
                  </div>
                  <div>
                    <label className="vendor-edit-label">Business Description</label>
                    <textarea value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} rows={3} className="vendor-edit-input" style={{ resize: 'vertical' }} />
                  </div>
                  <div className="edit-form-grid">
                    <div>
                      <label className="vendor-edit-label">Tables Requested</label>
                      <input value={editData.tables_requested} onChange={e => setEditData({ ...editData, tables_requested: e.target.value })} className="vendor-edit-input" />
                    </div>
                    <div>
                      <label className="vendor-edit-label">Power Requirements</label>
                      <input value={editData.power_requirements} onChange={e => setEditData({ ...editData, power_requirements: e.target.value })} className="vendor-edit-input" />
                    </div>
                  </div>
                  <div>
                    <label className="vendor-edit-label">Additional Notes</label>
                    <textarea value={editData.additional_notes} onChange={e => setEditData({ ...editData, additional_notes: e.target.value })} rows={3} className="vendor-edit-input" style={{ resize: 'vertical' }} />
                  </div>
                  <div>
                    <label className="vendor-edit-label">Booth Assignment</label>
                    <input value={editData.booth_assignment} onChange={e => setEditData({ ...editData, booth_assignment: e.target.value })} className="vendor-edit-input" />
                  </div>
                </form>
              ) : (
                /* ── Read-Only Mode ── */
                <div>
                  {/* Business Info Section */}
                  <div className="modal-section">
                    <h4 className="modal-section-title">Business Information</h4>
                    <div className="info-grid">
                      <div><p className="info-label">Business Name</p><p className="info-value">{selectedVendor.business_name}</p></div>
                      <div><p className="info-label">Contact Person</p><p className="info-value">{selectedVendor.contact_name}</p></div>
                      <div><p className="info-label">Email Address</p><p className="info-value">{selectedVendor.email}</p></div>
                      <div><p className="info-label">Phone Number</p><p className="info-value">{selectedVendor.phone || <span className="info-value-muted">Not provided</span>}</p></div>
                      <div><p className="info-label">State</p><p className="info-value">{selectedVendor.location_state || <span className="info-value-muted">Not provided</span>}</p></div>
                    </div>
                    {selectedVendor.logo_url && (
                      <div style={{ marginTop: '16px' }}>
                        <p className="info-label" style={{ marginBottom: '8px' }}>Business Logo</p>
                        <Image src={selectedVendor.logo_url} alt={`${selectedVendor.business_name} logo`} width={100} height={100} unoptimized className="vendor-logo-img" />
                      </div>
                    )}
                  </div>

                  {/* Social Media Section */}
                  {selectedVendor.social_links && (
                    <div className="modal-section">
                      <h4 className="modal-section-title">Social Media</h4>
                      <a href={selectedVendor.social_links} target="_blank" rel="noopener noreferrer" className="social-link">
                        {selectedVendor.social_links}
                      </a>
                    </div>
                  )}

                  {/* Products & Categories Section */}
                  <div className="modal-section">
                    <h4 className="modal-section-title">Products & Categories</h4>
                    {selectedVendor.categories && selectedVendor.categories.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
                        {selectedVendor.categories.map((cat, i) => (
                          <span key={i} className="view-category-tag">{cat}</span>
                        ))}
                      </div>
                    )}
                    {selectedVendor.description && (
                      <div><p className="info-label">Business Description</p><p className="info-value-muted" style={{ lineHeight: 1.6, marginTop: '4px' }}>{selectedVendor.description}</p></div>
                    )}
                  </div>

                  {/* Event Requirements Section */}
                  <div className="modal-section">
                    <h4 className="modal-section-title">Event Requirements</h4>
                    <div className="info-grid">
                      <div><p className="info-label">Tables Requested</p><p className="info-value">{selectedVendor.tables_requested || <span className="info-value-muted">Not specified</span>}</p></div>
                      <div><p className="info-label">Power Requirements</p><p className="info-value">{selectedVendor.power_requirements || <span className="info-value-muted">Not specified</span>}</p></div>
                    </div>
                  </div>

                  {/* Additional Notes Section */}
                  {selectedVendor.additional_notes && (
                    <div className="modal-section">
                      <h4 className="modal-section-title">Additional Notes</h4>
                      <p className="notes-display">{selectedVendor.additional_notes}</p>
                    </div>
                  )}

                  {/* Application Status Section */}
                  <div className="status-block">
                    <div className="info-grid">
                      <div>
                        <p className="info-label">Application Status</p>
                        <p className="info-value" style={{
                          color: selectedVendor.application_status === 'approved' ? '#22c55e' :
                                 selectedVendor.application_status === 'rejected' ? '#ef4444' :
                                 selectedVendor.application_status === 'waitlisted' ? '#8b5cf6' : '#f59e0b'
                        }}>{selectedVendor.application_status}</p>
                      </div>
                      <div>
                        <p className="info-label">Applied On</p>
                        <p className="info-value">{new Date(selectedVendor.applied_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                    {selectedVendor.booth_assignment && (
                      <div style={{ marginTop: '12px' }}>
                        <p className="info-label">Booth Assignment</p>
                        <p className="info-value">{selectedVendor.booth_assignment}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-footer" style={{ borderTop: '1px solid var(--admin-border)', paddingTop: '16px', marginTop: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              {/* Edit status feedback */}
              {editStatus && (
                <span style={{ fontSize: '0.85rem', color: editStatus.success ? '#22c55e' : '#ef4444', fontWeight: 500 }}>
                  {editStatus.message}
                </span>
              )}
              <div style={{ display: 'flex', gap: '8px', marginLeft: 'auto' }}>
                {isEditing ? (
                  <>
                    <button
                      onClick={handleCancelEdit}
                      className="modal-footer-btn modal-footer-secondary"
                      disabled={savingEdit}
                    >
                      Cancel
                    </button>
                    <button type="submit" form="vendor-edit-form" disabled={savingEdit}
                      className="modal-footer-btn modal-footer-primary"
                    >
                      {savingEdit ? 'Saving...' : 'Save Changes'}
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={handleEdit.bind(null, selectedVendor!)}
                      className="modal-footer-btn modal-footer-secondary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={closeViewModal}
                      className="modal-footer-btn modal-footer-primary"
                    >
                      Close
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

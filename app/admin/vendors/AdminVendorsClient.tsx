'use client';

import { useState, useEffect } from 'react';
import { useAdminData } from '@/contexts/AdminDataContext';
import { approveVendor, rejectVendor, waitlistVendor, deleteVendor } from '@/app/actions/vendors';
import type { Vendor } from '@/app/actions/vendors';

type TabType = 'all' | 'pending' | 'approved' | 'rejected' | 'waitlisted';

export default function AdminVendorsClient() {
  const { vendors, loading, error, invalidateCache, refreshData } = useAdminData();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [showModal, setShowModal] = useState(false);
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
        <h2 className="vendor-page-title">Vendor Applications</h2>
        <p className="vendor-page-subtitle">Review and manage vendor applications</p>
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
              
              {vendor.rejection_reason && (
                <div className="rejection-reason">
                  <strong>Rejection Reason:</strong> {vendor.rejection_reason}
                </div>
              )}
              
              <div className="vendor-actions">
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
    </div>
  );
}

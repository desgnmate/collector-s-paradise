'use client';

import { useState } from 'react';
import { useAdminData } from '@/contexts/AdminDataContext';
import { approveSponsor, rejectSponsor, waitlistSponsor, negotiateSponsor, deleteSponsor } from '@/app/actions/sponsors';
import type { Sponsor } from '@/app/actions/sponsors';

type TabType = 'all' | 'pending' | 'approved' | 'rejected' | 'waitlisted' | 'negotiating';

export default function AdminSponsorsClient() {
  const { sponsors, loading, error, invalidateCache, refreshData } = useAdminData();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedSponsor, setSelectedSponsor] = useState<Sponsor | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'waitlist' | 'negotiate' | 'delete' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: sponsors.length },
    { key: 'pending', label: 'Pending', count: sponsors.filter(s => s.application_status === 'pending').length },
    { key: 'approved', label: 'Approved', count: sponsors.filter(s => s.application_status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: sponsors.filter(s => s.application_status === 'rejected').length },
    { key: 'waitlisted', label: 'Waitlisted', count: sponsors.filter(s => s.application_status === 'waitlisted').length },
    { key: 'negotiating', label: 'Negotiating', count: sponsors.filter(s => s.application_status === 'negotiating').length },
  ];

  const filteredSponsors = sponsors.filter(s => 
    activeTab === 'all' || s.application_status === activeTab
  );

  const handleAction = async (sponsor: Sponsor, action: 'approve' | 'reject' | 'waitlist' | 'negotiate' | 'delete') => {
    setSelectedSponsor(sponsor);
    setModalAction(action);
    setRejectionReason('');
    setShowModal(true);
  };

  const handleViewInfo = (sponsor: Sponsor) => {
    setSelectedSponsor(sponsor);
    setShowViewModal(true);
  };

  const confirmAction = async () => {
    if (!selectedSponsor || !modalAction) return;
    
    setProcessingId(selectedSponsor.id);
    
    try {
      let result;
      switch (modalAction) {
        case 'approve':
          result = await approveSponsor(selectedSponsor.id);
          break;
        case 'reject':
          result = await rejectSponsor(selectedSponsor.id, rejectionReason || undefined);
          break;
        case 'waitlist':
          result = await waitlistSponsor(selectedSponsor.id);
          break;
        case 'negotiate':
          result = await negotiateSponsor(selectedSponsor.id);
          break;
        case 'delete':
          result = await deleteSponsor(selectedSponsor.id);
          break;
      }
      
      if (result?.success) {
        invalidateCache('sponsors');
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
      setSelectedSponsor(null);
      setModalAction(null);
      setRejectionReason('');
    }
  };

  const getStatusBadge = (status: Sponsor['application_status']) => {
    const config = {
      pending: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b', border: 'rgba(245, 158, 11, 0.25)', label: 'Pending' },
      approved: { bg: 'rgba(34, 197, 94, 0.12)', color: '#4ade80', border: 'rgba(34, 197, 94, 0.25)', label: 'Approved' },
      rejected: { bg: 'rgba(239, 68, 68, 0.12)', color: '#f87171', border: 'rgba(239, 68, 68, 0.25)', label: 'Rejected' },
      waitlisted: { bg: 'rgba(139, 92, 246, 0.12)', color: '#a78bfa', border: 'rgba(139, 92, 246, 0.25)', label: 'Waitlisted' },
      negotiating: { bg: 'rgba(59, 130, 246, 0.12)', color: '#60a5fa', border: 'rgba(59, 130, 246, 0.25)', label: 'Negotiating' },
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
          <span className="ml-3 text-gray-600">Loading sponsors...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-content-panel">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error loading sponsors</p>
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
        <h2 className="vendor-page-title">Sponsor Applications</h2>
        <p className="vendor-page-subtitle">Review and manage sponsorship applications</p>
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
        {filteredSponsors.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 15h8" />
                <circle cx="9" cy="9" r="1" />
                <circle cx="15" cy="9" r="1" />
              </svg>
            </div>
            <p>No sponsors found for this status.</p>
          </div>
        ) : (
          filteredSponsors.map(sponsor => (
            <div key={sponsor.id} className="admin-vendor-card">
              <div className="vendor-header">
                <div className="vendor-info">
                  <div className="vendor-name-row">
                    <h3 className="vendor-name">{sponsor.company_name}</h3>
                    {getStatusBadge(sponsor.application_status)}
                  </div>
                  <p className="vendor-contact">{sponsor.contact_name} • {sponsor.contact_email}</p>
                  {sponsor.contact_phone && <p className="vendor-phone">{sponsor.contact_phone}</p>}
                  {sponsor.website && (
                    <p className="vendor-phone">
                      <a href={sponsor.website} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--color-dark)', textDecoration: 'underline' }}>
                        {sponsor.website.replace(/^https?:\/\//, '')}
                      </a>
                    </p>
                  )}
                </div>
                <span className="vendor-date">
                  {new Date(sponsor.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              
              {/* Sponsorship Tier & Budget */}
              <div className="vendor-categories" style={{ marginTop: '0.75rem' }}>
                {sponsor.sponsorship_tier && (
                  <span className="category-tag" style={{ background: 'var(--color-dark)', color: 'white' }}>
                    {sponsor.sponsorship_tier.toUpperCase()}
                  </span>
                )}
                {sponsor.budget_range && (
                  <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500, marginLeft: '0.5rem' }}>
                     Budget: {sponsor.budget_range}
                  </span>
                )}
              </div>
              
              {/* Sponsorship Interests */}
              {sponsor.sponsorship_interest && sponsor.sponsorship_interest.length > 0 && (
                <div className="vendor-categories" style={{ marginTop: '0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600, marginRight: '0.5rem' }}>INTERESTS:</span>
                  {sponsor.sponsorship_interest.map((interest, i) => (
                    <span key={i} className="category-tag">{interest}</span>
                  ))}
                </div>
              )}
              
              {/* Brand Description */}
              {sponsor.brand_description && (
                <p className="vendor-description" style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
                  {sponsor.brand_description}
                </p>
              )}
              
              {/* Contract Status */}
              <div className="vendor-event-requirements" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.85rem', color: sponsor.contract_sent ? '#22c55e' : '#666', fontWeight: 500 }}>
                    {sponsor.contract_sent ? '✓ Contract Sent' : '○ Contract Not Sent'}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: sponsor.contract_signed ? '#22c55e' : '#666', fontWeight: 500 }}>
                    {sponsor.contract_signed ? '✓ Contract Signed' : '○ Not Signed'}
                  </span>
                  <span style={{ fontSize: '0.85rem', color: sponsor.payment_received ? '#22c55e' : '#666', fontWeight: 500 }}>
                    {sponsor.payment_received ? '✓ Payment Received' : '○ Payment Pending'}
                  </span>
                </div>
                {sponsor.additional_notes && (
                  <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                    📝 {sponsor.additional_notes}
                  </div>
                )}
              </div>
              
              {sponsor.rejection_reason && (
                <div className="rejection-reason">
                  <strong>Rejection Reason:</strong> {sponsor.rejection_reason}
                </div>
              )}
              
              <div className="vendor-actions">
                <button
                  onClick={() => handleViewInfo(sponsor)}
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
                   View Information
                </button>
                {sponsor.application_status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(sponsor, 'approve')}
                      disabled={processingId === sponsor.id}
                      className="btn-approve"
                    >
                      {processingId === sponsor.id ? 'Processing...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(sponsor, 'reject')}
                      disabled={processingId === sponsor.id}
                      className="btn-reject"
                    >
                      ✕ Reject
                    </button>
                    <button
                      onClick={() => handleAction(sponsor, 'negotiate')}
                      disabled={processingId === sponsor.id}
                      className="btn-waitlist"
                    >
                       Negotiate
                    </button>
                    <button
                      onClick={() => handleAction(sponsor, 'waitlist')}
                      disabled={processingId === sponsor.id}
                      className="btn-waitlist"
                    >
                       Waitlist
                    </button>
                  </>
                )}
                {sponsor.application_status === 'approved' && (
                  <>
                    <button
                      onClick={() => handleAction(sponsor, 'reject')}
                      disabled={processingId === sponsor.id}
                      className="btn-reject"
                    >
                      ✕ Unapprove
                    </button>
                    <button
                      onClick={() => handleAction(sponsor, 'waitlist')}
                      disabled={processingId === sponsor.id}
                      className="btn-waitlist"
                    >
                       Waitlist
                    </button>
                    <button
                      onClick={() => handleAction(sponsor, 'delete')}
                      disabled={processingId === sponsor.id}
                      className="btn-delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      Delete
                    </button>
                  </>
                )}
                {sponsor.application_status === 'negotiating' && (
                  <>
                    <button
                      onClick={() => handleAction(sponsor, 'approve')}
                      disabled={processingId === sponsor.id}
                      className="btn-approve"
                    >
                      {processingId === sponsor.id ? 'Processing...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(sponsor, 'reject')}
                      disabled={processingId === sponsor.id}
                      className="btn-reject"
                    >
                      ✕ Reject
                    </button>
                    <button
                      onClick={() => handleAction(sponsor, 'delete')}
                      disabled={processingId === sponsor.id}
                      className="btn-delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      Delete
                    </button>
                  </>
                )}
                {sponsor.application_status === 'rejected' && (
                  <>
                    <button
                      onClick={() => handleAction(sponsor, 'approve')}
                      disabled={processingId === sponsor.id}
                      className="btn-approve"
                    >
                      {processingId === sponsor.id ? 'Processing...' : '✓ Re-approve'}
                    </button>
                    <button
                      onClick={() => handleAction(sponsor, 'negotiate')}
                      disabled={processingId === sponsor.id}
                      className="btn-waitlist"
                    >
                       Negotiate
                    </button>
                    <button
                      onClick={() => handleAction(sponsor, 'delete')}
                      disabled={processingId === sponsor.id}
                      className="btn-delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      Delete
                    </button>
                  </>
                )}
                {sponsor.application_status === 'waitlisted' && (
                  <>
                    <button
                      onClick={() => handleAction(sponsor, 'approve')}
                      disabled={processingId === sponsor.id}
                      className="btn-approve"
                    >
                      {processingId === sponsor.id ? 'Processing...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(sponsor, 'reject')}
                      disabled={processingId === sponsor.id}
                      className="btn-reject"
                    >
                      ✕ Reject
                    </button>
                    <button
                      onClick={() => handleAction(sponsor, 'delete')}
                      disabled={processingId === sponsor.id}
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

      {/* Confirmation Modal */}
      {showModal && selectedSponsor && modalAction && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={modalAction === 'delete' ? { color: '#f87171' } : {}}>
                {modalAction === 'approve' && 'Approve Sponsor'}
                {modalAction === 'reject' && 'Reject Application'}
                {modalAction === 'waitlist' && 'Waitlist Sponsor'}
                {modalAction === 'negotiate' && 'Start Negotiation'}
                {modalAction === 'delete' && 'Delete Sponsor'}
              </h3>
            </div>
            
            <div className="modal-body">
              <p className="modal-vendor-name" style={{ margin: 0, marginBottom: modalAction === 'reject' || modalAction === 'delete' ? '12px' : '0' }}>
                {modalAction === 'delete' ? 
                  `Are you sure you want to delete "${selectedSponsor.company_name}"?` :
                  selectedSponsor.company_name
                }
              </p>
              
              {modalAction === 'delete' && (
                <p className="modal-warning" style={{ margin: 0, color: '#f87171', fontSize: '0.9rem' }}>
                  This will permanently remove this sponsor from the database. This action cannot be undone.
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

      {/* View Information Modal - Simplified for brevity */}
      {showViewModal && selectedSponsor && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header" style={{ borderBottom: '2px solid var(--color-dark)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="modal-title" style={{ margin: 0 }}>Sponsor Application Details</h3>
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
              {/* Similar structure to volunteers modal but with sponsor fields */}
              <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
                <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{selectedSponsor.company_name}</p>
                <p style={{ fontSize: '0.9rem' }}>{selectedSponsor.contact_name} • {selectedSponsor.contact_email}</p>
                {selectedSponsor.website && <p style={{ fontSize: '0.9rem' }}>{selectedSponsor.website}</p>}
                <div style={{ marginTop: '1rem' }}>{getStatusBadge(selectedSponsor.application_status)}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

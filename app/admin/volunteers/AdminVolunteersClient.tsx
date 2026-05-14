'use client';

import { useState } from 'react';
import { useAdminData } from '@/contexts/AdminDataContext';
import { approveVolunteer, rejectVolunteer, waitlistVolunteer, deleteVolunteer } from '@/app/actions/volunteers';
import type { Volunteer } from '@/app/actions/volunteers';

type TabType = 'all' | 'pending' | 'approved' | 'rejected' | 'waitlisted';

export default function AdminVolunteersClient() {
  const { volunteers, loading, error, invalidateCache, refreshData } = useAdminData();
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | 'waitlist' | 'delete' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const tabs: { key: TabType; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: volunteers.length },
    { key: 'pending', label: 'Pending', count: volunteers.filter(v => v.application_status === 'pending').length },
    { key: 'approved', label: 'Approved', count: volunteers.filter(v => v.application_status === 'approved').length },
    { key: 'rejected', label: 'Rejected', count: volunteers.filter(v => v.application_status === 'rejected').length },
    { key: 'waitlisted', label: 'Waitlisted', count: volunteers.filter(v => v.application_status === 'waitlisted').length },
  ];

  const filteredVolunteers = volunteers.filter(v => 
    activeTab === 'all' || v.application_status === activeTab
  );

  const handleAction = async (volunteer: Volunteer, action: 'approve' | 'reject' | 'waitlist' | 'delete') => {
    setSelectedVolunteer(volunteer);
    setModalAction(action);
    setRejectionReason('');
    setShowModal(true);
  };

  const handleViewInfo = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    setShowViewModal(true);
  };

  const confirmAction = async () => {
    if (!selectedVolunteer || !modalAction) return;
    
    setProcessingId(selectedVolunteer.id);
    
    try {
      let result;
      switch (modalAction) {
        case 'approve':
          result = await approveVolunteer(selectedVolunteer.id);
          break;
        case 'reject':
          result = await rejectVolunteer(selectedVolunteer.id, rejectionReason || undefined);
          break;
        case 'waitlist':
          result = await waitlistVolunteer(selectedVolunteer.id);
          break;
        case 'delete':
          result = await deleteVolunteer(selectedVolunteer.id);
          break;
      }
      
      if (result?.success) {
        invalidateCache('volunteers');
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
      setSelectedVolunteer(null);
      setModalAction(null);
      setRejectionReason('');
    }
  };

  const getStatusBadge = (status: Volunteer['application_status']) => {
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
          <span className="ml-3 text-gray-600">Loading volunteers...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-content-panel">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-medium">Error loading volunteers</p>
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
        <h2 className="vendor-page-title">Volunteer Applications</h2>
        <p className="vendor-page-subtitle">Review and manage volunteer applications</p>
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
        {filteredVolunteers.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <path d="M8 15h8" />
                <circle cx="9" cy="9" r="1" />
                <circle cx="15" cy="9" r="1" />
              </svg>
            </div>
            <p>No volunteers found for this status.</p>
          </div>
        ) : (
          filteredVolunteers.map(volunteer => (
            <div key={volunteer.id} className="admin-vendor-card">
              <div className="vendor-header">
                <div className="vendor-info">
                  <div className="vendor-name-row">
                    <h3 className="vendor-name">{volunteer.full_name}</h3>
                    {getStatusBadge(volunteer.application_status)}
                  </div>
                  <p className="vendor-contact">{volunteer.email}</p>
                  {volunteer.phone && <p className="vendor-phone">{volunteer.phone}</p>}
                </div>
                <span className="vendor-date">
                  {new Date(volunteer.applied_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
              
              {/* Preferred Roles */}
              {volunteer.preferred_roles && volunteer.preferred_roles.length > 0 && (
                <div className="vendor-categories">
                  <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 600, marginRight: '0.5rem' }}>PREFERRED ROLES:</span>
                  {volunteer.preferred_roles.map((role, i) => (
                    <span key={i} className="category-tag">{role}</span>
                  ))}
                </div>
              )}
              
              {/* Availability */}
              {volunteer.availability && (
                <p className="vendor-description" style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>
                  <strong>Availability:</strong> {volunteer.availability}
                </p>
              )}
              
              {/* Previous Experience */}
              {volunteer.previous_experience && (
                <p className="vendor-description" style={{ marginTop: '0.5rem', fontSize: '0.9rem' }}>
                  <strong>Experience:</strong> {volunteer.previous_experience}
                </p>
              )}
              
              {/* T-Shirt Size & Emergency Contact */}
              <div className="vendor-event-requirements" style={{ marginTop: '0.75rem', paddingTop: '0.75rem', borderTop: '1px solid rgba(0,0,0,0.08)' }}>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.5rem' }}>
                  {volunteer.t_shirt_size && (
                    <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>
                      👕 T-Shirt: {volunteer.t_shirt_size}
                    </span>
                  )}
                  {volunteer.emergency_contact_name && (
                    <span style={{ fontSize: '0.85rem', color: '#666', fontWeight: 500 }}>
                       Emergency: {volunteer.emergency_contact_name} {volunteer.emergency_contact_phone && `(${volunteer.emergency_contact_phone})`}
                    </span>
                  )}
                </div>
                {volunteer.how_heard_about && (
                  <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
                    📢 Heard about: {volunteer.how_heard_about}
                  </div>
                )}
                {volunteer.additional_notes && (
                  <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                    📝 {volunteer.additional_notes}
                  </div>
                )}
              </div>
              
              {volunteer.rejection_reason && (
                <div className="rejection-reason">
                  <strong>Rejection Reason:</strong> {volunteer.rejection_reason}
                </div>
              )}
              
              <div className="vendor-actions">
                <button
                  onClick={() => handleViewInfo(volunteer)}
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
                {volunteer.application_status === 'pending' && (
                  <>
                    <button
                      onClick={() => handleAction(volunteer, 'approve')}
                      disabled={processingId === volunteer.id}
                      className="btn-approve"
                    >
                      {processingId === volunteer.id ? 'Processing...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(volunteer, 'reject')}
                      disabled={processingId === volunteer.id}
                      className="btn-reject"
                    >
                      ✕ Reject
                    </button>
                    <button
                      onClick={() => handleAction(volunteer, 'waitlist')}
                      disabled={processingId === volunteer.id}
                      className="btn-waitlist"
                    >
                       Waitlist
                    </button>
                  </>
                )}
                {volunteer.application_status === 'approved' && (
                  <>
                    <button
                      onClick={() => handleAction(volunteer, 'reject')}
                      disabled={processingId === volunteer.id}
                      className="btn-reject"
                    >
                      ✕ Unapprove
                    </button>
                    <button
                      onClick={() => handleAction(volunteer, 'waitlist')}
                      disabled={processingId === volunteer.id}
                      className="btn-waitlist"
                    >
                       Waitlist
                    </button>
                    <button
                      onClick={() => handleAction(volunteer, 'delete')}
                      disabled={processingId === volunteer.id}
                      className="btn-delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      Delete
                    </button>
                  </>
                )}
                {volunteer.application_status === 'rejected' && (
                  <>
                    <button
                      onClick={() => handleAction(volunteer, 'approve')}
                      disabled={processingId === volunteer.id}
                      className="btn-approve"
                    >
                      {processingId === volunteer.id ? 'Processing...' : '✓ Re-approve'}
                    </button>
                    <button
                      onClick={() => handleAction(volunteer, 'waitlist')}
                      disabled={processingId === volunteer.id}
                      className="btn-waitlist"
                    >
                       Waitlist
                    </button>
                    <button
                      onClick={() => handleAction(volunteer, 'delete')}
                      disabled={processingId === volunteer.id}
                      className="btn-delete"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      Delete
                    </button>
                  </>
                )}
                {volunteer.application_status === 'waitlisted' && (
                  <>
                    <button
                      onClick={() => handleAction(volunteer, 'approve')}
                      disabled={processingId === volunteer.id}
                      className="btn-approve"
                    >
                      {processingId === volunteer.id ? 'Processing...' : '✓ Approve'}
                    </button>
                    <button
                      onClick={() => handleAction(volunteer, 'reject')}
                      disabled={processingId === volunteer.id}
                      className="btn-reject"
                    >
                      ✕ Reject
                    </button>
                    <button
                      onClick={() => handleAction(volunteer, 'delete')}
                      disabled={processingId === volunteer.id}
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
      {showModal && selectedVolunteer && modalAction && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={modalAction === 'delete' ? { color: '#f87171' } : {}}>
                {modalAction === 'approve' && 'Approve Volunteer'}
                {modalAction === 'reject' && 'Reject Application'}
                {modalAction === 'waitlist' && 'Waitlist Volunteer'}
                {modalAction === 'delete' && 'Delete Volunteer'}
              </h3>
            </div>
            
            <div className="modal-body">
              <p className="modal-vendor-name" style={{ margin: 0, marginBottom: modalAction === 'reject' || modalAction === 'delete' ? '12px' : '0' }}>
                {modalAction === 'delete' ? 
                  `Are you sure you want to delete "${selectedVolunteer.full_name}"?` :
                  selectedVolunteer.full_name
                }
              </p>
              
              {modalAction === 'delete' && (
                <p className="modal-warning" style={{ margin: 0, color: '#f87171', fontSize: '0.9rem' }}>
                  This will permanently remove this volunteer from the database. This action cannot be undone.
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
      {showViewModal && selectedVolunteer && (
        <div className="modal-overlay" onClick={() => setShowViewModal(false)}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '800px' }}>
            <div className="modal-header" style={{ borderBottom: '2px solid var(--color-dark)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 className="modal-title" style={{ margin: 0 }}>Volunteer Application Details</h3>
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
              {/* Personal Info Section */}
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
                  Personal Information
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Full Name</p>
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedVolunteer.full_name}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Email Address</p>
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedVolunteer.email}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Phone Number</p>
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedVolunteer.phone || 'Not provided'}</p>
                  </div>
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>T-Shirt Size</p>
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedVolunteer.t_shirt_size || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Volunteer Preferences Section */}
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
                  Volunteer Preferences
                </h4>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>Preferred Roles</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selectedVolunteer.preferred_roles.map((role, i) => (
                      <span key={i} className="category-tag">{role}</span>
                    ))}
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Availability</p>
                  <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedVolunteer.availability}</p>
                </div>
                {selectedVolunteer.previous_experience && (
                  <div style={{ marginTop: '1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Previous Experience</p>
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedVolunteer.previous_experience}</p>
                  </div>
                )}
              </div>

              {/* Emergency Contact Section */}
              {selectedVolunteer.emergency_contact_name && (
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
                    Emergency Contact
                  </h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Contact Name</p>
                      <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedVolunteer.emergency_contact_name}</p>
                    </div>
                    <div>
                      <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Contact Phone</p>
                      <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedVolunteer.emergency_contact_phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Additional Info Section */}
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
                  Additional Information
                </h4>
                {selectedVolunteer.how_heard_about && (
                  <div style={{ marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>How They Heard About Us</p>
                    <p style={{ fontWeight: 600, fontSize: '1rem' }}>{selectedVolunteer.how_heard_about}</p>
                  </div>
                )}
                {selectedVolunteer.additional_notes && (
                  <div>
                    <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Additional Notes</p>
                    <p style={{ fontWeight: 600, fontSize: '1rem', fontStyle: 'italic' }}>{selectedVolunteer.additional_notes}</p>
                  </div>
                )}
              </div>

              {/* Application Status */}
              <div style={{ 
                marginTop: '1.5rem', 
                paddingTop: '1.5rem', 
                borderTop: '2px solid var(--color-dark)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Application Status</p>
                  {getStatusBadge(selectedVolunteer.application_status)}
                </div>
                <div>
                  <p style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.25rem' }}>Applied On</p>
                  <p style={{ fontWeight: 600, fontSize: '1rem' }}>
                    {new Date(selectedVolunteer.applied_at).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      month: 'long', 
                      day: 'numeric', 
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

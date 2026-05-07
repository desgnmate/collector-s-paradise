'use client';

import Image from 'next/image';

import { useState, useEffect, useRef } from 'react';
import { createEvent, updateEvent, deleteEvent, getAdminEvents, type Event } from '@/app/actions/events';

export default function EventsContent() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  // Cover image state
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [selectedCoverImage, setSelectedCoverImage] = useState<File | null>(null);
  const coverImageRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const data = await getAdminEvents();
      setEvents(data);
    } catch (err) {
      console.error('Failed to fetch events:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setMessage({ text: 'Cover image must be less than 5MB.', type: 'error' });
      e.target.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      setMessage({ text: 'Cover image must be an image file.', type: 'error' });
      e.target.value = '';
      return;
    }
    setSelectedCoverImage(file);
    const reader = new FileReader();
    reader.onload = () => setCoverImagePreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const clearCoverImage = () => {
    setCoverImagePreview(null);
    setSelectedCoverImage(null);
    if (coverImageRef.current) coverImageRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    try {
      let result;
      if (editingEvent) {
        // Update existing event
        const updateFn = updateEvent.bind(null, editingEvent.id);
        result = await updateFn({ message: '', errors: undefined, success: false }, formData);
      } else {
        // Create new event
        result = await createEvent({ message: '', errors: undefined, success: false }, formData);
      }

      if (result.success) {
        setMessage({ text: result.message, type: 'success' });
        setShowForm(false);
        setEditingEvent(null);
        form.reset();
        clearCoverImage();
        fetchEvents();
      } else {
        setMessage({ text: result.message, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Something went wrong. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingEvent) return;
    setSubmitting(true);

    try {
      const result = await deleteEvent(deletingEvent.id);
      if (result.success) {
        setMessage({ text: result.message, type: 'success' });
        fetchEvents();
      } else {
        setMessage({ text: result.message, type: 'error' });
      }
    } catch (err) {
      setMessage({ text: 'Failed to delete event.', type: 'error' });
    } finally {
      setSubmitting(false);
      setDeletingEvent(null);
    }
  };

  const openEdit = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
    setMessage(null);
    // Set existing cover image preview if available
    if (event.cover_image_url) {
      setCoverImagePreview(event.cover_image_url);
      setSelectedCoverImage(null); // No new file selected, keeping existing URL
    } else {
      setCoverImagePreview(null);
      setSelectedCoverImage(null);
    }
  };

  const openCreate = () => {
    setEditingEvent(null);
    setShowForm(true);
    setMessage(null);
    setCoverImagePreview(null);
    setSelectedCoverImage(null);
    if (coverImageRef.current) coverImageRef.current.value = '';
  };

  const filteredEvents = events.filter(e => statusFilter === 'all' || e.status === statusFilter);

  const tabs = [
    { key: 'all', label: 'All', count: events.length },
    { key: 'upcoming', label: 'Upcoming', count: events.filter(e => e.status === 'upcoming').length },
    { key: 'active', label: 'Active', count: events.filter(e => e.status === 'active').length },
    { key: 'completed', label: 'Completed', count: events.filter(e => e.status === 'completed').length },
    { key: 'cancelled', label: 'Cancelled', count: events.filter(e => e.status === 'cancelled').length },
  ];

  const statusConfig: Record<string, { color: string; bg: string; border: string }> = {
    upcoming: { color: '#60a5fa', bg: 'rgba(59, 130, 246, 0.12)', border: 'rgba(59, 130, 246, 0.25)' },
    active: { color: '#4ade80', bg: 'rgba(34, 197, 94, 0.12)', border: 'rgba(34, 197, 94, 0.25)' },
    completed: { color: 'rgba(255,255,255,0.5)', bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)' },
    cancelled: { color: '#f87171', bg: 'rgba(239, 68, 68, 0.12)', border: 'rgba(239, 68, 68, 0.25)' },
  };

  if (loading) {
    return (
      <div className="admin-content-panel">
        <div className="flex items-center justify-center h-64">
          <div className="admin-spinner"></div>
          <span className="ml-3 text-gray-600">Loading events...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content-panel">
      {/* Header */}
      <div className="vendor-page-header">
        <div className="vendor-page-header-left">
          <h2 className="vendor-page-title">Events</h2>
          <p className="vendor-page-subtitle">Create and manage trading card events</p>
        </div>
        <button
          onClick={openCreate}
          className="btn-create-event"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          New Event
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`admin-alert ${message.type === 'success' ? 'admin-alert-success' : 'admin-alert-error'}`}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div className="admin-tabs">
        {tabs.map(tab => (
          <button
            key={tab.key}
            onClick={() => setStatusFilter(tab.key)}
            className={`admin-tab ${statusFilter === tab.key ? 'active' : ''}`}
          >
            {tab.label}
            <span className="tab-count">{tab.count}</span>
          </button>
        ))}
      </div>

      {/* Events Grid */}
      <div className="events-grid">
        {filteredEvents.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <p>{statusFilter === 'all' ? 'No events yet. Create your first event!' : 'No events with this status.'}</p>
          </div>
        ) : (
          filteredEvents.map(event => (
            <div key={event.id} className="event-card">
              {/* Event Cover Image */}
              {event.cover_image_url && (
                <div className="event-cover-image-wrapper">
                  <Image src={event.cover_image_url} alt={event.title} className="event-cover-image" fill style={{ objectFit: 'cover' }} />
                </div>
              )}
              <div className="event-card-header">
                <span
                  className="status-badge"
                  style={{
                    background: statusConfig[event.status]?.bg,
                    color: statusConfig[event.status]?.color,
                    border: `1px solid ${statusConfig[event.status]?.border}`,
                  }}
                >
                  {event.status}
                </span>
                <div className="event-card-actions">
                  <button onClick={() => openEdit(event)} className="btn-edit" title="Edit">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                    </svg>
                  </button>
                  <button onClick={() => setDeletingEvent(event)} className="btn-delete" title="Delete">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="3 6 5 6 21 6" />
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                    </svg>
                  </button>
                </div>
              </div>

              <h3 className="event-card-title">{event.title}</h3>

              <div className="event-card-details">
                <div className="event-detail">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                  <span>{new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                </div>
                <div className="event-detail">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>{event.start_time} – {event.end_time}</span>
                </div>
                {event.venue && (
                  <div className="event-detail">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    <span>{event.venue}</span>
                  </div>
                )}
                <div className="event-detail">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span>{event.tickets_sold} / {event.capacity} sold</span>
                </div>
                <div className="event-detail">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="1" x2="12" y2="23" />
                    <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <span>${event.ticket_price.toFixed(2)}</span>
                </div>
              </div>

              {event.description && (
                <p className="event-card-description">{event.description}</p>
              )}

              {event.booking_link && (
                <a
                  href={event.booking_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-book-event"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                    <polyline points="15 3 21 3 21 9" />
                    <line x1="10" y1="14" x2="21" y2="3" />
                  </svg>
                  Book Now
                </a>
              )}
            </div>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditingEvent(null); }}>
          <div className="modal-content modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editingEvent ? 'Edit Event' : 'Create New Event'}</h3>
              <p className="modal-vendor-name">Fill in the event details below</p>
            </div>

            <div className="modal-body">
              <form onSubmit={handleSubmit} className="event-form">
                <div className="event-form-grid">
                  <div className="event-form-group full-width">
                    <label htmlFor="title">Event Title *</label>
                    <input
                      type="text"
                      id="title"
                      name="title"
                      required
                      placeholder="e.g. Collector's Paradise — May Market"
                      defaultValue={editingEvent?.title || ''}
                    />
                  </div>

                  <div className="event-form-group full-width">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      rows={3}
                      placeholder="Describe the event..."
                      defaultValue={editingEvent?.description || ''}
                    />
                  </div>

                  <div className="event-form-group">
                    <label htmlFor="event_date">Event Date *</label>
                    <input
                      type="date"
                      id="event_date"
                      name="event_date"
                      required
                      defaultValue={editingEvent?.event_date || ''}
                    />
                  </div>

                  <div className="event-form-group">
                    <label htmlFor="start_time">Start Time *</label>
                    <input
                      type="time"
                      id="start_time"
                      name="start_time"
                      required
                      defaultValue={editingEvent?.start_time || ''}
                    />
                  </div>

                  <div className="event-form-group">
                    <label htmlFor="end_time">End Time *</label>
                    <input
                      type="time"
                      id="end_time"
                      name="end_time"
                      required
                      defaultValue={editingEvent?.end_time || ''}
                    />
                  </div>

                  <div className="event-form-group">
                    <label htmlFor="venue">Venue</label>
                    <input
                      type="text"
                      id="venue"
                      name="venue"
                      placeholder="e.g. Melbourne Convention Centre"
                      defaultValue={editingEvent?.venue || ''}
                    />
                  </div>

                  <div className="event-form-group full-width">
                    <label htmlFor="venue_address">Venue Address</label>
                    <input
                      type="text"
                      id="venue_address"
                      name="venue_address"
                      placeholder="e.g. 1 Convention Centre Pl, South Wharf VIC 3006"
                      defaultValue={editingEvent?.venue_address || ''}
                    />
                  </div>

                  <div className="event-form-group">
                    <label htmlFor="capacity">Capacity *</label>
                    <input
                      type="number"
                      id="capacity"
                      name="capacity"
                      required
                      min="1"
                      placeholder="200"
                      defaultValue={editingEvent?.capacity || ''}
                    />
                  </div>

                  <div className="event-form-group">
                    <label htmlFor="ticket_price">Ticket Price (AUD) *</label>
                    <input
                      type="number"
                      id="ticket_price"
                      name="ticket_price"
                      required
                      step="0.01"
                      min="0"
                      placeholder="15.00"
                      defaultValue={editingEvent?.ticket_price || ''}
                    />
                  </div>

                  <div className="event-form-group full-width">
                    <label htmlFor="booking_link">Booking Link</label>
                    <input
                      type="url"
                      id="booking_link"
                      name="booking_link"
                      placeholder="https://eventbrite.com/e/your-event"
                      defaultValue={editingEvent?.booking_link || ''}
                    />
                  </div>

                  {/* Cover Image Upload */}
                  <div className="event-form-group full-width">
                    <label htmlFor="cover_image">Cover Image</label>
                    <div className="admin-cover-upload">
                      {coverImagePreview ? (
                        <div className="admin-cover-preview">
                          <img src={coverImagePreview} alt="Cover preview" className="admin-cover-preview-img" />
                          <button type="button" onClick={clearCoverImage} className="admin-cover-remove" title="Remove image">
                            ✕
                          </button>
                        </div>
                      ) : (
                        <label htmlFor="cover_image" className="admin-cover-placeholder">
                          <span>Click to upload cover image</span>
                          <span className="admin-cover-hint">PNG, JPG, WebP — max 5MB</span>
                        </label>
                      )}
                      <input
                        ref={coverImageRef}
                        type="file"
                        id="cover_image"
                        name="cover_image"
                        accept="image/png,image/jpeg,image/webp,image/gif"
                        onChange={handleCoverImageChange}
                        className="admin-cover-input"
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>

            <div className="modal-footer">
              <div className="modal-actions">
                <button type="button" onClick={() => { setShowForm(false); setEditingEvent(null); }} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" className="btn-confirm-approve" disabled={submitting} onClick={() => (document.querySelector('.event-form') as HTMLFormElement)?.requestSubmit()}>
                  {submitting ? 'Saving...' : editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEvent && (
        <div className="modal-overlay" onClick={() => setDeletingEvent(null)}>
          <div className="modal-content modal-sm" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ color: '#f87171' }}>Delete Event</h3>
            </div>
            <div className="modal-body">
              <p className="modal-vendor-name" style={{ margin: 0 }}>
                Are you sure you want to delete "{deletingEvent.title}"? This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <div className="modal-actions" style={{ marginTop: 0 }}>
                <button onClick={() => setDeletingEvent(null)} className="btn-cancel">
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="btn-confirm-reject"
                  disabled={submitting}
                >
                  {submitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

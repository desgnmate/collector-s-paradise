'use client';

import { useState, useRef } from 'react';
import { useActionState } from 'react';
import { createEvent, type Event } from '@/app/actions/events';

type AdminEventFormProps = {
  events: Event[];
};

const initialState = { message: '', errors: undefined, success: false };

export default function AdminEventsClient({ events }: AdminEventFormProps) {
  const [state, formAction, pending] = useActionState(createEvent, initialState);
  const [coverImagePreview, setCoverImagePreview] = useState<string | null>(null);
  const [selectedCoverImage, setSelectedCoverImage] = useState<File | null>(null);
  const coverImageRef = useRef<HTMLInputElement>(null);

  const handleCoverImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Cover image must be less than 5MB.');
      e.target.value = '';
      return;
    }
    if (!file.type.startsWith('image/')) {
      alert('Cover image must be an image file.');
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

  return (
    <div className="admin-page">
      <div className="admin-page-header-row">
        <div>
          <h1 className="admin-page-title">Events</h1>
          <p className="admin-page-subtitle">Create and manage your events.</p>
        </div>
      </div>

      {/* Create Event Form */}
      <div className="admin-form-card">
        <h3 className="admin-form-title">Create New Event</h3>

        {state.message && (
          <div className={`admin-alert ${state.success ? 'admin-alert-success' : 'admin-alert-error'}`}>
            {state.message}
          </div>
        )}

        <form action={formAction} className="admin-form">
          <div className="admin-form-grid">
            <div className="admin-form-group admin-form-group-wide">
              <label htmlFor="title">Event Title *</label>
              <input type="text" id="title" name="title" required placeholder="e.g. Collector's Paradise — May Market" />
              {state.errors?.title && <span className="admin-form-error">{state.errors.title[0]}</span>}
            </div>

            <div className="admin-form-group admin-form-group-wide">
              <label htmlFor="description">Description</label>
              <textarea id="description" name="description" rows={3} placeholder="Describe the event..." />
            </div>

            <div className="admin-form-group">
              <label htmlFor="event_date">Event Date *</label>
              <input type="date" id="event_date" name="event_date" required />
              {state.errors?.event_date && <span className="admin-form-error">{state.errors.event_date[0]}</span>}
            </div>

            <div className="admin-form-group">
              <label htmlFor="start_time">Start Time *</label>
              <input type="time" id="start_time" name="start_time" required />
            </div>

            <div className="admin-form-group">
              <label htmlFor="end_time">End Time *</label>
              <input type="time" id="end_time" name="end_time" required />
            </div>

            <div className="admin-form-group">
              <label htmlFor="venue">Venue</label>
              <input type="text" id="venue" name="venue" placeholder="e.g. Melbourne Convention Centre" />
            </div>

            <div className="admin-form-group admin-form-group-wide">
              <label htmlFor="venue_address">Venue Address</label>
              <input type="text" id="venue_address" name="venue_address" placeholder="e.g. 1 Convention Centre Pl, South Wharf VIC 3006" />
            </div>

            <div className="admin-form-group">
              <label htmlFor="capacity">Capacity *</label>
              <input type="number" id="capacity" name="capacity" required min="1" placeholder="200" />
            </div>

            <div className="admin-form-group">
              <label htmlFor="ticket_price">Ticket Price (AUD) *</label>
              <input type="number" id="ticket_price" name="ticket_price" required step="0.01" min="0" placeholder="15.00" />
            </div>

            {/* Cover Image Upload */}
            <div className="admin-form-group admin-form-group-wide">
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

          <button type="submit" className="btn btn-yellow admin-submit-btn" disabled={pending}>
            {pending ? 'Creating...' : 'Create Event'}
          </button>
        </form>
      </div>

      {/* Events Table */}
      <div className="admin-table-card">
        <h3 className="admin-form-title">All Events</h3>

        {events.length === 0 ? (
          <p className="admin-empty-state">No events yet. Create your first event above!</p>
        ) : (
          <div className="admin-table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Cover</th>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Venue</th>
                  <th>Capacity</th>
                  <th>Tickets Sold</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="admin-table-cover">
                      {event.cover_image_url ? (
                        <img src={event.cover_image_url} alt="" className="admin-table-cover-img" />
                      ) : (
                        <span className="admin-table-cover-empty">—</span>
                      )}
                    </td>
                    <td className="admin-table-title">{event.title}</td>
                    <td>{new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-AU')}</td>
                    <td>{event.venue || '—'}</td>
                    <td>{event.capacity}</td>
                    <td>{event.tickets_sold}</td>
                    <td>
                      <span className={`admin-status-badge admin-status-${event.status}`}>
                        {event.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

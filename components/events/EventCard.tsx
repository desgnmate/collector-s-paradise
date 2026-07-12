'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Event } from '@/app/actions/events';

const EVENT_COVER_FALLBACK = '/images/event-experience.png';

interface EventCardProps {
  event: Event;
  variant?: 'upcoming' | 'past';
}

export default function EventCard({ event, variant = 'upcoming' }: EventCardProps) {
  const dateObj = new Date(event.event_date + 'T00:00:00');
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-AU', { month: 'short' }).toUpperCase();
  const fullDate = dateObj.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Compute "today" in the same YYYY-MM-DD shape as event_date so
  // the comparison is timezone-safe. If the date is in the past,
  // the event is past — regardless of the DB status field (which
  // admins may not have updated yet).
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const isPast = event.event_date < todayStr;

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    upcoming: { label: 'UPCOMING', color: '#2E7D32', bg: '#E8F5E9' },
    active: { label: 'ACTIVE', color: '#1565C0', bg: '#E3F2FD' },
    completed: { label: 'PAST EVENT', color: '#757575', bg: '#F5F5F5' },
    cancelled: { label: 'CANCELLED', color: '#C62828', bg: '#FFEBEE' },
  };

  // Past date wins over the DB status — that's the whole point of
  // this guard. Cancelled events stay cancelled.
  const effectiveKey = isPast && event.status !== 'cancelled' ? 'completed' : event.status;
  const status = statusConfig[effectiveKey] || statusConfig.upcoming;

  // If the card is rendered in the "upcoming" group but the date has
  // actually passed, switch the variant so the CTA says "VIEW GALLERY".
  const effectiveVariant = isPast ? 'past' : variant;

  return (
    <Link
      href={`/events/${event.id}`}
      prefetch
      className={`ec-card ${isPast ? 'ec-card-past' : ''}`}
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      {/* Cover Image with Date Chip */}
      <div className="ec-image-wrapper">
        <Image
          src={event.cover_image_url || EVENT_COVER_FALLBACK}
          alt={event.title}
          fill
          loading="lazy"
          style={{ objectFit: 'cover' }}
        />
        {/* Date chip */}
        <div className="ec-date-chip">
          <span className="ec-date-day">{day}</span>
          <span className="ec-date-month">{month}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="ec-content">
        {/* Status badge */}
        <div className="ec-card-kicker">
          <span
            className="ec-status-badge"
            style={{
              color: status.color,
              background: status.bg,
            }}
          >
            {status.label}
          </span>
          <span className="ec-full-date">{fullDate}</span>
        </div>

        {/* Title */}
        <h3 className="ec-title">{event.title}</h3>

        {/* Meta row: venue + price */}
        <div className="ec-meta">
          {event.venue && (
            <span className="ec-venue">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {event.venue}
            </span>
          )}
          <span className="ec-price">
            {event.ticket_price > 0 ? `$${event.ticket_price.toFixed(2)}` : ''}
          </span>
        </div>

        {/* Footer row: CTA */}
        <div className="ec-footer">
          <span className="ec-cta">
            {effectiveVariant === 'upcoming' ? 'VIEW EVENT' : 'VIEW GALLERY'}
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

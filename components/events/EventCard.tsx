'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Event } from '@/app/actions/events';

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

  const statusConfig: Record<string, { label: string; color: string; bg: string }> = {
    upcoming: { label: 'UPCOMING', color: '#2E7D32', bg: '#E8F5E9' },
    active: { label: 'ACTIVE', color: '#1565C0', bg: '#E3F2FD' },
    completed: { label: 'PAST EVENT', color: '#757575', bg: '#F5F5F5' },
    cancelled: { label: 'CANCELLED', color: '#C62828', bg: '#FFEBEE' },
  };

  const status = statusConfig[event.status] || statusConfig.upcoming;

  return (
    <Link
      href={`/events/${event.id}`}
      className="ec-card"
      style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}
    >
      {/* Cover Image with Date Chip */}
      <div className="ec-image-wrapper">
        <Image
          src={event.cover_image_url || '/images/placeholder-event.png'}
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
        <span
          className="ec-status-badge"
          style={{
            color: status.color,
            background: status.bg,
          }}
        >
          {status.label}
        </span>

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
            {variant === 'upcoming' ? 'VIEW EVENT' : 'VIEW GALLERY'}
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
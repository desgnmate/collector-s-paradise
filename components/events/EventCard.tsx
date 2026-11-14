'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { Event } from '@/app/actions/events';
import { getEffectiveEventStatus, getLocalDateKey } from '@/lib/events/status';
import { getEventCoverImage } from '@/lib/events/cover';
import { parseAustralianEventAddress } from '@/lib/event-location';

interface EventCardProps {
  event: Event;
  variant?: 'upcoming' | 'past';
}

function formatPrice(price: number) {
  return Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`;
}

function addDays(dateKey: string, days: number) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + days);
  return getLocalDateKey(date);
}

export default function EventCard({ event, variant = 'upcoming' }: EventCardProps) {
  const dateObj = new Date(event.event_date + 'T00:00:00');
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-AU', { month: 'short' }).toUpperCase();
  const weekdayYear = `${dateObj.toLocaleDateString('en-AU', { weekday: 'long' })} ${dateObj.getFullYear()}`;

  const today = getLocalDateKey();
  const status = getEffectiveEventStatus(event, today);
  // A card in the "upcoming" group whose date has passed reads as a past event.
  const isPast = status === 'completed' || (variant === 'past' && status !== 'cancelled');
  const isCancelled = status === 'cancelled';

  const soonLabel = isPast || isCancelled ? null
    : event.event_date === today ? 'Today'
    : event.event_date === addDays(today, 1) ? 'Tomorrow'
    : null;
  const coverTag = isCancelled ? 'Cancelled' : isPast ? 'Past event' : soonLabel;

  const { locality } = parseAustralianEventAddress(event.venue_address);
  const place = [event.venue, locality && !event.venue?.toLowerCase().includes(locality.toLowerCase()) ? locality : null]
    .filter(Boolean)
    .join(' · ');
  const price = event.ticket_price > 0 ? formatPrice(event.ticket_price) : null;

  return (
    <Link
      href={`/events/${event.id}`}
      prefetch
      className={`evc ${isPast ? 'is-past' : ''} ${isCancelled ? 'is-cancelled' : ''}`}
    >
      <div className="evc-cover">
        <Image
          src={getEventCoverImage(event)}
          alt=""
          fill
          sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 400px"
          loading="lazy"
        />
        {coverTag && (
          <span className={`evc-tag ${soonLabel ? 'is-soon' : ''}`}>
            {soonLabel && <span className="evc-tag-dot" aria-hidden="true" />}
            {coverTag}
          </span>
        )}
      </div>

      <div className="evc-body">
        <div className="evc-heading">
          <span className="evc-date" aria-hidden="true">
            <span className="evc-date-day">{day}</span>
            <span className="evc-date-month">{month}</span>
          </span>
          <div className="evc-heading-copy">
            <span className="evc-weekday">{weekdayYear}</span>
            <h3 className="evc-title">{event.title}</h3>
          </div>
        </div>

        {place && (
          <span className="evc-place">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
              <circle cx="12" cy="10" r="3" />
            </svg>
            {place}
          </span>
        )}

        <div className="evc-footer">
          {isPast || isCancelled ? (
            <span className="evc-price-note">{price ? `Entry was ${price}` : isCancelled ? 'This event was cancelled' : 'Event finished'}</span>
          ) : (
            <span className="evc-price">
              <span className="evc-price-label">{price ? 'Tickets from' : 'Tickets'}</span>
              <span className="evc-price-value">{price ?? 'Details soon'}</span>
            </span>
          )}
          <span className="evc-cta">
            {isPast ? 'Event recap' : 'View event'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <line x1="5" y1="12" x2="19" y2="12" />
              <polyline points="12 5 19 12 12 19" />
            </svg>
          </span>
        </div>
      </div>
    </Link>
  );
}

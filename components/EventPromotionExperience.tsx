'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, MapPin, Ticket, X } from 'lucide-react';
import type { PromotedEvent } from '@/lib/event-promotion';

const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

export default function EventPromotionExperience({
  event,
}: {
  event: PromotedEvent;
}) {
  const [showPopup, setShowPopup] = useState(false);
  const dismissalKey = `cp-event-promo-dismissed:${event.id}`;
  const sessionKey = `cp-event-promo-seen:${event.id}`;

  useEffect(() => {
    const dismissedAt = Number(window.localStorage.getItem(dismissalKey) || 0);
    const wasSeenThisSession = window.sessionStorage.getItem(sessionKey) === 'true';
    if (wasSeenThisSession || Date.now() - dismissedAt < DISMISS_FOR_MS) return;

    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(sessionKey, 'true');
      setShowPopup(true);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [dismissalKey, sessionKey]);

  const dismissPopup = () => {
    window.localStorage.setItem(dismissalKey, String(Date.now()));
    setShowPopup(false);
  };

  return (
    <>
      <aside className="next-event-banner" aria-label={`Next event: ${event.title}`}>
        <div className="next-event-banner-inner">
          <span className="next-event-date" aria-hidden="true">
            <strong>{event.dateDay}</strong>
            <small>{event.dateMonth}</small>
          </span>
          <span className="next-event-copy">
            <span className="next-event-eyebrow"><Ticket aria-hidden="true" /> Up next</span>
            <span className="next-event-info">
              <strong>{event.title}</strong>
              <span className="next-event-meta">
                {event.eventDate} · {event.startTime}{event.venue ? ` · ${event.venue}` : ''}
              </span>
            </span>
          </span>
          <Link className="next-event-link" href={event.href}>
            <span>Event details</span>
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </aside>

      {showPopup ? (
        <aside className="event-promo-popup" aria-label={`Upcoming event promotion: ${event.title}`} aria-live="polite">
          <button className="event-promo-close" type="button" onClick={dismissPopup} aria-label="Dismiss event promotion">
            <X aria-hidden="true" />
          </button>
          <Link className="event-promo-image" href={event.href} aria-label={`View ${event.title}`}>
            <Image
              src={event.coverImageUrl || '/images/event-experience.jpg'}
              alt={`${event.title} promotional artwork`}
              fill
              sizes="(max-width: 520px) 104px, 142px"
            />
          </Link>
          <div className="event-promo-copy">
            <span className="event-promo-kicker"><Ticket aria-hidden="true" /> Up next</span>
            <h2>{event.title}</h2>
            <div className="event-promo-details">
              <span><CalendarDays aria-hidden="true" />{event.eventDate} at {event.startTime}</span>
              {event.venue ? <span><MapPin aria-hidden="true" />{event.venue}</span> : null}
            </div>
          </div>
          <Link className="event-promo-stub" href={event.href} aria-label={`Open ${event.title} event details`}>
            <span>Open</span>
            <ArrowRight aria-hidden="true" />
          </Link>
        </aside>
      ) : null}
    </>
  );
}

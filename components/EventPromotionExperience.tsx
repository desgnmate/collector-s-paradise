'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ArrowRight, CalendarDays, MapPin, Store, Ticket, X } from 'lucide-react';
import type { PromotedEvent } from '@/lib/event-promotion';
import popupImage from '@/Hero pop up image.png';

const DISMISS_FOR_MS = 7 * 24 * 60 * 60 * 1000;

function getCountdown(targetTimeMs: number, nowMs: number) {
  const remainingSeconds = Math.max(0, Math.floor((targetTimeMs - nowMs) / 1000));
  return {
    days: Math.floor(remainingSeconds / 86400),
    hours: Math.floor((remainingSeconds % 86400) / 3600),
    minutes: Math.floor((remainingSeconds % 3600) / 60),
    seconds: remainingSeconds % 60,
    isLive: remainingSeconds === 0,
  };
}

function EventCountdown({ targetTimeMs }: { targetTimeMs: number }) {
  const [nowMs, setNowMs] = useState<number | null>(null);

  useEffect(() => {
    const update = () => setNowMs(Date.now());
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, []);

  if (nowMs === null) {
    return (
      <span className="next-event-countdown" aria-label="Countdown loading">
        {['D', 'H', 'M', 'S'].map((label) => <strong key={label}>--<small>{label}</small></strong>)}
      </span>
    );
  }

  const countdown = getCountdown(targetTimeMs, nowMs);
  if (countdown.isLive) return <span className="next-event-live">Happening today</span>;

  return (
    <span className="next-event-countdown" aria-label={`${countdown.days} days, ${countdown.hours} hours, ${countdown.minutes} minutes and ${countdown.seconds} seconds until the event`}>
      <strong>{String(countdown.days).padStart(2, '0')}<small>D</small></strong>
      <strong>{String(countdown.hours).padStart(2, '0')}<small>H</small></strong>
      <strong>{String(countdown.minutes).padStart(2, '0')}<small>M</small></strong>
      <strong>{String(countdown.seconds).padStart(2, '0')}<small>S</small></strong>
    </span>
  );
}

export default function EventPromotionExperience({
  event,
}: {
  event: PromotedEvent;
}) {
  const [showPopup, setShowPopup] = useState(false);
  const dismissalKey = `cp-event-promo-dismissed:${event.id}`;

  useEffect(() => {
    const dismissedAt = Number(window.localStorage.getItem(dismissalKey) || 0);
    if (Date.now() - dismissedAt < DISMISS_FOR_MS) return;

    const timer = window.setTimeout(() => {
      setShowPopup(true);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [dismissalKey]);

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
          <EventCountdown targetTimeMs={event.targetTimeMs} />
          <Link className="next-event-link" href={event.href}>
            <span>Event details</span>
            <ArrowRight aria-hidden="true" />
          </Link>
        </div>
      </aside>

      {showPopup ? (
        <aside className="event-promo-popup" aria-label={`Vendor application promotion for ${event.title}`} aria-live="polite">
          <button className="event-promo-close" type="button" onClick={dismissPopup} aria-label="Dismiss vendor application promotion">
            <X aria-hidden="true" />
          </button>
          <Link className="event-promo-image" href="/vendors/apply" aria-label={`Apply to trade at ${event.title}`}>
            <Image
              src={popupImage}
              alt="Collector's Paradise vendor application artwork"
              fill
              sizes="(max-width: 520px) 104px, 142px"
            />
          </Link>
          <div className="event-promo-copy">
            <span className="event-promo-kicker"><Store aria-hidden="true" /> Vendor applications</span>
            <h2>Trade at {event.title}</h2>
            <div className="event-promo-details">
              <span><CalendarDays aria-hidden="true" />{event.eventDate} at {event.startTime}</span>
              {event.venue ? <span><MapPin aria-hidden="true" />{event.venue}</span> : null}
            </div>
          </div>
          <Link className="event-promo-stub" href="/vendors/apply" aria-label={`Apply as a vendor for ${event.title}`}>
            <span>Apply</span>
            <ArrowRight aria-hidden="true" />
          </Link>
        </aside>
      ) : null}
    </>
  );
}

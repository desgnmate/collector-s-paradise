'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, MapPin, Ticket, X } from 'lucide-react';
import type { PromotedEvent } from '@/lib/event-promotion';
import vipTicket from '@/Canberra VIP ticket.png';
import gaTicket from '@/Canberra GA ticket.png';

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
  const [isHeroVisible, setIsHeroVisible] = useState(true);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dismissalKey = `cp-ticket-invite-dismissed:v1:${event.id}`;
  const hasMatchingTicketArtwork = /canberra/i.test(event.title);

  const dismissPopup = useCallback(() => {
    window.localStorage.setItem(dismissalKey, String(Date.now()));
    setShowPopup(false);
  }, [dismissalKey]);

  useEffect(() => {
    if (!hasMatchingTicketArtwork) return;

    const dismissedAt = Number(window.localStorage.getItem(dismissalKey) || 0);
    if (Date.now() - dismissedAt < DISMISS_FOR_MS) return;

    const timer = window.setTimeout(() => {
      setShowPopup(true);
    }, 3500);

    return () => window.clearTimeout(timer);
  }, [dismissalKey, hasMatchingTicketArtwork]);

  useEffect(() => {
    const hero = document.getElementById('hero');
    if (!hero) return;

    const observer = new IntersectionObserver(
      ([entry]) => setIsHeroVisible(entry.isIntersecting),
      { threshold: 0.12 },
    );
    observer.observe(hero);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!showPopup || !isHeroVisible) return;

    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (keyboardEvent: KeyboardEvent) => {
      if (keyboardEvent.key === 'Escape') {
        dismissPopup();
        return;
      }

      if (keyboardEvent.key !== 'Tab') return;
      const focusable = Array.from(
        document.querySelectorAll<HTMLElement>('.event-promo-popup a, .event-promo-popup button:not([disabled])'),
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;

      if (keyboardEvent.shiftKey && document.activeElement === first) {
        keyboardEvent.preventDefault();
        last.focus();
      } else if (!keyboardEvent.shiftKey && document.activeElement === last) {
        keyboardEvent.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKeyDown);
      previousFocus?.focus();
    };
  }, [dismissPopup, isHeroVisible, showPopup]);

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

      {hasMatchingTicketArtwork && showPopup && isHeroVisible ? (
        <div
          className="event-promo-backdrop"
          onMouseDown={(mouseEvent) => {
            if (mouseEvent.target === mouseEvent.currentTarget) dismissPopup();
          }}
        >
          <aside
            className="event-promo-popup"
            role="dialog"
            aria-modal="true"
            aria-labelledby="event-promo-title"
            aria-describedby="event-promo-description"
            aria-live="polite"
          >
            <button
              ref={closeButtonRef}
              className="event-promo-close"
              type="button"
              onClick={dismissPopup}
              aria-label="Close ticket invitation"
            >
              <X aria-hidden="true" />
            </button>
            <div className="event-promo-copy">
              <span className="event-promo-kicker"><Ticket aria-hidden="true" /> Canberra tickets are live</span>
              <h2 id="event-promo-title">Join us at {event.title}</h2>
              <p id="event-promo-description" className="event-promo-description">
                Secure your tickets today and join us for an unforgettable day at Collector&apos;s Paradise.
              </p>
            </div>
            <div className="event-promo-ticket-stage" aria-hidden="true">
              <Image
                className="event-promo-ticket event-promo-ticket--vip"
                src={vipTicket}
                alt=""
                sizes="(max-width: 560px) 88vw, 500px"
              />
              <Image
                className="event-promo-ticket event-promo-ticket--ga"
                src={gaTicket}
                alt=""
                sizes="(max-width: 560px) 88vw, 500px"
              />
            </div>
            <div className="event-promo-details">
              <span><CalendarDays aria-hidden="true" />{event.eventDate} at {event.startTime}</span>
              {event.venue ? <span><MapPin aria-hidden="true" />{event.venue}</span> : null}
            </div>
            {/^(https?:)?\/\//.test(event.ticketHref) ? (
              <a
                className="event-promo-action"
                href={event.ticketHref}
                target="_blank"
                rel="noreferrer"
                aria-label={`Buy tickets for ${event.title}`}
              >
                <span>Buy tickets</span>
                <ArrowRight aria-hidden="true" />
              </a>
            ) : (
              <Link
                className="event-promo-action"
                href={event.ticketHref}
                aria-label={`Buy tickets for ${event.title}`}
              >
                <span>Buy tickets</span>
                <ArrowRight aria-hidden="true" />
              </Link>
            )}
          </aside>
        </div>
      ) : null}
    </>
  );
}

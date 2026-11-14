'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CONSENT_OPEN_EVENT,
  getConsent,
  saveConsent,
  type ConsentCategory,
} from '@/lib/consent';

type Choices = Record<ConsentCategory, boolean>;

const CATEGORIES: { id: ConsentCategory | 'essential'; title: string; detail: string }[] = [
  {
    id: 'essential',
    title: 'Essential',
    detail: 'Keeps the site secure and working, including staff sign-in. Always on.',
  },
  {
    id: 'preferences',
    title: 'Preferences',
    detail: 'Remembers choices like a ticket pop-up you closed, so you don’t see it again.',
  },
  {
    id: 'analytics',
    title: 'Analytics',
    detail: 'Would let us count visits to plan better events. Nothing runs yet; this only allows it later.',
  },
];

function CookieIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2a10 10 0 1 0 10 10 4 4 0 0 1-5-5 4 4 0 0 1-5-5" />
      <path d="M8.5 8.5v.01" /><path d="M16 15.5v.01" /><path d="M12 12v.01" /><path d="M11 17v.01" /><path d="M7 14v.01" />
    </svg>
  );
}

export default function CookieConsent() {
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<'banner' | 'settings'>('banner');
  const [hasDecided, setHasDecided] = useState(false);
  const [choices, setChoices] = useState<Choices>({ preferences: false, analytics: false });
  const panelRef = useRef<HTMLDivElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);

  // First visit: ask. Later visits stay quiet until the visitor reopens settings.
  useEffect(() => {
    const saved = getConsent();
    // Reading the cookie needs the browser, so this runs after hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHasDecided(Boolean(saved));
    if (saved) {
      setChoices({ preferences: saved.preferences, analytics: saved.analytics });
    } else {
      setOpen(true);
    }

    const reopen = () => {
      const current = getConsent();
      setHasDecided(Boolean(current));
      setChoices({ preferences: current?.preferences ?? false, analytics: current?.analytics ?? false });
      setView('settings');
      setOpen(true);
      window.requestAnimationFrame(() => headingRef.current?.focus());
    };
    window.addEventListener(CONSENT_OPEN_EVENT, reopen);
    return () => window.removeEventListener(CONSENT_OPEN_EVENT, reopen);
  }, []);

  useEffect(() => {
    if (!open || !hasDecided) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && panelRef.current?.contains(document.activeElement)) setOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, hasDecided]);

  if (!open) return null;

  const decide = (next: Choices) => {
    saveConsent(next);
    setChoices(next);
    setHasDecided(true);
    setOpen(false);
  };

  const toggle = (id: ConsentCategory) => setChoices((current) => ({ ...current, [id]: !current[id] }));

  return (
    <div
      ref={panelRef}
      className={`cookie-consent ${view === 'settings' ? 'is-settings' : ''}`}
      role="region"
      aria-labelledby="cookie-consent-title"
      data-lenis-prevent
    >
      <div className="cookie-consent-head">
        <span className="cookie-consent-icon"><CookieIcon /></span>
        <h2 id="cookie-consent-title" ref={headingRef} tabIndex={-1}>
          {view === 'settings' ? 'Cookie settings' : 'Cookies, your call'}
        </h2>
        {hasDecided && (
          <button type="button" className="cookie-consent-close" aria-label="Close cookie settings" onClick={() => setOpen(false)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
          </button>
        )}
      </div>

      {view === 'banner' ? (
        <>
          <p className="cookie-consent-text">
            We use essential cookies to keep the site working. With your OK we&apos;ll also remember small choices, like a pop-up you&apos;ve closed. No advertising cookies, ever.{' '}
            <Link href="/privacy#cookies">Privacy policy</Link>
          </p>
          <div className="cookie-consent-actions">
            <button type="button" className="cookie-consent-primary" onClick={() => decide({ preferences: true, analytics: true })}>Accept all</button>
            <button type="button" className="cookie-consent-secondary" onClick={() => decide({ preferences: false, analytics: false })}>Essential only</button>
            <button type="button" className="cookie-consent-link" onClick={() => setView('settings')}>Customise</button>
          </div>
        </>
      ) : (
        <>
          <ul className="cookie-consent-list">
            {CATEGORIES.map((category) => {
              const locked = category.id === 'essential';
              const on = locked || choices[category.id as ConsentCategory];
              return (
                <li key={category.id}>
                  <span className="cookie-consent-copy">
                    <strong id={`cookie-${category.id}`}>{category.title}</strong>
                    <small>{category.detail}</small>
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={on}
                    aria-labelledby={`cookie-${category.id}`}
                    disabled={locked}
                    className="cookie-switch"
                    onClick={() => !locked && toggle(category.id as ConsentCategory)}
                  >
                    <span aria-hidden="true" />
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="cookie-consent-actions">
            <button type="button" className="cookie-consent-primary" onClick={() => decide(choices)}>Save choices</button>
            <button type="button" className="cookie-consent-secondary" onClick={() => decide({ preferences: true, analytics: true })}>Accept all</button>
          </div>
        </>
      )}
    </div>
  );
}

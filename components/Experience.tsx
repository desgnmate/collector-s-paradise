'use client';

import React, { useState, useSyncExternalStore } from 'react';
import Link from 'next/link';
import FloorMap3D, { type FloorZone } from '@/components/experience/FloorMap3D';

type ExperienceZone = FloorZone & {
  tag: string;
  blurb: string;
  icon: React.ReactNode;
};

// Each experience maps to an area of the event's pixel floor plan.
const ZONES: ExperienceZone[] = [
  {
    id: 'market',
    num: '1',
    pin: 'Vendor aisles',
    tag: 'Buy / Sell / Trade',
    rect: { left: 20, top: 30, width: 27.5, height: 42 },
    blurb: 'Rows of 100+ vendor tables with singles, sealed product, graded slabs and vintage. Bring your binder — trading is half the fun.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    ),
  },
  {
    id: 'commons',
    num: '2',
    pin: 'Food court',
    tag: 'Connect with Collectors',
    rect: { left: 2, top: 3, width: 44, height: 23 },
    blurb: 'Grab a bite, compare pulls and meet the people who chase the same sets you do. Plenty of first-timers, every age, every game.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    id: 'stage',
    num: '3',
    pin: 'Main stage',
    tag: 'Culture & Fun',
    rect: { left: 55, top: 3, width: 31.5, height: 23 },
    blurb: 'Giveaways, pack openings and community moments on the stage between deals — a day out, not just a market.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    id: 'deals',
    num: '4',
    pin: 'Deal desk',
    tag: 'Live Deal Evaluations',
    rect: { left: 52, top: 75.5, width: 28.5, height: 11.5 },
    blurb: 'Not sure what a card is worth? Get a second opinion on condition and value before you buy, sell or trade.',
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
  },
];

// On wide screens the dialogue box overlays the bottom of the map.
const WIDE_QUERY = '(min-width: 900px)';
function subscribeWide(onChange: () => void) {
  const media = window.matchMedia(WIDE_QUERY);
  media.addEventListener('change', onChange);
  return () => media.removeEventListener('change', onChange);
}

const Experience = () => {
  const [activeId, setActiveId] = useState(ZONES[0].id);
  const [view, setView] = useState<'3d' | 'top'>('3d');
  const isWide = useSyncExternalStore(subscribeWide, () => window.matchMedia(WIDE_QUERY).matches, () => true);

  const index = ZONES.findIndex((zone) => zone.id === activeId);
  const current = ZONES[index];
  const step = (offset: number) => setActiveId(ZONES[(index + offset + ZONES.length) % ZONES.length].id);

  return (
    <section id="experience" className="experience-section">
      <div className="experience-card-container" data-aos="fade-up">
        <div className="experience-content">
          <span className="eyebrow-badge">WHAT YOU&apos;LL EXPERIENCE</span>
          <h2 className="section-title">FUN FOR EVERYONE</h2>
          <p className="section-subtitle">
            Find rare cards, meet the community and enjoy a full day of collecting culture — whether you&apos;re chasing your first card or your next grail.
          </p>

          <div className="experience-proof" aria-label="Event highlights">
            <div><strong>100+</strong><span>Vendors &amp; tables</span></div>
            <div><strong>1</strong><span>Big collector community</span></div>
          </div>

          <p className="experience-tags-hint" id="experience-tags-hint">Explore the floor — pick an area:</p>
          <div className="experience-tags" role="group" aria-labelledby="experience-tags-hint">
            {ZONES.map((zone) => (
              <button
                key={zone.id}
                type="button"
                className={`experience-tag ${zone.id === activeId ? 'is-active' : ''}`}
                aria-pressed={zone.id === activeId}
                onClick={() => setActiveId(zone.id)}
              >
                <span className="experience-tag-icon" aria-hidden="true">{zone.icon}</span>
                {zone.tag}
              </button>
            ))}
          </div>

          <Link href="/events" className="experience-cta">See upcoming events</Link>
        </div>

        <div className="experience-image-side experience-map-side">
          <div className="experience-map-stage">
            <FloorMap3D
              zones={ZONES}
              active={activeId}
              view={view}
              onSelect={setActiveId}
              bottomInset={isWide ? 170 : 0}
            />

            <div className="experience-media-label">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#5C8FC9" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
              </svg>
              <span className="experience-media-label-copy"><strong>EVENT FLOOR</strong><strong>MAP</strong></span>
            </div>

            <div className="experience-map-toggle" role="group" aria-label="Map view">
              <button type="button" aria-pressed={view === '3d'} className={view === '3d' ? 'is-active' : ''} onClick={() => setView('3d')}>3D</button>
              <button type="button" aria-pressed={view === 'top'} className={view === 'top' ? 'is-active' : ''} onClick={() => setView('top')}>TOP</button>
            </div>
          </div>

          <div className="experience-map-dialog" aria-live="polite">
            <div className="experience-map-dialog-copy">
              <p className="experience-map-dialog-kicker">{current.num} · {current.pin}</p>
              <h3>{current.tag}</h3>
              <p>{current.blurb}</p>
            </div>
            <div className="experience-map-dialog-nav">
              <button type="button" aria-label="Previous area" onClick={() => step(-1)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6" /></svg>
              </button>
              <button type="button" aria-label="Next area" onClick={() => step(1)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6" /></svg>
              </button>
            </div>
            <svg className="experience-map-dialog-more" width="12" height="9" viewBox="0 0 12 9" aria-hidden="true"><polygon points="0,0 12,0 6,9" /></svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;

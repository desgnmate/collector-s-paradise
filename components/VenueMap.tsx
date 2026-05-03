'use client';

import React from 'react';

interface Booth {
  id: string;
  label: string;
  vendor: string;
  col: number;
  row: number;
}

const vendorBooths: Booth[] = [
  { id: 'v1', label: 'Card Fetty', vendor: 'Card Fetty', col: 1, row: 1 },
  { id: 'v2', label: 'Card Fetty 2', vendor: 'Card Fetty', col: 1, row: 2 },
  { id: 'v3', label: 'Geek Peek', vendor: 'Geek Peek', col: 3, row: 1 },
  { id: 'v4', label: 'Geek Peek 2', vendor: 'Geek Peek', col: 3, row: 2 },
  { id: 'v5', label: 'Pokimnt', vendor: 'Pokimnt', col: 5, row: 1 },
  { id: 'v6', label: 'Pokimnt 2', vendor: 'Pokimnt', col: 5, row: 2 },
  { id: 'v7', label: 'Booth B1', vendor: 'Vendor B1', col: 1, row: 3 },
  { id: 'v8', label: 'Silhouette Cards', vendor: 'Silhouette Cards', col: 3, row: 3 },
  { id: 'v9', label: 'D2 Cards', vendor: 'D2 Cards', col: 5, row: 3 },
  { id: 'v10', label: 'RahRah TCG', vendor: 'RahRah TCG', col: 2, row: 4 },
  { id: 'v11', label: 'Frontier TCG', vendor: 'Frontier TCG', col: 3, row: 4 },
  { id: 'v12', label: 'CSJ', vendor: 'CSJ', col: 5, row: 4 },
  { id: 'v13', label: 'RahRah TCG 2', vendor: 'RahRah TCG', col: 2, row: 5 },
  { id: 'v14', label: 'SYN', vendor: 'SYN', col: 3, row: 5 },
  { id: 'v15', label: 'Pokémart', vendor: 'Pokémart', col: 5, row: 5 },
  { id: 'v16', label: 'Cards Sell Em All', vendor: 'Cards Sell Em All', col: 2, row: 6 },
  { id: 'v17', label: 'Cards Sell Em All 2', vendor: 'Cards Sell Em All', col: 3, row: 6 },
  { id: 'v18', label: 'Wild Cards', vendor: 'Wild Cards', col: 5, row: 6 },
  { id: 'v19', label: 'Megalodon', vendor: 'Megalodon', col: 3, row: 7 },
  { id: 'v20', label: 'Ad11', vendor: 'Ad11', col: 5, row: 7 },
  { id: 'v21', label: 'Empty Lambo', vendor: 'Empty Lambo', col: 1, row: 8 },
  { id: 'v22', label: 'Novus Cards', vendor: 'Novus Cards', col: 3, row: 8 },
  { id: 'v23', label: 'Ad11 2', vendor: 'Ad11', col: 5, row: 8 },
  { id: 'v24', label: 'Empty Lambo 2', vendor: 'Empty Lambo', col: 1, row: 9 },
  { id: 'v25', label: 'NV', vendor: 'NV', col: 2, row: 9 },
  { id: 'v26', label: 'NV 2', vendor: 'NV', col: 3, row: 9 },
  { id: 'v27', label: 'Phone Cases', vendor: 'Phone Cases', col: 4, row: 9 },
  { id: 'v28', label: 'Phone Cases 2', vendor: 'Phone Cases', col: 5, row: 9 },
];

interface SpecialLocation {
  id: string;
  label: string;
  description: string;
  x: number;
  y: number;
  color: string;
}

const specialLocations: SpecialLocation[] = [
  { id: 'stage', label: 'Stage', description: 'Live events & announcements', x: 75, y: 5, color: '#F4C542' },
  { id: 'entrance', label: 'Entrance', description: 'Main entry & ticket check', x: 42, y: 95, color: '#F4C542' },
  { id: 'parking', label: 'Parking', description: 'Free parking available', x: 8, y: 25, color: '#999' },
  { id: 'food', label: 'Food & BBQ', description: 'BBQ & refreshments area', x: 8, y: 55, color: '#F4C542' },
  { id: 'accessible', label: 'Accessible Parking', description: 'Wheelchair accessible spaces', x: 8, y: 70, color: '#5C8FC9' },
  { id: 'restroom', label: 'Restroom', description: 'Public restroom facilities', x: 92, y: 95, color: '#5C8FC9' },
  { id: 'pokecartel', label: 'PokeCartel', description: 'Featured vendor — PokeCartel', x: 22, y: 40, color: '#F4C542' },
];

/* ── Inline SVG Icons ── */
const IconCar = () => (
  <svg viewBox="0 0 24 24" fill="none" className="vm-icon vm-icon--car">
    <path d="M5 17h14M5 17a2 2 0 01-2-2V9a2 2 0 012-2h1l2-3h8l2 3h1a2 2 0 012 2v6a2 2 0 01-2 2M5 17a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm14 0a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconFood = () => (
  <svg viewBox="0 0 24 24" fill="none" className="vm-icon vm-icon--food">
    <path d="M12 3v1m0 16v1m-7-9H4m16 0h-1M7.05 7.05l-.7-.7m11.3 11.3l-.7-.7M7.05 16.95l-.7.7m11.3-11.3l-.7.7M12 8a4 4 0 100 8 4 4 0 000-8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M9 12h6M12 9v6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconAccessible = () => (
  <svg viewBox="0 0 24 24" fill="none" className="vm-icon vm-icon--accessible">
    <circle cx="12" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M10 22l2-8h4l1 4M8 14l4-2v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconRestroom = () => (
  <svg viewBox="0 0 24 24" fill="none" className="vm-icon vm-icon--restroom">
    <circle cx="8" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M6 8h4v5H8v7H8V13H6V8z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="17" cy="4" r="2" stroke="currentColor" strokeWidth="1.5" />
    <path d="M14 8h6l-1 5h-1v7h0v-7h-2l-1-5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const IconLeaf = () => (
  <svg viewBox="0 0 24 24" fill="none" className="vm-icon vm-icon--leaf">
    <path d="M12 22c-4-4-8-8-8-14 4-2 8 0 8 0s4-2 8 0c0 6-4 10-8 14z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 22V10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const IconParking = () => (
  <svg viewBox="0 0 24 24" fill="none" className="vm-icon vm-icon--parking">
    <rect x="3" y="3" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M9 16V8h4a3 3 0 010 6H9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

export default function VenueMap() {
  return (
    <div className="venue-map-container">
    <div className="venue-map">
      <div className="venue-map-grid" />

      {/* ── Left Strip: Parking & Food ── */}
      <div className="vm-parking">
        <div className="vm-grass">
          <div className="vm-grass-decor">
            <IconLeaf />
            <IconLeaf />
          </div>
        </div>
        <div className="vm-parking-header">
          <IconParking />
        </div>
        <div className="vm-parking-spots">
          <div className="vm-car"><IconCar /></div>
          <div className="vm-car"><IconCar /></div>
          <div className="vm-car"><IconCar /></div>
          <div className="vm-car"><IconCar /></div>
        </div>
        <div className="vm-food-area">
          <IconFood />
          <span className="vm-area-label">BBQ</span>
        </div>
        <div className="vm-accessible">
          <IconAccessible />
        </div>
      </div>

      {/* ── Main Hall ── */}
      <div className="vm-hall">
        <div className="vm-stage">
          <span className="vm-stage-label">STAGE</span>
        </div>

        <div className="vm-wall-banner">
          <span className="vm-banner-text">POKECARTEL</span>
        </div>

        <div className="vm-booth-grid">
          {vendorBooths.map((booth) => (
            <div
              key={booth.id}
              className="vm-booth"
              style={{
                gridColumn: booth.col,
                gridRow: booth.row,
              }}
            >
              <div className="vm-booth-inner">
                <span className="vm-booth-label">{booth.vendor}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="vm-entrance">
          <div className="vm-entrance-leaf vm-entrance-leaf--left"><IconLeaf /></div>
          <span className="vm-entrance-label">ENTRANCE</span>
          <div className="vm-entrance-leaf vm-entrance-leaf--right"><IconLeaf /></div>
        </div>
      </div>

      {/* ── Restroom ── */}
      <div className="vm-restroom">
        <IconRestroom />
        <span className="vm-area-label">RESTROOM</span>
      </div>

      {/* ── Interactive Dots ── */}
      {specialLocations.map((loc) => (
        <div
          key={loc.id}
          className="venue-dot-wrapper"
          style={{ left: `${loc.x}%`, top: `${loc.y}%` }}
        >
          <span className="venue-dot" style={{ '--dot-color': loc.color } as React.CSSProperties}>
            <span className="venue-dot-ping" style={{ '--dot-color': loc.color } as React.CSSProperties} />
          </span>
          <div className="venue-tooltip">
            <strong className="venue-tooltip-title">{loc.label}</strong>
            <span className="venue-tooltip-desc">{loc.description}</span>
          </div>
        </div>
      ))}
    </div>
    </div>
  );
}

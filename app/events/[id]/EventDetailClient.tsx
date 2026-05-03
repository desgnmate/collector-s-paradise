'use client';

import React from 'react';
import VenueMap from '@/components/VenueMap';

export default function EventDetailClient() {
  return (
    <section className="ed-map-section">
      <div className="container">
        <h3 className="ed-map-title">Interactive Map</h3>
        <div className="ed-map-container">
          <VenueMap />
        </div>
      </div>
    </section>
  );
}

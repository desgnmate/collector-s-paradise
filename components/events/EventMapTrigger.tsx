'use client';

import React, { useState } from 'react';
import VendorMap from './VendorMap';

interface EventMapTriggerProps {
  eventTitle: string;
}

export default function EventMapTrigger({ eventTitle }: EventMapTriggerProps) {
  const [isMapOpen, setIsMapOpen] = useState(false);

  return (
    <>
      <button 
        onClick={() => setIsMapOpen(true)}
        className="btn btn-yellow w-full"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="mr-2">
          <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
        </svg>
        View Vendor Map
      </button>

      <VendorMap 
        isOpen={isMapOpen} 
        onClose={() => setIsMapOpen(false)} 
        eventTitle={eventTitle} 
      />
    </>
  );
}

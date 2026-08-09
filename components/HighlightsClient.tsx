'use client';

import React, { useState } from 'react';
import { CalendarDays, Grid2X2 } from 'lucide-react';
import EventCard from './events/EventCard';
import EventCalendar from './EventCalendar';
import type { Event } from '@/app/actions/events';

interface HighlightsClientProps {
  upcomingEvents: Event[];
  pastEvents: Event[];
}

const HighlightsClient = ({ upcomingEvents, pastEvents }: HighlightsClientProps) => {
  const [viewMode, setViewMode] = useState<'card' | 'calendar'>('card');
  const [eventType, setEventType] = useState<'upcoming' | 'past'>('upcoming');

  const allEvents = [...upcomingEvents, ...pastEvents];
  const filteredEvents = eventType === 'upcoming' ? upcomingEvents : pastEvents;

  const [isCalendarDateSelected, setIsCalendarDateSelected] = useState(false);

  return (
    <section id="highlights" className="highlights-section">
      <div className="container">
        <div className="highlights-calendar-shell">
          {!isCalendarDateSelected && (
            <div className="highlights-header">
              <div className="highlights-header-copy">
                <span className="eyebrow-badge">EVENTS &amp; EXPERIENCES</span>
                <h2 className="section-title">COLLECTOR&apos;S CALENDAR</h2>
                <p className="section-subtitle">
                  Find your next collector meet-up, plan the day and secure your place before the tables fill up.
                </p>
              </div>
            </div>
          )}
          
          <div
            className="highlights-controls-wrapper"
            data-calendar-mode={viewMode === 'calendar' ? 'true' : 'false'}
          >
          {viewMode === 'card' && (
            <div className="highlights-toggle-container" aria-label="Event timeframe" role="group">
              <button 
                className={`toggle-btn ${eventType === 'upcoming' ? 'active' : ''}`}
                onClick={() => setEventType('upcoming')}
                aria-pressed={eventType === 'upcoming'}
              >
                Upcoming <span className="toggle-count">{upcomingEvents.length}</span>
              </button>
              <button 
                className={`toggle-btn ${eventType === 'past' ? 'active' : ''}`}
                onClick={() => setEventType('past')}
                aria-pressed={eventType === 'past'}
              >
                Past <span className="toggle-count">{pastEvents.length}</span>
              </button>
            </div>
          )}

          <div className="view-toggle-container">
            <button 
              className={`view-btn view-icon-only ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
              aria-label="Card View"
              aria-pressed={viewMode === 'card'}
              title="Card view"
            >
              <Grid2X2 aria-hidden="true" strokeWidth={2.2} />
            </button>
            <button 
              className={`view-btn view-icon-only ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
              aria-label="Calendar View"
              aria-pressed={viewMode === 'calendar'}
              title="Calendar view"
            >
              <CalendarDays aria-hidden="true" strokeWidth={2.2} />
            </button>
          </div>
          </div>

          {viewMode === 'card' ? (
            <div className="ec-grid-wrapper">
              <div className={`ec-grid ${filteredEvents.length === 1 ? 'ec-grid--single' : ''}`}>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      variant={eventType}
                    />
                  ))
                ) : (
                  <div className="ec-empty">
                    <p>No {eventType} events available at the moment.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="highlights-calendar-view">
              <EventCalendar
                events={allEvents}
                onDateSelect={(date) => setIsCalendarDateSelected(!!date)}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default HighlightsClient;

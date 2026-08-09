'use client';

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { CalendarDays, Grid2X2 } from 'lucide-react';
import EventCard from './EventCard';
import type { Event } from '@/app/actions/events';

const EventCalendar = dynamic(() => import('../EventCalendar'), {
  loading: () => <div className="events-calendar-loading" aria-label="Loading event calendar" />,
});

interface EventsPageClientProps {
  upcomingEvents: Event[];
  pastEvents: Event[];
}

const EventsPageClient = ({ upcomingEvents, pastEvents }: EventsPageClientProps) => {
  const [viewMode, setViewMode] = useState<'card' | 'calendar'>('card');
  const [eventType, setEventType] = useState<'upcoming' | 'past'>('upcoming');
  const [isCalendarDateSelected, setIsCalendarDateSelected] = useState(false);

  const allEvents = [...upcomingEvents, ...pastEvents];
  const filteredEvents = eventType === 'upcoming' ? upcomingEvents : pastEvents;

  return (
    <section className="events-page-section">
      <div className="container">

        {/* Header — hide when calendar date is selected */}
        {!isCalendarDateSelected && (
          <div className="events-page-header">
            <span className="eyebrow-badge">EVENTS &amp; EXPERIENCES</span>
            <h1 className="section-title">COLLECTOR&apos;S CALENDAR</h1>
            <p className="section-subtitle">
              Find your next collector meet-up, plan the day and relive the events that brought the community together.
            </p>
          </div>
        )}

        <div className="events-calendar-shell">
        {/* Controls Bar */}
        <div 
          className="highlights-controls-wrapper"
          style={{ 
            justifyContent: viewMode === 'calendar' ? 'flex-end' : 'space-between',
          }}
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

{/* Content: Card or Calendar */}
        {viewMode === 'card' ? (
          <div className="ec-grid-wrapper">
            <div className={`ec-grid events-page-card-grid ${filteredEvents.length === 1 ? 'ec-grid--single' : ''}`}>
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
                  <p>No {eventType === 'upcoming' ? 'upcoming' : 'past'} events available at the moment.</p>
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

export default EventsPageClient;

'use client';

import React, { useState } from 'react';
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
        
        {!isCalendarDateSelected && (
          <div className="highlights-header" data-aos="fade-up">
            <span className="eyebrow-badge">PREVIOUS &amp; UPCOMING EVENTS</span>
            <h2 className="section-title">COLLECTOR'S CALENDAR</h2>
            <p className="section-subtitle">
              Discover everything happening at the event, from trading zones to exclusive finds.
            </p>
          </div>
        )}
          
        <div 
          className="highlights-controls-wrapper"
          style={{ 
            justifyContent: viewMode === 'calendar' ? 'flex-end' : 'space-between',
          }}
        >
          {viewMode === 'card' && (
            <div className="highlights-toggle-container">
              <button 
                className={`toggle-btn ${eventType === 'upcoming' ? 'active' : ''}`}
                onClick={() => setEventType('upcoming')}
              >
                Upcoming Events
              </button>
              <button 
                className={`toggle-btn ${eventType === 'past' ? 'active' : ''}`}
                onClick={() => setEventType('past')}
              >
                Past Events
              </button>
            </div>
          )}

          <div className="view-toggle-container">
            <button 
              className={`view-btn view-icon-only ${viewMode === 'card' ? 'active' : ''}`}
              onClick={() => setViewMode('card')}
              aria-label="Card View"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
            </button>
            <button 
              className={`view-btn view-icon-only ${viewMode === 'calendar' ? 'active' : ''}`}
              onClick={() => setViewMode('calendar')}
              aria-label="Calendar View"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>
            </button>
          </div>
        </div>

        {viewMode === 'card' ? (
          <div className="ec-grid-wrapper">
            <div className="ec-grid">
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
    </section>
  );
};

export default HighlightsClient;
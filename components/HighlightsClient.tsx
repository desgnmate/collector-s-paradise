'use client';

import React, { useRef, useState, useEffect } from 'react';
import Image from 'next/image';
import EventCalendar from './EventCalendar';
import type { Event } from '@/app/actions/events';

interface HighlightsClientProps {
  upcomingEvents: Event[];
  pastEvents: Event[];
}

const HighlightsClient = ({ upcomingEvents, pastEvents }: HighlightsClientProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'card' | 'calendar'>('card');
  const [eventType, setEventType] = useState<'upcoming' | 'past'>('upcoming');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 2);
      setCanScrollRight(Math.ceil(scrollLeft + clientWidth) < scrollWidth - 2);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  const scrollLeft = () => {
    if (scrollRef.current) {
      const card = scrollRef.current.querySelector('.highlight-card') as HTMLElement;
      const amount = card ? card.offsetWidth + 48 : scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollLeft - amount,
        behavior: 'smooth'
      });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      const card = scrollRef.current.querySelector('.highlight-card') as HTMLElement;
      const amount = card ? card.offsetWidth + 48 : scrollRef.current.clientWidth;
      scrollRef.current.scrollTo({
        left: scrollRef.current.scrollLeft + amount,
        behavior: 'smooth'
      });
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
      handleScroll();
    }
  }, [eventType]);

  // Combine all events for the calendar view
  const allEvents = [...upcomingEvents, ...pastEvents];
  const filteredEvents = eventType === 'upcoming' ? upcomingEvents : pastEvents;

  const [isCalendarDateSelected, setIsCalendarDateSelected] = useState(false);

  return (
    <section id="highlights" className="highlights-section">
      <div className="container">
        
        {!isCalendarDateSelected && (
          <div className="highlights-header" data-aos="fade-up">
            <span className="eyebrow-badge">PREVIOUS &amp; UPCOMING EVENTS</span>
            <h2 className="section-title">EVENT HIGHLIGHTS</h2>
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
          <div className="highlights-carousel-wrapper">
            {canScrollLeft && (
              <button className="highlights-carousel-arrow arrow-prev" aria-label="Previous" onClick={scrollLeft}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M15 18l-6-6 6-6"/>
                </svg>
              </button>
            )}

            <div 
              className="highlights-grid" 
              ref={scrollRef} 
              onScroll={handleScroll}
            >
              {filteredEvents.length > 0 ? (
                filteredEvents.map((event) => {
                  const dateObj = new Date(event.event_date);
                  const displayDate = dateObj.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
                  
                  return (
                    <div 
                      className="highlight-card" 
                      key={event.id}
                    >
                      <div className="highlight-image-wrapper">
                        <Image src={event.cover_image_url || '/images/placeholder-event.png'} alt={event.title} width={400} height={250} loading="lazy" style={{ objectFit: 'cover' }} />
                        <div className="highlight-date-tag">{displayDate}</div>
                      </div>
                      <div className="highlight-content">
                        <h3 className="highlight-title">{event.title}</h3>
                        <p className="highlight-desc">{event.description || ''}</p>
                        <button className="btn-highlight">{eventType === 'upcoming' ? 'BOOK NOW' : 'VIEW GALLERY'}</button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="no-events-message">
                  <p>No {eventType} events available at the moment.</p>
                </div>
              )}
            </div>

            {canScrollRight && (
              <button className="highlights-carousel-arrow arrow-next" aria-label="Next" onClick={scrollRight}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 18l6-6-6-6"/>
                </svg>
              </button>
            )}
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

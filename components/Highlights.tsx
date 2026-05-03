'use client';

import React, { useRef, useState, useEffect } from 'react';
import EventCalendar from './EventCalendar';
import type { Event } from '@/app/actions/events';

const Highlights = () => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<'card' | 'calendar'>('card');
  const [eventType, setEventType] = useState<'upcoming' | 'past'>('upcoming');
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 2); // Use a small threshold for better reliability
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
      // Use the actual card width + the gap between cards (48px / 3rem)
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

  // Reset scroll and update arrows when event type changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = 0;
      handleScroll();
    }
  }, [eventType]);

  // Convert mocked data to the Event type so EventCalendar can parse them correctly mapping to this month
  const currentYear = new Date().getFullYear();
  const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
  
  const events: Event[] = [
    {
      id: 'mock-1',
      title: "Sydney Card Show",
      description: "Join us at the International Convention Centre for the biggest card show in NSW. Special guests, live breaks, and thousands of graded slabs.",
      event_date: `${currentYear}-${currentMonth}-12`, 
      start_time: "09:00",
      end_time: "17:00",
      venue: "International Convention Centre, Sydney",
      venue_address: null,
      capacity: 500,
      tickets_sold: 450,
      ticket_price: 25,
      cover_image_url: "/images/4th-card-1.png",
      booking_link: null,
      status: "upcoming",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mock-2',
      title: "Melbourne Trade Day",
      description: "Victoria's premier trading event. Bring your binders and slabs for a massive weekend of trading, grading submissions, and collecting.",
      event_date: `${currentYear}-${currentMonth}-24`,
      start_time: "10:00",
      end_time: "18:00",
      venue: "Melbourne Convention Centre",
      venue_address: null,
      capacity: 800,
      tickets_sold: 790,
      ticket_price: 30,
      cover_image_url: "/images/live-deals.png",
      booking_link: null,
      status: "upcoming",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mock-past-1',
      title: "Perth Summer Slam",
      description: "A look back at the incredible Summer Slam event in Perth. Over 1,000 collectors joined us for a huge weekend of deals and trades.",
      event_date: `${currentYear}-01-15`,
      start_time: "10:00",
      end_time: "18:00",
      venue: "Perth Convention Centre",
      venue_address: null,
      capacity: 1200,
      tickets_sold: 1200,
      ticket_price: 20,
      cover_image_url: "/images/event-experience.png",
      booking_link: null,
      status: "completed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mock-3',
      title: "Brisbane Collector Fest",
      description: "The ultimate pop culture and card convention hits Queensland. Featuring voice actors, exclusive merch, and massive vendor halls.",
      event_date: `${currentYear}-${currentMonth}-05`,
      start_time: "09:00",
      end_time: "20:00",
      venue: "Brisbane Convention Centre",
      venue_address: null,
      capacity: 1000,
      tickets_sold: 999,
      ticket_price: 35,
      cover_image_url: "/images/meet-fans.png",
      booking_link: null,
      status: "upcoming",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mock-4',
      title: "Perth Pop Culture Expo",
      description: "Get ready for the biggest weekend of gaming, trading, and pop culture excitement in Western Australia.",
      event_date: `${currentYear}-${currentMonth}-28`,
      start_time: "10:00",
      end_time: "19:00",
      venue: "Perth Convention Centre",
      venue_address: null,
      capacity: 600,
      tickets_sold: 120,
      ticket_price: 20,
      cover_image_url: "/images/event-experience.png",
      booking_link: null,
      status: "upcoming",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 'mock-past-2',
      title: "Adelaide Card Expo",
      description: "Relive the highlights from the Adelaide expo. Rare Charizards and pristine graded slabs were the talk of the town.",
      event_date: `${currentYear}-02-10`,
      start_time: "09:00",
      end_time: "17:00",
      venue: "Adelaide Showgrounds",
      venue_address: null,
      capacity: 500,
      tickets_sold: 495,
      ticket_price: 15,
      cover_image_url: "/images/meet-fans.png",
      booking_link: null,
      status: "completed",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const filteredEvents = events.filter(e => e.status === eventType);

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
                filteredEvents.map((event, index) => {
                  // Ensure date string looks clean like "Aug 12"
                  const dateObj = new Date(event.event_date);
                  const displayDate = dateObj.toLocaleDateString('en-AU', { month: 'short', day: 'numeric' });
                  
                  return (
                    <div 
                      className="highlight-card" 
                      key={event.id}
                    >
                      <div className="highlight-image-wrapper">
                        <img src={event.cover_image_url || ''} alt={event.title} loading="lazy" style={{ objectFit: 'cover' }} />
                        <div className="highlight-date-tag">{displayDate}</div>
                      </div>
                      <div className="highlight-content">
                        <h3 className="highlight-title">{event.title}</h3>
                        <p className="highlight-desc">{event.description}</p>
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
              events={events} 
              onDateSelect={(date) => setIsCalendarDateSelected(!!date)}
            />
          </div>
        )}

      </div>
    </section>
  );
};

export default Highlights;

'use client';

import React, { useRef } from 'react';
import Image from 'next/image';

const Highlights = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: 'smooth' });
    }
  };

  const scrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: 'smooth' });
    }
  };

  const events = [
    {
      id: 1,
      title: "Sydney Card Show",
      description: "Join us at the International Convention Centre for the biggest card show in NSW. Special guests, live breaks, and thousands of graded slabs.",
      date: "Aug 12",
      image: "/images/4th-card-1.png"
    },
    {
      id: 2,
      title: "Melbourne Trade Day",
      description: "Victoria's premier trading event. Bring your binders and slabs for a massive weekend of trading, grading submissions, and collecting.",
      date: "Sep 24",
      image: "/images/4th-card-2.jpg"
    },
    {
      id: 3,
      title: "Brisbane Collector Fest",
      description: "The ultimate pop culture and card convention hits Queensland. Featuring voice actors, exclusive merch, and massive vendor halls.",
      date: "Nov 05",
      image: "/images/4th-card-3.jpg"
    },
    {
      id: 4,
      title: "Perth Pop Culture Expo",
      description: "Get ready for the biggest weekend of gaming, trading, and pop culture excitement in Western Australia.",
      date: "Dec 10",
      image: "/images/4th-card-4.jpg"
    }
  ];

  return (
    <section id="highlights" className="highlights-section">
      <div className="container">
        
        <div className="highlights-header" data-aos="fade-up">
          <span className="eyebrow-badge">PREVIOUS &amp; UPCOMING EVENTS</span>
          <h2 className="section-title">EVENT HIGHLIGHTS</h2>
          <p className="section-subtitle">
            Discover everything happening at the event, from trading zones to exclusive finds.
          </p>
          
          <div className="highlights-toggle-container">
            <button className="toggle-btn active">Upcoming Events</button>
            <button className="toggle-btn">Past Events</button>
          </div>
        </div>

        <div className="highlights-carousel-wrapper">
          <button className="highlights-carousel-arrow arrow-prev" aria-label="Previous" onClick={scrollLeft}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>

          <div className="highlights-grid" ref={scrollRef}>
            {events.map((event, index) => (
            <div 
              className="highlight-card" 
              key={event.id}
              data-aos="fade-up"
              data-aos-delay={index * 100}
            >
              <div className="highlight-image-wrapper">
                <Image 
                  src={event.image} 
                  alt={event.title} 
                  fill 
                  style={{ objectFit: 'cover' }}
                />
                <div className="highlight-date-tag">{event.date}</div>
              </div>
              <div className="highlight-content">
                <h3 className="highlight-title">{event.title}</h3>
                <p className="highlight-desc">{event.description}</p>
                <button className="btn-highlight">GET YOUR TICKETS</button>
              </div>
            </div>
          ))}
          </div>

          <button className="highlights-carousel-arrow arrow-next" aria-label="Next" onClick={scrollRight}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>
        </div>

      </div>
    </section>
  );
};

export default Highlights;

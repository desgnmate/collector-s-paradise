'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

const tags = [
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="17 1 21 5 17 9"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><polyline points="7 23 3 19 7 15"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
      </svg>
    ),
    label: 'Buy / Sell / Trade',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
    label: 'Meet Fellow Fans',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
    label: 'Culture & Fun',
  },
  {
    icon: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
      </svg>
    ),
    label: 'Live Deal Evaluations',
  },
];

const slides = [
  { src: '/images/3rd-section-card-image.jpg', alt: 'Event experience at Collector\'s Paradise' },
  { src: '/images/meet-fans.png',              alt: 'Meet fellow fans and collectors' },
  { src: '/images/culture-fun.png',            alt: 'Culture and fun at the event' },
  { src: '/images/live-deals.png',             alt: 'Live deal evaluations' },
];

const Experience = () => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), []);

  // Auto-advance every 4 s
  useEffect(() => {
    const id = setInterval(next, 4000);
    return () => clearInterval(id);
  }, [next]);

  return (
    <section id="experience" className="experience-section">
      <div className="experience-card-container" data-aos="fade-up">

        {/* Left Side: Content */}
        <div className="experience-content">
          <span className="eyebrow-badge">WHAT YOU&apos;LL EXPERIENCE</span>
          <h2 className="section-title">FUN FOR<br />EVERYONE</h2>
          <p className="section-subtitle">
            Immerse yourself in a world of pop culture excitement. From rare collectibles to exclusive guest appearances, there&apos;s something for every fan.
          </p>

          <div className="experience-tags">
            {tags.map((tag) => (
              <span key={tag.label} className="experience-tag">
                <span className="experience-tag-icon">{tag.icon}</span>
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        {/* Right Side: Carousel */}
        <div className="experience-image-side">
          {/* Slides */}
          <div className="exp-carousel-track">
            {slides.map((slide, i) => (
              <div
                key={slide.src}
                className={`exp-carousel-slide ${i === current ? 'active' : ''}`}
              >
                <Image
                  src={slide.src}
                  alt={slide.alt}
                  fill
                  sizes="(max-width: 900px) 100vw, 50vw"
                  style={{ objectFit: 'cover', objectPosition: 'center' }}
                  priority={i === 0}
                />
              </div>
            ))}
          </div>

          {/* Prev / Next arrows */}
          <button className="exp-carousel-btn exp-carousel-btn--prev" onClick={prev} aria-label="Previous">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button className="exp-carousel-btn exp-carousel-btn--next" onClick={next} aria-label="Next">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          {/* Dot indicators */}
          <div className="exp-carousel-dots">
            {slides.map((_, i) => (
              <button
                key={i}
                className={`exp-carousel-dot ${i === current ? 'active' : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Go to slide ${i + 1}`}
              />
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Experience;

'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';

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
    label: 'Connect with Collectors',
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
  { src: '/videos/1.mp4', alt: 'Event experience at Collector\'s Paradise' },
  { src: '/videos/2.mp4', alt: 'Meet fellow fans and collectors' },
  { src: '/videos/3.mp4', alt: 'Culture and fun at the event' },
  { src: '/videos/4.mp4', alt: 'Live deal evaluations' },
];

const Experience = () => {
  const [current, setCurrent] = useState(0);
  const slideVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const activeVideoRef = useRef<HTMLVideoElement | null>(null);

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), []);

  useEffect(() => {
    const prevVideo = activeVideoRef.current;
    if (prevVideo) {
      prevVideo.pause();
      prevVideo.currentTime = 0;
    }

    const nextVideo = slideVideoRefs.current[current];
    if (nextVideo) {
      nextVideo.currentTime = 0;
      nextVideo.play().catch(() => {});
      activeVideoRef.current = nextVideo;
    }
  }, [current]);

  useEffect(() => {
    const id = setInterval(next, 8000);
    return () => clearInterval(id);
  }, [next]);


  return (
    <section id="experience" className="experience-section">
      <div className="experience-card-container" data-aos="fade-up">
        <div className="experience-content">
          <span className="eyebrow-badge">WHAT YOU&apos;LL EXPERIENCE</span>
          <h2 className="section-title">FUN FOR EVERYONE</h2>
          <p className="section-subtitle">
            Find rare cards, meet the community and enjoy a full day of collecting culture — whether you&apos;re chasing your first card or your next grail.
          </p>

          <div className="experience-proof" aria-label="Event highlights">
            <div><strong>100+</strong><span>Vendors &amp; tables</span></div>
            <div><strong>1</strong><span>Big collector community</span></div>
          </div>

          <div className="experience-tags">
            {tags.map((tag) => (
              <span key={tag.label} className="experience-tag">
                <span className="experience-tag-icon" aria-hidden="true">{tag.icon}</span>
                {tag.label}
              </span>
            ))}
          </div>
        </div>

        <div className="experience-image-side">
          <div className="experience-media-label">
            <span className="experience-media-live-icon" aria-hidden="true">◉</span>
            <span className="experience-media-label-copy"><strong>LIVE FROM</strong><strong>THE FLOOR</strong></span>
          </div>
          <div className="exp-carousel-track">
            {slides.map((slide, i) => (
              <div
                key={slide.src}
                className={`exp-carousel-slide ${i === current ? 'active' : ''}`}
              >
                <video
                  ref={(el) => { slideVideoRefs.current[i] = el; }}
                  src={slide.src}
                  muted
                  loop
                  playsInline
                  preload={i === 0 ? 'metadata' : 'none'}
                  aria-label={slide.alt}
                />
              </div>
            ))}
          </div>

          <button className="exp-carousel-btn exp-carousel-btn--prev" onClick={prev} aria-label="Previous video">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6"/>
            </svg>
          </button>
          <button className="exp-carousel-btn exp-carousel-btn--next" onClick={next} aria-label="Next video">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </button>

          <div className="exp-carousel-dots" aria-label="Choose event video">
            {slides.map((slide, i) => (
              <button
                key={slide.src}
                className={`exp-carousel-dot ${i === current ? 'active' : ''}`}
                onClick={() => setCurrent(i)}
                aria-label={`Go to video ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Experience;

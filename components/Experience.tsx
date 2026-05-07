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
  { src: '/videos/vlog-1.mp4', alt: 'Event experience at Collector\'s Paradise' },
  { src: '/videos/vlog-2.mp4', alt: 'Meet fellow fans and collectors' },
  { src: '/videos/vlog-3.mp4', alt: 'Culture and fun at the event' },
  { src: '/videos/vlog-4.mp4', alt: 'Live deal evaluations' },
];

const Experience = () => {
  const [current, setCurrent] = useState(0);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const sectionRef = useRef<HTMLElement>(null);
  const slideVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const next = useCallback(() => setCurrent(c => (c + 1) % slides.length), []);
  const prev = useCallback(() => setCurrent(c => (c - 1 + slides.length) % slides.length), []);

  // Play/pause slide videos based on active index
  useEffect(() => {
    slideVideoRefs.current.forEach((video, i) => {
      if (!video) return;
      if (i === current) {
        video.currentTime = 0;
        video.play().catch(() => {});
      } else {
        video.pause();
      }
    });
  }, [current]);

  // Auto-advance every 8s (longer for video content)
  useEffect(() => {
    const id = setInterval(next, 8000);
    return () => clearInterval(id);
  }, [next]);

  // Lazy-load the background video when the section enters viewport
  useEffect(() => {
    const section = sectionRef.current;
    const video = bgVideoRef.current;
    if (!section || !video) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          video.src = '/videos/cp-bg.mp4';
          video.load();
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <section id="experience" className="experience-section" ref={sectionRef}>
      <video 
        ref={bgVideoRef}
        autoPlay 
        muted 
        loop 
        playsInline 
        preload="none"
        className="experience-video-bg"
      />
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

        {/* Right Side: Video Carousel */}
        <div className="experience-image-side">
          {/* Slides */}
          <div className="exp-carousel-track">
            {slides.map((slide, i) => (
              <div
                key={i}
                className={`exp-carousel-slide ${i === current ? 'active' : ''}`}
              >
                <video
                  ref={(el) => { slideVideoRefs.current[i] = el; }}
                  src={slide.src}
                  muted
                  loop
                  playsInline
                  preload="metadata"
                  style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center' }}
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

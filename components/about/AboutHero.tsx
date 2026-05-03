'use client';

import React from 'react';
import { motion } from 'framer-motion';

const AboutHero = () => {
  return (
    <section className="about-hero-section">
      <div className="about-hero-container">
        <motion.div 
          className="about-hero-content"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="about-eyebrow">Our Story</span>
          <h1 className="about-title">
            About <span className="title-accent">Us</span>
          </h1>
          <p className="about-description">
            Collector&apos;s Paradise is Melbourne&apos;s premier destination for TCG enthusiasts. 
            We bring the community together through immersive events, live pack breaks, 
            expert evaluations, and a curated marketplace for the rarest finds.
          </p>
        </motion.div>

        <motion.div 
          className="about-hero-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="stat-item">
            <span className="stat-number">50+</span>
            <span className="stat-label">Events Hosted</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">10K+</span>
            <span className="stat-label">Collectors</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-item">
            <span className="stat-number">100+</span>
            <span className="stat-label">Vendors</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default AboutHero;
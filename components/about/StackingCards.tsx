'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';

const experiences = [
  {
    title: 'PSA Card Evaluations',
    desc: 'Get your rare finds evaluated by experts and learn the true value of your collection. Real-time market data at your fingertips.',
    image: '/images/3rd-section-card-image.jpg',
  },
  {
    title: 'Guest Signings',
    desc: "Meet your favorite artists and creators. Get your cards signed and captured in the moment. Experience pop culture history live.",
    image: '/images/meet-fans.png',
  },
  {
    title: 'Buy / Sell / Trade',
    desc: "The heart of the event. Connect with thousands of collectors. Find that one-of-a-kind card you've been searching for years.",
    image: '/images/event-experience.png',
  },
];

const ExperienceCard = ({ exp, index }: { exp: typeof experiences[0]; index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <motion.div
      ref={ref}
      className="experience-card"
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay: index * 0.15 }}
    >
      <div className="experience-card-image">
        <img src={exp.image} alt={exp.title} loading="lazy" style={{ objectFit: 'cover' }} />
      </div>
      <div className="experience-card-content">
        <h3 className="experience-card-title">{exp.title}</h3>
        <p className="experience-card-desc">{exp.desc}</p>
      </div>
      <div className="experience-card-footer">
        <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
        <span className="learn-more">Learn More</span>
      </div>
    </motion.div>
  );
};

const StackingCards = () => {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: '-50px' });

  return (
    <section className="experiences-section">
      <div className="experiences-container">
        <motion.div
          ref={headerRef}
          className="experiences-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-eyebrow">What You&apos;ll Experience</span>
          <h2 className="section-heading">
            Discover <span className="heading-accent">Collector&apos;s Paradise</span>
          </h2>
          <p className="section-subtitle">
            Every event is a new adventure. Collect experiences, meet fellow trainers, and discover rare treasures.
          </p>
        </motion.div>

        <div className="experiences-grid">
          {experiences.map((exp, i) => (
            <ExperienceCard key={i} exp={exp} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default StackingCards;
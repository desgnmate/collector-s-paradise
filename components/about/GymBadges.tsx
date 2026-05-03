'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Link from 'next/link';

const badges = [
  {
    icon: '🎪',
    title: 'First Event',
    desc: 'Attended your first Collector\'s Paradise event',
    level: 'Lv.1',
  },
  {
    icon: '🃏',
    title: 'Card Collector',
    desc: 'Built a collection of 50+ cards',
    level: 'Lv.2',
  },
  {
    icon: '🤝',
    title: 'Trader',
    desc: 'Completed your first trade with another collector',
    level: 'Lv.3',
  },
  {
    icon: '⭐',
    title: 'Rare Find',
    desc: 'Discovered a rare or holographic card',
    level: 'Lv.4',
  },
  {
    icon: '🏪',
    title: 'Vendor Ally',
    desc: 'Purchased from 5+ different vendors',
    level: 'Lv.5',
  },
  {
    icon: '🏆',
    title: 'Champion',
    desc: 'Attended 10+ events and became a community pillar',
    level: 'Lv.6',
  },
];

const BadgeCard = ({ badge, index }: { badge: typeof badges[0]; index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  return (
    <motion.div
      ref={ref}
      className="badge-card"
      initial={{ opacity: 0, y: 30 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.4, delay: index * 0.1 }}
    >
      <div className="badge-card-inner">
        <div className="badge-level">{badge.level}</div>
        <div className="badge-icon-ring">
          <div className="badge-icon">{badge.icon}</div>
        </div>
        <h3 className="badge-title">{badge.title}</h3>
        <p className="badge-desc">{badge.desc}</p>
        <div className="badge-progress">
          <div className="badge-progress-bar" />
        </div>
      </div>

    </motion.div>
  );
};

const GymBadges = () => {
  const headerRef = useRef(null);
  const ctaRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: '-50px' });
  const isCtaInView = useInView(ctaRef, { once: true, margin: '-50px' });

  return (
    <section className="badges-section">
      <div className="badges-bg-grid" />
      <div className="badges-container">
        <motion.div
          ref={headerRef}
          className="badges-header"
          initial={{ opacity: 0, y: 30 }}
          animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
        >
          <span className="section-eyebrow-dark">Your Journey Awaits</span>
          <h2 className="section-heading-dark">
            Earn <span className="heading-yellow">Gym Badges</span>
          </h2>
          <p className="section-desc-dark">
            Every event is a chance to earn new badges. Collect them all and become a true Champion of Collector&apos;s Paradise.
          </p>
        </motion.div>

        <div className="badges-grid">
          {badges.map((badge, i) => (
            <BadgeCard key={i} badge={badge} index={i} />
          ))}
        </div>

        <motion.div
          ref={ctaRef}
          className="badges-cta"
          initial={{ opacity: 0, y: 20 }}
          animate={isCtaInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="cta-content">
            <h3 className="cta-title">Ready to Start Your Collection?</h3>
            <p className="cta-subtitle">Join our next event and begin earning your first badge today.</p>
            <Link href="/events" className="cta-button">
              <span>View Upcoming Events</span>
              <span className="cta-arrow">→</span>
            </Link>
          </div>
        </motion.div>
      </div>

    </section>
  );
};

export default GymBadges;
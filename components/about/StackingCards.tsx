'use client';

import React, { useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import Image, { StaticImageData } from 'next/image';
import Link from 'next/link';
import exp1 from '@/public/images/3rd-section-card-image.jpg';
import exp2 from '@/public/images/giveaways.jpeg';
import exp3 from '@/public/images/buy-sell-trade.jpeg';

const experiences = [
  {
    title: 'Collaboration',
    desc: 'Connect with vendors, creators, and fellow collectors. Build relationships that last long after the event doors close.',
    image: exp1,
  },
  {
    title: 'Giveaways',
    desc: 'Win prizes, sealed product, and exclusive drops. Every event has something for collectors of every level.',
    image: exp2,
  },
  {
    title: 'Buy / Sell / Trade',
    desc: 'The heart of the event. Hunt rare finds, flip your extras, and trade with people who love the hobby as much as you do.',
    image: exp3,
  },
];

interface Experience {
  title: string;
  desc: string;
  image: StaticImageData;
}

const ExperienceCard = ({ exp, index }: { exp: Experience; index: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      ref={ref}
      className="experience-card"
      initial={{ opacity: 0, y: 36 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.45, delay: index * 0.12 }}
    >
      <div className="experience-card-image">
        <Image src={exp.image} alt={exp.title} loading="lazy" fill sizes="(max-width: 768px) 100vw, 33vw" style={{ objectFit: 'cover' }} />
      </div>
      <div className="experience-card-content">
        <h3 className="experience-card-title">{exp.title}</h3>
        <p className="experience-card-desc">{exp.desc}</p>
      </div>
      <div className="experience-card-footer">
        <span className="card-number">{String(index + 1).padStart(2, '0')}</span>
        <span className="learn-more">Explore</span>
      </div>
    </motion.div>
  );
};

const StackingCards = () => {
  const headerRef = useRef(null);
  const isHeaderInView = useInView(headerRef, { once: true, margin: '-40px' });

  return (
    <>
      <section className="experiences-section">
        <div className="container">
          <motion.div
            ref={headerRef}
            className="experiences-header"
            initial={{ opacity: 0, y: 24 }}
            animate={isHeaderInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
          >
            <span className="eyebrow-badge">WHAT YOU&apos;LL EXPERIENCE</span>
            <h2 className="section-title">
              Discover Collector&apos;s Paradise
            </h2>
            <p className="section-subtitle">
              Every event is a new adventure. Collect experiences, meet fellow trainers, and
              discover rare treasures with Melbourne&apos;s collector community.
            </p>
          </motion.div>

          <div className="experiences-grid">
            {experiences.map((exp, i) => (
              <ExperienceCard key={exp.title} exp={exp} index={i} />
            ))}
          </div>
        </div>
      </section>

      <section className="vendors-cta-section about-page-cta">
        <div className="container">
          <div className="vendors-cta-inner">
            <div className="vendors-cta-text">
              <div className="vendors-cta-badge">
                <span>JOIN THE COMMUNITY</span>
              </div>
              <h2 className="vendors-cta-title">
                Ready for the next event?
              </h2>
              <p className="vendors-cta-subtitle">
                Grab tickets, apply as a vendor, or volunteer — there&apos;s a place for every
                kind of collector at Collector&apos;s Paradise.
              </p>
            </div>
            <div className="vendors-cta-actions">
              <Link href="/events" className="vendors-cta-btn-primary">
                Buy Tickets
              </Link>
              <Link href="/volunteers" className="vendors-cta-btn-secondary">
                Volunteer With Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default StackingCards;

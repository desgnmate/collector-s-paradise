'use client';

import React from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const AboutHero = () => {
  return (
    <section className="about-hero-section">
      <div className="about-hero-container">
        <motion.div 
          className="about-hero-left"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <span className="about-eyebrow">Our Story</span>
          <h1 className="about-title">
            About <span className="title-accent">Us</span>
          </h1>
          <p className="about-description">
            Collectors Paradise was founded by James and Chris through a shared passion for trading cards, collecting culture, and community. The two first met at Hobby Hangout in Melbourne in mid-2025 in one of the trade zones, where an organic conversation quickly turned into a strong friendship built around Pokémon, vending, and the joy of collecting.
          </p>
          <p className="about-description">
            After vending beside each other at several events, the idea naturally arose to create their own show — a space that felt welcoming, exciting, community-driven, and genuinely enjoyable for both vendors and attendees alike. What began as a simple idea between two collectors quickly evolved into Collectors Paradise.
          </p>
          <p className="about-description">
            At its core, Collectors Paradise is about more than just cards. In an increasingly digital world, James and Chris believe in the importance of creating real physical spaces where people can connect, share passions, make memories, and experience joy together. While people attend for many different reasons — collecting, investing, nostalgia, competition, or simply meeting like-minded people — the essence behind it all is community and joy.
          </p>
          <p className="about-description">
            Collectors Paradise prides itself on creating safe, welcoming, and energetic events for collectors of all ages and experience levels. Through buying, selling, trading, tournaments, and shared enthusiasm for the hobby, James and Chris hope to continue growing Collectors Paradise into one of Australia&apos;s leading community-focused collector events.
          </p>
        </motion.div>

        <motion.div 
          className="about-hero-right"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Image 
            src="/images/about-hero.jpg" 
            alt="James and Chris - Founders of Collectors Paradise" 
            width={600}
            height={700}
            priority
            style={{ objectFit: 'cover', borderRadius: '20px', border: '4px solid var(--color-dark)' }}
          />
        </motion.div>
      </div>
    </section>
  );
};

export default AboutHero;
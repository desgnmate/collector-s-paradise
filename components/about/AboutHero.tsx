import React from 'react';
import Image from 'next/image';

export default function AboutHero() {
  return (
    <section className="about-hero-section">
      <div className="container">
        <div className="about-hero-container">
          <div className="about-hero-left">
            <span className="eyebrow-badge">OUR STORY</span>
            <h1 className="about-title">
              About Collector&apos;s Paradise
            </h1>
            <div className="about-description-stack">
              <p className="about-description">
                Collector&apos;s Paradise was founded by James and Chris through a shared passion for
                trading cards, collecting culture, and community. The two first met at Hobby Hangout
                in Melbourne in mid-2025 in one of the trade zones, where an organic conversation
                quickly turned into a strong friendship built around Pokémon, vending, and the joy
                of collecting.
              </p>
              <p className="about-description">
                After vending beside each other at several events, the idea naturally arose to create
                their own show — a space that felt welcoming, exciting, community-driven, and
                genuinely enjoyable for both vendors and attendees alike. What began as a simple idea
                between two collectors quickly evolved into Collector&apos;s Paradise.
              </p>
              <p className="about-description">
                At its core, Collector&apos;s Paradise is about more than just cards. In an increasingly
                digital world, James and Chris believe in creating real physical spaces where people
                can connect, share passions, make memories, and experience joy together.
              </p>
              <p className="about-description">
                Through buying, selling, trading, tournaments, and shared enthusiasm for the hobby,
                they hope to continue growing Collector&apos;s Paradise into one of Australia&apos;s
                leading community-focused collector events.
              </p>
            </div>
          </div>

          <div className="about-hero-right">
            <div className="about-hero-image-wrap">
              <Image
                src="/images/about-hero.jpg"
                alt="James and Chris - Founders of Collector's Paradise"
                fill
                priority
                sizes="(max-width: 900px) 100vw, 48vw"
                style={{ objectFit: 'cover' }}
              />
              <div className="about-hero-stats">
                <div className="stat-item">
                  <span className="stat-number">2k+</span>
                  <span className="stat-label">Collectors</span>
                </div>
                <div className="stat-divider" aria-hidden="true" />
                <div className="stat-item">
                  <span className="stat-number">Melb</span>
                  <span className="stat-label">Based</span>
                </div>
                <div className="stat-divider" aria-hidden="true" />
                <div className="stat-item">
                  <span className="stat-number">TCG</span>
                  <span className="stat-label">Community</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

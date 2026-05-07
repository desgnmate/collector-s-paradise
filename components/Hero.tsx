import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import card1 from '@/public/images/card1.png';
import card2 from '@/public/images/card2.png';
import card3 from '@/public/images/card3.png';

export default function Hero() {
  return (
    <section className="hero" id="hero">
      {/* Background video */}
      <div className="hero-bg">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className="hero-video"
        >
          <source src="/hero-section-video.mp4" type="video/mp4" />
        </video>
      </div>

      {/* Content */}
      <div className="hero-content">
        <h1 className="hero-title">
          Where Collectors<br />
          Meet, Trade &amp; Connect
        </h1>
        <p className="hero-subtitle">
          A live trading card event where collectors buy, sell, and
          trade Pokémon cards, discover rare finds, and connect
          with the community.
        </p>
        <div className="hero-buttons">
          <Link href="/events" className="btn btn-hero-ticket">
            Buy Tickets
          </Link>
        </div>
      </div>

      {/* Cards fan at the bottom */}
      <div className="hero-cards-fan">
        {/* Card 1 - Charizard (left, tilted left) */}
        <div className="hero-card hero-card-left">
          <Image src={card1} alt="Charizard Pokemon Card" width={280} height={390} priority />
        </div>
        {/* Card 2 - Arcanine V (center, upright, larger) */}
        <div className="hero-card hero-card-center">
          <Image src={card2} alt="Arcanine V Pokemon Card" width={300} height={420} priority />
        </div>
        {/* Card 3 - Pikachu ex (right, tilted right) */}
        <div className="hero-card hero-card-right">
          <Image src={card3} alt="Pikachu ex Pokemon Card" width={280} height={390} priority />
        </div>
      </div>
    </section>
  );
}

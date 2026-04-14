'use client';

import Image from 'next/image';
import Link from 'next/link';

export default function Hero() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="hero" id="hero">
      {/* Background video */}
      <div className="hero-bg">
        <video
          autoPlay
          loop
          muted
          playsInline
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
          <Image
            src="/images/card1.png"
            alt="Charizard Pokemon Card"
            width={280}
            height={390}
            priority
          />
        </div>
        {/* Card 2 - Arcanine V (center, upright, larger) */}
        <div className="hero-card hero-card-center">
          <Image
            src="/images/card2.png"
            alt="Arcanine V Pokemon Card"
            width={300}
            height={420}
            priority
          />
        </div>
        {/* Card 3 - Pikachu ex (right, tilted right) */}
        <div className="hero-card hero-card-right">
          <Image
            src="/images/card3.png"
            alt="Pikachu ex Pokemon Card"
            width={280}
            height={390}
            priority
          />
        </div>
      </div>
    </section>
  );
}

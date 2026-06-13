import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import cardLeft from '@/public/images/card2-v2.jpg';
import cardCenter from '@/public/images/card3.png';
import cardRight from '@/public/images/card1-v3.png';

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
          Australia's home of trading card events. Buy, sell and trade your
          favourite TCGs, discover rare finds, and connect with collectors
          who are as obsessed as you are.
        </p>
        <div className="hero-buttons">
          <Link href="/events" className="btn btn-hero-ticket" prefetch>
            Buy Tickets
          </Link>
        </div>
      </div>

      {/* Cards fan at the bottom */}
      <div className="hero-cards-fan">
        <div className="hero-card hero-card-left">
          <Image src={cardLeft} alt="Pokémon trading card on display at Collector's Paradise Melbourne event" width={190} height={265} priority />
        </div>
        <div className="hero-card hero-card-center">
          <Image src={cardCenter} alt="Rare Pokémon TCG card featured at a Collector's Paradise trading card show" width={210} height={290} priority />
        </div>
        <div className="hero-card hero-card-right">
          <Image src={cardRight} alt="Pokémon trading card hero image for Melbourne collector event" width={380} height={530} priority />
        </div>
      </div>
    </section>
  );
}

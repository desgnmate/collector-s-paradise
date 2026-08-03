import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import s1 from '@/public/images/silhouette-1.png';
import t1 from '@/public/images/team-vendors-1.png';
import s2 from '@/public/images/silhouette-2.png';
import v2 from '@/public/images/vendor-2.png';

const VendorShowcase = () => {
  return (
    <section className="vendor-showcase-section" style={{ paddingBottom: 'var(--space-4xl)' }}>
      <div className="container">
        
        <div className="vendor-showcase-header" data-aos="fade-up">
          <span className="eyebrow-badge">VENDOR OPPORTUNITIES</span>
          <h2 className="section-title">VENDOR SHOWCASE</h2>
          <p className="section-subtitle">
            Discover top vendors with unique cards, rare items, and must-have collectibles.
          </p>
        </div>

        <div className="vendor-cards-container">
          
          {/* Left Card: Yellow */}
          <div className="vendor-card-3d vendor-card-left" data-aos="fade-up" data-aos-delay="100">
            <div className="card-custom-header">
              <div className="card-slashes">
                <span className="slash"></span>
                <span className="slash"></span>
                <span className="slash"></span>
              </div>
              <div className="top-bar-fill"></div>
            </div>
            <div className="vendor-card-content">
              <div className="vendor-image-wrapper">
                <Image src={s1} alt="Pokémon TCG vendor booth silhouette at Collector's Paradise trading card event" width={800} height={700} loading="lazy" className="silhouette-img" />
                <Image src={t1} alt="Featured trading card vendor display with rare collectibles at Collector's Paradise" width={800} height={700} loading="lazy" className="reveal-img" />
              </div>
              <Link href="/vendors" className="vendor-card-btn" prefetch>VIEW VENDOR LIST</Link>
            </div>
          </div>

          {/* Right Card: Blue */}
          <div className="vendor-card-3d vendor-card-right" data-aos="fade-up" data-aos-delay="300">
            <div className="card-custom-header">
              <div className="card-slashes">
                <span className="slash"></span>
                <span className="slash"></span>
                <span className="slash"></span>
              </div>
              <div className="top-bar-fill"></div>
            </div>
            <div className="vendor-card-content">
              <div className="vendor-image-wrapper">
                <Image src={s2} alt="Trading card singles showcase booth silhouette at Collector's Paradise event" width={800} height={700} loading="lazy" className="silhouette-img" />
                <Image src={v2} alt="Featured singles vendor display with rare Pokémon and trading cards at Collector's Paradise" width={800} height={700} loading="lazy" className="reveal-img" />
              </div>
              <Link href="/vendors/apply" className="vendor-card-btn" prefetch>JOIN AS VENDOR</Link>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default VendorShowcase;

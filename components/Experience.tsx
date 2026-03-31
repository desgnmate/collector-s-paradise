import React from 'react';
import Image from 'next/image';

const Experience = () => {
  return (
    <section id="experience" className="experience-section">
      <div className="experience-card-container" data-aos="fade-up">
        
        {/* Left Side: Content */}
        <div className="experience-content">
          <span className="eyebrow-badge">WHAT YOU&apos;LL EXPERIENCE</span>
          <h2 className="section-title">FUN FOR<br />EVERYONE</h2>
          <p className="section-subtitle">
            Immerse yourself in a world of pop culture excitement. From rare collectibles to exclusive guest appearances, there's something for every fan.
          </p>
          
          <div className="experience-tags">
            <span className="experience-tag">BUY / SELL / TRADE</span>
            <span className="experience-tag">MEET FELLOW FANS</span>
            <span className="experience-tag">CULTURE AND FUN</span>
            <span className="experience-tag">LIVE DEAL EVALUATIONS</span>
          </div>
        </div>

        {/* Right Side: Image */}
        <div className="experience-image-side">
          <Image 
            src="/images/3rd-section-card-image.jpg" 
            alt="Collector's Paradise Experience" 
            fill
            sizes="(max-width: 900px) 100vw, 50vw"
            style={{ objectFit: 'cover', objectPosition: 'center' }}
            priority
          />
        </div>

      </div>
    </section>
  );
};

export default Experience;

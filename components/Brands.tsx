import React from 'react';

// Generates an array of generic svg elements for placeholder brands
const generateBrandSVGs = () => {
  return [
    <svg key="1" viewBox="0 0 100 40" className="brand-logo-svg"><path d="M10,20 Q25,5 50,20 T90,20 L90,30 L10,30 Z" /></svg>,
    <svg key="2" viewBox="0 0 100 40" className="brand-logo-svg"><rect x="25" y="10" width="50" height="20" rx="4" /> <circle cx="15" cy="20" r="10"/> </svg>,
    <svg key="3" viewBox="0 0 100 40" className="brand-logo-svg"><polygon points="50,5 90,35 10,35" /></svg>,
    <svg key="4" viewBox="0 0 100 40" className="brand-logo-svg"><ellipse cx="50" cy="20" rx="40" ry="15" /> </svg>,
    <svg key="5" viewBox="0 0 100 40" className="brand-logo-svg"><path d="M10,10 L30,10 L50,30 L70,10 L90,10 L90,30 L70,30 L50,15 L30,30 L10,30 Z" /></svg>,
    <svg key="6" viewBox="0 0 100 40" className="brand-logo-svg"><circle cx="50" cy="20" r="15" /> <circle cx="30" cy="20" r="10" /> <circle cx="70" cy="20" r="10" /> </svg>,
    <svg key="7" viewBox="0 0 100 40" className="brand-logo-svg"><path d="M20,5 L80,5 L70,35 L30,35 Z" /></svg>,
    <svg key="8" viewBox="0 0 100 40" className="brand-logo-svg"><rect x="10" y="15" width="80" height="10" /> <rect x="45" y="5" width="10" height="30" /></svg>,
  ];
};

const Brands = () => {
  const brandLogos = generateBrandSVGs();

  return (
    <section id="brands" className="brands-section">
      <div className="brands-header" data-aos="fade-up">
        <span className="eyebrow-badge">SPONSORS &amp; PARTNERS</span>
        <h2 className="section-title">
          BRANDS WE&apos;VE <br className="brands-mobile-break" /> WORKED WITH
        </h2>
      </div>

      <div className="brands-grid">
        {brandLogos.map((svg, index) => (
          <div 
            key={index} 
            className="brand-item" 
            data-aos="zoom-in" 
            data-aos-delay={index * 50}
          >
            {svg}
          </div>
        ))}
      </div>
    </section>
  );
};

export default Brands;

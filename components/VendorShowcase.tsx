import React from 'react';
import Image from 'next/image';

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
                <Image 
                  src="/images/silhouette-1.png" 
                  alt="Vendors Showcase Silhouette" 
                  width={800} 
                  height={700} 
                  className="silhouette-img"
                />
                <Image 
                  src="/images/team-vendors-1.png" 
                  alt="Vendors Showcase revealed" 
                  width={800} 
                  height={700} 
                  className="reveal-img"
                />
              </div>
              <button className="vendor-card-btn">VIEW VENDOR LIST</button>
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
                <Image 
                  src="/images/silhouette-2.png" 
                  alt="Singles Showcase Silhouette" 
                  width={800} 
                  height={700}
                  className="silhouette-img"
                />
                <Image 
                  src="/images/vendor-2.png" 
                  alt="Singles Showcase revealed" 
                  width={800} 
                  height={700}
                  className="reveal-img"
                />
              </div>
              <button className="vendor-card-btn">JOIN AS VENDOR</button>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
};

export default VendorShowcase;

'use client';

import Image from 'next/image';

export default function Footer() {
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <footer className="new-footer-section">
      <div className="new-footer-container">
        {/* CTA Top Half */}
        <div className="footer-cta-part">
          <p className="footer-eyebrow">JOIN THE COMMUNITY</p>
          <h2 className="footer-cta-title">BE PART OF THE<br/>EXPERIENCE</h2>
          <p className="footer-cta-subtitle">Connect with collectors, share the passion,<br/>and be part of something bigger.</p>
          <button className="btn btn-yellow footer-cta-btn" onClick={() => scrollTo('highlights')}>Buy Tickets</button>

          {/* Floating Polaroids */}
          <div className="polaroid-cards-wrapper">
            <div className="polaroid p-1">
              <Image src="/images/meet-fans.png" alt="Collectors" width={220} height={220} />
            </div>
            <div className="polaroid p-2">
              <Image src="/images/event-experience.png" alt="Events" width={220} height={220} />
            </div>
            <div className="polaroid p-3">
              <Image src="/images/culture-fun.png" alt="Passion" width={220} height={220} />
            </div>
            <div className="polaroid p-4">
              <Image src="/images/browse-collections.png" alt="Community" width={220} height={220} />
            </div>
          </div>
        </div>

        {/* Footer Main Logo and Nav */}
        <div className="footer-main-part">
          <Image
            src="/images/footer-logo.png"
            alt="Collector's Paradise"
            width={700}
            height={200}
            className="footer-hero-logo"
            style={{ objectFit: 'contain' }}
          />

          <div className="footer-nav">
            <a href="#highlights">EVENTS</a>
            <a href="#vendors">VENDORS</a>
            <a href="#about">ABOUT</a>
            <a href="#contact">CONTACT</a>
          </div>
        </div>

        {/* Bottom Contact / Legal Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-dev-text">
            DESIGNED AND DEVELOPED BY<br/>
            WWW.DESIGNMATE.COM
          </div>

          <div className="footer-social-icons">
            <a href="#" aria-label="YouTube">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z"/><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"/>
              </svg>
            </a>
            <a href="#" aria-label="Instagram">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </a>
            <a href="#" aria-label="TikTok">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5"/>
              </svg>
            </a>
          </div>

          <div className="footer-legal-text">
            PRIVACY<br/>
            TERMS &amp; CONDITIONS
          </div>
        </div>

      </div>
    </footer>
  );
}

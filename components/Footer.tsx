import Link from 'next/link';
import { AdminSecretAccess } from './AdminSecretAccess';

export default function Footer() {
  return (
    <footer className="new-footer-section">
      <div className="new-footer-container">
        {/* CTA Top Half */}
        <div className="footer-cta-part">
          <p className="footer-eyebrow">JOIN THE COMMUNITY</p>
          <h2 className="footer-cta-title">BE PART OF THE<br />EXPERIENCE</h2>
          <p className="footer-cta-subtitle">Connect with collectors, share the passion,<br />and be part of something bigger.</p>
          <Link href="/events" className="btn btn-yellow footer-cta-btn">Buy Tickets</Link>

          {/* Floating Polaroids */}
          <div className="polaroid-cards-wrapper">
            <div className="polaroid p-1">
              <img src="/images/meet-fans.png" alt="Collectors meeting at a Pokémon trading card event" width="220" height="220" loading="lazy" />
            </div>
            <div className="polaroid p-2">
              <img src="/images/event-experience.png" alt="Live event experience at Collector" width="220" height="220" loading="lazy" />
            </div>
            <div className="polaroid p-3">
              <img src="/images/culture-fun.png" alt="Fun and culture at the collector community" width="220" height="220" loading="lazy" />
            </div>
            <div className="polaroid p-4">
              <img src="/images/browse-collections.png" alt="Browsing rare Pokémon card collections" width="220" height="220" loading="lazy" />
            </div>
          </div>
        </div>

        {/* Footer Main Logo and Nav */}
        <div className="footer-main-part">
          <AdminSecretAccess>
            <img src="/images/footer-logo.png" alt="Collector" width="700" height="200" loading="lazy" className="footer-hero-logo" style={{ objectFit: 'contain' }} />
          </AdminSecretAccess>

          <nav className="footer-nav" aria-label="Footer navigation">
            <Link href="/events">EVENTS</Link>
            <Link href="/vendors/apply">VENDOR APPLICATION</Link>
            <Link href="/about">ABOUT</Link>
            <a href="/about#contact">CONTACT</a>
          </nav>
        </div>

        {/* Bottom Contact / Legal Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-dev-text">
            DESIGNED AND DEVELOPED BY<br />
            WWW.DESGNMATE.COM
          </div>

          <div className="footer-social-icons">
            <a aria-label="YouTube" rel="noopener noreferrer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
              </svg>
            </a>
            <a aria-label="Instagram" rel="noopener noreferrer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a aria-label="TikTok" rel="noopener noreferrer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
              </svg>
            </a>
          </div>

          <div className="footer-legal-text">
            <a href="/privacy">PRIVACY</a><br />
            <a href="/terms">TERMS &amp; CONDITIONS</a>
          </div>
        </div>

      </div>
    </footer>
  );
}

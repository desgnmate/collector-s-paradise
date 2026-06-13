import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AdminSecretAccess } from './AdminSecretAccess';
import logo from '@/public/images/logo.png';
import polaroid1 from '@/public/images/footer-card-1.jpg';
import polaroid2 from '@/public/images/footer-card-2.jpg';
import polaroid3 from '@/public/images/footer-card-3.jpg';
import polaroid4 from '@/public/images/footer-card-4.jpg';
import footerLogo from '@/public/images/footer-logo.png';

export default function Footer() {
  return (
    <footer className="new-footer-section">
      <div className="new-footer-container">
        {/* CTA Top Half */}
        <div className="footer-cta-part">
          <p className="footer-eyebrow">Join Collector&apos;s Club</p>
          <h2 className="footer-cta-title">BE PART OF THE<br />EXPERIENCE</h2>
          <p className="footer-cta-subtitle">Connect with collectors, share the passion,<br />and be part of something bigger.</p>
          <Link href="#" className="btn btn-yellow footer-cta-btn">Subscribe</Link>

          {/* Floating Polaroids */}
          <div className="polaroid-cards-wrapper">
            <div className="polaroid p-1">
              <Image src={polaroid1} alt="Collectors meeting at a Pokémon trading card event" width={150} height={210} loading="lazy" />
            </div>
            <div className="polaroid p-2">
              <Image src={polaroid2} alt="Live event experience at Collector's Paradise" width={150} height={210} loading="lazy" />
            </div>
            <div className="polaroid p-3">
              <Image src={polaroid3} alt="Fun and culture at the collector community" width={150} height={210} loading="lazy" />
            </div>
            <div className="polaroid p-4">
              <Image src={polaroid4} alt="Browsing rare Pokemon card collections" width={150} height={210} loading="lazy" />
            </div>
          </div>
        </div>

        {/* Footer Main Logo and Nav */}
        <div className="footer-main-part">
          <AdminSecretAccess>
            <Image src={footerLogo} alt="Collector's Paradise" width={700} height={200} loading="lazy" className="footer-hero-logo" style={{ objectFit: 'contain' }} />
          </AdminSecretAccess>

          <nav className="footer-nav" aria-label="Footer navigation">
            <Link href="/events" prefetch>EVENTS</Link>
            <Link href="/vendors/apply" prefetch>VENDOR APPLICATION</Link>
            <Link href="/sponsorship" prefetch>SPONSORSHIP</Link>
            <Link href="/volunteers" prefetch>VOLUNTEER</Link>
            <Link href="/about" prefetch>ABOUT</Link>
            <Link href="/about#contact" prefetch>CONTACT</Link>
          </nav>

          {/* Address block — supports Local SEO NAP consistency */}
          <address className="footer-address" style={{ fontStyle: 'normal', textAlign: 'center', marginTop: '1rem', color: 'var(--color-dark)', fontSize: '0.85rem', lineHeight: 1.6 }}>
            Collector's Paradise<br />
            Melbourne, Victoria 3000<br />
            Australia<br />
            <a href="mailto:Collectorsinparadise@gmail.com" style={{ color: 'inherit' }}>Collectorsinparadise@gmail.com</a>
          </address>
        </div>

        {/* Bottom Contact / Legal Bar */}
        <div className="footer-bottom-bar">
          <div className="footer-dev-text">
            DESIGNED AND DEVELOPED BY<br />
            WWW.DESGNMATE.COM
          </div>

          <div className="footer-social-icons">
            <a href="#" aria-label="YouTube" rel="noopener noreferrer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19.13C5.12 19.56 12 19.56 12 19.56s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.43z" /><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" />
              </svg>
            </a>
            <a href="#" aria-label="Instagram" rel="noopener noreferrer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
              </svg>
            </a>
            <a href="#" aria-label="TikTok" rel="noopener noreferrer">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
              </svg>
            </a>
          </div>

          <div className="footer-legal-text">
            <Link href="/privacy">PRIVACY</Link><br />
            <Link href="/terms">TERMS &amp; CONDITIONS</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}

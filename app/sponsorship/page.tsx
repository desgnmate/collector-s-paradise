import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sponsorship',
  description: 'Partner with Collector\'s Paradise — Melbourne\'s premier Pokémon trading card event. Reach thousands of collectors and showcase your brand to the TCG community.',
  openGraph: {
    title: "Sponsorship | Collector's Paradise",
    description: "Partner with Collector's Paradise and reach thousands of collectors and TCG enthusiasts.",
  },
  alternates: {
    canonical: 'https://collectorsparadise.com.au/sponsorship',
  },
};

export default function SponsorshipPage() {
  return (
    <main>
      <Navbar />

      {/* Page Header */}
      <section className="vendors-page-header-section">
        <div className="container">
          <div className="vendors-page-header">
            <span className="eyebrow-badge">PARTNERSHIPS</span>
            <h1 className="section-title">
              SPONSORSHIP
            </h1>
            <p className="section-subtitle">
              Partner with Collector&apos;s Paradise and connect with Melbourne&apos;s most passionate
              Pokémon TCG community. Reach thousands of collectors at our events.
            </p>
          </div>
        </div>
      </section>

      {/* Sponsorship Tiers */}
      <section className="vendors-grid-section">
        <div className="container">
          <div className="sponsorship-tiers-grid">
            {/* Platinum Tier */}
            <div className="sponsorship-tier-card platinum">
              <div className="tier-header">
                <span className="tier-badge">PLATINUM</span>
                <h2 className="tier-title">$5,000+</h2>
              </div>
              <ul className="tier-benefits">
                <li>Premium booth location (high-traffic area)</li>
                <li>Logo on all event marketing materials</li>
                <li>Featured social media posts (3x)</li>
                <li>Stage announcement recognition</li>
                <li>Exclusive email newsletter feature</li>
                <li>Complimentary vendor table</li>
              </ul>
            </div>

            {/* Gold Tier */}
            <div className="sponsorship-tier-card gold">
              <div className="tier-header">
                <span className="tier-badge">GOLD</span>
                <h2 className="tier-title">$2,500+</h2>
              </div>
              <ul className="tier-benefits">
                <li>Priority booth selection</li>
                <li>Logo on event website</li>
                <li>Social media mention (2x)</li>
                <li>Stage announcement recognition</li>
                <li>10% discount on additional tables</li>
              </ul>
            </div>

            {/* Silver Tier */}
            <div className="sponsorship-tier-card silver">
              <div className="tier-header">
                <span className="tier-badge">SILVER</span>
                <h2 className="tier-title">$1,000+</h2>
              </div>
              <ul className="tier-benefits">
                <li>Standard booth location</li>
                <li>Name listed on event website</li>
                <li>Social media mention (1x)</li>
                <li>5% discount on additional tables</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Why Sponsor CTA */}
      <section className="vendors-cta-section">
        <div className="container">
          <div className="vendors-cta-inner">
            <div className="vendors-cta-text">
              <div className="vendors-cta-badge">
                <span>WHY SPONSOR</span>
              </div>
              <h2 className="vendors-cta-title">
                REACH 2,000+ COLLECTORS PER EVENT
              </h2>
              <p className="vendors-cta-subtitle">
                Our events attract serious collectors, players, and enthusiasts from across Melbourne and beyond.
                Sponsorship gives your brand direct access to this engaged community.
              </p>
            </div>
            <div className="vendors-cta-actions">
              <a href="mailto:sponsor@collectorsparadise.com.au" className="vendors-cta-btn-primary">
                Become a Sponsor
              </a>
              <Link href="/about" className="vendors-cta-btn-secondary">
                Learn More About Us
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

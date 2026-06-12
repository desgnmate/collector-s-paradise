import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Event Sponsorship Melbourne | Partner with Pokémon TCG Events',
  description:
    "Become a sponsor of Collector's Paradise — Melbourne's biggest Pokémon TCG and trading card event. Reach 2,000+ Australian collectors per event. Platinum, Gold, Silver and custom packages available.",
  keywords: [
    'event sponsorship Melbourne',
    'Pokemon TCG sponsorship Australia',
    'trading card event partner',
    'Melbourne hobby sponsorship',
    'youth market sponsorship Australia',
  ],
  openGraph: {
    title: "Event Sponsorship | Collector's Paradise Melbourne",
    description:
      "Reach 2,000+ Australian collectors per event. Partner with Melbourne's biggest trading card event series.",
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
              <Link href="/sponsors/apply" className="vendors-cta-btn-primary">
                Become a Sponsor
              </Link>
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

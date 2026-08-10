import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';

export const metadata: Metadata = {
  title: "Event Sponsorship Australia | Collector's Paradise",
  description:
    "Become a sponsor of Collector's Paradise trading card events. Reach Australian Pokémon TCG and collectibles fans with custom partnership packages.",
  keywords: [
    'event sponsorship Australia',
    'Pokemon TCG sponsorship Australia',
    'trading card event partner',
    'Australian hobby sponsorship',
    'youth market sponsorship Australia',
  ],
  openGraph: {
    title: "Event Sponsorship | Collector's Paradise",
    description:
      "Reach Australian collectors at Collector's Paradise trading card events with tailored sponsorship packages.",
    url: 'https://www.collectorsparadise.au/sponsorship',
  },
  alternates: {
    canonical: 'https://www.collectorsparadise.au/sponsorship',
  },
};

const benefits = [
  {
    title: 'Targeted reach',
    desc: 'Put your brand in front of 2,000+ engaged collectors, players, and hobbyists at every event.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    title: 'On-site presence',
    desc: 'Booth space, signage, stage mentions, and product placement options tailored to your goals.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    title: 'Digital & social',
    desc: 'Logo placement across our website, event pages, and social channels before and after show day.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    ),
  },
  {
    title: 'Community goodwill',
    desc: 'Support a growing Melbourne hobby scene and associate your brand with fun, inclusive collector culture.',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
      </svg>
    ),
  },
];

export default function SponsorshipPage() {
  return (
    <main className="brand-page">
      <Navbar />

      <section className="vendors-page-header-section">
        <div className="container">
          <div className="vendors-page-header">
            <span className="eyebrow-badge">PARTNERSHIPS</span>
            <h1 className="section-title">Sponsorship</h1>
            <p className="section-subtitle">
              Partner with Collector&apos;s Paradise and connect with Melbourne&apos;s most passionate
              Pokémon TCG and trading card community. Reach thousands of collectors at every show.
            </p>
          </div>
        </div>
      </section>

      <section className="featured-sponsor-section" aria-labelledby="fetch-sponsor-title">
        <div className="container">
          <article className="featured-sponsor-card">
            <div className="featured-sponsor-visual" aria-hidden="true">
              <div className="featured-sponsor-logo-frame">
                <Image
                  src="/images/sponsors/fetch-sponsor.jpeg"
                  alt=""
                  width={1080}
                  height={1080}
                  sizes="(max-width: 820px) 220px, 300px"
                  className="featured-sponsor-logo"
                />
              </div>
            </div>

            <div className="featured-sponsor-content">
              <span className="featured-sponsor-kicker">Featured Event Partner</span>
              <h2 id="fetch-sponsor-title" className="featured-sponsor-title">
                Proudly supported by <span>FETCH</span>
              </h2>
              <p className="featured-sponsor-description">
                FETCH proudly supports Collector&apos;s Paradise and our growing community of
                collectors, vendors, and trading card enthusiasts.
              </p>
              <p className="featured-sponsor-note">Supporting collector culture and community.</p>
            </div>
          </article>
        </div>
      </section>

      <section className="brand-page-section">
        <div className="container">
          <div className="brand-benefits-grid">
            {benefits.map((item) => (
              <article key={item.title} className="brand-benefit-card">
                <div className="brand-benefit-icon">{item.icon}</div>
                <h3 className="brand-benefit-title">{item.title}</h3>
                <p className="brand-benefit-desc">{item.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="vendors-cta-section">
        <div className="container">
          <div className="vendors-cta-inner">
            <div className="vendors-cta-text">
              <div className="vendors-cta-badge">
                <span>GET STARTED</span>
              </div>
              <h2 className="vendors-cta-title">
                Ready to reach 2,000+ collectors?
              </h2>
              <p className="vendors-cta-subtitle">
                Tell us about your brand and goals. We&apos;ll match you with the right package
                and activation for the next Collector&apos;s Paradise event.
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

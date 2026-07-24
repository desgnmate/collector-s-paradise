import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { FAQ_DATA, FAQSchema } from '@/components/StructuredData';
import FaqAccordion from '@/components/FaqAccordion';

export const metadata: Metadata = {
  title: 'Frequently Asked Questions | Trading Card Events Melbourne',
  description:
    "Answers to common questions about Collector's Paradise trading card and collectibles events — tickets, vendors, venue info, and more.",
  keywords: [
    'Collectors Paradise FAQ',
    'trading card event questions Melbourne',
    'Pokemon TCG event tickets',
    'how to become vendor trading cards',
    'Melbourne card show FAQ',
  ],
  openGraph: {
    title: "FAQ | Collector's Paradise Melbourne",
    description:
      "Everything you need to know about Collector's Paradise trading card events — tickets, vendors, venue, and community.",
    url: 'https://collectorsparadise.au/faq',
  },
  alternates: {
    canonical: 'https://collectorsparadise.au/faq',
  },
};

export default function FAQPage() {
  return (
    <>
      <Navbar />
      <main className="about-page-wrapper" style={{ paddingBottom: 'var(--space-4xl)' }}>
        <FAQSchema />

        {/* Page Header */}
        <section className="vendors-page-header-section">
          <div className="container">
            <div className="vendors-page-header">
              <span className="eyebrow-badge">HELP CENTRE</span>
              <h1 className="section-title">Frequently Asked Questions</h1>
              <p className="section-subtitle">
                Everything you need to know about Collector&apos;s Paradise events, tickets, and the community.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ List */}
        <section className="faq-section">
          <div className="container">
            <FaqAccordion items={FAQ_DATA} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

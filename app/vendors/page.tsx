import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { getApprovedVendors } from '@/app/actions/vendors';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Trading Card Vendors Melbourne | Pokémon TCG Sellers Australia',
  description:
    "Meet approved trading card vendors at Collector's Paradise Melbourne. Rare Pokémon TCG, Yu-Gi-Oh!, One Piece, sports cards, graded cards, and vintage collectibles from Australian sellers.",
  keywords: [
    'trading card vendors Melbourne',
    'Pokemon TCG sellers Australia',
    'rare card vendors Victoria',
    'vintage collectibles Melbourne',
    'graded cards Australia',
  ],
  openGraph: {
    title: "Approved Vendors | Collector's Paradise Melbourne",
    description:
      "Discover approved Australian trading card vendors — rare Pokémon, Yu-Gi-Oh!, One Piece, sports cards, and graded cards.",
  },
  alternates: {
    canonical: 'https://collectorsparadise.au/vendors',
  },
};

export default async function VendorsPage() {
  const vendors = await getApprovedVendors();

  return (
    <main>
      <Navbar />

      {/* Page Header */}
      <section className="vendors-page-header-section">
        <div className="container">
          <div className="vendors-page-header">
            <span className="eyebrow-badge">COMMUNITY</span>
            <h1 className="section-title">
              OUR VENDORS
            </h1>
            <p className="section-subtitle">
              Meet the elite collectors, rare card dealers, and vintage enthusiasts who make
              Collector&apos;s Paradise the ultimate destination for the hobby.
            </p>
          </div>
        </div>
      </section>

      {/* Vendors Grid */}
      <section className="vendors-grid-section">
        <div className="container">
          {vendors.length === 0 ? (
            <div className="vendors-empty-state">
              <div className="vendors-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h3 className="vendors-empty-title">No Vendors Listed Yet</h3>
              <p className="vendors-empty-desc">
                We are currently processing new applications. Check back soon or apply to become a vendor yourself!
              </p>
              <Link href="/vendors/apply" className="btn-highlight">
                Apply to Sell →
              </Link>
            </div>
          ) : (
            <div className="vendors-cards-grid">
              {vendors.map((vendor, index) => (
                <div
                  key={vendor.id}
                  className="vendor-card"
                >
                  <div className="vendor-card-logo">
                    <Image
                      src={vendor.logo_url || '/images/logo.png'}
                      alt={`${vendor.business_name} logo`}
                      fill
                      style={{ objectFit: 'contain', padding: '1rem' }}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      priority={index < 4}
                    />
                  </div>

                  <div className="vendor-card-body">
                    <div className="vendor-card-top">
                      <h2 className="vendor-card-name">{vendor.business_name}</h2>
                      {vendor.booth_assignment && (
                        <span className="vendor-card-booth">#{vendor.booth_assignment}</span>
                      )}
                    </div>

                    <p className="vendor-card-contact">
                      {vendor.contact_name}
                    </p>

                    {vendor.description && (
                      <p className="vendor-card-desc">{vendor.description}</p>
                    )}

                    <div className="vendor-card-tags">
                      {(vendor.categories || []).map(cat => (
                        <span key={cat} className="vendor-card-tag">{cat}</span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Become a Vendor CTA */}
      <section id="become-vendor" className="vendors-cta-section">
        <div className="container">
          <div className="vendors-cta-inner">
            <div className="vendors-cta-text">
              <div className="vendors-cta-badge">
                <span>JOIN US</span>
              </div>
              <h2 className="vendors-cta-title">
                WANT TO SELL AT OUR NEXT EVENT?
              </h2>
              <p className="vendors-cta-subtitle">
                Join the growing network of vendors at Collector&apos;s Paradise.
                Gain access to thousands of motivated buyers and showcase your collection.
              </p>
            </div>
            <div className="vendors-cta-actions">
              <Link href="/vendors/apply" className="vendors-cta-btn-primary">
                Apply as Vendor
              </Link>
              <Link href="/vendors/apply" className="vendors-cta-btn-secondary">
                Learn More About Booths
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { getApprovedVendors } from '@/app/actions/vendors';

export const revalidate = 3600;

const VENDORS_PER_PAGE = 6;

type VendorsPageProps = {
  searchParams: Promise<{ page?: string | string[] | undefined }>;
};

export const metadata: Metadata = {
  title: "Trading Card Vendors Australia | Collector's Paradise",
  description:
    "Meet approved trading card vendors at Collector's Paradise. Discover Pokémon TCG, Yu-Gi-Oh!, One Piece, sports cards, and rare collectibles.",
  keywords: [
    'trading card vendors Australia',
    'Pokemon TCG sellers Australia',
    'rare card vendors Australia',
    'vintage collectibles Australia',
    'graded cards Australia',
  ],
  openGraph: {
    title: "Approved Trading Card Vendors | Collector's Paradise",
    description:
      "Discover approved Australian trading card vendors — rare Pokémon, Yu-Gi-Oh!, One Piece, sports cards, and graded cards.",
    url: "https://collectorsparadise.au/vendors",
  },
  alternates: {
    canonical: 'https://collectorsparadise.au/vendors',
  },
};

export default async function VendorsPage({ searchParams }: VendorsPageProps) {
  const { page: rawPage } = await searchParams;
  const requestedPage = Number(Array.isArray(rawPage) ? rawPage[0] : rawPage);
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  let { vendors: visibleVendors, totalCount } = await getApprovedVendors(currentPage, VENDORS_PER_PAGE);
  const totalPages = Math.max(1, Math.ceil(totalCount / VENDORS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  if (safeCurrentPage !== currentPage) {
    ({ vendors: visibleVendors, totalCount } = await getApprovedVendors(safeCurrentPage, VENDORS_PER_PAGE));
  }

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
          {totalCount === 0 ? (
            <div className="vendors-empty-state">
              <div className="vendors-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h3 className="vendors-empty-title">No Vendors Listed Yet</h3>
              <p className="vendors-empty-desc">
                We are currently processing new applications. Check back soon to see approved vendors.
              </p>
            </div>
          ) : (
            <>
              <div className="vendors-cards-grid">
              {visibleVendors.map((vendor, index) => (
                <div
                  key={vendor.id}
                  className="vendor-card"
                  data-card-number={String(index + 1).padStart(2, '0')}
                >
                  <div className="vendor-card-logo">
                    <span className="vendor-card-logo-label">APPROVED VENDOR</span>
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

                    <div className="vendor-card-footer">
                      {vendor.categories && vendor.categories.length > 0 && (
                        <div className="vendor-card-tags" aria-label="Vendor categories">
                          <span className="vendor-card-tags-label">Specialties</span>
                          <div className="vendor-card-tags-list">
                            {vendor.categories.slice(0, 4).map(cat => (
                              <span key={cat} className="vendor-card-tag">{cat}</span>
                            ))}
                            {vendor.categories.length > 4 && (
                              <span className="vendor-card-tag vendor-card-tag-more">
                                +{vendor.categories.length - 4}
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {vendor.social_links && (
                        <a
                          href={vendor.social_links}
                          className="vendor-card-social-link"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <svg viewBox="0 0 24 24" aria-hidden="true">
                            <rect x="3" y="3" width="18" height="18" rx="5" />
                            <circle cx="12" cy="12" r="4" />
                            <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
                          </svg>
                          Follow vendor
                          <span aria-hidden="true">↗</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

              {totalPages > 1 && (
                <nav className="vendors-pagination" aria-label="Vendor pages">
                <Link
                  href={`/vendors?page=${safeCurrentPage - 1}`}
                  className="vendors-pagination-link vendors-pagination-arrow"
                  aria-disabled={safeCurrentPage === 1}
                  tabIndex={safeCurrentPage === 1 ? -1 : undefined}
                >
                  Previous
                </Link>

                <div className="vendors-pagination-numbers">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <Link
                      key={pageNumber}
                      href={`/vendors?page=${pageNumber}`}
                      className={`vendors-pagination-link ${pageNumber === safeCurrentPage ? 'is-active' : ''}`}
                      aria-current={pageNumber === safeCurrentPage ? 'page' : undefined}
                    >
                      {pageNumber}
                    </Link>
                  ))}
                </div>

                <Link
                  href={`/vendors?page=${safeCurrentPage + 1}`}
                  className="vendors-pagination-link vendors-pagination-arrow"
                  aria-disabled={safeCurrentPage === totalPages}
                  tabIndex={safeCurrentPage === totalPages ? -1 : undefined}
                >
                  Next
                </Link>
                </nav>
              )}
            </>
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

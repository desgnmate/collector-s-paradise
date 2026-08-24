import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import Link from 'next/link';
import VendorNavigationLink from '@/components/VendorNavigationLink';
import { getApprovedVendors } from '@/app/actions/vendors';
import { getEvents } from '@/app/actions/events';

export const revalidate = 3600;

const VENDORS_PER_PAGE = 6;

type VendorsPageProps = {
  searchParams: Promise<{
    page?: string | string[] | undefined;
    event?: string | string[] | undefined;
    view?: string | string[] | undefined;
  }>;
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
    url: "https://www.collectorsparadise.au/vendors",
  },
  alternates: {
    canonical: 'https://www.collectorsparadise.au/vendors',
  },
};

export default async function VendorsPage({ searchParams }: VendorsPageProps) {
  const { page: rawPage, event: rawEvent, view: rawView } = await searchParams;
  const requestedPage = Number(Array.isArray(rawPage) ? rawPage[0] : rawPage);
  const requestedEventId = Array.isArray(rawEvent) ? rawEvent[0] : rawEvent;
  const requestedView = Array.isArray(rawView) ? rawView[0] : rawView;
  const unassignedOnly = requestedView !== 'all' && !requestedEventId;
  const today = new Date().toISOString().slice(0, 10);
  const events = (await getEvents())
    .filter((event) => (
      event.event_date >= today &&
      (event.status === 'upcoming' || event.status === 'active')
    ))
    .sort((a, b) => a.event_date.localeCompare(b.event_date));
  const selectedEvent = unassignedOnly ? undefined : events.find((event) => event.id === requestedEventId);
  const selectedEventId = selectedEvent?.id;
  const currentPage = Number.isInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  let { vendors: visibleVendors, totalCount } = await getApprovedVendors(currentPage, VENDORS_PER_PAGE, selectedEventId, unassignedOnly);
  const totalPages = Math.max(1, Math.ceil(totalCount / VENDORS_PER_PAGE));
  const safeCurrentPage = Math.min(currentPage, totalPages);

  if (safeCurrentPage !== currentPage) {
    ({ vendors: visibleVendors, totalCount } = await getApprovedVendors(safeCurrentPage, VENDORS_PER_PAGE, selectedEventId, unassignedOnly));
  }

  const vendorPageHref = (page: number) => selectedEventId
    ? `/vendors?event=${encodeURIComponent(selectedEventId)}&page=${page}`
    : unassignedOnly
      ? `/vendors?page=${page}`
      : `/vendors?view=all&page=${page}`;

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
      <section id="vendor-directory" className="vendors-grid-section">
        <div className="container">
          <section className="vendors-event-browser" aria-labelledby="vendor-roster-heading">
            <div className="vendors-event-browser-heading">
              <h2 id="vendor-roster-heading" className="sr-only">
                {selectedEvent?.title || (unassignedOnly ? 'Approved vendors' : 'Browse all vendors')}
              </h2>
              <div className="vendors-event-browser-actions">
                <details className="vendors-roster-menu">
                  <summary aria-label="Choose vendor directory">
                    <span>
                      <small>View directory</small>
                      <strong>{selectedEvent?.title || 'Approved vendors'}</strong>
                    </span>
                    <span aria-hidden="true">⌄</span>
                  </summary>
                  <nav
                    aria-label="Choose vendor directory"
                    data-lenis-prevent="true"
                    data-lenis-prevent-wheel="true"
                    data-lenis-prevent-touch="true"
                    tabIndex={0}
                  >
                    <VendorNavigationLink href="/vendors" closeMenu className={unassignedOnly ? 'is-active' : ''} aria-current={unassignedOnly ? 'page' : undefined}>
                      <span><strong>Approved vendors</strong><small>Current directory</small></span>
                      {unassignedOnly && <span aria-hidden="true">✓</span>}
                    </VendorNavigationLink>
                    {events.map((event) => (
                      <VendorNavigationLink
                        key={event.id}
                        href={`/vendors?event=${encodeURIComponent(event.id)}`}
                        closeMenu
                        className={selectedEventId === event.id ? 'is-active' : ''}
                        aria-current={selectedEventId === event.id ? 'page' : undefined}
                      >
                        <span>
                          <strong>{event.title}</strong>
                          <small>{new Date(`${event.event_date}T00:00:00`).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</small>
                        </span>
                        {selectedEventId === event.id && <span aria-hidden="true">✓</span>}
                      </VendorNavigationLink>
                    ))}
                    {events.length === 0 && <p>No upcoming events available.</p>}
                  </nav>
                </details>
              </div>
            </div>
          </section>

          {totalCount === 0 ? (
            <div className="vendors-empty-state">
              <div className="vendors-empty-icon">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h3 className="vendors-empty-title">No approved vendors yet</h3>
              <p className="vendors-empty-desc">
                {selectedEvent
                  ? `No vendors have been approved for ${selectedEvent.title} yet.`
                  : unassignedOnly
                    ? 'No approved vendors are currently waiting for an event assignment.'
                    : 'We are currently processing applications. Check back soon to see approved vendors.'}
              </p>
            </div>
          ) : (
            <>
              <div className="vendors-cards-grid" key={`${selectedEventId || 'approved'}-${safeCurrentPage}`}>
              {visibleVendors.map((vendor, index) => (
                <div
                  key={vendor.id}
                  className="vendor-card"
                  data-card-number={String(index + 1).padStart(2, '0')}
                >
                  <div className="vendor-card-logo">
                    <span className="vendor-card-logo-label">VENDOR</span>
                    <Image
                      src={vendor.logo_url || '/images/logo.png'}
                      alt={`${vendor.business_name} logo`}
                      fill
                      style={{ objectFit: 'contain', padding: '1rem' }}
                      sizes="(max-width: 768px) 100vw, 33vw"
                      priority={index === 0}
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

                    {vendor.event_applications && vendor.event_applications.length > 0 && (
                      <div className="vendor-card-events" aria-label="Approved events">
                        {vendor.event_applications.slice(0, 3).map((application) => (
                          <span key={application.id}>{application.event_name}</span>
                        ))}
                        {vendor.event_applications.length > 3 && <span>+{vendor.event_applications.length - 3} more</span>}
                      </div>
                    )}

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
                          <span className="vendor-card-social-arrow" aria-hidden="true">→</span>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

              {totalPages > 1 && (
                <nav className="vendors-pagination" aria-label="Vendor pages">
                <VendorNavigationLink
                  href={vendorPageHref(safeCurrentPage - 1)}
                  className="vendors-pagination-link vendors-pagination-arrow"
                  disabled={safeCurrentPage === 1}
                  scrollTarget="#vendor-directory"
                >
                  Previous
                </VendorNavigationLink>

                <div className="vendors-pagination-numbers">
                  {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
                    <VendorNavigationLink
                      key={pageNumber}
                      href={vendorPageHref(pageNumber)}
                      className={`vendors-pagination-link ${pageNumber === safeCurrentPage ? 'is-active' : ''}`}
                      aria-current={pageNumber === safeCurrentPage ? 'page' : undefined}
                      scrollTarget="#vendor-directory"
                    >
                      {pageNumber}
                    </VendorNavigationLink>
                  ))}
                </div>

                <VendorNavigationLink
                  href={vendorPageHref(safeCurrentPage + 1)}
                  className="vendors-pagination-link vendors-pagination-arrow"
                  disabled={safeCurrentPage === totalPages}
                  scrollTarget="#vendor-directory"
                >
                  Next
                </VendorNavigationLink>
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

import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getApprovedVendors } from '@/app/actions/vendors';

export const revalidate = 3600; // Cache for 1 hour to improve navigation speed

export const metadata: Metadata = {
  title: 'Our Vendors | Collector\'s Paradise',
  description: 'Explore the amazing vendors joining Collector\'s Paradise. Discover rare cards, vintage collectibles, and more from our approved sellers.',
};

export default async function VendorsPage() {
  const vendors = await getApprovedVendors();

  return (
    <main>
      <Navbar />
      <section className="events-page-section" style={{ minHeight: '100vh' }}>
        <div className="container">
          <div className="events-page-header">
            <span className="eyebrow-badge">VENDORS</span>
            <h1 className="section-title">OUR VENDORS</h1>
            <p className="section-subtitle">
              Check out the incredible sellers bringing the best trading cards, rare items, and pop culture collectibles to our events.
            </p>
          </div>

          {vendors.length === 0 ? (
            <div className="calendar-no-events" style={{ marginTop: '3rem' }}>
              <p>No vendors are currently listed. Check back soon as we approve new applications!</p>
            </div>
          ) : (
            <div className="vendor-list-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '2rem', marginTop: '3rem' }}>
              {vendors.map((vendor) => (
                <div key={vendor.id} className="calendar-event-card" style={{ display: 'flex', flexDirection: 'column' }}>
                  <h3 className="calendar-event-title" style={{ marginBottom: '0.5rem' }}>{vendor.business_name}</h3>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1rem' }}>
                    {(vendor.categories || []).map(cat => (
                      <span key={cat} className="event-status-badge event-status-active" style={{ marginBottom: 0 }}>{cat}</span>
                    ))}
                  </div>
                  {vendor.description && (
                    <p style={{ fontSize: '0.9rem', color: '#555', marginBottom: '1rem', flex: 1 }}>{vendor.description}</p>
                  )}
                  {vendor.booth_assignment && (
                    <div className="calendar-event-footer" style={{ marginTop: 'auto' }}>
                      <span className="calendar-event-venue" style={{ margin: 0 }}>
                        📍 Booth: <strong>{vendor.booth_assignment}</strong>
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
      <Footer />
    </main>
  );
}

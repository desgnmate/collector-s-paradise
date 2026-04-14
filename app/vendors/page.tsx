import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { getApprovedVendors } from '@/app/actions/vendors';

export const revalidate = 3600; // Cache for 1 hour to improve navigation speed

export const metadata: Metadata = {
  title: 'Our Vendors | Collector\'s Paradise',
  description: 'Explore the amazing vendors joining Collector\'s Paradise. Discover rare cards, vintage collectibles, and more from our approved sellers.',
};

export default async function VendorsPage() {
  const vendors = await getApprovedVendors();

  return (
    <main className="bg-cream">
      <Navbar />
      
      {/* Header Section */}
      <section style={{ paddingTop: '10rem', paddingBottom: '4rem', overflow: 'hidden' }}>
        <div className="container" style={{ position: 'relative' }}>
          {/* Decorative shapes */}
          <div style={{ position: 'absolute', top: '-5rem', right: '-5rem', width: '16rem', height: '16rem', backgroundColor: 'var(--color-yellow)', borderRadius: '50%', opacity: '0.1', filter: 'blur(3xl)', zIndex: '-1' }}></div>

          <div style={{ maxWidth: '64rem', margin: '0 auto', textAlign: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1rem', marginBottom: '1.5rem' }} data-aos="fade-up">
              <span className="eyebrow-badge">COMMUNITY</span>
              <div style={{ height: '2px', width: '3rem', backgroundColor: 'var(--color-dark)', opacity: '0.2' }}></div>
            </div>
            
            <h1 className="section-title mb-8" data-aos="fade-up" style={{ textAlign: 'center' }}>
              OUR <span className="text-stroke">VENDORS</span>
            </h1>
            
            <p className="section-subtitle mb-0" data-aos="fade-up" data-aos-delay="100" style={{ textAlign: 'center', margin: '0 auto' }}>
              Meet the elite collectors, rare card dealers, and vintage enthusiasts who make 
              Collector&apos;s Paradise the ultimate destination for the hobby.
            </p>
          </div>
        </div>
      </section>

      {/* Vendors Grid */}
      <section className="vendor-list-grid-section">
        <div className="container">
          {vendors.length === 0 ? (
            <div className="bg-white" style={{ border: '4px solid var(--color-dark)', borderRadius: '1.5rem', padding: '3rem', textAlign: 'center' }} data-aos="zoom-in">
              <div style={{ width: '6rem', height: '6rem', backgroundColor: 'var(--color-yellow)', border: '4px solid var(--color-dark)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem', transform: 'rotate(-12deg)' }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
              </div>
              <h3 className="font-baloo" style={{ fontSize: '1.5rem', fontWeight: '800', color: 'var(--color-dark)', marginBottom: '1rem', textTransform: 'uppercase' }}>No Vendors listed yet</h3>
              <p className="text-dark" style={{ opacity: '0.7', marginBottom: '2rem', maxWidth: '28rem', margin: '0 auto 2rem' }}>
                We are currently processing new applications. Check back soon or apply to become a vendor yourself!
              </p>
              <a href="#become-vendor" className="btn btn-yellow" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                APPLY TO SELL
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </a>
            </div>
          ) : (
            <div className="brutalist-grid brutalist-grid-2 brutalist-grid-3">
              {vendors.map((vendor, index) => (
                <div 
                  key={vendor.id} 
                  className="vendor-list-card" 
                  data-aos="fade-up" 
                  data-aos-delay={index * 50}
                >
                  <div className="vendor-list-image-wrapper" style={{ height: 'auto', aspectRatio: '16/9', overflow: 'hidden' }}>
                    <div className="vendor-list-image-inner" style={{ transition: 'transform 0.5s ease' }}>
                      <Image 
                        src={vendor.logo_url || "/images/placeholder.jpg"} 
                        alt={`${vendor.business_name} logo`} 
                        fill
                        className="object-contain"
                        style={{ padding: '1rem' }}
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      />
                    </div>
                  </div>
                  
                  <div className="vendor-list-content" style={{ padding: '2rem', flex: '1', display: 'flex', flexDirection: 'column', alignItems: 'start', gap: '1rem' }}>
                    <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'start', gap: '1rem' }}>
                      <h2 className="vendor-list-business-name" style={{ fontSize: '1.5rem', margin: '0', lineHeight: '1.2' }}>
                        {vendor.business_name}
                      </h2>
                      {vendor.booth_assignment && (
                        <div style={{ backgroundColor: 'var(--color-dark)', color: 'var(--color-yellow)', padding: '0.25rem 0.75rem', fontSize: '0.75rem', fontWeight: '900', borderRadius: '4px', textTransform: 'uppercase', transform: 'rotate(2deg)' }}>
                          #{vendor.booth_assignment}
                        </div>
                      )}
                    </div>

                    <div className="vendor-list-contact-name" style={{ fontWeight: '700', fontSize: '0.75rem', opacity: '0.5', letterSpacing: '0.1rem', color: 'var(--color-dark)', textTransform: 'uppercase', marginBottom: '0' }}>
                      COLLECTOR — {vendor.contact_name}
                    </div>
                    
                    {vendor.description && (
                      <p className="vendor-list-description" style={{ fontSize: '0.875rem', opacity: '0.8', marginBottom: '1rem' }}>
                        {vendor.description}
                      </p>
                    )}
                    
                    <div className="vendor-list-categories" style={{ marginTop: 'auto', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {(vendor.categories || []).map(cat => (
                        <span key={cat} className="vendor-list-category-badge" style={{ fontSize: '10px', padding: '0.25rem 0.5rem' }}>
                          {cat}
                        </span>
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
      <section id="become-vendor" className="bg-dark text-white" style={{ padding: '6rem 0', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '0', left: '0', width: '100%', height: '100%', opacity: '0.1', pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: '0', right: '0', width: '50%', height: '100%', backgroundColor: 'var(--color-yellow)', transform: 'skewX(12deg) translateX(50%)' }}></div>
        </div>
        
        <div className="container" style={{ position: 'relative', zIndex: '10' }}>
          <div style={{ maxWidth: '64rem', margin: '0 auto', textAlign: 'center' }}>
            <span className="eyebrow-badge bg-white" style={{ color: 'var(--color-dark)', marginBottom: '2rem', padding: '0.5rem 1rem', borderRadius: '4px' }}>JOIN US</span>
            <h2 className="section-title text-white mb-8" style={{ fontSize: '2.5rem' }}>
              WANT TO SELL AT OUR <span className="text-yellow" style={{ fontStyle: 'italic' }}>NEXT EVENT?</span>
            </h2>
            <p style={{ fontSize: '1.125rem', opacity: '0.8', marginBottom: '3rem', maxWidth: '42rem', margin: '0 auto 3rem' }}>
              Join the growing network of vendors at Collector&apos;s Paradise. 
              Gain access to thousands of motivated buyers and showcase your collection.
            </p>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
              <a href="/vendors/apply" className="btn-white">
                APPLY AS VENDOR
              </a>
              <a href="/contact" style={{ color: 'var(--color-white)', borderBottom: '2px solid rgba(255,255,255,0.2)', paddingBottom: '0.25rem', fontWeight: '700', transition: 'all 0.3s ease' }}>
                LEARN MORE ABOUT BOOTHS
              </a>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}



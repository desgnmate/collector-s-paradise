import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import VendorApplicationForm from '@/components/VendorApplicationForm';

export const metadata: Metadata = {
  title: 'Apply as Vendor',
  description:
    'Join Collector\'s Paradise as a vendor. Apply to showcase your trading cards, collectibles, and merchandise at Melbourne\'s top collector events.',
  openGraph: {
    title: "Apply as Vendor | Collector's Paradise",
    description: "Apply to showcase your trading cards and collectibles at Melbourne's top collector events.",
  },
  alternates: {
    canonical: 'https://collectorsparadise.com.au/vendors/apply',
  },
};

export default function VendorApplyPage() {
  return (
    <main>
      <Navbar />
      <section className="vendor-apply-section">
        <div className="container">
          <div className="vendor-apply-header">
            <span className="eyebrow-badge">VENDOR REGISTRATION</span>
            <h1 className="section-title">JOIN AS A VENDOR</h1>
            <p className="section-subtitle">
              Ready to showcase your collection? Apply to become a vendor at our events
              and connect with hundreds of passionate collectors.
            </p>
          </div>

          <div className="vendor-apply-layout">
            {/* Form */}
            <div className="vendor-apply-form-wrapper">
              <VendorApplicationForm />
            </div>


          </div>
        </div>
      </section>
    </main>
  );
}

import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import VendorApplicationForm from '@/components/VendorApplicationForm';

export const metadata: Metadata = {
  title: 'Apply as Vendor | Sell at Pokémon TCG Events in Melbourne',
  description:
    "Apply to become a vendor at Collector's Paradise Melbourne. Sell trading cards, Pokémon TCG, Yu-Gi-Oh!, One Piece, sports cards, graded cards, and collectibles to Australia's largest collector audience.",
  keywords: [
    'vendor application Melbourne',
    'sell trading cards Australia',
    'Pokemon TCG vendor',
    'card show vendor application',
    'trading card booth rental Melbourne',
  ],
  openGraph: {
    title: "Apply as Vendor | Collector's Paradise Melbourne",
    description:
      "Sell your trading cards and collectibles at Melbourne's biggest Pokémon TCG and trading card events.",
  },
  alternates: {
    canonical: 'https://collectorsparadise.au/vendors/apply',
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

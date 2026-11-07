import type { Metadata } from 'next';
import Link from 'next/link';
import { DEFAULT_OG_IMAGE, OPEN_GRAPH_DEFAULTS } from '@/lib/seo/metadata';
import Navbar from '@/components/Navbar';
export const metadata: Metadata = {
  title: "Page Not Found | Collector's Paradise",
  description: "This page could not be found. Browse upcoming Collector's Paradise trading card events across Australia.",
  robots: { index: false, follow: true },
  openGraph: {
    ...OPEN_GRAPH_DEFAULTS,
    title: "Page Not Found | Collector's Paradise",
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function NotFound() {
  return (
    <main>
      <Navbar />
      <section className="not-found-section">
        <div className="container">
          <div className="not-found-content">
            <span className="not-found-code">404</span>
            <h1 className="not-found-title">PAGE NOT FOUND</h1>
            <p className="not-found-desc">
              Looks like this page got lost in the shuffle. Don&apos;t worry — there are plenty of cards left to discover.
            </p>
            <div className="not-found-actions">
              <Link href="/" className="btn btn-yellow">
                Back to Home
              </Link>
              <Link href="/events" className="btn btn-hero-ticket">
                Browse Events
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

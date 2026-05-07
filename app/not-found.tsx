import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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
      <Footer />
    </main>
  );
}

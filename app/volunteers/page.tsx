import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Volunteers',
  description: 'Join the Collector\'s Paradise volunteer team! Help run Melbourne\'s premier Pokémon TCG events, meet fellow collectors, and be part of the community.',
  openGraph: {
    title: "Volunteers | Collector's Paradise",
    description: "Join the Collector's Paradise volunteer team and be part of Melbourne's premier Pokémon TCG events.",
  },
  alternates: {
    canonical: 'https://collectorsparadise.com.au/volunteers',
  },
};

export default function VolunteersPage() {
  return (
    <main>
      <Navbar />

      {/* Page Header */}
      <section className="vendors-page-header-section">
        <div className="container">
          <div className="vendors-page-header">
            <span className="eyebrow-badge">JOIN THE TEAM</span>
            <h1 className="section-title">
              VOLUNTEERS
            </h1>
            <p className="section-subtitle">
              Be part of the action! Join our volunteer team and help make Collector&apos;s Paradise
              events unforgettable. Meet fellow collectors and contribute to the community.
            </p>
          </div>
        </div>
      </section>

      {/* Volunteer Roles */}
      <section className="vendors-grid-section">
        <div className="container">
          <div className="volunteer-roles-grid">
            {/* Event Setup */}
            <div className="volunteer-role-card">
              <div className="role-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a4 4 0 0 1 4-4v0a4 4 0 0 1 4 4v9"/>
                </svg>
              </div>
              <h3 className="role-title">Event Setup Crew</h3>
              <p className="role-description">
                Help set up tables, chairs, signage, and decorations before the event starts.
                Early birds welcome!
              </p>
              <span className="role-time">Shift: 7:00 AM - 10:00 AM</span>
            </div>

            {/* Registration Desk */}
            <div className="volunteer-role-card">
              <div className="role-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                </svg>
              </div>
              <h3 className="role-title">Registration Desk</h3>
              <p className="role-description">
                Greet attendees, check tickets, hand out event materials, and answer questions.
              </p>
              <span className="role-time">Shift: 9:00 AM - 1:00 PM or 1:00 PM - 5:00 PM</span>
            </div>

            {/* Floor Guides */}
            <div className="volunteer-role-card">
              <div className="role-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/><path d="M12 16v-4M12 8h.01"/>
                </svg>
              </div>
              <h3 className="role-title">Floor Guides</h3>
              <p className="role-description">
                Roam the event floor, assist attendees with directions, and ensure smooth flow
                throughout the venue.
              </p>
              <span className="role-time">Shift: 10:00 AM - 2:00 PM or 2:00 PM - 6:00 PM</span>
            </div>

            {/* Breakdown Crew */}
            <div className="volunteer-role-card">
              <div className="role-icon">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/>
                </svg>
              </div>
              <h3 className="role-title">Breakdown Crew</h3>
              <p className="role-description">
                Help pack up after the event, clean the venue, and ensure everything is returned
                to order.
              </p>
              <span className="role-time">Shift: 6:00 PM - 8:00 PM</span>
            </div>
          </div>
        </div>
      </section>

      {/* Apply CTA */}
      <section className="vendors-cta-section">
        <div className="container">
          <div className="vendors-cta-inner">
            <div className="vendors-cta-text">
              <div className="vendors-cta-badge">
                <span>JOIN US</span>
              </div>
              <h2 className="vendors-cta-title">
                READY TO VOLUNTEER?
              </h2>
              <p className="vendors-cta-subtitle">
                Fill out the form below and we&apos;ll get in touch with available shifts and details.
                No experience needed — just bring your enthusiasm!
              </p>
            </div>
            <div className="vendors-cta-actions">
              <Link href="/volunteers/apply" className="vendors-cta-btn-primary">
                Sign Up to Volunteer
              </Link>
              <Link href="/events" className="vendors-cta-btn-secondary">
                View Upcoming Events
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}

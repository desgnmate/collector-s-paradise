import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Volunteer at Melbourne Pokémon TCG Events | Collector's Paradise",
  description:
    "Volunteer at Collector's Paradise trading card events in Melbourne. Help run Pokémon TCG, Yu-Gi-Oh!, and One Piece events, meet the community, and gain event experience.",
  keywords: [
    'volunteer Melbourne events',
    'event volunteer Victoria',
    'Pokemon TCG volunteer Australia',
    'community events Melbourne',
  ],
  openGraph: {
    title: "Volunteer With Us | Collector's Paradise Melbourne",
    description:
      "Help run Melbourne's biggest trading card events. Volunteer roles include setup, registration, floor guides, and breakdown.",
    url: 'https://collectorsparadise.au/volunteers',
  },
  alternates: {
    canonical: 'https://collectorsparadise.au/volunteers',
  },
};

const roles = [
  {
    title: 'Event Setup Crew',
    description:
      'Help set up tables, chairs, signage, and decorations before doors open. Perfect if you like being early and hands-on.',
    time: 'Shift: 7:00 AM – 10:00 AM',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 21h18M5 21V7l8-4 8 4v14M8 21v-9a4 4 0 0 1 4-4v0a4 4 0 0 1 4 4v9" />
      </svg>
    ),
  },
  {
    title: 'Registration Desk',
    description:
      'Greet attendees, check tickets, hand out materials, and answer questions with a friendly smile.',
    time: 'Shift: 9:00 AM – 1:00 PM or 1:00 PM – 5:00 PM',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </svg>
    ),
  },
  {
    title: 'Floor Guides',
    description:
      'Roam the event floor, help with directions, and keep the vibe smooth for vendors and collectors.',
    time: 'Shift: 10:00 AM – 2:00 PM or 2:00 PM – 6:00 PM',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 16v-4M12 8h.01" />
      </svg>
    ),
  },
  {
    title: 'Breakdown Crew',
    description:
      'Help pack up after the event, reset the venue, and wrap the day with the team.',
    time: 'Shift: 6:00 PM – 8:00 PM',
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
        <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
        <line x1="12" y1="22.08" x2="12" y2="12" />
      </svg>
    ),
  },
];

const perks = [
  'Event entry for your shift day',
  'Meet collectors, vendors, and organisers',
  'Behind-the-scenes event experience',
  'No prior experience required',
  'Flexible shift options',
  "Be part of Melbourne's TCG community",
];

export default function VolunteersPage() {
  return (
    <main className="brand-page">
      <Navbar />

      <section className="vendors-page-header-section">
        <div className="container">
          <div className="vendors-page-header">
            <span className="eyebrow-badge">JOIN THE TEAM</span>
            <h1 className="section-title">Volunteers</h1>
            <p className="section-subtitle">
              Be part of the action. Join our volunteer crew and help make Collector&apos;s Paradise
              events unforgettable — while meeting fellow collectors and giving back to the community.
            </p>
          </div>
        </div>
      </section>

      <section className="brand-page-section">
        <div className="container">
          <div className="volunteer-roles-grid">
            {roles.map((role) => (
              <article key={role.title} className="volunteer-role-card">
                <div className="role-icon">{role.icon}</div>
                <h3 className="role-title">{role.title}</h3>
                <p className="role-description">{role.description}</p>
                <span className="role-time">{role.time}</span>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="brand-page-section brand-page-section--muted">
        <div className="container">
          <div className="volunteer-perks-panel">
            <div className="volunteer-perks-copy">
              <span className="eyebrow-badge">PERKS</span>
              <h2 className="section-title brand-section-title">Why volunteer with us?</h2>
              <p className="section-subtitle brand-section-subtitle brand-section-subtitle--left">
                Bring enthusiasm — we&apos;ll handle the rest. Volunteers are the backbone of every
                great show day.
              </p>
            </div>
            <ul className="volunteer-perks-list">
              {perks.map((perk) => (
                <li key={perk}>{perk}</li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="vendors-cta-section">
        <div className="container">
          <div className="vendors-cta-inner">
            <div className="vendors-cta-text">
              <div className="vendors-cta-badge">
                <span>SIGN UP</span>
              </div>
              <h2 className="vendors-cta-title">Ready to volunteer?</h2>
              <p className="vendors-cta-subtitle">
                Fill out a short form and we&apos;ll follow up with available shifts and details.
                No experience needed — just bring your energy.
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

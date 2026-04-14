import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getEventById } from '@/app/actions/events';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
export const revalidate = 3600; // Cache for 1 hour

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    return { title: "Event Not Found | Collector's Paradise" };
  }

  return {
    title: `${event.title} | Collector's Paradise`,
    description: event.description || `Join us for ${event.title} at ${event.venue}.`,
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    notFound();
  }

  const spotsLeft = event.capacity - event.tickets_sold;
  const isSoldOut = spotsLeft <= 0;

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const formattedDate = new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main>
      <Navbar />
      <section className="event-detail-section">
        <div className="container">
          {/* Back Link */}
          <Link href="/events" className="event-back-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            Back to Events
          </Link>

          <div className="event-detail-grid">
            {/* Main Content */}
            <div className="event-detail-main">
              <span className={`event-status-badge event-status-${event.status}`}>
                {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
              </span>

              <h1 className="event-detail-title">{event.title}</h1>

              {event.description && (
                <p className="event-detail-description">{event.description}</p>
              )}

              {/* Event Info Cards */}
              <div className="event-info-cards">
                <div className="event-info-card">
                  <div className="event-info-icon">📅</div>
                  <div>
                    <div className="event-info-label">Date</div>
                    <div className="event-info-value">{formattedDate}</div>
                  </div>
                </div>
                <div className="event-info-card">
                  <div className="event-info-icon">🕐</div>
                  <div>
                    <div className="event-info-label">Time</div>
                    <div className="event-info-value">
                      {formatTime(event.start_time)} — {formatTime(event.end_time)}
                    </div>
                  </div>
                </div>
                {event.venue && (
                  <div className="event-info-card">
                    <div className="event-info-icon">📍</div>
                    <div>
                      <div className="event-info-label">Venue</div>
                      <div className="event-info-value">{event.venue}</div>
                      {event.venue_address && (
                        <div className="event-info-address">{event.venue_address}</div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Vendor Map Link (Phase 4) */}
              <Link href={`/events/${event.id}/map`} className="event-map-link">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6" />
                  <line x1="8" y1="2" x2="8" y2="18" />
                  <line x1="16" y1="6" x2="16" y2="22" />
                </svg>
                View Vendor Map
              </Link>
            </div>

            {/* Ticket Sidebar */}
            <div className="event-ticket-sidebar">
              <div className="ticket-card">
                <h3 className="ticket-card-title">Get Your Tickets</h3>

                <div className="ticket-price-row">
                  <span className="ticket-price-label">General Admission</span>
                  <span className="ticket-price-amount">
                    {event.ticket_price > 0
                      ? `$${event.ticket_price.toFixed(2)}`
                      : 'Free'}
                  </span>
                </div>

                <div className="ticket-availability">
                  {isSoldOut ? (
                    <span className="ticket-sold-out">Sold Out</span>
                  ) : (
                    <span className="ticket-spots-left">
                      {spotsLeft} of {event.capacity} spots left
                    </span>
                  )}
                  <div className="ticket-progress-bar">
                    <div
                      className="ticket-progress-fill"
                      style={{ width: `${(event.tickets_sold / event.capacity) * 100}%` }}
                    />
                  </div>
                </div>

                {/* Checkout button — Phase 2 will wire this to the booking flow */}
                <button
                  className="btn btn-yellow ticket-buy-btn"
                  disabled={isSoldOut}
                >
                  {isSoldOut ? 'Sold Out' : 'Buy Tickets'}
                </button>

                <p className="ticket-secure-note">
                  🔒 Secure checkout powered by Square
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

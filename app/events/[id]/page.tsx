import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getEventById } from '@/app/actions/events';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import EventDetailClient from './EventDetailClient';
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

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const formattedDateShort = new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).toUpperCase();

  const isSoldOut = (event.capacity - event.tickets_sold) <= 0;

  return (
    <main>
      <Navbar />

      {/* ── Hero Banner ── */}
      <section className="ed-hero">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="ed-hero-video"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 10%',
            zIndex: 1
          }}
        >
          <source src="/videos/cp-bg.mp4" type="video/mp4" />
        </video>
        <div className="ed-hero-overlay" />
        <div className="ed-hero-content container">
          <h1 className="ed-hero-title">{event.title}</h1>
          {event.description && (
            <p className="ed-hero-subtitle">{event.description}</p>
          )}
        </div>
      </section>

      {/* ── Dark Info + Ticket Section ── */}
      <section className="ed-info-section">
        <div className="container">
          <div className="ed-info-inner">
            {/* Left: Event Details */}
            <div className="ed-details">
              <div className="ed-detail-block">
                <span className="ed-detail-label">Venue</span>
                <h3 className="ed-detail-value">{event.venue?.toUpperCase() || 'TBA'}</h3>
                {event.venue_address && (
                  <p className="ed-detail-address">{event.venue_address.toUpperCase()}</p>
                )}
              </div>

              <div className="ed-detail-row">
                <div className="ed-detail-block">
                  <span className="ed-detail-label">Date</span>
                  <h3 className="ed-detail-value ed-detail-value--sm">{formattedDateShort}</h3>
                </div>
                <div className="ed-detail-block">
                  <span className="ed-detail-label">Time</span>
                  <h3 className="ed-detail-value ed-detail-value--sm">
                    {formatTime(event.start_time)} — {formatTime(event.end_time)}
                  </h3>
                </div>
              </div>
            </div>

            {/* Right: Ticket Card */}
            <div className="ed-ticket-card">
              <div className="ed-ticket-row">
                <span className="ed-ticket-type">General Admission</span>
                <span className="ed-ticket-price">
                  {event.ticket_price > 0 ? `$${event.ticket_price.toFixed(2)}` : 'Free'}
                </span>
              </div>
              <button
                className="ed-ticket-btn"
                disabled={isSoldOut}
              >
                {isSoldOut ? 'Sold Out' : 'Book Your Ticket'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Map Section ── */}
      <EventDetailClient />

      <Footer />
    </main>
  );
}

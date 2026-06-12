import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventCard from '@/components/events/EventCard';
import { EventSchema } from '@/components/StructuredData';

import { getEventById, getEvents } from '@/app/actions/events';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
export const revalidate = 3600;

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    return { title: "Event Not Found | Collector's Paradise" };
  }

  const dateStr = new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return {
    title: `${event.title} — ${dateStr} | Melbourne Trading Card Event`,
    description:
      event.description ||
      `Join ${event.title} on ${dateStr} at ${event.venue}, Melbourne. Buy tickets, meet vendors, trade Pokémon TCG, Yu-Gi-Oh!, One Piece and more.`,
    keywords: [
      event.title,
      `${event.title} Melbourne`,
      'Pokemon TCG event Melbourne',
      'trading card event Australia',
      `${event.venue} event`,
    ],
    openGraph: {
      title: `${event.title} | Collector's Paradise Melbourne`,
      description:
        event.description ||
        `${event.title} — ${dateStr} at ${event.venue}, Melbourne. Buy tickets now.`,
      type: 'website',
      locale: 'en_AU',
      ...(event.cover_image_url && !event.cover_image_url.startsWith('data:') ? {
        images: [{ url: event.cover_image_url, width: 1200, height: 630, alt: event.title }],
      } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${event.title} — ${dateStr}`,
      description: event.description || `Trading card event in Melbourne on ${dateStr}.`,
      ...(event.cover_image_url && !event.cover_image_url.startsWith('data:') ? {
        images: [event.cover_image_url],
      } : {}),
    },
    alternates: {
      canonical: `https://collectorsparadise.com.au/events/${id}`,
    },
    other: {
      'geo.region': 'AU-VIC',
      'geo.placename': event.venue || 'Melbourne',
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(id);
  const allEvents = await getEvents();
  const otherEvents = allEvents.filter((e) => e.id !== id).slice(0, 3);

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

  const formattedDate = new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const dateObj = new Date(event.event_date + 'T00:00:00');
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-AU', { month: 'short' }).toUpperCase();
  const weekday = dateObj.toLocaleDateString('en-AU', { weekday: 'short' }).toUpperCase();

  const isSoldOut = (event.capacity - event.tickets_sold) <= 0;
  const ticketsRemaining = event.capacity - event.tickets_sold;

  return (
    <main>
      <Navbar />

      <EventSchema
        name={event.title}
        description={event.description || `${event.title} — trading card event in Melbourne, Australia.`}
        startDate={`${event.event_date}T${event.start_time || '09:00'}:00`}
        endDate={`${event.event_date}T${event.end_time || '17:00'}:00`}
        venue={event.venue || 'Melbourne'}
        venueAddress={event.venue_address || undefined}
        ticketPrice={event.ticket_price ?? undefined}
        ticketUrl={`https://collectorsparadise.com.au/events/${event.id}`}
        imageUrl={event.cover_image_url || undefined}
        status={(event.status as 'upcoming' | 'completed' | 'cancelled') || 'upcoming'}
      />

      <section className="edp-main">
        <div className="container">
          <div className="edp-layout">
            <div className="edp-content">
              <div className="edp-cover">
                <Image
                  src={event.cover_image_url || '/images/placeholder-event.png'}
                  alt={event.title}
                  width={800}
                  height={450}
                  priority
                  style={{ objectFit: 'cover' }}
                />
                <div className="edp-date-badge">
                  <span className="edp-date-month">{month}</span>
                  <span className="edp-date-day">{day}</span>
                  <span className="edp-date-weekday">{weekday}</span>
                </div>
              </div>

              <div className="edp-details">
                <h1 className="edp-title">{event.title}</h1>
                
                {event.description && (
                  <p className="edp-description">{event.description}</p>
                )}

                <div className="edp-info-cards">
                  <div className="edp-info-card">
                    <div className="edp-info-card-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div className="edp-info-card-content">
                      <span className="edp-info-card-label">Date & Time</span>
                      <span className="edp-info-card-value">{formattedDate}</span>
                      <span className="edp-info-card-sub">
                        {formatTime(event.start_time)} — {formatTime(event.end_time)}
                      </span>
                    </div>
                  </div>

                  <div className="edp-info-card">
                    <div className="edp-info-card-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                    <div className="edp-info-card-content">
                      <span className="edp-info-card-label">Venue</span>
                      <span className="edp-info-card-value">{event.venue || 'TBA'}</span>
                      {event.venue_address && (
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue_address)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="edp-info-card-link"
                        >
                          Get Directions
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <aside className="edp-sidebar">
              <div className="edp-booking-card">
                <div className="edp-booking-header">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 0 0-2 2v3a2 2 0 0 1 0 4v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3a2 2 0 0 1 0-4V7a2 2 0 0 0-2-2H5z"/>
                  </svg>
                  <span>General Admission</span>
                </div>

                <div className="edp-booking-price">
                  {event.ticket_price > 0 ? `$${event.ticket_price.toFixed(2)}` : ''}
                  {event.ticket_price > 0 && <span className="edp-booking-price-unit">/ ticket</span>}
                </div>

                {!isSoldOut && ticketsRemaining > 0 && ticketsRemaining <= 20 && (
                  <div className="edp-booking-urgency">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"/>
                      <polyline points="12 6 12 12 16 14"/>
                    </svg>
                    Only {ticketsRemaining} tickets left!
                  </div>
                )}

                {event.booking_link ? (
                  <a
                    href={event.booking_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="edp-booking-btn"
                  >
                    Get Tickets
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="5" y1="12" x2="19" y2="12" />
                      <polyline points="12 5 19 12 12 19" />
                    </svg>
                  </a>
                ) : (
                  <button
                    className="edp-booking-btn edp-booking-btn-disabled"
                    disabled
                  >
                    Tickets Coming Soon
                  </button>
                )}

              </div>

            </aside>
          </div>
        </div>
      </section>

      {otherEvents.length > 0 && (
        <section className="browse-other-events">
          <div className="container">
            <h2 className="browse-other-events-title">Browse Other Events</h2>
            <div className="browse-other-events-grid">
              {otherEvents.map((otherEvent) => (
                <EventCard key={otherEvent.id} event={otherEvent} variant="upcoming" />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}

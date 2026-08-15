import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventsPageClient from '@/components/events/EventsPageClient';
import { getEvents } from '@/app/actions/events';
import { EventSchema } from '@/components/StructuredData';
import type { Metadata } from 'next';
import { getEventMarketDate } from '@/lib/event-date';
import { getEventSchemaDates, parseAustralianEventAddress } from '@/lib/event-location';
import { absoluteUrl } from '@/lib/site';
export const revalidate = 3600; // Cache for 1 hour to improve navigation speed

export const metadata: Metadata = {
  title: "Pokémon TCG & Trading Card Events in Australia | Collector's Paradise",
  description:
    "Australia’s Pokémon TCG, Yu-Gi-Oh!, One Piece and sports card events. Buy tickets, meet vendors, and connect with collectors.",
  keywords: [
    'Pokemon events Melbourne',
    'trading card events Australia',
    'TCG tournament Melbourne',
    'card show Melbourne 2026',
    'upcoming Pokemon events Victoria',
    'past Pokemon events Australia',
  ],
  openGraph: {
    title: "Australian Trading Card Events | Collector's Paradise",
    description:
      "Upcoming and past Pokémon TCG, Yu-Gi-Oh!, One Piece, and sports card events across Australia. Buy tickets and meet vendors.",
    url: absoluteUrl('/events'),
  },
  alternates: {
    canonical: absoluteUrl('/events'),
  },
};

export default async function EventsPage() {
  const events = await getEvents();
  // Local AU date for "today" so a 7 June event in Melbourne doesn't
  // get classified as past because UTC has already rolled forward.
  const now = getEventMarketDate();
  // Upcoming = event is today/future AND not cancelled. Past date wins
  // over the DB status — same logic used in EventCard.
  const upcomingEvents = events.filter(
    (e) => e.event_date >= now && e.status !== 'cancelled' && e.status !== 'completed'
  );
  const pastEvents = events.filter(
    (e) => e.event_date < now || e.status === 'completed'
  );

  return (
    <main>
      <Navbar />
      {/* Structured data for each event — invisible to users, consumed by search engines */}
      {/* Structured data for each upcoming event — consumed by search engines */}
      {upcomingEvents.map(event => {
          const address = parseAustralianEventAddress(event.venue_address);
          const eventUrl = absoluteUrl(`/events/${event.id}`);
          const schemaDates = getEventSchemaDates(event.event_date, event.start_time, event.end_time);
          return (
            <EventSchema
              key={event.id}
              name={event.title}
              description={event.description || ''}
              startDate={schemaDates.startDate}
              endDate={schemaDates.endDate}
              venue={event.venue || 'Event Venue'}
              venueAddress={address.streetAddress}
              addressLocality={address.locality}
              addressRegion={address.region}
              postalCode={address.postcode}
              ticketPrice={event.ticket_price ?? undefined}
              ticketUrl={event.booking_link || undefined}
              offerValidFrom={event.created_at}
              eventUrl={eventUrl}
              imageUrl={event.cover_image_url || undefined}
              status={event.status}
              isSoldOut={event.capacity > 0 && event.tickets_sold >= event.capacity}
            />
          );
        })}
      <EventsPageClient upcomingEvents={upcomingEvents} pastEvents={pastEvents} />
      <Footer />
    </main>
  );
}

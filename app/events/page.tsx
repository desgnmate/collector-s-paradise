import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventsPageClient from '@/components/events/EventsPageClient';
import { getEvents } from '@/app/actions/events';
import { EventSchema } from '@/components/StructuredData';
import type { Metadata } from 'next';
export const revalidate = 3600; // Cache for 1 hour to improve navigation speed

export const metadata: Metadata = {
  title: "Pokémon TCG & Trading Card Events in Melbourne | Upcoming & Past",
  description:
    "Browse upcoming and past Pokémon TCG, Yu-Gi-Oh!, One Piece, Magic: The Gathering, and sports card events in Melbourne, Australia. Buy tickets, meet vendors, and join Australia's largest collector community.",
  keywords: [
    'Pokemon events Melbourne',
    'trading card events Australia',
    'TCG tournament Melbourne',
    'card show Melbourne 2026',
    'upcoming Pokemon events Victoria',
    'past Pokemon events Australia',
  ],
  openGraph: {
    title: "Melbourne Trading Card Events | Collector's Paradise",
    description:
      "Upcoming and past Pokémon TCG, Yu-Gi-Oh!, One Piece, and sports card events in Melbourne. Buy tickets, meet vendors.",
  },
  alternates: {
    canonical: 'https://collectorsparadise.com.au/events',
  },
};

export default async function EventsPage() {
  const events = await getEvents();
  // Local AU date for "today" so a 7 June event in Melbourne doesn't
  // get classified as past because UTC has already rolled forward.
  const today = new Date();
  const now = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
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
      {events
        .filter((e) => e.event_date >= now && e.status !== 'cancelled' && e.status !== 'completed')
        .map(event => (
          <EventSchema
            key={event.id}
            name={event.title}
            description={event.description || ''}
            startDate={`${event.event_date}T${event.start_time || '09:00'}:00`}
            endDate={`${event.event_date}T${event.end_time || '17:00'}:00`}
            venue={event.venue || 'Melbourne'}
            venueAddress={event.venue_address || undefined}
            ticketPrice={event.ticket_price ?? undefined}
            imageUrl={event.cover_image_url || undefined}
            status={event.status as 'upcoming' | 'completed'}
          />
        ))}
      <EventsPageClient upcomingEvents={upcomingEvents} pastEvents={pastEvents} />
      <Footer />
    </main>
  );
}

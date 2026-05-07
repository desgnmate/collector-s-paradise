import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventsPageClient from '@/components/events/EventsPageClient';
import { getEvents } from '@/app/actions/events';
import { EventSchema } from '@/components/StructuredData';
import type { Metadata } from 'next';
export const revalidate = 3600; // Cache for 1 hour to improve navigation speed

export const metadata: Metadata = {
  title: "Events",
  description: 'Browse upcoming Pokémon TCG events in Melbourne. Buy tickets, meet vendors, and join the collector community.',
  openGraph: {
    title: "Events | Collector's Paradise",
    description: 'Browse upcoming Pokémon TCG events in Melbourne. Buy tickets and join the community.',
  },
  alternates: {
    canonical: 'https://collectorsparadise.com.au/events',
  },
};

export default async function EventsPage() {
  const events = await getEvents();
  const now = new Date().toISOString().split('T')[0];
  const upcomingEvents = events.filter(e => e.event_date >= now && e.status === 'upcoming');
  const pastEvents = events.filter(e => e.event_date < now || e.status === 'completed');

  return (
    <main>
      <Navbar />
      {/* Structured data for each event — invisible to users, consumed by search engines */}
      {events
        .filter(e => e.status === 'upcoming')
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

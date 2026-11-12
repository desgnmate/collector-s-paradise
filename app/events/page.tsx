import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventsPageClient from '@/components/events/EventsPageClient';
import { getEvents } from '@/app/actions/events';
import { serializeJsonLd } from '@/lib/seo/jsonld';
import type { Metadata } from 'next';
import { OPEN_GRAPH_DEFAULTS } from '@/lib/seo/metadata';
import { getEventMarketDate } from '@/lib/event-date';
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
    ...OPEN_GRAPH_DEFAULTS,
    title: "Australian Trading Card Events | Collector's Paradise",
    description:
      "Upcoming and past Pokémon TCG, Yu-Gi-Oh!, One Piece, and sports card events across Australia. Buy tickets and meet vendors.",
    url: absoluteUrl('/events'),
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: "Collector's Paradise Australian trading card events",
    }],
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
      {/* Full Event markup belongs on the linked, single-event pages. */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd({
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        name: 'Upcoming trading card events in Australia',
        url: absoluteUrl('/events'),
        mainEntity: {
          '@type': 'ItemList',
          itemListElement: upcomingEvents.map((event, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: event.title,
            url: absoluteUrl(`/events/${event.id}`),
          })),
        },
      }) }} />
      <EventsPageClient upcomingEvents={upcomingEvents} pastEvents={pastEvents} />
      <Footer />
    </main>
  );
}

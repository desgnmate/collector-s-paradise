import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventCalendar from '@/components/EventCalendar';
import { getEvents } from '@/app/actions/events';
import type { Metadata } from 'next';
export const revalidate = 3600; // Cache for 1 hour to improve navigation speed

export const metadata: Metadata = {
  title: "Events | Collector's Paradise",
  description: 'Browse upcoming Pokémon TCG events in Melbourne. Buy tickets, meet vendors, and join the collector community.',
};

export default async function EventsPage() {
  const events = await getEvents();

  return (
    <main>
      <Navbar />
      <section className="events-page-section">
        <div className="container">
          <div className="events-page-header">
            <span className="eyebrow-badge">UPCOMING EVENTS</span>
            <h1 className="section-title">EVENT CALENDAR</h1>
            <p className="section-subtitle">
              Browse our upcoming Pokémon TCG events. Click on a highlighted date to see event details and grab your tickets.
            </p>
          </div>

          <EventCalendar events={events} />
        </div>
      </section>
      <Footer />
    </main>
  );
}

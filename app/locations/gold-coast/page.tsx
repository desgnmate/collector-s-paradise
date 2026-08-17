import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import EditorialPageHero from '@/components/EditorialPageHero';
import ResourcePageNav from '@/components/ResourcePageNav';
import { getEvents } from '@/app/actions/events';
import { absoluteUrl } from '@/lib/site';
import { serializeJsonLd } from '@/lib/seo/jsonld';
import LocationEventCard, { NoLocationEvents } from '../LocationEventCard';
import { getLocationEvents } from '../location-data';
import styles from '../locations.module.css';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Gold Coast Trading Card Shows | Collector's Paradise",
  description:
    "Find Collector's Paradise trading card and collectibles shows on the Gold Coast. Check upcoming Nerang and Gold Coast dates, venues, and tickets.",
  alternates: { canonical: absoluteUrl('/locations/gold-coast') },
  openGraph: {
    title: "Gold Coast Trading Card Shows | Collector's Paradise",
    description: 'Upcoming Pokémon TCG, sports card, and collectibles events on the Gold Coast.',
    url: absoluteUrl('/locations/gold-coast'),
    images: [{ url: '/images/event-experience.jpg', alt: "Collector's Paradise show experience" }],
  },
};

export default async function GoldCoastLocationPage() {
  const events = getLocationEvents(await getEvents(), 'gold-coast');
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: "Collector's Paradise Gold Coast trading card shows",
    description: metadata.description,
    url: absoluteUrl('/locations/gold-coast'),
    about: {
      '@type': 'Place',
      name: 'Gold Coast, Queensland',
      address: { '@type': 'PostalAddress', addressLocality: 'Gold Coast', addressRegion: 'QLD', addressCountry: 'AU' },
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: events.map((event, index) => ({
        '@type': 'ListItem', position: index + 1, name: event.title, url: absoluteUrl(`/events/${event.id}`),
      })),
    },
  };

  return (
    <main className={`${styles.page} ${styles.gold}`}>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageSchema) }} />

      <EditorialPageHero
        title="Gold Coast collector days"
        description="Big hobby energy, one room, and plenty to discover. Find upcoming Gold Coast-area events, then open the show page for the final venue, entry, and booking information."
      />

      <ResourcePageNav items={[
        { href: '#gold-coast-events', label: 'Upcoming shows' },
        { href: '#coast-plan', label: 'Plan the day' },
        { href: '#first-show-guide', label: 'First-show guide' },
      ]} />

      <section id="gold-coast-events" className={styles.goldEvents} aria-labelledby="gold-events-title">
        <div className={styles.shell}>
          <div className={styles.sectionHeader}>
            <div><p className={styles.kicker}>Gold Coast lineup</p><h2 id="gold-events-title">Choose your show</h2></div>
            <p>Event pages are the source of truth for dates, venue addresses, opening times, availability, and external ticket checkout.</p>
          </div>
          <div className={styles.eventGrid}>
            {events.length ? events.map((event) => <LocationEventCard key={event.id} event={event} />) : <NoLocationEvents city="Gold Coast" />}
          </div>
        </div>
      </section>

      <section id="coast-plan" className={styles.goldPlan} aria-labelledby="coast-plan-title">
        <div className={styles.shell}>
          <div className={styles.goldPlanHeader}>
            <h2 id="coast-plan-title">Pack light. Plan smart.</h2>
            <p>Venue arrangements differ from show to show. Use the live event listing for confirmed details, then prepare your collection and questions before you arrive.</p>
          </div>
          <div className={styles.goldChecklist}>
            <article className={styles.goldCheck}><span>01</span><h3>Confirm before you travel</h3><p>Re-open the event page on the day for the published venue address, time, and ticket link.</p></article>
            <article className={styles.goldCheck}><span>02</span><h3>Bring a trade-ready kit</h3><p>Protect cards, label what is not for trade, and have a clear idea of the items or sets you are hunting.</p></article>
            <article className={styles.goldCheck}><span>03</span><h3>Ask about venue access</h3><p>If you have an access requirement, contact the team before booking so venue-specific information can be checked.</p></article>
          </div>
        </div>
      </section>

      <section id="first-show-guide" className={styles.locationFooterCta}>
        <div className={`${styles.shell} ${styles.locationFooterCtaInner}`}>
          <div className={styles.locationFooterCtaCopy}>
            <h2>Make the first lap easier.</h2>
            <p>Use the practical first trading card show guide before event day.</p>
          </div>
          <Link href="/guides/first-trading-card-show" className={styles.darkButton}>Open the guide</Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}

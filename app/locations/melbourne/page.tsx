import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import EditorialPageHero from '@/components/EditorialPageHero';
import { getEvents } from '@/app/actions/events';
import { absoluteUrl } from '@/lib/site';
import { serializeJsonLd } from '@/lib/seo/jsonld';
import LocationEventCard, { NoLocationEvents } from '../LocationEventCard';
import { getLocationEvents } from '../location-data';
import styles from '../locations.module.css';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Melbourne Trading Card Shows | Collector's Paradise",
  description:
    "Find Collector's Paradise trading card and collectibles shows across Melbourne. See upcoming dates, venues, visitor guidance, and ticket links.",
  alternates: { canonical: absoluteUrl('/locations/melbourne') },
  openGraph: {
    title: "Melbourne Trading Card Shows | Collector's Paradise",
    description: 'Plan your next Pokémon TCG, sports card, and collectibles show in Melbourne.',
    url: absoluteUrl('/locations/melbourne'),
    images: [{ url: '/images/buy-sell-trade.jpeg', alt: 'Collectors trading cards at a live show' }],
  },
};

export default async function MelbourneLocationPage() {
  const events = getLocationEvents(await getEvents(), 'melbourne');
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: "Collector's Paradise Melbourne trading card shows",
    description: metadata.description,
    url: absoluteUrl('/locations/melbourne'),
    about: {
      '@type': 'Place',
      name: 'Melbourne, Victoria',
      address: { '@type': 'PostalAddress', addressLocality: 'Melbourne', addressRegion: 'VIC', addressCountry: 'AU' },
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: events.map((event, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: event.title,
        url: absoluteUrl(`/events/${event.id}`),
      })),
    },
  };

  return (
    <main className={`${styles.page} ${styles.melbourne}`}>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageSchema) }} />

      <EditorialPageHero
        title="Melbourne card shows"
        description="A rotating market for trading cards, graded favourites, sealed product, and collector culture. Use this page to find the next Melbourne-area show and arrive with a plan."
      />

      <section id="melbourne-events" className={styles.melEvents} aria-labelledby="melbourne-events-title">
        <div className={styles.shell}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>On the calendar</p>
              <h2 id="melbourne-events-title">Next in Melbourne</h2>
            </div>
            <p>Dates and venues can move around metropolitan Melbourne. Open an event for the confirmed address, times, entry details, and booking link.</p>
          </div>
          <div className={styles.eventGrid}>
            {events.length ? events.map((event) => <LocationEventCard key={event.id} event={event} />) : <NoLocationEvents city="Melbourne" />}
          </div>
        </div>
      </section>

      <section className={styles.melRoute} aria-labelledby="melbourne-route-title">
        <div className={`${styles.shell} ${styles.routeGrid}`}>
          <div className={styles.routeIntro}>
            <p className={styles.kicker}>A collector&apos;s route</p>
            <h2 id="melbourne-route-title">Build a better show day</h2>
            <p>Make time to browse first, compare what is available, and return to the tables that fit your collection.</p>
          </div>
          <div className={styles.routeSteps}>
            <article className={styles.routeStep}>
              <span>01</span><div><h3>Check the event page</h3><p>Confirm the venue, opening hours, ticket link, and any show-specific updates before travelling.</p></div>
            </article>
            <article className={styles.routeStep}>
              <span>02</span><div><h3>Protect what you bring</h3><p>Use sleeves, top loaders, or a secure binder and decide in advance which cards are available to trade.</p></div>
            </article>
            <article className={styles.routeStep}>
              <span>03</span><div><h3>Ask, compare, connect</h3><p>Prices and stock vary by vendor. Ask clear questions, inspect condition, and enjoy the community side of the show.</p></div>
            </article>
          </div>
        </div>
      </section>

      <section className={styles.locationFooterCta}>
        <div className={`${styles.shell} ${styles.locationFooterCtaInner}`}>
          <div className={styles.locationFooterCtaCopy}>
            <h2>Looking beyond Victoria?</h2>
            <p>Explore the Gold Coast and Canberra show guides.</p>
          </div>
          <div className={styles.heroActions}>
            <Link href="/locations/gold-coast" className={styles.darkButton}>Gold Coast</Link>
            <Link href="/locations/canberra" className={styles.outlineButton}>Canberra</Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

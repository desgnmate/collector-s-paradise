import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
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
  title: "Epping Card Shows | Collector's Paradise",
  description:
    "Find upcoming Collector's Paradise trading card shows in Epping and Melbourne's north. Check event dates, venues, visitor details, and tickets.",
  alternates: { canonical: absoluteUrl('/locations/epping') },
  openGraph: {
    title: "Epping Card Shows | Collector's Paradise",
    description: "Plan your next Pokémon TCG, sports card, and collectibles show in Epping.",
    url: absoluteUrl('/locations/epping'),
    images: [{ url: '/images/buy-sell-trade.jpeg', alt: 'Collectors trading cards at a live show' }],
  },
};

export default async function EppingLocationPage() {
  const events = getLocationEvents(await getEvents(), 'epping');
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: "Collector's Paradise Epping card shows",
    description: metadata.description,
    url: absoluteUrl('/locations/epping'),
    about: {
      '@type': 'Place',
      name: 'Epping, Victoria',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Epping',
        addressRegion: 'VIC',
        addressCountry: 'AU',
      },
    },
    ...(events.length ? {
      mainEntity: {
        '@type': 'ItemList',
        itemListElement: events.map((event, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: event.title,
          url: absoluteUrl(`/events/${event.id}`),
        })),
      },
    } : {}),
  };

  return (
    <main className={styles.page}>
      <Navbar />
      <Breadcrumbs
        className={styles.breadcrumbs}
        items={[{ label: 'Home', href: '/' }, { label: 'Epping card shows' }]}
      />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(pageSchema) }} />

      <EditorialPageHero
        title="Epping card shows"
        description="Use this page to find Collector's Paradise trading card events hosted in Epping and nearby Melbourne north venues. Open each event for the confirmed address, timing, entry details, and ticket link."
      />

      <ResourcePageNav items={[
        { href: '#epping-events', label: 'Upcoming shows' },
        { href: '#epping-briefing', label: 'Plan the visit' },
        { href: '/locations/melbourne', label: 'Melbourne shows' },
      ]} />

      <section id="epping-events" className={styles.melEvents} aria-labelledby="epping-events-title">
        <div className={styles.shell}>
          <div className={styles.sectionHeader}>
            <div>
              <p className={styles.kicker}>Epping and Melbourne north</p>
              <h2 id="epping-events-title">Upcoming Epping shows</h2>
            </div>
            <p>Dates and venues can change. Use the individual event page as the final reference before travelling or booking.</p>
          </div>
          <div className={styles.eventGrid}>
            {events.length ? events.map((event) => <LocationEventCard key={event.id} event={event} />) : <NoLocationEvents city="Epping" />}
          </div>
        </div>
      </section>

      <section id="epping-briefing" className={styles.melRoute} aria-labelledby="epping-briefing-title">
        <div className={`${styles.shell} ${styles.routeGrid}`}>
          <div className={styles.routeIntro}>
            <p className={styles.kicker}>Before show day</p>
            <h2 id="epping-briefing-title">Plan a better visit</h2>
            <p>Keep the live event listing open while you plan. It contains the details most likely to change.</p>
          </div>
          <div className={styles.routeSteps}>
            <article className={styles.routeStep}><span>01</span><div><h3>Confirm the listing</h3><p>Check the published date, venue, opening time, ticket link, and any event notes.</p></div></article>
            <article className={styles.routeStep}><span>02</span><div><h3>Prepare your cards</h3><p>Protect cards you bring, separate trade items, and make a short list of what you want to find.</p></div></article>
            <article className={styles.routeStep}><span>03</span><div><h3>Meet the vendors</h3><p>Ask about condition, compare stock, and enjoy the collector community around the tables.</p></div></article>
          </div>
        </div>
      </section>

      <section className={styles.locationFooterCta}>
        <div className={`${styles.shell} ${styles.locationFooterCtaInner}`}>
          <div className={styles.locationFooterCtaCopy}>
            <h2>Looking for more Melbourne shows?</h2>
            <p>Browse the wider Melbourne calendar or see every upcoming Collector&apos;s Paradise event.</p>
          </div>
          <div className={styles.heroActions}>
            <Link href="/locations/melbourne" className={styles.outlineButton}>Melbourne</Link>
            <Link href="/events" className={styles.darkButton}>All events</Link>
          </div>
        </div>
      </section>
      <Footer />
    </main>
  );
}

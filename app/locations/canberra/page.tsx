import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import EditorialPageHero from '@/components/EditorialPageHero';
import { getEvents } from '@/app/actions/events';
import { absoluteUrl } from '@/lib/site';
import LocationEventCard, { NoLocationEvents } from '../LocationEventCard';
import { getLocationEvents } from '../location-data';
import styles from '../locations.module.css';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Canberra Trading Card Shows | Collector's Paradise",
  description:
    "Plan a Collector's Paradise trading card and collectibles show in Canberra. Find upcoming ACT dates, confirmed venues, visitor guidance, and tickets.",
  alternates: { canonical: absoluteUrl('/locations/canberra') },
  openGraph: {
    title: "Canberra Trading Card Shows | Collector's Paradise",
    description: 'Your briefing for upcoming Pokémon TCG, sports card, and collectibles events in Canberra.',
    url: absoluteUrl('/locations/canberra'),
    images: [{ url: '/images/3rd-section-new.jpg', alt: 'Trading cards ready for a collector show' }],
  },
};

export default async function CanberraLocationPage() {
  const events = getLocationEvents(await getEvents(), 'canberra');
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: "Collector's Paradise Canberra trading card shows",
    description: metadata.description,
    url: absoluteUrl('/locations/canberra'),
    about: {
      '@type': 'Place',
      name: 'Canberra, Australian Capital Territory',
      address: { '@type': 'PostalAddress', addressLocality: 'Canberra', addressRegion: 'ACT', addressCountry: 'AU' },
    },
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: events.map((event, index) => ({
        '@type': 'ListItem', position: index + 1, name: event.title, url: absoluteUrl(`/events/${event.id}`),
      })),
    },
  };

  return (
    <main className={`${styles.page} ${styles.canberra}`}>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />

      <EditorialPageHero
        title="Cards in the capital"
        description="A clear, practical briefing for Collector's Paradise shows in Canberra: what is scheduled, where to verify details, and how to prepare for a day of collecting."
      />

      <section id="canberra-events" className={styles.canEvents} aria-labelledby="canberra-events-title">
        <div className={styles.shell}>
          <div className={styles.sectionHeader}>
            <div><p className={styles.kicker}>Published notices</p><h2 id="canberra-events-title">Canberra events</h2></div>
            <p>Always use the individual event page as the final reference for venue details, access notes, ticketing, and timing.</p>
          </div>
          <div className={styles.eventGrid}>
            {events.length ? events.map((event) => <LocationEventCard key={event.id} event={event} />) : <NoLocationEvents city="Canberra" />}
          </div>
        </div>
      </section>

      <section className={styles.canGuide} aria-labelledby="briefing-notes-title">
        <div className={`${styles.shell} ${styles.canGuideGrid}`}>
          <div className={styles.canGuideIntro}><p className={styles.kicker}>Briefing notes</p><h2 id="briefing-notes-title">Four checks before show day</h2></div>
          <div className={styles.briefCards}>
            <article className={styles.briefCard}><span>01 / VERIFY</span><h3>Open the live event page</h3><p>Confirm the date, session time, venue address, and ticket availability.</p></article>
            <article className={styles.briefCard}><span>02 / PREPARE</span><h3>Set a collection goal</h3><p>Make a short want list and a realistic spending or trading limit before browsing.</p></article>
            <article className={styles.briefCard}><span>03 / PROTECT</span><h3>Pack cards securely</h3><p>Sleeve and organise anything you bring so condition is easy to inspect and discuss.</p></article>
            <article className={styles.briefCard}><span>04 / CONTACT</span><h3>Raise access questions early</h3><p>Venue facilities vary. Send the event name and your requirement before booking where possible.</p></article>
          </div>
        </div>
      </section>

      <section className={styles.locationFooterCta}>
        <div className={`${styles.shell} ${styles.locationFooterCtaInner}`}>
          <div className={styles.locationFooterCtaCopy}>
            <h2>Need venue-specific accessibility information?</h2>
            <p>Check the access-planning guidance before you commit.</p>
          </div>
          <Link href="/accessibility" className={styles.darkButton}>Accessibility planning</Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}

import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import EditorialPageHero from '@/components/EditorialPageHero';
import { getVendorApplicationEvents } from '@/app/actions/events';
import { absoluteUrl } from '@/lib/site';
import BoothReadiness from './BoothReadiness';
import styles from './booth.module.css';

export const revalidate = 0;

export const metadata: Metadata = {
  title: "Vendor Booth Information | Collector's Paradise",
  description:
    "Learn how Collector's Paradise vendor applications work, what to prepare, which shows are accepting applications, and which booth details are confirmed per event.",
  alternates: { canonical: absoluteUrl('/vendors/booth-information') },
  openGraph: {
    title: "Vendor Booth Information | Collector's Paradise",
    description: 'Prepare a clear vendor application for upcoming Australian trading card and collectibles events.',
    url: absoluteUrl('/vendors/booth-information'),
    images: [{ url: '/images/team-vendors-1.png', alt: 'Vendor team at a trading card show' }],
  },
};

const faqItems = [
  ['What is included with a booth?', 'Booth inclusions, size, fees, passes, furniture, and power arrangements can differ by event. Treat the written approval or offer for your selected show as the source of truth.'],
  ['Can I apply for more than one event?', 'Yes. When multiple published events are open in the application, you can select the dates that suit your business. Each event is reviewed separately.'],
  ['Does submitting an application reserve a booth?', 'No. Submission is an application, not a reservation or approval. The team reviews event fit and available space before confirming an outcome.'],
  ['What products are a good fit?', 'Applications are open to relevant trading card games, sports cards, graded cards, sealed product, accessories, art, and other aligned collectibles. Describe your range clearly in the form.'],
  ['How do I raise a setup or access question?', 'Add practical requirements to your application and include the specific event. Availability depends on the selected venue and must be confirmed by the team.'],
];

function formatDate(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default async function VendorBoothInformationPage() {
  const availableEvents = await getVendorApplicationEvents();
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqItems.map(([question, answer]) => ({
      '@type': 'Question', name: question, acceptedAnswer: { '@type': 'Answer', text: answer },
    })),
  };

  return (
    <main className={styles.page}>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      <EditorialPageHero
        title="Build a booth worth finding"
        description="Understand the application path, prepare the information the team needs, and see which events are currently available. Event-specific inclusions and fees are only final when confirmed in writing."
      />

      <section className={styles.readinessSection} aria-label="Vendor application readiness tool"><div className={styles.shell}><BoothReadiness /></div></section>

      <section id="process" className={styles.process} aria-labelledby="process-title">
        <div className={styles.shell}>
          <div className={styles.sectionHeader}><div><p className={styles.label}>Application flow</p><h2 id="process-title">From interest to show day</h2></div><p>A clear application helps the team understand your products, brand, selected dates, and practical requirements before space is allocated.</p></div>
          <div className={styles.processGrid}>
            <article className={styles.processCard}><span>01</span><h3>Choose live events</h3><p>Select only the published dates you can attend and review their locations before applying.</p></article>
            <article className={styles.processCard}><span>02</span><h3>Describe your range</h3><p>List the card games, product types, art, accessories, or collectibles visitors can expect at your booth.</p></article>
            <article className={styles.processCard}><span>03</span><h3>Submit for review</h3><p>The team reviews each selected event separately. An application is not a guaranteed booth allocation.</p></article>
            <article className={styles.processCard}><span>04</span><h3>Use confirmed details</h3><p>Plan around the written event-specific information you receive, including final inclusions and setup instructions.</p></article>
          </div>
        </div>
      </section>

      <section className={styles.opportunities} aria-labelledby="opportunities-title">
        <div className={styles.shell}>
          <div className={styles.sectionHeader}><div><p className={styles.label}>Live availability</p><h2 id="opportunities-title">Events in the application</h2></div><p>This list is read directly from the current vendor application data. Availability and approval remain subject to review.</p></div>
          {availableEvents.length ? (
            <div className={styles.opportunityList}>
              {availableEvents.map((event) => <article key={event.id} className={styles.opportunity}><time dateTime={event.event_date}>{formatDate(event.event_date)}</time><div><h3>{event.title}</h3><p>{event.venue || 'Venue information to be confirmed'}</p></div><Link href="/vendors/apply">Select in application →</Link></article>)}
            </div>
          ) : <p className={styles.noOpportunities}>No event is currently listed in the vendor application. Check the main event calendar for public show announcements and return when applications open.</p>}
        </div>
      </section>

      <section className={styles.practical} aria-labelledby="practical-title">
        <div className={`${styles.shell} ${styles.practicalGrid}`}>
          <div><p className={styles.label}>Practical boundaries</p><h2 id="practical-title">Confirm, do not assume</h2></div>
          <div className={styles.factList}>
            <article className={styles.fact}><h3>Booth footprint</h3><p>Use the dimensions and allocation in your event confirmation. Do not design around a standard size unless one is provided for that show.</p></article>
            <article className={styles.fact}><h3>Furniture &amp; power</h3><p>Tables, chairs, electricity, placement, and other inclusions may vary. Raise requirements in the application and wait for confirmation.</p></article>
            <article className={styles.fact}><h3>Fees &amp; passes</h3><p>Rely on the written event offer for vendor fees, payment timing, included passes, and any event-specific conditions.</p></article>
            <article className={styles.fact}><h3>Display planning</h3><p>Prepare clear pricing, secure high-value items, keep walkways unobstructed, and make your product categories easy to understand.</p></article>
          </div>
        </div>
      </section>

      <section className={styles.faq} aria-labelledby="booth-faq-title">
        <div className={styles.shell}><p className={styles.label}>Vendor FAQ</p><h2 id="booth-faq-title">Before you apply</h2><div className={styles.faqList}>{faqItems.map(([question, answer]) => <details key={question}><summary>{question}</summary><p>{answer}</p></details>)}</div></div>
      </section>

      <section className={styles.finalCta}>
        <div className={`${styles.shell} ${styles.finalCtaInner}`}>
          <div className={styles.finalCtaCopy}>
            <h2>Prepared your range and selected your dates?</h2>
            <p>Start when your booth information and event choices are ready.</p>
          </div>
          <Link href="/vendors/apply" className={styles.yellowButton}>Start the application</Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}

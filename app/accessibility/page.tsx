import type { Metadata } from 'next';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import EditorialPageHero from '@/components/EditorialPageHero';
import { absoluteUrl, CONTACT_EMAIL } from '@/lib/site';
import AccessPlanner from './AccessPlanner';
import styles from './accessibility.module.css';

export const metadata: Metadata = {
  title: "Accessibility at Events and Online | Collector's Paradise",
  description:
    "Read Collector's Paradise accessibility approach, plan venue-specific access questions, and report a website or event information barrier.",
  alternates: { canonical: absoluteUrl('/accessibility') },
  openGraph: {
    title: "Accessibility | Collector's Paradise",
    description: 'Plan access questions for an event or tell us about an online information barrier.',
    url: absoluteUrl('/accessibility'),
    images: [{ url: '/og-image.jpg', alt: "Collector's Paradise Australian collectibles events" }],
  },
};

export default function AccessibilityPage() {
  const pageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: "Collector's Paradise accessibility",
    description: metadata.description,
    url: absoluteUrl('/accessibility'),
    isPartOf: { '@id': `${absoluteUrl('/')}#website` },
  };

  return (
    <main className={styles.page}>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(pageSchema) }} />

      <EditorialPageHero
        title="Plan the visit that works for you"
        description="We want event information and online journeys to be easier to understand and use. Venue facilities vary, so this page helps you ask the right questions before booking."
      />

      <section className={styles.principles} aria-labelledby="principles-title">
        <div className={styles.shell}>
          <div className={styles.sectionHeader}><p className={styles.label}>What good access information looks like</p><h2 id="principles-title">Specific, early, and confirmed</h2><p>The most useful conversation starts with a named event and a clear question. That allows the team to check the selected venue rather than make a general promise.</p></div>
          <div className={styles.principleGrid}>
            <article className={styles.principle}><span>01</span><h3>Name the event</h3><p>Include the city, event title, or date so the team can identify the correct venue and session.</p></article>
            <article className={styles.principle}><span>02</span><h3>Describe the information you need</h3><p>Ask about the route, facility, timing, support, or communication detail that will help you decide and prepare.</p></article>
            <article className={styles.principle}><span>03</span><h3>Wait for venue confirmation</h3><p>Arrangements and facilities differ. Treat a direct response for your selected event as the reliable answer.</p></article>
          </div>
        </div>
      </section>

      <section id="access-planner" className={styles.plannerSection} aria-label="Accessibility email planner"><div className={styles.shell}><AccessPlanner /></div></section>

      <section className={styles.visitGuide} aria-labelledby="access-visit-title">
        <div className={`${styles.shell} ${styles.visitGrid}`}>
          <div><p className={styles.label}>Before and during a visit</p><h2 id="access-visit-title">A simple access plan</h2></div>
          <div className={styles.visitSteps}>
            <article className={styles.visitStep}><h3>Before booking</h3><p>Review the individual event page. If a required facility is not stated, contact the team with the event name and your question.</p></article>
            <article className={styles.visitStep}><h3>Before travelling</h3><p>Re-check event and venue information for changes. Keep any confirmed access details with your ticket or travel notes.</p></article>
            <article className={styles.visitStep}><h3>At the venue</h3><p>If something differs from the information you received, speak with event staff so they can understand the barrier and check the available options.</p></article>
            <article className={styles.visitStep}><h3>After the event</h3><p>Share specific feedback about the information, website, or on-site experience. It helps identify what needs to be clearer next time.</p></article>
          </div>
        </div>
      </section>

      <section className={styles.statement} aria-labelledby="statement-title">
        <div className={`${styles.shell} ${styles.statementGrid}`}>
          <div><p className={styles.label}>Website accessibility statement</p><h2 id="statement-title">Tell us when information gets in the way</h2></div>
          <div className={styles.statementCopy}>
            <p>Collector&apos;s Paradise works toward clear page structure, keyboard-operable controls, readable contrast, responsive text, descriptive image alternatives, and support for reduced-motion preferences.</p>
            <p>If you cannot access content, complete an important task, or understand event information, email <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>. Include the page address, what you were trying to do, what happened, and any assistive technology or browser details you are comfortable sharing.</p>
            <p>We use that context to investigate the barrier and provide the relevant information in another practical format where possible.</p>
          </div>
        </div>
      </section>

      <section className={styles.contact}><div className={`${styles.shell} ${styles.contactInner}`}><h2>Have an event access question or found an online barrier?</h2><a href={`mailto:${CONTACT_EMAIL}`} className={styles.primaryButton}>Email {CONTACT_EMAIL}</a></div></section>
      <Footer />
    </main>
  );
}

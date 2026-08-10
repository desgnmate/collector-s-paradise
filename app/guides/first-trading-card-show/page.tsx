import type { Metadata } from 'next';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import { absoluteUrl } from '@/lib/site';
import FirstShowChecklist from './FirstShowChecklist';
import styles from './guide.module.css';

export const metadata: Metadata = {
  title: "First Trading Card Show Guide | Collector's Paradise",
  description:
    'Going to your first trading card show? Learn what to bring, how buying and trading works, show etiquette, access planning, and what to do on the day.',
  alternates: { canonical: absoluteUrl('/guides/first-trading-card-show') },
  openGraph: {
    title: "Your First Trading Card Show: A Practical Guide",
    description: 'A clear first-timer guide to browsing, buying, selling, and trading at an Australian card show.',
    url: absoluteUrl('/guides/first-trading-card-show'),
    images: [{ url: '/images/meet-fans.png', alt: 'Collectors meeting at a live trading card event' }],
  },
};

const howToSteps = [
  ['Confirm the event details', 'Open the live event page and verify the date, venue, times, and ticket link.'],
  ['Set a collection goal', 'Write a short want list and choose a comfortable spending or trading limit.'],
  ['Pack cards securely', 'Protect anything you bring and separate cards that are available for trade.'],
  ['Browse before deciding', 'Use an initial lap to compare stock, condition, and prices across tables.'],
  ['Complete a clear trade', 'Agree on the exact items and values, inspect condition, and confirm before exchanging.'],
];

export default function FirstTradingCardShowGuidePage() {
  const howToSchema = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: 'How to prepare for your first trading card show',
    description: metadata.description,
    image: absoluteUrl('/images/meet-fans.png'),
    step: howToSteps.map(([name, text], index) => ({ '@type': 'HowToStep', position: index + 1, name, text })),
  };

  return (
    <main className={styles.page}>
      <Navbar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />

      <section id="before" className={styles.intro} aria-labelledby="before-title">
        <div className={`${styles.shell} ${styles.introGrid}`}>
          <div className={styles.introHeader}><p className={styles.label}>Before you go</p><h2 id="before-title">Give yourself a simple mission</h2></div>
          <div className={styles.introCopy}>
            <p>Your first show is easier when you choose one or two priorities: find a specific card, learn what a set is worth, meet local sellers, or simply see what the hobby looks like in person. <strong>Start with the live event page.</strong> That is where confirmed venue, time, entry, and ticket details belong. Re-check it before travelling.</p>
            <p>Bring a short want list and note any condition, edition, language, grading, or budget requirements. This makes conversations quicker and helps you compare like with like. If you plan to trade, organise your cards so another collector can inspect them without handling your whole collection.</p>
          </div>
        </div>
      </section>

      <section id="checklist" className={styles.checklistSection} aria-label="First show preparation checklist">
        <div className={styles.shell}><FirstShowChecklist /></div>
      </section>

      <section id="day-of" className={styles.timeline} aria-labelledby="day-title">
        <div className={styles.shell}>
          <div className={styles.timelineHeader}><p className={styles.label}>On the day</p><h2 id="day-title">A low-pressure first lap</h2></div>
          <div className={styles.timelineList}>
            <article className={styles.timelineItem}><span>Arrival</span><h3>Orient yourself</h3><p>Check entry instructions, locate amenities, and take a moment to understand the room before shopping.</p></article>
            <article className={styles.timelineItem}><span>First lap</span><h3>Browse and take notes</h3><p>See what is available and compare condition and price. You do not need to buy from the first table you visit.</p></article>
            <article className={styles.timelineItem}><span>Conversation</span><h3>Ask specific questions</h3><p>Share a card name, set, number, player, character, or budget. Vendors can help faster when the brief is clear.</p></article>
            <article className={styles.timelineItem}><span>Decision</span><h3>Inspect before agreeing</h3><p>Look at condition, confirm exactly what is included, and make sure both sides understand a trade before completing it.</p></article>
            <article className={styles.timelineItem}><span>Reset</span><h3>Take breaks</h3><p>Busy rooms can be tiring. Step aside, review your list, and return when you are ready.</p></article>
          </div>
        </div>
      </section>

      <section id="etiquette" className={styles.etiquette} aria-labelledby="etiquette-title">
        <div className={styles.shell}>
          <div className={styles.etiquetteHeader}><div><p className={styles.label}>Good table manners</p><h2 id="etiquette-title">Clear, calm, respectful</h2></div><p>Every table is different, but these three habits make buying and trading smoother for everyone.</p></div>
          <div className={styles.etiquetteGrid}>
            <article className={styles.etiquetteCard}><span>01</span><h3>Ask before handling</h3><p>Wait for permission before removing a card from a case, sleeve, display, or someone else&apos;s binder.</p></article>
            <article className={styles.etiquetteCard}><span>02</span><h3>Be direct about condition</h3><p>Point out issues you know about, inspect both sides, and avoid assuming two copies have the same value.</p></article>
            <article className={styles.etiquetteCard}><span>03</span><h3>It is okay to walk away</h3><p>A polite “thanks, I&apos;ll think about it” is enough. A good show does not require every conversation to become a deal.</p></article>
          </div>
        </div>
      </section>

      <section className={styles.nextStep}>
        <div className={`${styles.shell} ${styles.nextStepInner}`}>
          <div className={styles.nextStepCopy}>
            <h2>Ready to choose a date?</h2>
            <p>Start with the live event calendar.</p>
          </div>
          <Link href="/events" className={styles.button}>Find an event</Link>
        </div>
      </section>
      <Footer />
    </main>
  );
}

import type { Metadata } from 'next';
import { OPEN_GRAPH_DEFAULTS } from '@/lib/seo/metadata';
import Link from 'next/link';
import Footer from '@/components/Footer';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import { absoluteUrl } from '@/lib/site';
import { serializeJsonLd } from '@/lib/seo/jsonld';
import FirstShowChecklist from './FirstShowChecklist';
import styles from './guide.module.css';
import hallPhoto from '@/public/images/buy-sell-trade.jpeg';
import tablePhoto from '@/public/images/giveaways.jpeg';

export const metadata: Metadata = {
  title: "First Trading Card Show Guide | Collector's Paradise",
  description:
    'Going to your first trading card show? Learn what to bring, how buying and trading works, show etiquette, access planning, and what to do on the day.',
  alternates: { canonical: absoluteUrl('/guides/first-trading-card-show') },
  openGraph: {
    ...OPEN_GRAPH_DEFAULTS,
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

const daySteps = [
  ['Get your bearings.', 'Check entry, find the amenities and take in the room before you shop.'],
  ['Do a first lap.', 'Browse and take notes on condition and price. You don’t have to buy at the first table.'],
  ['Ask specific questions.', 'Name the card, set, number, player or budget. A clear brief gets you faster help.'],
  ['Inspect, then agree.', 'Check condition and exactly what’s included before any deal or trade is done.'],
  ['Take breaks.', 'Busy rooms are tiring. Step aside, check your list, go again.'],
] as const;

const manners = [
  ['“Can I take a look?”', 'Wait for a yes before taking a card out of a case, sleeve, display or someone else’s binder.'],
  ['“There’s a crease on the back.”', 'Be direct about condition. Mention issues you know about, check both sides, and don’t assume two copies are worth the same.'],
  ['“Thanks, I’ll think about it.”', 'That’s enough. Not every conversation has to end in a deal, and nobody will take it personally.'],
] as const;

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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(howToSchema) }} />

      <div className={styles.shell}>
        <header className={styles.masthead}>
          <h1>Your first<br />card show</h1>
          <p>What to bring, how buying and trading works, and the small habits that make a first visit easy.</p>
        </header>

        <figure className={styles.heroFigure}>
          <Image
            src={hallPhoto}
            alt="The floor at a Collector's Paradise show, with rows of vendor tables and visitors browsing"
            sizes="(max-width: 1240px) 100vw, 1160px"
            priority
          />
          <figcaption>The floor at a Collector&apos;s Paradise show. It&apos;s busy, but nobody minds you looking.</figcaption>
        </figure>

        <div className={styles.layout}>
          <nav className={styles.toc} aria-label="In this guide">
            <p>In this guide</p>
            <a href="#before"><span>01</span>Before you go</a>
            <a href="#pack"><span>02</span>What to pack</a>
            <a href="#day"><span>03</span>On the day</a>
            <a href="#manners"><span>04</span>Table manners</a>
          </nav>

          <article className={styles.article}>
            <section id="before" className={styles.section} aria-labelledby="before-title">
              <h2 id="before-title"><span>01</span>Before you go</h2>
              <p className={styles.lead}>Pick one or two things you want out of the day. Find a specific card, learn what a set is worth, meet local sellers, or just see what the hobby looks like in person.</p>
              <p>Then write a short want list. Note the condition, edition, language, grading and budget you care about, so conversations are quick and you&apos;re comparing like with like. If you plan to trade, sort your cards so someone can look through them without handling your whole collection.</p>

              <div className={styles.beforeExtras}>
                <div className={styles.wantList}>
                  <p className={styles.wantListTitle}>A want list that works</p>
                  <ul>
                    <li><strong>Card</strong> · set · number</li>
                    <li><strong>Condition</strong> you&apos;ll accept</li>
                    <li><strong>Language</strong> / edition / graded?</li>
                    <li><strong>Most</strong> you&apos;ll pay or trade</li>
                  </ul>
                </div>
                <p className={styles.callout}>
                  Check the <Link href="/events">live event page</Link> before you leave. That&apos;s where the confirmed venue, times, entry and tickets are.
                </p>
              </div>
            </section>

            <section id="pack" className={styles.section} aria-labelledby="pack-title">
              <FirstShowChecklist />
            </section>

            <section id="day" className={styles.section} aria-labelledby="day-title">
              <h2 id="day-title"><span>03</span>On the day</h2>
              <div className={styles.dayLayout}>
                <ol className={styles.steps}>
                  {daySteps.map(([title, text], index) => (
                    <li key={title}>
                      <span className={styles.stepNumber} aria-hidden="true">{index + 1}</span>
                      <p><strong>{title}</strong> {text}</p>
                    </li>
                  ))}
                </ol>
                <figure className={styles.dayFigure}>
                  <Image src={tablePhoto} alt="Collectors looking through binders at a trading table" sizes="(max-width: 900px) 100vw, 320px" />
                  <figcaption>Binders out at the trading tables.</figcaption>
                </figure>
              </div>
            </section>

            <section id="manners" className={styles.section} aria-labelledby="manners-title">
              <h2 id="manners-title"><span>04</span>Table manners</h2>
              <dl className={styles.manners}>
                {manners.map(([say, why]) => (
                  <div key={say}>
                    <dt>{say}</dt>
                    <dd>{why}</dd>
                  </div>
                ))}
              </dl>
            </section>

            <section className={styles.closing}>
              <h2>That&apos;s it. Pick a date.</h2>
              <Link href="/events" className={styles.button}>
                See upcoming events
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
            </section>
          </article>
        </div>
      </div>
      <Footer />
    </main>
  );
}

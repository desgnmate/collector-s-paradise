import Image from 'next/image';
import Link from 'next/link';
import type { Event } from '@/app/actions/events';
import { formatEventDate } from './location-data';
import styles from './locations.module.css';

export default function LocationEventCard({ event }: { event: Event }) {
  const date = new Date(`${event.event_date}T00:00:00`);

  return (
    <article className={styles.eventCard}>
      <Link href={`/events/${event.id}`} className={styles.eventImageLink} aria-label={`View ${event.title}`}>
        <Image
          src={event.cover_image_url || '/images/event-experience.jpg'}
          alt={`${event.title} trading card show`}
          fill
          sizes="(max-width: 760px) 92vw, (max-width: 1200px) 45vw, 360px"
          className={styles.eventImage}
        />
        <span className={styles.eventDateBadge}>
          <strong>{date.getDate()}</strong>
          <span>{date.toLocaleDateString('en-AU', { month: 'short' })}</span>
        </span>
      </Link>
      <div className={styles.eventCardBody}>
        <p>{formatEventDate(event.event_date)}</p>
        <h3><Link href={`/events/${event.id}`}>{event.title}</Link></h3>
        <span>{event.venue || 'Venue details coming soon'}</span>
        <Link href={`/events/${event.id}`} className={styles.textLink}>
          Event details <span aria-hidden="true">→</span>
        </Link>
      </div>
    </article>
  );
}

export function NoLocationEvents({ city }: { city: string }) {
  return (
    <div className={styles.noEvents}>
      <p className={styles.kicker}>Next date loading</p>
      <h3>Planning the next {city} show</h3>
      <p>New dates and venue details are published on the main events calendar as soon as they are confirmed.</p>
      <Link href="/events" className={styles.darkButton}>See all events</Link>
    </div>
  );
}

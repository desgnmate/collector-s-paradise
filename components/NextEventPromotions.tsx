import { getEvents } from '@/app/actions/events';
import { getEventMarketDate } from '@/lib/event-date';
import {
  formatPromotionDate,
  formatPromotionTime,
  getEventStartTimeMs,
  type PromotedEvent,
} from '@/lib/event-promotion';
import EventPromotionExperience from './EventPromotionExperience';

export default async function NextEventPromotions() {
  const events = await getEvents();
  const today = getEventMarketDate();
  const nextEvent = events.find((event) => (
    event.event_date >= today
    && event.status !== 'completed'
    && event.status !== 'cancelled'
  ));

  if (!nextEvent) return null;

  const event: PromotedEvent = {
    id: nextEvent.id,
    title: nextEvent.title.trim(),
    eventDate: formatPromotionDate(nextEvent.event_date),
    dateDay: nextEvent.event_date.slice(8, 10),
    dateMonth: new Intl.DateTimeFormat('en-AU', {
      timeZone: 'Australia/Melbourne',
      month: 'short',
    }).format(new Date(`${nextEvent.event_date}T00:00:00Z`)).toUpperCase(),
    startTime: formatPromotionTime(nextEvent.start_time),
    venue: nextEvent.venue,
    href: `/events/${nextEvent.id}`,
    ticketHref: nextEvent.booking_link || `/events/${nextEvent.id}`,
    targetTimeMs: getEventStartTimeMs(nextEvent.event_date, nextEvent.start_time),
  };

  return <EventPromotionExperience event={event} />;
}

export function NextEventPromotionFallback() {
  return <div className="next-event-banner next-event-banner--loading" aria-hidden="true" />;
}

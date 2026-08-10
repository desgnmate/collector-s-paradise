import HighlightsClient from './HighlightsClient';
import { getEvents } from '@/app/actions/events';
import { getEventMarketDate } from '@/lib/event-date';

// Cache the events query for 10 minutes so repeated navigations to
// the home page don't hit Supabase on every visit. Background
// revalidation keeps the data fresh.
export const revalidate = 600;

export default async function Highlights() {
  const events = await getEvents();
  const today = getEventMarketDate();

  // Upcoming = event is today or in the future AND not cancelled/completed.
  // Past = event was before today OR explicitly marked completed.
  // This mirrors the date-based filtering used by /events so a past
  // event disappears from "Upcoming" as soon as the date passes.
  const upcomingEvents = events.filter(
    (event) => event.event_date >= today && event.status !== 'completed' && event.status !== 'cancelled',
  );
  const pastEvents = events
    .filter((event) => event.event_date < today || event.status === 'completed')
    .sort((a, b) => b.event_date.localeCompare(a.event_date));

  return (
    <HighlightsClient
      upcomingEvents={upcomingEvents}
      pastEvents={pastEvents}
    />
  );
}

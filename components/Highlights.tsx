import HighlightsClient from './HighlightsClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Event } from '@/app/actions/events';

export default async function Highlights() {
  const supabase = await createSupabaseServerClient();

  // Local date (AU) so an event on the current calendar day isn't
  // mis-classified as past because UTC has rolled forward.
  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  // Upcoming = event is today or in the future AND not cancelled/completed.
  // Past = event was before today OR explicitly marked completed.
  // This mirrors the date-based filtering used by /events so a past
  // event disappears from "Upcoming" as soon as the date passes.
  const { data: upcomingData, error: upcomingError } = await supabase
    .from('events')
    .select('*')
    .gte('event_date', today)
    .not('status', 'in', '(completed,cancelled)')
    .order('event_date', { ascending: true });

  if (upcomingError) {
    console.error('Error fetching upcoming events:', upcomingError);
  }

  const { data: pastData, error: pastError } = await supabase
    .from('events')
    .select('*')
    .or(`event_date.lt.${today},status.in.(completed)`)
    .order('event_date', { ascending: false });

  if (pastError) {
    console.error('Error fetching past events:', pastError);
  }

  const upcomingEvents: Event[] = upcomingData || [];
  const pastEvents: Event[] = pastData || [];

  return (
    <HighlightsClient
      upcomingEvents={upcomingEvents}
      pastEvents={pastEvents}
    />
  );
}

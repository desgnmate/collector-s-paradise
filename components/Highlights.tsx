import HighlightsClient from './HighlightsClient';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import type { Event } from '@/app/actions/events';

export default async function Highlights() {
  const supabase = await createSupabaseServerClient();

  // Fetch upcoming events
  const { data: upcomingData, error: upcomingError } = await supabase
    .from('events')
    .select('*')
    .in('status', ['upcoming', 'active'])
    .order('event_date', { ascending: true });

  if (upcomingError) {
    console.error('Error fetching upcoming events:', upcomingError);
  }

  // Fetch past/completed events
  const { data: pastData, error: pastError } = await supabase
    .from('events')
    .select('*')
    .in('status', ['completed'])
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

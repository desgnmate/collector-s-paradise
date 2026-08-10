import type { Event } from '@/app/actions/events';
import { getEventMarketDate } from '@/lib/event-date';

export type LocationKey = 'melbourne' | 'gold-coast' | 'canberra';

const locationTerms: Record<LocationKey, string[]> = {
  melbourne: ['melbourne', 'vic', 'victoria', 'oakleigh', 'epping'],
  'gold-coast': ['gold coast', 'nerang', 'ashmore', 'qld', 'queensland'],
  canberra: ['canberra', 'act', 'australian capital territory'],
};

export function getLocationEvents(events: Event[], location: LocationKey) {
  const terms = locationTerms[location];
  const today = getEventMarketDate();

  return events.filter((event) => {
    if (event.status === 'cancelled' || event.status === 'completed' || event.event_date < today) {
      return false;
    }

    const haystack = [event.title, event.venue, event.venue_address]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return terms.some((term) => haystack.includes(term));
  });
}

export function formatEventDate(date: string, options?: Intl.DateTimeFormatOptions) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-AU', options ?? {
    weekday: 'short',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

/** Picks an event's cover: its own upload, else the city artwork, else a generic photo. */

export const EVENT_COVER_FALLBACK = '/images/event-experience.jpg';

const LOCATION_EVENT_COVERS = [
  {
    src: '/images/event-covers/gold-coast.png',
    terms: ['gold coast', 'nerang', 'ashmore', 'qld', 'queensland'],
  },
  {
    src: '/images/event-covers/melbourne.png',
    terms: ['melbourne', 'oakleigh', 'epping', 'vic', 'victoria'],
  },
  {
    src: '/images/event-covers/canberra.png',
    terms: ['canberra', 'act', 'australian capital territory'],
  },
] as const;

export type EventCoverInput = {
  title: string;
  venue: string | null;
  venue_address: string | null;
  cover_image_url: string | null;
};

export function getEventCoverImage(event: EventCoverInput) {
  const haystack = [event.title, event.venue, event.venue_address]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  const locationCover = LOCATION_EVENT_COVERS.find(({ terms }) => terms.some((term) => (
    term.length <= 3
      ? new RegExp(`\\b${term}\\b`).test(haystack)
      : haystack.includes(term)
  )));

  return event.cover_image_url || locationCover?.src || EVENT_COVER_FALLBACK;
}

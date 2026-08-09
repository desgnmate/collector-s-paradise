export const EVENT_TIME_ZONE = 'Australia/Melbourne';

export function getEventMarketDate(date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone: EVENT_TIME_ZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

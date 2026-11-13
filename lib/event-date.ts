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

/** "17:00:00" -> "5:00 pm". Returns the input unchanged when it is not a time. */
export function formatEventClockTime(value: string | null | undefined): string {
  if (!value) return '';
  const match = /^(\d{1,2}):(\d{2})/.exec(value);
  if (!match) return value;
  const hours = Number(match[1]);
  const suffix = hours >= 12 ? 'pm' : 'am';
  return `${hours % 12 || 12}:${match[2]} ${suffix}`;
}

/** "10:00:00", "17:00:00" -> "10:00 am – 5:00 pm" for admin and listing displays. */
export function formatEventTimeRange(start: string | null | undefined, end: string | null | undefined): string {
  return [formatEventClockTime(start), formatEventClockTime(end)].filter(Boolean).join(' – ') || 'Time to be confirmed';
}

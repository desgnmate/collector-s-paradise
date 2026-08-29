export type PromotedEvent = {
  id: string;
  title: string;
  eventDate: string;
  dateDay: string;
  dateMonth: string;
  startTime: string;
  venue: string | null;
  href: string;
  ticketHref: string;
  targetTimeMs: number;
};

function timeZoneOffsetMs(timestamp: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-AU', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(timestamp));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const representedAsUtc = Date.UTC(
    Number(values.year),
    Number(values.month) - 1,
    Number(values.day),
    Number(values.hour),
    Number(values.minute),
    Number(values.second),
  );
  return representedAsUtc - timestamp;
}

export function getEventStartTimeMs(
  eventDate: string,
  startTime: string,
  timeZone = 'Australia/Melbourne',
) {
  const [year, month, day] = eventDate.split('-').map(Number);
  const [hour, minute, second = 0] = startTime.split(':').map(Number);
  const utcGuess = Date.UTC(year, month - 1, day, hour, minute, second);
  const firstPass = utcGuess - timeZoneOffsetMs(utcGuess, timeZone);

  // A second pass handles dates that sit on the edge of daylight-saving
  // transitions without relying on the server's own local timezone.
  return utcGuess - timeZoneOffsetMs(firstPass, timeZone);
}

export function formatPromotionDate(eventDate: string) {
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'Australia/Melbourne',
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${eventDate}T00:00:00Z`));
}

export function formatPromotionTime(startTime: string) {
  const [hour, minute] = startTime.split(':').map(Number);
  return new Intl.DateTimeFormat('en-AU', {
    timeZone: 'UTC',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(Date.UTC(2000, 0, 1, hour, minute)));
}

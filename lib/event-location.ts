export type AustralianEventAddress = {
  streetAddress?: string;
  locality?: string;
  region?: string;
  postcode?: string;
};

/** Split an Australian venue address into the fields expected by Event JSON-LD. */
export function parseAustralianEventAddress(
  value: string | null | undefined,
): AustralianEventAddress {
  if (!value) return {};

  const match = value
    .trim()
    .match(/^(.*?),\s*([^,]+?)\s+(ACT|NSW|NT|QLD|SA|TAS|VIC|WA)\s+(\d{4})\s*$/i);

  if (!match) return { streetAddress: value.trim() };

  return {
    streetAddress: match[1].trim(),
    locality: match[2].trim(),
    region: match[3].toUpperCase(),
    postcode: match[4],
  };
}

export function toEventDateTime(date: string, time: string | null | undefined, fallback: string) {
  const match = (time || fallback).trim().match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return `${date}T${fallback}:00`;

  const hour = match[1].padStart(2, '0');
  const minute = match[2];
  const second = match[3] || '00';
  return `${date}T${hour}:${minute}:${second}`;
}

export function getEventSchemaDates(
  date: string,
  startTime: string | null | undefined,
  endTime: string | null | undefined,
) {
  const startDate = toEventDateTime(date, startTime, '09:00');
  const endDate = toEventDateTime(date, endTime, '17:00');

  if (endDate <= startDate) {
    return { startDate: date, endDate: undefined, hasValidTimeRange: false };
  }

  return { startDate, endDate, hasValidTimeRange: true };
}

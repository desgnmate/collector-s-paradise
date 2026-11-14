/**
 * Turns an organiser's free-text event description into scannable pieces.
 *
 * Descriptions are typed (or pasted from ticketing sites) as plain text with
 * blank lines between paragraphs, and often repeat the date, location and a
 * "Ticket options" list. Rendering that as one paragraph produced a wall of
 * text, so the event page shows these parts instead:
 *   summary     — the opening paragraph, for the hero
 *   interests   — games and collectibles mentioned ("What's on")
 *   highlights  — a giveaway/prize paragraph worth calling out
 *   tickets     — ticket tiers with price, entry window and a short note
 *   notes       — leftover ticket-section lines ("All ticket holders …")
 *   about       — the remaining intro paragraphs
 * Location and date sections are dropped: the page shows the event's own
 * venue and date fields. Anything unrecognised stays in `about`.
 *
 * Kept free of runtime imports so Node's test runner can load it directly.
 */

export type EventTicketTier = {
  name: string;
  /** null when no price could be read. 0 for free tiers. */
  price: number | null;
  priceLabel: string;
  entry: string | null;
  /** Entry window in minutes after midnight, when the description gives one. */
  entryStart: number | null;
  entryEnd: number | null;
  note: string | null;
  limited: boolean;
};

export type EventHighlight = { title: string; detail: string | null };

export type ParsedEventDescription = {
  summary: string | null;
  interests: string[];
  highlights: EventHighlight[];
  tickets: EventTicketTier[];
  notes: string[];
  about: string[];
};

const INTERESTS: [label: string, pattern: RegExp][] = [
  ['Pokémon', /pok[eé]mon/i],
  ['One Piece', /one\s*piece/i],
  ['Riftbound', /rif+t?\s*bound/i],
  ['Magic: The Gathering', /\bmagic\b|\bmtg\b/i],
  ['Yu-Gi-Oh!', /yu-?\s?gi-?\s?oh/i],
  ['Dragon Ball', /dragon\s*ball/i],
  ['Lorcana', /lorcana/i],
  ['Sports cards', /sports?\s+(cards|memorabilia)/i],
  ['Vintage', /\bvintage\b/i],
  ['Anime', /\banime\b/i],
  ['Art', /\bart\b/i],
  ['Comics', /\bcomics?\b/i],
  ['Stickers & trinkets', /\bstickers?\b|\btrinkets?\b/i],
];

// Emoji, variation selectors and the zero-width joiner.
const EMOJI = /[\p{Extended_Pictographic}\u{FE0F}\u{200D}\u{20E3}]/gu;

const clean = (value: string) => value.replace(EMOJI, '').replace(/\s+/g, ' ').trim();

const SECTION_HEADING = /^(ticket options|tickets|location|venue|date\s*&\s*time|date and time|when|where)\s*:?$/i;
const PRICE = /\$\s*(\d+(?:\.\d{1,2})?)/;
const TIME_RANGE = /(\d{1,2}(?::\d{2})?\s*[ap]\.?m\.?)\s*[–—-]\s*(\d{1,2}(?::\d{2})?\s*[ap]\.?m\.?)/i;
// "General Admission (On-Door): $35", "Kids Under 10: FREE"
const INLINE_TIER = /^(.+?)\s*:\s*(\$\s*\d+(?:\.\d{1,2})?|free)\s*$/i;

function formatClock(value: string) {
  const match = /^(\d{1,2})(?::(\d{2}))?\s*([ap])/i.exec(value.replace(/\./g, '').trim());
  if (!match) return value.trim();
  return `${Number(match[1])}:${match[2] || '00'} ${match[3].toLowerCase() === 'a' ? 'am' : 'pm'}`;
}

function formatEntry(line: string): string | null {
  const range = TIME_RANGE.exec(line);
  return range ? `${formatClock(range[1])} – ${formatClock(range[2])}` : null;
}

/** "9:00 am", "3pm", "12:30 P.M." → minutes after midnight. */
function toMinutes(value: string): number | null {
  const match = /^(\d{1,2})(?::(\d{2}))?\s*([ap])/i.exec(value.replace(/\./g, '').trim());
  if (!match) return null;
  const hour = Number(match[1]) % 12 + (match[3].toLowerCase() === 'p' ? 12 : 0);
  return hour * 60 + Number(match[2] || 0);
}

const CLOCK = /\b(\d{1,2}(?::\d{2})?\s*[ap]\.?m\.?)/i;

/** The first clock time in a sentence ("Giveaway Buffet at 3:00 PM!"), in minutes. */
export function findClockMinutes(text: string | null | undefined): number | null {
  const match = text ? CLOCK.exec(text) : null;
  return match ? toMinutes(match[1]) : null;
}

function priceLabel(price: number | null) {
  if (price === null) return 'See tickets';
  if (price === 0) return 'Free';
  return Number.isInteger(price) ? `$${price}` : `$${price.toFixed(2)}`;
}

/** Split into paragraphs on blank lines; lines inside a paragraph are kept. */
function blocks(text: string): string[][] {
  return text
    .replace(/\r\n?/g, '\n')
    .split(/\n\s*\n/)
    .map((block) => block.split('\n').map((line) => line.trim()).filter(Boolean))
    .filter((lines) => lines.length > 0);
}

function parseTier(lines: string[]): EventTicketTier | null {
  const [first, ...rest] = lines.map(clean);
  if (!first) return null;
  let name = first;
  let price: number | null = null;
  let entry: string | null = null;
  let entryStart: number | null = null;
  let entryEnd: number | null = null;
  const noteLines: string[] = [];

  const inline = INLINE_TIER.exec(first);
  if (inline) {
    name = inline[1];
    price = /free/i.test(inline[2]) ? 0 : Number(PRICE.exec(inline[2])?.[1]);
  }

  for (const line of rest) {
    if (/^price\s*:/i.test(line) && PRICE.test(line)) price = Number(PRICE.exec(line)?.[1]);
    else if (/^free$/i.test(line)) price = 0;
    else if (/^entry\b/i.test(line) && formatEntry(line)) {
      entry = formatEntry(line);
      const range = TIME_RANGE.exec(line);
      entryStart = range ? toMinutes(range[1]) : null;
      entryEnd = range ? toMinutes(range[2]) : null;
    }
    else noteLines.push(line.replace(/^\((.*)\)$/, '$1'));
  }

  // A block with no price is not a ticket tier (it is a note).
  if (price === null || Number.isNaN(price)) return null;
  const limited = /limited/i.test(name);
  name = name.replace(/\s*\((?:limited availability|limited)\)\s*/i, ' ').trim();
  return {
    name,
    price,
    priceLabel: priceLabel(price),
    entry,
    entryStart,
    entryEnd,
    note: noteLines.length ? noteLines.join(' ') : null,
    limited,
  };
}

function sentences(text: string): string[] {
  // Keep closing brackets and quotes with their sentence: "(free as a giveaway!)".
  return text.match(/[^.!?]+(?:[.!?]+[)"'’”]*|$)\s*/g)?.map((sentence) => sentence.trim()).filter(Boolean) || [text];
}

const HIGHLIGHT = /giveaway|prize|raffle|don['’]t miss/i;

export function parseEventDescription(raw: string | null | undefined): ParsedEventDescription {
  const result: ParsedEventDescription = { summary: null, interests: [], highlights: [], tickets: [], notes: [], about: [] };
  if (!raw?.trim()) return result;

  type Section = 'about' | 'tickets' | 'skip';
  let section: Section = 'about';
  const aboutBlocks: string[] = [];

  for (const lines of blocks(raw)) {
    const heading = clean(lines[0]).replace(/:$/, '');
    if (SECTION_HEADING.test(heading)) {
      section = /ticket/i.test(heading) ? 'tickets' : 'skip';
      const remainder = lines.slice(1);
      // "Location:\nPCYC Nerang\n…" keeps its value in the same block.
      if (section === 'tickets' && remainder.length) {
        const tier = parseTier(remainder);
        if (tier) result.tickets.push(tier);
        else result.notes.push(...remainder.map(clean).filter(Boolean));
      }
      continue;
    }

    if (section === 'tickets') {
      const tier = parseTier(lines);
      if (tier) {
        // "FREE\nAll ticket holders have access until 4pm" — trailing general notes
        // inside the last tier stay with that tier unless they read as general.
        const generalAt = tier.note ? tier.note.search(/all ticket holders/i) : -1;
        if (tier.note && generalAt !== -1) {
          result.notes.push(tier.note.slice(generalAt).trim());
          tier.note = tier.note.slice(0, generalAt).trim() || null;
        }
        result.tickets.push(tier);
      } else {
        result.notes.push(...lines.map(clean).filter(Boolean));
      }
      continue;
    }

    if (section === 'skip') continue;
    aboutBlocks.push(clean(lines.join(' ')));
  }

  const paragraphs = aboutBlocks.filter(Boolean);
  // A one-line opener ("We're back in Oakleigh!") reads better with what follows it.
  if (paragraphs.length > 1 && paragraphs[0].length < 60) {
    paragraphs.splice(0, 2, `${paragraphs[0]} ${paragraphs[1]}`);
  }
  result.summary = paragraphs[0] || null;

  const about: string[] = [];
  paragraphs.slice(1).forEach((paragraph) => {
    const parts = sentences(paragraph);
    const hit = result.highlights.length === 0 ? parts.findIndex((sentence) => HIGHLIGHT.test(sentence)) : -1;
    if (hit === -1) { about.push(paragraph); return; }
    const before = parts.slice(0, hit).join(' ');
    const after = parts.slice(hit + 1).join(' ');
    if (before) about.push(before);
    result.highlights.push({ title: parts[hit], detail: after || null });
  });
  result.about = about;
  const searchable = paragraphs.join(' ');
  result.interests = INTERESTS.filter(([, pattern]) => pattern.test(searchable)).map(([label]) => label);
  return result;
}

/** Lowest paid ticket price, for "From $12" labels. Null when nothing is paid. */
export function lowestTicketPrice(tickets: EventTicketTier[]): number | null {
  const paid = tickets.map((ticket) => ticket.price).filter((price): price is number => price !== null && price > 0);
  return paid.length ? Math.min(...paid) : null;
}

export type DayTimelineLane = {
  tier: EventTicketTier;
  /** Where the entry bar starts and how wide it is, in percent of the day. */
  offset: number;
  width: number;
};

export type DayTimeline = {
  hours: { label: string; offset: number }[];
  lanes: DayTimelineLane[];
  /** Tiers with no entry window (on-door, free entry) shown beside the chart. */
  untimed: EventTicketTier[];
  marker: { label: string; offset: number } | null;
};

function hourLabel(minutes: number, edge: boolean) {
  const hour = Math.floor(minutes / 60);
  const display = hour % 12 || 12;
  return edge || hour === 12 ? `${display}${hour >= 12 ? 'pm' : 'am'}` : String(display);
}

/**
 * Lays ticket entry windows on one hour axis ("when do you want in?").
 * Needs at least two tiers with entry times; otherwise a plain list reads better.
 * `marker` is a timed highlight such as the 3pm giveaway.
 */
export function buildDayTimeline(
  tickets: EventTicketTier[],
  options: { dayStart?: number | null; dayEnd?: number | null; marker?: { label: string; minutes: number | null } | null } = {},
): DayTimeline | null {
  const timed = tickets.filter((tier) => tier.entryStart !== null && tier.entryEnd !== null && tier.entryEnd > tier.entryStart);
  if (timed.length < 2) return null;

  const starts = timed.map((tier) => tier.entryStart as number);
  const ends = timed.map((tier) => tier.entryEnd as number);
  if (options.dayStart != null) starts.push(options.dayStart);
  if (options.dayEnd != null) ends.push(options.dayEnd);
  const start = Math.floor(Math.min(...starts) / 60) * 60;
  const end = Math.ceil(Math.max(...ends) / 60) * 60;
  const span = end - start;
  if (span <= 0 || span > 16 * 60) return null;

  const at = (minutes: number) => Math.round(((minutes - start) / span) * 10000) / 100;
  const hours = [];
  for (let minutes = start; minutes <= end; minutes += 60) {
    hours.push({ label: hourLabel(minutes, minutes === start || minutes === end), offset: at(minutes) });
  }

  const markerMinutes = options.marker?.minutes ?? null;
  const marker = options.marker && markerMinutes !== null && markerMinutes > start && markerMinutes < end
    ? { label: options.marker.label, offset: at(markerMinutes) }
    : null;

  return {
    hours,
    lanes: timed.map((tier) => ({
      tier,
      offset: at(tier.entryStart as number),
      width: Math.round((at(tier.entryEnd as number) - at(tier.entryStart as number)) * 100) / 100,
    })),
    untimed: tickets.filter((tier) => !timed.includes(tier)),
    marker,
  };
}

/** Splits text into a short lead (whole sentences, about `max` characters) and the rest. */
export function splitLead(text: string, max = 170): { lead: string; rest: string | null } {
  const parts = sentences(text);
  let lead = parts[0] || text;
  let used = 1;
  // A short opener ("We're back in Oakleigh!") always takes the next sentence too.
  while (used < parts.length && (lead.length < 60 || lead.length + parts[used].length + 1 <= max)) {
    lead = `${lead} ${parts[used]}`;
    used += 1;
  }
  const rest = parts.slice(used).join(' ').trim();
  return { lead, rest: rest || null };
}

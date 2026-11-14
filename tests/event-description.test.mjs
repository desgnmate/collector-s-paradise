import assert from 'node:assert/strict';
import test from 'node:test';

const { parseEventDescription, lowestTicketPrice } = await import('../lib/events/description.ts');

// Real descriptions from published events (both ticket-list formats in use).
const LABELLED = "Gold Coast, Collector's Paradise brings you another fun day full of your favourite TCG, Sports Cards & Pop Culture. Whether you're interested in Pokemon, One Piece, Rifbound or Art we have it all under one roof!\r\n\r\nBuy, sell, trade, hunt for hidden gems, and connect with fellow collectors who share the same passion.\r\n\r\nDon't miss our FREE Giveaway Buffet at 3:00 PM! Every attendee is welcome to take part for the chance to receive a prize from a huge selection generously donated by our vendors and sponsors.\r\n\r\nLocation:\r\nPCYC Nerang\r\n61 Cayuga St, Nerang QLD 4211\r\n\r\nDate & Time:\r\nSunday, 15th of November 2026 I 9AM - 4PM\r\n\r\nTicket Options:\r\n\r\nSensory Hour (Limited Availability)\r\nPrice: $22\r\nEntry: 9:00 AM – 4:00 PM\r\nA quieter and less crowded environment for neurodivergent attendees, families, and anyone who prefers a calmer experience. Sensory Hour ticket holders enjoy all-day access to the event.\r\n\r\nVIP Admission (Limited Availability)\r\nPrice: $22\r\nEntry: 10:00 AM – 4:00 PM\r\nIncludes two hours of early access before General Admission for the best deals and a quieter shopping experience.\r\n\r\nGeneral Admission\r\nPrice: $12\r\nEntry: 12:00 PM – 4:00 PM\r\n\r\nGeneral Admission (On-Door Entry)\r\nPrice: $35\r\n\r\nKids Under 10 & Companion Card Holders\r\nFREE\r\nAll ticket holders have access until 4pm";

const INLINE = "We’re back in Oakleigh! \r\n\r\nCollector’s Paradise LVL UP will be an EPIC Melbourne where collectors, friends and family come together to celebrate trading card games and collectibles! \r\n\r\nSpend the day exploring Art, Pokémon, One Piece, Dragon Ball, Yu-Gi-Oh!, sports cards, stickers, trinkets, games, food + drinks, and so much more!\r\n\r\nBuy, sell, trade, hunt for hidden gems, and connect with fellow collectors who share the same passion.\r\n\r\nExpect interactive activities, free giveaways and all-day fun :)\r\n\r\n🎟️ TICKET OPTIONS\r\n\r\n🌿 Sensory Hour (Limited Availability): $22\r\nEntry 9:00AM – 4:00PM\r\nA quieter, less crowded start for neurodivergent attendees, families, and anyone who prefers a calmer experience. Includes all-day access.\r\n\r\n⭐ VIP Admission (Limited Availability): $22\r\nEntry 10:00AM – 4:00PM\r\nTwo hours of early access before General Admission for the best deals and a quieter shopping experience.\r\n\r\n🎫 General Admission: $12\r\nEntry 12:00PM – 4:00PM\r\n\r\n🚪 General Admission (On-Door): $35\r\n\r\n👶 Kids 10 & Under + Companion Card Holders: FREE\r\n(Must be accompanying a paying ticket holder)";

const ADELAIDE = "Adelaide, we’re bringing Collector’s Paradise to you for our first ever Adelaide Collectibles Market on Sunday 7 March 2027.\n\nSpend the day buying, selling and trading with vendors and fellow collectors. Browse sports cards, Pokémon, Riftbound, One Piece, Magic: The Gathering, Yu-Gi-Oh!, vintage collectibles and more. There’ll also be our unique giveaway buffet, quest cards and major prizes!\n\nWhether you’re hunting for a card to complete your set or just getting into the hobby, this event is for you!";

test('labelled ticket lists become tiers; location and date sections are dropped', () => {
  const parsed = parseEventDescription(LABELLED);
  assert.match(parsed.summary, /^Gold Coast, Collector's Paradise brings you/);
  assert.deepEqual(parsed.tickets.map((tier) => [tier.name, tier.priceLabel, tier.entry, tier.limited]), [
    ['Sensory Hour', '$22', '9:00 am – 4:00 pm', true],
    ['VIP Admission', '$22', '10:00 am – 4:00 pm', true],
    ['General Admission', '$12', '12:00 pm – 4:00 pm', false],
    ['General Admission (On-Door Entry)', '$35', null, false],
    ['Kids Under 10 & Companion Card Holders', 'Free', null, false],
  ]);
  assert.match(parsed.tickets[0].note, /quieter and less crowded/);
  assert.deepEqual(parsed.notes, ['All ticket holders have access until 4pm']);
  assert.deepEqual(parsed.highlights, [{
    title: "Don't miss our FREE Giveaway Buffet at 3:00 PM!",
    detail: 'Every attendee is welcome to take part for the chance to receive a prize from a huge selection generously donated by our vendors and sponsors.',
  }]);
  assert.ok(!parsed.about.join(' ').includes('Cayuga'), 'location section is not repeated in About');
  assert.ok(!parsed.about.join(' ').includes('Price:'), 'tickets are not repeated in About');
  assert.deepEqual(parsed.interests, ['Pokémon', 'One Piece', 'Riftbound', 'Sports cards', 'Art']);
  assert.equal(lowestTicketPrice(parsed.tickets), 12);
});

test('inline "Name: $22" tiers with emoji are parsed the same way', () => {
  const parsed = parseEventDescription(INLINE);
  assert.match(parsed.summary, /^We’re back in Oakleigh! Collector’s Paradise LVL UP/, 'a one-line opener joins the next paragraph');
  assert.deepEqual(parsed.tickets.map((tier) => [tier.name, tier.price, tier.entry]), [
    ['Sensory Hour', 22, '9:00 am – 4:00 pm'],
    ['VIP Admission', 22, '10:00 am – 4:00 pm'],
    ['General Admission', 12, '12:00 pm – 4:00 pm'],
    ['General Admission (On-Door)', 35, null],
    ['Kids 10 & Under + Companion Card Holders', 0, null],
  ]);
  assert.equal(parsed.tickets[4].note, 'Must be accompanying a paying ticket holder');
  assert.ok(parsed.tickets.every((tier) => !/\p{Extended_Pictographic}/u.test(tier.name)), 'emoji are stripped from names');
  assert.match(parsed.highlights[0].title, /free giveaways/);
});

test('the highlight is the sentence that mentions the giveaway, not its paragraph opener', () => {
  const parsed = parseEventDescription(ADELAIDE);
  assert.equal(parsed.highlights[0].title, 'There’ll also be our unique giveaway buffet, quest cards and major prizes!');
  assert.match(parsed.about[0], /^Spend the day buying/);
  assert.ok(parsed.about[0].endsWith('vintage collectibles and more.'));
  assert.equal(parsed.tickets.length, 0);
  assert.ok(parsed.interests.includes('Magic: The Gathering'));
  assert.ok(parsed.interests.includes('Vintage'));
});

test('empty and plain descriptions degrade gracefully', () => {
  assert.deepEqual(parseEventDescription(''), { summary: null, interests: [], highlights: [], tickets: [], notes: [], about: [] });
  const plain = parseEventDescription('Our 1st ever 2 Day Show here at gold coast!');
  assert.equal(plain.summary, 'Our 1st ever 2 Day Show here at gold coast!');
  assert.deepEqual([plain.about, plain.tickets, plain.highlights], [[], [], []]);
  assert.equal(lowestTicketPrice([]), null);
});

test('closing brackets stay with their sentence', () => {
  const parsed = parseEventDescription('Come enjoy our Autumn Edition, where collectors, friends and family all come together!\n\nThere will be food on the day to purchase (maybe some given out for free as giveaway!) See you there.');
  assert.equal(parsed.highlights[0].title, 'There will be food on the day to purchase (maybe some given out for free as giveaway!)');
  assert.equal(parsed.highlights[0].detail, 'See you there.');
});

test('entry windows become a day timeline with the giveaway marked', async () => {
  const { buildDayTimeline, findClockMinutes } = await import('../lib/events/description.ts');
  const parsed = parseEventDescription(LABELLED);
  assert.deepEqual(parsed.tickets.slice(0, 3).map((tier) => [tier.entryStart, tier.entryEnd]), [[540, 960], [600, 960], [720, 960]]);
  assert.equal(findClockMinutes(parsed.highlights[0].title), 900);

  const timeline = buildDayTimeline(parsed.tickets, { dayStart: 540, dayEnd: 960, marker: { label: 'Giveaway', minutes: 900 } });
  assert.deepEqual(timeline.hours.map((hour) => hour.label), ['9am', '10', '11', '12pm', '1', '2', '3', '4pm']);
  assert.deepEqual(timeline.lanes.map((lane) => [lane.tier.name, lane.offset, lane.width]), [
    ['Sensory Hour', 0, 100],
    ['VIP Admission', 14.29, 85.71],
    ['General Admission', 42.86, 57.14],
  ]);
  assert.deepEqual(timeline.untimed.map((tier) => tier.name), ['General Admission (On-Door Entry)', 'Kids Under 10 & Companion Card Holders']);
  assert.deepEqual(timeline.marker, { label: 'Giveaway', offset: 85.71 });

  assert.equal(buildDayTimeline(parseEventDescription(ADELAIDE).tickets), null, 'no entry windows, no timeline');
});

test('the hero lead keeps whole sentences and never stops at a one-line opener', async () => {
  const { splitLead } = await import('../lib/events/description.ts');
  const ep4 = splitLead(parseEventDescription(LABELLED).summary);
  assert.equal(ep4.lead, "Gold Coast, Collector's Paradise brings you another fun day full of your favourite TCG, Sports Cards & Pop Culture.");
  assert.match(ep4.rest, /^Whether you're interested/);
  const oakleigh = splitLead(parseEventDescription(INLINE).summary);
  assert.match(oakleigh.lead, /^We’re back in Oakleigh! Collector’s Paradise LVL UP/);
  assert.equal(splitLead('Short and sweet.').rest, null);
});

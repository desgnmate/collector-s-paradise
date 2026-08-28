import assert from 'node:assert/strict';
import test from 'node:test';

const {
  formatPromotionDate,
  formatPromotionTime,
  getEventStartTimeMs,
} = await import('../lib/event-promotion.ts');

test('promotion dates and times use Australian event formatting', () => {
  assert.equal(formatPromotionDate('2026-09-19'), '19 September 2026');
  assert.equal(formatPromotionTime('10:00:00'), '10:00 am');
});

test('event countdown target respects Melbourne daylight saving', () => {
  assert.equal(
    new Date(getEventStartTimeMs('2026-09-19', '10:00:00')).toISOString(),
    '2026-09-19T00:00:00.000Z',
  );
  assert.equal(
    new Date(getEventStartTimeMs('2026-11-15', '09:00:00')).toISOString(),
    '2026-11-14T22:00:00.000Z',
  );
});

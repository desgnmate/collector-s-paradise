const assert = require('node:assert/strict');

function getEffectiveEventStatus(event, today) {
  return event.event_date < today && event.status !== 'cancelled'
    ? 'completed'
    : event.status;
}

assert.equal(getEffectiveEventStatus({ event_date: '2026-06-07', status: 'upcoming' }, '2026-08-03'), 'completed');
assert.equal(getEffectiveEventStatus({ event_date: '2026-06-27', status: 'active' }, '2026-08-03'), 'completed');
assert.equal(getEffectiveEventStatus({ event_date: '2026-08-03', status: 'upcoming' }, '2026-08-03'), 'upcoming');
assert.equal(getEffectiveEventStatus({ event_date: '2026-08-04', status: 'upcoming' }, '2026-08-03'), 'upcoming');
assert.equal(getEffectiveEventStatus({ event_date: '2026-06-07', status: 'cancelled' }, '2026-08-03'), 'cancelled');

console.log('event status checks: passed');

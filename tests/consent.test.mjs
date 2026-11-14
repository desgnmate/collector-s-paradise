import assert from 'node:assert/strict';
import test from 'node:test';

const { parseConsent, serializeConsent, makeConsent, readCookie, CONSENT_VERSION } = await import('../lib/consent.ts');

test('a saved choice round-trips through the cookie value', () => {
  const state = makeConsent({ preferences: true, analytics: false }, 1700000000000);
  assert.deepEqual(parseConsent(serializeConsent(state)), state);
});

test('missing, malformed or outdated cookies mean no decision yet', () => {
  assert.equal(parseConsent(null), null);
  assert.equal(parseConsent('not-json'), null);
  assert.equal(parseConsent(encodeURIComponent(JSON.stringify({ version: CONSENT_VERSION + 1, preferences: true }))), null);
});

test('only an explicit true grants a category', () => {
  const parsed = parseConsent(encodeURIComponent(JSON.stringify({ version: CONSENT_VERSION, preferences: 'yes', analytics: 1 })));
  assert.deepEqual([parsed.preferences, parsed.analytics], [false, false]);
});

test('reads one cookie out of a document.cookie string', () => {
  assert.equal(readCookie('a=1; cp_consent=abc%3D; b=2', 'cp_consent'), 'abc%3D');
  assert.equal(readCookie('a=1', 'cp_consent'), null);
});

import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV = 'production';
process.env.RESEND_API_KEY = 're_test_closure_email';
process.env.RESEND_FROM_EMAIL = 'notifications@collectorsparadise.au';
process.env.ADMIN_EMAIL = 'admin@example.test';
process.env.NEXT_PUBLIC_APP_URL = 'https://collectorsparadise.example.test/';

const originalFetch = globalThis.fetch;
const requests = [];
let nextResponse;

globalThis.fetch = async (url, init) => {
  requests.push({
    url: String(url),
    headers: Object.fromEntries(new Headers(init?.headers).entries()),
    body: JSON.parse(String(init?.body)),
  });
  return new Response(JSON.stringify(nextResponse.body), {
    status: nextResponse.status,
    headers: { 'Content-Type': 'application/json' },
  });
};
test.after(() => { globalThis.fetch = originalFetch; });

const { sendApplicationsClosedEmails, APPLICATIONS_CLOSED_EMAIL_BATCH_SIZE } = await import('../lib/email.ts');

const applicant = (index, overrides = {}) => ({
  applicationId: `application-${index}`,
  eventId: 'event-1',
  recipientEmail: `vendor${index}@example.test`,
  businessName: `Business ${index}`,
  contactName: `Contact ${index}`,
  eventName: 'Melbourne Card Show',
  eventDate: '2027-03-14',
  replyTo: 'vendors@example.test',
  ...overrides,
});

test('sends one batch and maps provider results back to each applicant', async () => {
  requests.length = 0;
  nextResponse = {
    status: 200,
    body: { data: [{ id: 'email-a' }, { id: 'email-c' }], errors: [{ index: 1, message: 'Invalid `to` field.' }] },
  };

  const results = await sendApplicationsClosedEmails([
    applicant(0, { businessName: '<script>Shop</script>', contactName: '<b>Alex</b>' }),
    applicant(1, { recipientEmail: 'not-an-email' }),
    applicant(2, { replyTo: null, eventDate: null }),
  ], 'closure-key');

  assert.deepEqual(results, [
    { success: true, id: 'email-a' },
    { success: false, error: 'Invalid `to` field.' },
    { success: true, id: 'email-c' },
  ]);
  assert.equal(requests.length, 1);
  const [request] = requests;
  assert.match(request.url, /\/emails\/batch$/);
  assert.equal(request.headers['idempotency-key'], 'closure-key');
  assert.equal(request.headers['x-batch-validation'], 'permissive');
  assert.equal(request.body.length, 3);

  const [first, , third] = request.body;
  assert.equal(first.to, 'vendor0@example.test');
  assert.equal(first.subject, 'Vendor applications closed — Melbourne Card Show');
  assert.equal(first.reply_to, 'vendors@example.test');
  assert.deepEqual(first.tags, [
    { name: 'application_id', value: 'application-0' },
    { name: 'event_id', value: 'event-1' },
  ]);
  assert.match(first.html, /All vendor spots for this event have now been filled/);
  assert.match(first.html, /not able to offer/);
  assert.match(first.html, /Sunday 14 March 2027|Sunday, 14 March 2027/);
  assert.match(first.html, /href="https:\/\/collectorsparadise\.example\.test\/events"/);
  assert.doesNotMatch(first.html, /<script>|<b>Alex<\/b>/);
  assert.match(first.html, /&lt;script&gt;Shop&lt;\/script&gt;/);
  assert.match(first.text, /not able to offer Shop a place/);
  assert.equal(third.reply_to, 'admin@example.test');
  assert.doesNotMatch(third.html, /\(null\)|undefined/);
});

test('an accepted batch is never reported as failed when IDs cannot be matched', async () => {
  requests.length = 0;
  nextResponse = { status: 200, body: { data: [{ id: 'only-one' }] } };
  const results = await sendApplicationsClosedEmails([applicant(0), applicant(1)], 'closure-key-2');
  assert.deepEqual(results, [{ success: true, id: '' }, { success: true, id: '' }]);
});

test('a provider error fails every applicant so the admin can retry', async () => {
  requests.length = 0;
  nextResponse = {
    status: 403,
    body: { name: 'validation_error', message: 'Domain is not verified', statusCode: 403 },
  };
  const results = await sendApplicationsClosedEmails([applicant(0), applicant(1)], 'closure-key-3');
  assert.deepEqual(results, [
    { success: false, error: 'Domain is not verified' },
    { success: false, error: 'Domain is not verified' },
  ]);
});

test('oversized, empty and unconfigured sends never reach the provider', async () => {
  requests.length = 0;
  assert.deepEqual(await sendApplicationsClosedEmails([], 'unused'), []);
  const tooMany = Array.from({ length: APPLICATIONS_CLOSED_EMAIL_BATCH_SIZE + 1 }, (_, index) => applicant(index));
  const oversized = await sendApplicationsClosedEmails(tooMany, 'unused');
  assert.equal(oversized.length, tooMany.length);
  assert.ok(oversized.every((result) => !result.success));

  const key = process.env.RESEND_API_KEY;
  delete process.env.RESEND_API_KEY;
  try {
    assert.deepEqual(await sendApplicationsClosedEmails([applicant(0)], 'unused'), [
      { success: false, error: 'Resend not configured' },
    ]);
  } finally {
    process.env.RESEND_API_KEY = key;
  }
  assert.equal(requests.length, 0);
});

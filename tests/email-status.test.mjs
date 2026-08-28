import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV = 'production';
process.env.RESEND_API_KEY = 're_test_email_status';
process.env.RESEND_FROM_EMAIL = 'notifications@collectorsparadise.au';

const originalFetch = globalThis.fetch;
const requests = [];
let providerError = false;

globalThis.fetch = async (url, init) => {
  requests.push({
    url: String(url),
    headers: Object.fromEntries(new Headers(init?.headers).entries()),
    body: JSON.parse(String(init?.body)),
  });

  if (providerError) {
    return new Response(JSON.stringify({
      name: 'validation_error',
      message: 'Rejected by provider',
      statusCode: 422,
    }), {
      status: 422,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ id: `email-${requests.length}` }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

const {
  sendApprovalEmail,
  sendRejectionEmail,
  sendWaitlistEmail,
} = await import('../lib/email.ts');

test('application status helpers send safe, idempotent messages and surface provider errors', async () => {
  try {
    const approval = await sendApprovalEmail(
      'applicant@example.test',
      'Test Organisation',
      'Alex Applicant',
      'approval-key',
    );
    const rejection = await sendRejectionEmail(
      'applicant@example.test',
      '<script>Organisation</script>',
      '<b>Alex</b>',
      '<img src=x onerror=alert(1)>',
      'Test Event',
      'rejection-key',
    );
    const waitlist = await sendWaitlistEmail(
      'applicant@example.test',
      'Test Organisation',
      'Alex Applicant',
      'Test <Event>',
      'waitlist-key',
    );

    assert.deepEqual(approval, { success: true, id: 'email-1' });
    assert.deepEqual(rejection, { success: true, id: 'email-2' });
    assert.deepEqual(waitlist, { success: true, id: 'email-3' });
    assert.equal(requests.length, 3);
    assert.deepEqual(
      requests.map((request) => request.body.subject),
      [
        "Application approved — Collector's Paradise",
        "Application Status Update — Collector's Paradise",
        "Application waitlisted — Collector's Paradise",
      ],
    );
    assert.deepEqual(
      requests.map((request) => request.headers['idempotency-key']),
      ['approval-key', 'rejection-key', 'waitlist-key'],
    );
    assert.match(requests[1].body.html, /&lt;script&gt;Organisation&lt;\/script&gt;/);
    assert.match(requests[1].body.html, /&lt;b&gt;Alex&lt;\/b&gt;/);
    assert.match(requests[1].body.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.doesNotMatch(requests[1].body.text, /<strong>|<script>|<img/);
    assert.match(requests[2].body.html, /Test &lt;Event&gt;/);

    providerError = true;
    const failure = await sendRejectionEmail(
      'applicant@example.test',
      'Test Organisation',
      'Alex Applicant',
    );
    assert.deepEqual(failure, { success: false, error: 'Rejected by provider' });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

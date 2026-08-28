import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV = 'production';
process.env.RESEND_API_KEY = 're_test_email_status';
process.env.RESEND_FROM_EMAIL = 'notifications@collectorsparadise.au';
process.env.ADMIN_EMAIL = 'admin@example.test';
process.env.NEXT_PUBLIC_APP_URL = 'https://collectorsparadise.example.test';

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
  sendReportNotificationEmail,
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
    const reportNotification = await sendReportNotificationEmail({
      id: 'fd3e0f2f-c488-407e-8fb8-6ead5f8ba401',
      ticket_number: 'CP-REP-20260828-ABC12345',
      reporter_name: '<b>Jamie Reporter</b>',
      reporter_email: 'jamie@example.test',
      category: 'website_bug',
      impact: 'high',
      priority: 'high',
      subject: '<script>Checkout is broken</script>',
      description: '<img src=x onerror=alert(1)> The button does not work.',
      page_url: 'https://collectorsparadise.example.test/events/test',
      browser_details: 'Test Browser <unsafe>',
      status: 'new',
      admin_notes: null,
      admin_notification_status: 'pending',
      admin_notification_resend_id: null,
      admin_notification_error: null,
      admin_notification_attempt_count: 0,
      admin_notification_sent_at: null,
      created_at: '2026-08-28T00:00:00.000Z',
      updated_at: '2026-08-28T00:00:00.000Z',
      resolved_at: null,
    }, 'report-key');

    assert.deepEqual(approval, { success: true, id: 'email-1' });
    assert.deepEqual(rejection, { success: true, id: 'email-2' });
    assert.deepEqual(waitlist, { success: true, id: 'email-3' });
    assert.deepEqual(reportNotification, { success: true, id: 'email-4' });
    assert.equal(requests.length, 4);
    assert.deepEqual(
      requests.map((request) => request.body.subject),
      [
        "Application approved — Collector's Paradise",
        "Application Status Update — Collector's Paradise",
        "Application waitlisted — Collector's Paradise",
        '[CP-REP-20260828-ABC12345] Blocking: Checkout is broken',
      ],
    );
    assert.deepEqual(
      requests.map((request) => request.headers['idempotency-key']),
      ['approval-key', 'rejection-key', 'waitlist-key', 'report-key'],
    );
    assert.match(requests[1].body.html, /&lt;script&gt;Organisation&lt;\/script&gt;/);
    assert.match(requests[1].body.html, /&lt;b&gt;Alex&lt;\/b&gt;/);
    assert.match(requests[1].body.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.doesNotMatch(requests[1].body.text, /<strong>|<script>|<img/);
    assert.match(requests[2].body.html, /Test &lt;Event&gt;/);
    assert.equal(requests[3].body.to, 'admin@example.test');
    assert.equal(requests[3].body.reply_to, 'jamie@example.test');
    assert.match(requests[3].body.html, /&lt;script&gt;Checkout is broken&lt;\/script&gt;/);
    assert.match(requests[3].body.html, /&lt;img src=x onerror=alert\(1\)&gt;/);
    assert.doesNotMatch(requests[3].body.text, /<script>|<img/);
    assert.match(requests[3].body.text, /\/admin\/reports/);

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

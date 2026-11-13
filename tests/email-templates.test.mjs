import assert from 'node:assert/strict';
import test from 'node:test';

process.env.NODE_ENV = 'production';
process.env.RESEND_API_KEY = 're_test_email_templates';
process.env.RESEND_FROM_EMAIL = 'notifications@collectorsparadise.au';
process.env.ADMIN_EMAIL = 'admin@example.test';
process.env.NEXT_PUBLIC_APP_URL = 'https://collectorsparadise.example.test';

const originalFetch = globalThis.fetch;
const requests = [];

globalThis.fetch = async (url, init) => {
  requests.push({
    url: String(url),
    headers: Object.fromEntries(new Headers(init?.headers).entries()),
    body: JSON.parse(String(init?.body)),
  });
  return new Response(JSON.stringify({ id: `email-${requests.length}` }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};

const {
  sendApprovalEmail,
  sendReportReceiptEmail,
  sendSponsorApplicationEmails,
  sendVendorInvitationEmail,
  sendVendorReviewRequestAdminEmail,
  sendVolunteerApplicationEmails,
} = await import('../lib/email.ts');

test.after(() => {
  globalThis.fetch = originalFetch;
});

const byRecipient = (to) => requests.find((request) => request.body.to === to || request.body.to?.[0] === to);

test('every template uses the shared branded layout', async () => {
  requests.length = 0;
  await sendApprovalEmail('a@example.test', 'Org', 'Alex', 'layout-key');
  const { html } = requests[0].body;
  assert.match(html, /^<!DOCTYPE html>/);
  assert.match(html, /https:\/\/www\.collectorsparadise\.au\/images\/email-logo\.png/);
  assert.match(html, /<meta name="color-scheme" content="light">/);
  assert.match(html, /href="https:\/\/collectorsparadise\.example\.test\/events"/);
});

test('sponsor applications send an applicant receipt and an admin alert', async () => {
  requests.length = 0;
  const result = await sendSponsorApplicationEmails({
    sponsorId: '0f8e2c1a-1111-4222-8333-444455556666',
    recipientEmail: 'sponsor@example.test',
    companyName: '<script>Acme</script>',
    contactName: 'Sam <b>Sponsor</b>',
    tier: 'Gold ($2,500+)',
    interests: ['Prize Donation'],
    brandDescription: 'We make card sleeves.',
  }, 'sponsor-key');

  assert.equal(result.applicant.success, true);
  assert.equal(result.admin.success, true);
  const applicant = byRecipient('sponsor@example.test');
  const admin = byRecipient('admin@example.test');
  assert.equal(applicant.headers['idempotency-key'], 'sponsor-key-applicant');
  assert.equal(admin.headers['idempotency-key'], 'sponsor-key-admin');
  assert.equal(admin.body.reply_to, 'sponsor@example.test');
  assert.match(applicant.body.html, /CP-S-0F8E2C1A/);
  assert.match(applicant.body.html, /&lt;script&gt;Acme&lt;\/script&gt;/);
  assert.doesNotMatch(applicant.body.html, /<script>|<b>Sponsor/);
  assert.doesNotMatch(applicant.body.text, /<script>|<b>/);
  assert.match(admin.body.html, /\/admin\/sponsors/);
});

test('volunteer applications send a receipt and an admin alert', async () => {
  requests.length = 0;
  const result = await sendVolunteerApplicationEmails({
    volunteerId: 'aa11bb22-1111-4222-8333-444455556666',
    recipientEmail: 'helper@example.test',
    fullName: 'Riley Helper',
    roles: ['Registration Desk'],
    availability: 'Saturdays\n8am to 2pm',
  }, 'volunteer-key');

  assert.equal(result.applicant.success, true);
  assert.equal(result.admin.success, true);
  const applicant = byRecipient('helper@example.test');
  assert.match(applicant.body.subject, /Volunteer application received/);
  assert.match(applicant.body.html, /Thanks for offering to help, Riley/);
  assert.match(applicant.body.text, /Saturdays\n8am to 2pm/);
});

test('volunteer status emails do not say "your application for <their own name>"', async () => {
  requests.length = 0;
  await sendApprovalEmail('helper@example.test', 'Riley Helper', 'Riley Helper', 'vol-approve', 'volunteer');
  assert.match(requests[0].body.text, /your volunteer application has been approved/);
  assert.doesNotMatch(requests[0].body.text, /application for Riley Helper/);
});

test('report receipts go to the reporter with their ticket number', async () => {
  requests.length = 0;
  const result = await sendReportReceiptEmail({
    id: 'r1',
    ticket_number: 'CP-REP-20261114-ABCD1234',
    reporter_name: 'Jamie',
    reporter_email: 'jamie@example.test',
    subject: 'Broken <link>',
    category: 'website_bug',
    impact: 'low',
  }, 'receipt-key');
  assert.equal(result.success, true);
  assert.equal(requests[0].body.to, 'jamie@example.test');
  assert.match(requests[0].body.subject, /CP-REP-20261114-ABCD1234/);
  assert.match(requests[0].body.html, /Broken &lt;link&gt;/);
});

test('review-queue submissions alert the admin only', async () => {
  requests.length = 0;
  await sendVendorReviewRequestAdminEmail({
    reviewRequestId: '9c0f-review',
    kind: 'directory',
    businessName: 'Holo Hunters',
    contactName: 'Sam',
    vendorEmail: 'sam@example.test',
    eventNames: [],
  });
  assert.equal(requests.length, 1);
  assert.equal(requests[0].body.to, 'admin@example.test');
  assert.equal(requests[0].body.reply_to, 'sam@example.test');
  assert.match(requests[0].body.html, /Directory registration/);
});

test('invitations drop payment links that are not http(s)', async () => {
  requests.length = 0;
  await sendVendorInvitationEmail({
    applicationId: 'app', eventId: 'evt', vendorEmail: 'v@example.test', businessName: 'Shop',
    contactName: 'Alex', eventName: 'VMAX', eventDate: '2026-10-03', startTime: '09:00', endTime: '17:00',
    venue: null, venueAddress: null, boothAssignment: null, tablesRequested: '1', powerRequirements: 'none',
    approvedVendorFee: 150, tablePrice: 150, powerFee: 0, responseDeadline: null, loadInTime: null,
    paymentLink: 'javascript:alert(1)', contactEmail: null, instructions: null,
  }, 'unsafe-link');
  assert.doesNotMatch(requests[0].body.html, /javascript:/);
  assert.doesNotMatch(requests[0].body.html, /Confirm your place/);
  assert.doesNotMatch(requests[0].body.text, /javascript:/);
});

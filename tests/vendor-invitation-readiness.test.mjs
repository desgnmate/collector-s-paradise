import assert from 'node:assert/strict';
import test from 'node:test';

const { getVendorInvitationReadinessIssues } = await import('../lib/vendor-invitation.ts');

test('paid invitations require contact, deadline, and payment configuration', () => {
  assert.deepEqual(getVendorInvitationReadinessIssues({
    vendor_contact_email: null,
    vendor_response_deadline: null,
    vendor_payment_link: null,
  }, 150), [
    'Add a working vendor contact email.',
    'Add a vendor confirmation deadline.',
    'Add a payment or confirmation link for the vendor fee.',
  ]);
});

test('free invitations do not require a payment link', () => {
  assert.deepEqual(getVendorInvitationReadinessIssues({
    vendor_contact_email: 'vendors@example.test',
    vendor_response_deadline: '2026-09-10',
    vendor_payment_link: null,
  }, 0), []);
});

test('fully configured paid invitations are ready to send', () => {
  assert.deepEqual(getVendorInvitationReadinessIssues({
    vendor_contact_email: 'vendors@example.test',
    vendor_response_deadline: '2026-09-10',
    vendor_payment_link: 'https://payments.example.test/vendor',
  }, 150), []);
});

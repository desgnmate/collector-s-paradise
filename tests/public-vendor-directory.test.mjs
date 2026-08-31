import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const sqlFiles = [
  'supabase/migrations/add_public_vendor_directory.sql',
  'lib/supabase/public_vendor_directory.sql',
  'supabase/migrations/20260901010000_fix_vendor_visibility_and_email_tracking.sql',
];

test('every maintained public vendor directory exposes approved applications only', async () => {
  for (const file of sqlFiles) {
    const sql = await readFile(new URL(`../${file}`, import.meta.url), 'utf8');

    assert.doesNotMatch(
      sql,
      /application\.application_status\s*<>\s*'rejected'/i,
      `${file} must not publish pending or waitlisted applications`,
    );
    assert.match(
      sql,
      /application\.event_id\s*=\s*p_event_id[\s\S]*application\.application_status\s*=\s*'approved'/i,
      `${file} must require event-specific approval`,
    );
    assert.match(
      sql,
      /vendor\.application_status\s*=\s*'approved'[\s\S]*NOT EXISTS/i,
      `${file} must preserve approved legacy vendors without event applications`,
    );
    assert.match(
      sql,
      /WHERE application\.vendor_id = vendor\.id[\s\S]*application\.application_status\s*=\s*'approved'/i,
      `${file} must exclude non-approved applications from returned JSON`,
    );
  }
});

test('the deployment migration adds durable application receipt tracking', async () => {
  const sql = await readFile(
    new URL('../supabase/migrations/20260901010000_fix_vendor_visibility_and_email_tracking.sql', import.meta.url),
    'utf8',
  );

  for (const column of [
    'application_receipt_status',
    'application_receipt_sent_at',
    'application_receipt_last_attempt_at',
    'application_receipt_attempt_count',
    'application_receipt_resend_id',
    'application_receipt_error',
  ]) {
    assert.match(sql, new RegExp(`ADD COLUMN IF NOT EXISTS ${column}`, 'i'));
  }
});

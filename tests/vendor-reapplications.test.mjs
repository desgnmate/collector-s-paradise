import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const sqlPaths = [
  'supabase/migrations/add_vendor_event_applications.sql',
  'supabase/migrations/fix_vendor_reapplications.sql',
  'supabase/migrations/20260831000000_harden_vendor_reapplications.sql',
  'lib/supabase/vendor_event_applications.sql',
];

const normalizeBusinessName = (value) => value.trim().replace(/\s+/g, ' ').toLowerCase();
const normalizeEmail = (value) => value.trim().toLowerCase();

function resolveVendor(rows, businessName, email) {
  const normalizedBusinessName = normalizeBusinessName(businessName);
  const normalizedEmail = normalizeEmail(email);
  const exactProfile = rows.find((row) => (
    normalizeBusinessName(row.business_name) === normalizedBusinessName
    && normalizeEmail(row.email) === normalizedEmail
  ));

  if (exactProfile) return { kind: 'existing', vendorId: exactProfile.id };

  const hasBusinessConflict = rows.some(
    (row) => normalizeBusinessName(row.business_name) === normalizedBusinessName,
  );
  const hasEmailConflict = rows.some(
    (row) => normalizeEmail(row.email) === normalizedEmail,
  );

  return hasBusinessConflict || hasEmailConflict
    ? { kind: 'conflict' }
    : { kind: 'new' };
}

async function readSql(relativePath) {
  return readFile(`${projectRoot}/${relativePath}`, 'utf8');
}

function extractSubmissionFunction(sql) {
  const match = sql.match(
    /CREATE FUNCTION public\.submit_vendor_with_events\([\s\S]*?\n\$\$;/,
  );
  assert.ok(match, 'submit_vendor_with_events function must be present');
  return match[0].replace(/\s+/g, ' ').trim();
}

test('an exact normalized profile wins over unrelated legacy partial matches', () => {
  const rows = [
    { id: 'older-name-match', business_name: 'Raid Ready', email: 'old@example.test' },
    { id: 'exact-profile', business_name: '  RAID   READY ', email: 'raid@example.test ' },
    { id: 'older-email-match', business_name: 'Former Trading Name', email: 'RAID@example.test' },
  ];

  assert.deepEqual(resolveVendor(rows, 'Raid Ready', 'raid@example.test'), {
    kind: 'existing',
    vendorId: 'exact-profile',
  });
});

test('a partial identity match remains a conflict', () => {
  const rows = [
    { id: 'existing', business_name: 'Raid Ready', email: 'owner@example.test' },
  ];

  assert.deepEqual(resolveVendor(rows, 'Raid Ready', 'different@example.test'), {
    kind: 'conflict',
  });
});

test('every maintained SQL definition preserves safe multi-event reapplications', async () => {
  for (const relativePath of sqlPaths) {
    const sql = await readSql(relativePath);

    assert.match(sql, /normalized_business_name TEXT;/, `${relativePath}: canonical business variable`);
    assert.match(sql, /normalized_email TEXT;/, `${relativePath}: canonical email variable`);
    assert.match(
      sql,
      /lower\(regexp_replace\(btrim\(business_name\), '\[\[:space:\]\]\+', ' ', 'g'\)\) = normalized_business_name\s+AND lower\(btrim\(email\)\) = normalized_email/,
      `${relativePath}: exact normalized name+email lookup`,
    );
    assert.match(sql, /pg_advisory_xact_lock/, `${relativePath}: concurrent identity lock`);
    assert.match(
      sql,
      /DROP POLICY IF EXISTS "Anyone can apply as vendor" ON public\.vendors/,
      `${relativePath}: direct public inserts cannot bypass the RPC`,
    );
    assert.match(
      sql,
      /ON CONFLICT \(vendor_id, event_id\) DO NOTHING/,
      `${relativePath}: same-event submissions stay idempotent`,
    );
    assert.match(
      sql,
      /'already_applied', cardinality\(inserted_event_ids\) = 0/,
      `${relativePath}: caller receives duplicate-event status`,
    );
  }
});

test('schema definitions enforce one application per vendor and event', async () => {
  for (const relativePath of [
    'supabase/migrations/add_vendor_event_applications.sql',
    'lib/supabase/vendor_event_applications.sql',
  ]) {
    assert.match(
      await readSql(relativePath),
      /UNIQUE \(vendor_id, event_id\)/,
      `${relativePath}: vendor/event uniqueness constraint`,
    );
  }
});

test('fresh-install and follow-up SQL keep the same submission function', async () => {
  const definitions = await Promise.all(
    sqlPaths.map(async (relativePath) => extractSubmissionFunction(await readSql(relativePath))),
  );

  for (const definition of definitions.slice(1)) {
    assert.equal(definition, definitions[0]);
  }
});

import assert from 'node:assert/strict';
import test from 'node:test';
import {
  ADMIN_VENDOR_COLUMNS,
  loadAdminVendorRows,
  vendorLogoRoute,
} from '../lib/admin/vendor-rows.ts';

const INLINE_LOGO = `data:image/png;base64,${'A'.repeat(4096)}`;
const TABLE = [
  { id: 'inline', business_name: 'Inline Logo Co', logo_url: INLINE_LOGO },
  { id: 'hosted', business_name: 'Hosted Logo Co', logo_url: 'https://cdn.example/logo.png' },
  { id: 'none', business_name: 'No Logo Co', logo_url: null },
];

/** Minimal stand-in for the two PostgREST reads the loader performs. */
function fakeSupabase({ logoError = null, rowError = null } = {}) {
  const calls = [];
  return {
    calls,
    from(table) {
      const call = { table, select: '', or: null };
      calls.push(call);
      const query = {
        select(columns) { call.select = columns; return query; },
        or(filter) { call.or = filter; return query; },
        order() { return query; },
        then(resolve) {
          const columns = call.select.split(',').map((column) => column.trim());
          const isLogoLookup = call.or !== null;
          if (isLogoLookup && logoError) return resolve({ data: null, error: logoError });
          if (!isLogoLookup && rowError) return resolve({ data: null, error: rowError });
          const rows = TABLE
            // The lookup filter excludes inline images, as Postgres would.
            .filter((row) => !isLogoLookup || !row.logo_url?.startsWith('data:'))
            .map((row) => Object.fromEntries(columns.filter((column) => column in row).map((column) => [column, row[column]])));
          return resolve({ data: rows, error: null });
        },
      };
      return query;
    },
  };
}

test('admin vendor reads never select the logo column alongside vendor rows', async () => {
  assert.doesNotMatch(ADMIN_VENDOR_COLUMNS, /logo_url/);

  const supabase = fakeSupabase();
  await loadAdminVendorRows(supabase);

  const logoReads = supabase.calls.filter((call) => /logo_url/.test(call.select));
  assert.equal(logoReads.length, 1);
  assert.match(logoReads[0].or, /logo_url\.not\.like\."data:%"/, 'the logo lookup must exclude inline images in the database');
});

test('inline logos become the logo route while hosted and missing logos pass through', async () => {
  const { data, error } = await loadAdminVendorRows(fakeSupabase());

  assert.equal(error, null);
  assert.deepEqual(
    Object.fromEntries(data.map((vendor) => [vendor.id, vendor.logo_url])),
    { inline: vendorLogoRoute('inline'), hosted: 'https://cdn.example/logo.png', none: null },
  );
  assert.equal(vendorLogoRoute('inline'), '/api/vendors/inline/logo');
  assert.doesNotMatch(JSON.stringify(data), /data:image/);
});

test('a failed logo lookup falls back to the logo route instead of failing the vendor list', async (t) => {
  t.mock.method(console, 'error', () => {});
  const { data, error } = await loadAdminVendorRows(fakeSupabase({ logoError: { message: 'timeout' } }));

  assert.equal(error, null);
  assert.deepEqual(data.map((vendor) => vendor.logo_url), ['inline', 'hosted', 'none'].map(vendorLogoRoute));
});

test('a failed vendor read is reported to the caller', async () => {
  const { data, error } = await loadAdminVendorRows(fakeSupabase({ rowError: { message: 'boom' } }));

  assert.equal(data, null);
  assert.equal(error.message, 'boom');
});

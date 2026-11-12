import type { SupabaseClient } from '@supabase/supabase-js';
import type { Vendor } from '@/app/actions/vendors';

export type AdminVendorRow = Omit<Vendor, 'event_applications'>;

type QueryError = { code?: string; message: string };

/**
 * Vendor columns for admin reads. `logo_url` is deliberately absent: legacy
 * rows hold inline base64 `data:` images of several MB each, which made one
 * admin snapshot ~27 MB. Logos are resolved by `loadAdminVendorRows` instead.
 */
export const ADMIN_VENDOR_COLUMNS = 'id, business_name, contact_name, email, phone, location_state, description, categories, social_links, tables_requested, power_requirements, additional_notes, application_status, application_receipt_status, application_receipt_sent_at, application_receipt_last_attempt_at, application_receipt_attempt_count, application_receipt_resend_id, application_receipt_error, booth_assignment, event_id, rejection_reason, applied_at';

// Matches only rows whose logo is missing or a hosted URL, so Postgres never
// returns an inline image. The pattern is quoted because `:` is reserved in
// PostgREST logic filters.
const SMALL_LOGO_FILTER = 'logo_url.is.null,logo_url.not.like."data:%"';

/** Route that streams a vendor's stored logo, inline or hosted. */
export function vendorLogoRoute(vendorId: string): string {
  return `/api/vendors/${vendorId}/logo`;
}

/**
 * Loads every vendor for the admin with `logo_url` already safe to send to the
 * browser: a hosted URL, null, or the logo route for an inline image.
 */
export async function loadAdminVendorRows(
  supabase: SupabaseClient,
): Promise<{ data: AdminVendorRow[]; error: null } | { data: null; error: QueryError }> {
  const [rows, logos] = await Promise.all([
    supabase
      .from('vendors')
      .select(ADMIN_VENDOR_COLUMNS)
      .order('applied_at', { ascending: false }),
    supabase
      .from('vendors')
      .select('id, logo_url')
      .or(SMALL_LOGO_FILTER)
      .order('applied_at', { ascending: false }),
  ]);

  if (rows.error) return { data: null, error: rows.error };

  // A vendor missing from this lookup has an inline logo. If the lookup itself
  // fails, every vendor falls back to the route, which also handles hosted and
  // missing logos, so a logo problem never blocks the vendor list.
  if (logos.error) console.error('Error fetching vendor logo references:', logos.error.message);
  const smallLogos = new Map<string, string | null>(
    ((logos.data || []) as { id: string; logo_url: string | null }[])
      .map((row) => [row.id, row.logo_url || null]),
  );

  const data = ((rows.data || []) as unknown as Omit<AdminVendorRow, 'logo_url'>[]).map((row) => {
    const smallLogo = smallLogos.get(row.id);
    return {
      ...row,
      logo_url: smallLogo === undefined ? vendorLogoRoute(row.id) : smallLogo,
    };
  });

  return { data, error: null };
}

'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sendNewApplicationEmail, sendApprovalEmail, sendRejectionEmail } from '@/lib/email';
import { getEventMarketDate } from '@/lib/event-date';

// ============================================
// Types
// ============================================
export type VendorApplicationStatus = 'pending' | 'approved' | 'rejected' | 'waitlisted';

export type VendorEventApplication = {
  id: string;
  vendor_id: string;
  event_id: string;
  application_status: VendorApplicationStatus;
  tables_requested: string | null;
  power_requirements: string | null;
  booth_assignment: string | null;
  rejection_reason: string | null;
  applied_at: string;
  updated_at: string;
  event_name: string;
  event_date: string;
  event_venue: string | null;
};

export type Vendor = {
  id: string;
  business_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  description: string | null;
  categories: string[];
  logo_url: string | null;
  social_links: string | null;
  tables_requested: string | null;
  power_requirements: string | null;
  additional_notes: string | null;
  application_status: VendorApplicationStatus;
  booth_assignment: string | null;
  event_id: string | null;
  event_name?: string | null;
  event_applications: VendorEventApplication[];
  rejection_reason: string | null;
  location_state: string;
  applied_at: string;
};

export type VendorManagementEvent = {
  id: string;
  title: string;
  event_date: string;
  venue: string | null;
  status: string;
  applications: Array<VendorEventApplication & { vendor: Vendor }>;
};

// Column selection for admin queries - only fetch what's needed
const ADMIN_VENDOR_COLUMNS = 'id, business_name, contact_name, email, phone, location_state, description, categories, logo_url, social_links, tables_requested, power_requirements, additional_notes, application_status, booth_assignment, event_id, rejection_reason, applied_at';

async function attachEventApplications(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  vendors: Omit<Vendor, 'event_applications'>[],
): Promise<Vendor[]> {
  if (vendors.length === 0) return [];

  const { data: applications, error } = await supabase
    .from('vendor_event_applications')
    .select('id, vendor_id, event_id, application_status, tables_requested, power_requirements, booth_assignment, rejection_reason, applied_at, updated_at, events(title, event_date, venue)')
    .in('vendor_id', vendors.map((vendor) => vendor.id))
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('Error fetching vendor event applications:', JSON.stringify(error, null, 2));
    return vendors.map((vendor) => ({
      ...vendor,
      event_name: null,
      event_applications: [],
    }));
  }

  const byVendor = new Map<string, VendorEventApplication[]>();
  for (const row of applications || []) {
    const eventValue = row.events as unknown as { title: string; event_date: string; venue: string | null } | { title: string; event_date: string; venue: string | null }[] | null;
    const event = Array.isArray(eventValue) ? eventValue[0] : eventValue;
    const application: VendorEventApplication = {
      id: row.id,
      vendor_id: row.vendor_id,
      event_id: row.event_id,
      application_status: row.application_status,
      tables_requested: row.tables_requested,
      power_requirements: row.power_requirements,
      booth_assignment: row.booth_assignment,
      rejection_reason: row.rejection_reason,
      applied_at: row.applied_at,
      updated_at: row.updated_at,
      event_name: event?.title || 'Deleted event',
      event_date: event?.event_date || '',
      event_venue: event?.venue || null,
    };
    byVendor.set(row.vendor_id, [...(byVendor.get(row.vendor_id) || []), application]);
  }

  return vendors.map((vendor) => {
    const eventApplications = byVendor.get(vendor.id) || [];
    return {
      ...vendor,
      event_name: eventApplications.map((application) => application.event_name).join(', ') || null,
      event_applications: eventApplications,
    };
  });
}

// ============================================
// Validation Schema
// ============================================
const vendorApplicationSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').max(200),
  contact_name: z.string().min(1, 'Contact name is required').max(200),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  location_state: z.string().min(1, 'Please select your state'),
  description: z.string().min(10, 'Please provide at least a brief description of your business').max(1000),
  categories: z.array(z.string()).min(1, 'Please select at least one category'),
  social_links: z.string().min(1, 'Social media link is required').url('Please enter a valid URL'),
  tables_requested: z.string().min(1, 'Please select the number of tables'),
  power_requirements: z.string().optional(),
  additional_notes: z.string().optional(),
  event_ids: z.array(z.string().uuid('Please select valid events')).min(1, 'Please select at least one event'),
  agreement: z.literal(true).refine((val) => val === true, { message: 'You must agree to the Terms and Conditions' }),
});

const MAX_LOGO_SIZE = 5 * 1024 * 1024;
const ALLOWED_LOGO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);
const LOGO_EXTENSION_BY_TYPE: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
};

type VendorApplicationFields = {
  business_name: string;
  contact_name: string;
  email: string;
  phone: string;
  location_state: string;
  description: string;
  social_links: string;
  tables_requested: string;
  power_requirements: string;
  additional_notes: string;
  event_ids: string[];
  agreement: boolean;
};

type ActionState = {
  message: string;
  errors?: Record<string, string[]>;
  success?: boolean;
  fields?: Partial<VendorApplicationFields>;
};

/** Verify the current user is an admin — returns error message or null if OK */
async function verifyAdmin(): Promise<string | null> {
  const supabase = await createSupabaseServerClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return 'Authentication required.';

  const { data: adminRecord } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!adminRecord) return 'Admin access required.';

  return null;
}

// Admin update schema — more lenient than the application form
const vendorUpdateSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').max(200),
  contact_name: z.string().min(1, 'Contact name is required').max(200),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional().default(''),
  location_state: z.string().min(1, 'Please select a state'),
  description: z.string().max(1000).optional().default(''),
  categories: z.array(z.string()).min(1, 'Please select at least one category'),
  social_links: z.string().optional().default(''),
  tables_requested: z.string().optional().default(''),
  power_requirements: z.string().optional().default(''),
  additional_notes: z.string().optional().default(''),
  booth_assignment: z.string().optional().default(''),
});

export type VendorUpdateData = z.infer<typeof vendorUpdateSchema>;

function isStorageSetupError(message: string) {
  const normalized = message.toLowerCase();
  return (
    normalized.includes('security policy') ||
    normalized.includes('row-level security') ||
    normalized.includes('not found') ||
    normalized.includes('bucket')
  );
}

function isDatabaseSetupError(error: { code?: string; message?: string }) {
  const code = error.code || '';
  const message = error.message || '';
  return (
    ['42883', '42P01', '42703', 'PGRST202'].includes(code) ||
    /function .* does not exist|relation .* does not exist|column .* does not exist|schema cache/i.test(message)
  );
}

// ============================================
// Public Actions
// ============================================

async function sendToGoogleSheet(data: Record<string, unknown>): Promise<{ success: boolean; error?: string }> {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) return { success: false, error: 'GOOGLE_SHEET_WEBHOOK_URL not configured' };

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      return { success: false, error: `Sheet webhook returned HTTP ${res.status}` };
    }

    const body = await res.json();
    if (body && body.success === false) {
      return { success: false, error: body.error || 'Sheet webhook returned failure' };
    }

    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Unknown sheet sync error' };
  }
}

export async function syncAllVendorsToSheet() {
  'use server';
  const adminError = await verifyAdmin();
  if (adminError) return { success: false, message: adminError };

  const supabase = await createSupabaseServerClient();
  const { data: vendors, error } = await supabase
    .from('vendors')
    .select(ADMIN_VENDOR_COLUMNS)
    .order('applied_at', { ascending: false });

  if (error || !vendors) return { success: false, message: 'Failed to fetch vendors.' };

  const vendorsWithApplications = await attachEventApplications(
    supabase,
    vendors as Omit<Vendor, 'event_applications'>[],
  );
  let synced = 0;

  for (const vendor of vendorsWithApplications) {
    const rows = vendor.event_applications.length > 0
      ? vendor.event_applications
      : [{
          id: 'legacy',
          event_id: vendor.event_id || '',
          event_name: vendor.event_name || '',
          tables_requested: vendor.tables_requested,
          power_requirements: vendor.power_requirements,
          booth_assignment: vendor.booth_assignment,
          application_status: vendor.application_status,
          applied_at: vendor.applied_at,
        }];

    for (const application of rows) {
      const result = await sendToGoogleSheet({
        id: vendor.id,
        application_id: application.event_id
          ? `${vendor.id}:${application.event_id}`
          : `${vendor.id}:general`,
        business_name: vendor.business_name,
        contact_name: vendor.contact_name,
        email: vendor.email,
        phone: vendor.phone || '',
        location_state: vendor.location_state || '',
        categories: vendor.categories || [],
        event_id: application.event_id || '',
        event_name: application.event_name || '',
        tables_requested: application.tables_requested || '',
        power_requirements: application.power_requirements || '',
        social_links: vendor.social_links || '',
        description: vendor.description || '',
        logo_url: vendor.logo_url || '',
        additional_notes: vendor.additional_notes || '',
        booth_assignment: application.booth_assignment || '',
        application_status: application.application_status,
        applied_at: application.applied_at || vendor.applied_at || new Date().toISOString(),
      });

      if (!result.success) {
        return { success: false, message: `Failed to sync "${vendor.business_name}" for "${application.event_name || 'general'}": ${result.error}` };
      }
      synced++;
    }
  }

  return { success: true, message: `${synced} vendor event applications synced to spreadsheet.` };
}

/** Submit a vendor application (publicly accessible) */
export async function submitVendorApplication(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
  const supabase = await createSupabaseServerClient();
  const categories = formData.getAll('categories') as string[];
  const eventIds = [...new Set(formData.getAll('event_ids').map(String))];
  const logo = formData.get('logo') as File | null;
  const fields: VendorApplicationFields = {
    business_name: String(formData.get('business_name') || ''),
    contact_name: String(formData.get('contact_name') || ''),
    email: String(formData.get('email') || ''),
    phone: String(formData.get('phone') || ''),
    location_state: String(formData.get('location_state') || ''),
    description: String(formData.get('description') || ''),
    social_links: String(formData.get('social_links') || ''),
    tables_requested: String(formData.get('tables_requested') || ''),
    power_requirements: String(formData.get('power_requirements') || ''),
    additional_notes: String(formData.get('additional_notes') || ''),
    event_ids: eventIds,
    agreement: formData.get('agreement') === 'on',
  };

  const validatedFields = vendorApplicationSchema.safeParse({
    ...fields,
    phone: fields.phone || undefined,
    categories,
    power_requirements: fields.power_requirements || undefined,
    additional_notes: fields.additional_notes || undefined,
  });

  if (!validatedFields.success) {
    return { message: 'Please fix the errors below.', errors: validatedFields.error.flatten().fieldErrors, fields };
  }
  if (!logo || logo.size === 0) return { message: 'A business logo or profile avatar is required.', fields };
  if (logo.size > MAX_LOGO_SIZE) return { message: 'Logo file size must be less than 5MB.', fields };
  if (!ALLOWED_LOGO_TYPES.has(logo.type)) return { message: 'Logo must be a JPG, PNG, WebP, or GIF image.', fields };

  const { data: selectedEvents, error: eventError } = await supabase
    .from('events')
    .select('id, title')
    .in('id', validatedFields.data.event_ids)
    .gte('event_date', getEventMarketDate())
    .eq('status', 'upcoming');

  if (eventError || selectedEvents?.length !== validatedFields.data.event_ids.length) {
    return { message: 'One or more selected events are no longer available.', fields };
  }

  const vendorId = crypto.randomUUID();
  const filePath = `${vendorId}/logo-${Date.now()}.${LOGO_EXTENSION_BY_TYPE[logo.type]}`;
  const { error: uploadError } = await supabase.storage.from('vendor_logos').upload(
    filePath,
    await logo.arrayBuffer(),
    { contentType: logo.type, cacheControl: '3600', upsert: false },
  );

  if (uploadError) {
    console.error('Upload error:', uploadError);
    return {
      message: isStorageSetupError(uploadError.message)
        ? 'We could not upload your logo right now. Please contact support so we can finish your application.'
        : 'Failed to upload the logo file. Please try submitting again or contact support.',
      fields,
    };
  }

  const logoUrl = supabase.storage.from('vendor_logos').getPublicUrl(filePath).data.publicUrl;
  const { data: submissionData, error: dbError } = await supabase.rpc('submit_vendor_with_events', {
    p_vendor_id: vendorId,
    p_business_name: validatedFields.data.business_name,
    p_contact_name: validatedFields.data.contact_name,
    p_email: validatedFields.data.email,
    p_phone: validatedFields.data.phone || '',
    p_location_state: validatedFields.data.location_state,
    p_description: validatedFields.data.description,
    p_categories: validatedFields.data.categories,
    p_logo_url: logoUrl,
    p_social_links: validatedFields.data.social_links,
    p_tables_requested: validatedFields.data.tables_requested,
    p_power_requirements: validatedFields.data.power_requirements || '',
    p_additional_notes: validatedFields.data.additional_notes || '',
    p_event_ids: validatedFields.data.event_ids,
  });

  if (dbError) {
    console.error('Error submitting vendor application:', JSON.stringify(dbError, null, 2));
    await supabase.storage.from('vendor_logos').remove([filePath]);
    if (isDatabaseSetupError(dbError)) {
      return { message: 'Database setup incomplete. Please contact support.', fields };
    }
    const normalizedMessage = dbError.message.toLowerCase();
    if (dbError.code === '22023' && normalizedMessage.includes('unavailable')) {
      return { message: 'One or more selected events are no longer accepting vendor applications. Refresh the page and choose an available event.', fields };
    }
    if (dbError.code === '23505' && normalizedMessage.includes('already applied')) {
      return { message: 'You have already applied to one or more selected events. Choose a different event or contact support.', fields };
    }
    if (dbError.code === '23505') {
      return { message: 'These business details conflict with an existing vendor profile. Use the same business name and email, or contact support.', fields };
    }
    return { message: 'Something went wrong while saving your application. Please contact support.', fields };
  }

  const savedApplication = submissionData && typeof submissionData === 'object'
    ? submissionData as {
        vendor_id?: string;
        logo_url?: string;
        uploaded_logo_used?: boolean;
        inserted_event_ids?: string[];
        already_applied?: boolean;
      }
    : null;
  const savedVendorId = savedApplication?.vendor_id || vendorId;
  const savedLogoUrl = savedApplication?.logo_url || logoUrl;
  const insertedEventIds = savedApplication?.inserted_event_ids || validatedFields.data.event_ids;

  if (savedApplication?.uploaded_logo_used === false) {
    const { error: cleanupError } = await supabase.storage.from('vendor_logos').remove([filePath]);
    if (cleanupError) console.error('Failed to remove unused repeat-application logo:', cleanupError);
  }

  const eventNames = new Map((selectedEvents || []).map((event) => [event.id, event.title]));
  if (insertedEventIds.length > 0) {
    sendNewApplicationEmail(
      validatedFields.data.email,
      validatedFields.data.business_name,
      validatedFields.data.contact_name,
    ).catch((err) => console.error('Failed to send application emails:', err));
  }

  for (const eventId of insertedEventIds) {
    sendToGoogleSheet({
      id: savedVendorId,
      application_id: `${savedVendorId}:${eventId}`,
      business_name: validatedFields.data.business_name,
      contact_name: validatedFields.data.contact_name,
      email: validatedFields.data.email,
      phone: validatedFields.data.phone || '',
      location_state: validatedFields.data.location_state,
      categories: validatedFields.data.categories,
      tables_requested: validatedFields.data.tables_requested,
      power_requirements: validatedFields.data.power_requirements || '',
      social_links: validatedFields.data.social_links,
      description: validatedFields.data.description,
      logo_url: savedLogoUrl,
      additional_notes: validatedFields.data.additional_notes || '',
      event_id: eventId,
      event_name: eventNames.get(eventId) || '',
      booth_assignment: '',
      application_status: 'pending',
      applied_at: new Date().toISOString(),
    }).catch((err) => console.error('Failed to push to Google Sheet:', err));
  }

  revalidatePath('/admin/vendors');
  if (savedApplication?.already_applied) {
    return { message: 'Your application for the selected event is already on file.', success: true };
  }
  return { message: 'Application submitted securely. We will review each selected event and contact you by email.', success: true };
  } catch (error) {
    console.error('Vendor application error:', error);
    return {
      message: 'Something went wrong while submitting your application. Please try again or contact support.',
      success: false,
    };
  }
}

/** Get one public-safe page of unassigned vendors or event applicants. */
export async function getApprovedVendors(
  page = 1,
  perPage = 6,
  eventId?: string,
  unassignedOnly = true,
): Promise<{ vendors: Partial<Vendor>[]; totalCount: number }> {
  const supabase = await createSupabaseServerClient();
  const safePage = Number.isInteger(page) && page > 0 ? page : 1;
  const safePerPage = Number.isInteger(perPage) && perPage > 0 ? Math.min(perPage, 48) : 6;
  const validatedEventId = eventId ? z.string().uuid().safeParse(eventId) : null;
  if (eventId && !validatedEventId?.success) return { vendors: [], totalCount: 0 };

  const { data, error } = await supabase.rpc('get_public_vendor_directory', {
    p_event_id: eventId || null,
    p_unassigned_only: eventId ? false : unassignedOnly,
    p_offset: (safePage - 1) * safePerPage,
    p_limit: safePerPage,
  });

  if (error) {
    if (error.code !== 'PGRST202') {
      console.error('Error fetching public vendor directory:', JSON.stringify(error, null, 2));
      return { vendors: [], totalCount: 0 };
    }

    // ponytail: compatibility path only returns legacy-approved profiles; remove
    // after add_public_vendor_directory.sql is applied to every environment.
    if (eventId) return { vendors: [], totalCount: 0 };
    const from = (safePage - 1) * safePerPage;
    const { data: fallbackData, count, error: fallbackError } = await supabase
      .from('vendors')
      .select('id, business_name, contact_name, description, categories, logo_url, social_links', { count: 'exact' })
      .eq('application_status', 'approved')
      .order('business_name', { ascending: true })
      .range(from, from + safePerPage - 1);

    if (fallbackError) {
      console.error('Error fetching fallback vendor directory:', JSON.stringify(fallbackError, null, 2));
      return { vendors: [], totalCount: 0 };
    }

    return {
      vendors: (fallbackData || []).map((vendor) => ({
        ...vendor,
        event_applications: [],
      })),
      totalCount: count || 0,
    };
  }

  const vendors = (data || []).map((row: Record<string, unknown>) => ({
    id: String(row.id),
    business_name: String(row.business_name),
    contact_name: String(row.contact_name),
    description: row.description ? String(row.description) : null,
    categories: Array.isArray(row.categories) ? row.categories.map(String) : [],
    logo_url: row.logo_url ? String(row.logo_url) : null,
    social_links: row.social_links ? String(row.social_links) : null,
    booth_assignment: row.booth_assignment ? String(row.booth_assignment) : null,
    event_applications: (Array.isArray(row.event_applications) ? row.event_applications : []).map((application: Record<string, unknown>) => ({
      id: String(application.id),
      vendor_id: String(application.vendor_id),
      event_id: String(application.event_id),
      application_status: application.application_status as VendorApplicationStatus,
      tables_requested: null,
      power_requirements: null,
      booth_assignment: application.booth_assignment ? String(application.booth_assignment) : null,
      rejection_reason: null,
      applied_at: '',
      updated_at: '',
      event_name: String(application.event_name || 'Event'),
      event_date: String(application.event_date || ''),
      event_venue: application.event_venue ? String(application.event_venue) : null,
    })),
  } satisfies Partial<Vendor>));

  return { vendors, totalCount: Number(data?.[0]?.total_count || 0) };
}

// ============================================
// Admin Actions
// ============================================

export async function getAllVendors(): Promise<Vendor[]> {
  const supabase = await createSupabaseServerClient();
  const adminError = await verifyAdmin();
  if (adminError) throw new Error(adminError);

  const { data, error } = await supabase
    .from('vendors')
    .select(ADMIN_VENDOR_COLUMNS)
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('Error fetching all vendors:', JSON.stringify(error, null, 2));
    return [];
  }
  return attachEventApplications(supabase, data as Omit<Vendor, 'event_applications'>[]);
}

const eventApplicationUpdateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected', 'waitlisted']),
  booth_assignment: z.string().max(100).optional().default(''),
  rejection_reason: z.string().max(1000).optional().default(''),
});

const assignVendorsSchema = z.object({
  vendor_ids: z.array(z.string().uuid()).min(1).max(500),
  event_ids: z.array(z.string().uuid()).min(1).max(20),
  starting_status: z.enum(['pending', 'approved', 'rejected', 'waitlisted', 'preserve']),
});

export async function assignVendorsToEvents(input: z.input<typeof assignVendorsSchema>): Promise<ActionState> {
  const adminError = await verifyAdmin();
  if (adminError) return { message: adminError };
  const validated = assignVendorsSchema.safeParse(input);
  if (!validated.success) return { message: 'Select at least one valid vendor and event.' };

  const supabase = await createSupabaseServerClient();
  const vendorIds = [...new Set(validated.data.vendor_ids)];
  const eventIds = [...new Set(validated.data.event_ids)];
  const [{ data: vendors, error: vendorError }, { data: events, error: eventError }] = await Promise.all([
    supabase
      .from('vendors')
      .select('id, application_status, tables_requested, power_requirements, applied_at')
      .in('id', vendorIds),
    supabase.from('events').select('id').in('id', eventIds),
  ]);

  if (vendorError || !vendors || vendors.length !== vendorIds.length) {
    return { message: 'One or more selected vendors no longer exist.' };
  }
  if (eventError || !events || events.length !== eventIds.length) {
    return { message: 'One or more selected events no longer exist.' };
  }

  const rows = vendors.flatMap((vendor) => eventIds.map((eventId) => ({
    vendor_id: vendor.id,
    event_id: eventId,
    application_status: validated.data.starting_status === 'preserve'
      ? vendor.application_status
      : validated.data.starting_status,
    tables_requested: vendor.tables_requested,
    power_requirements: vendor.power_requirements,
    applied_at: vendor.applied_at || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })));

  const { data: inserted, error } = await supabase
    .from('vendor_event_applications')
    .upsert(rows, { onConflict: 'vendor_id,event_id', ignoreDuplicates: true })
    .select('id');

  if (error) {
    console.error('Error assigning vendors to events:', JSON.stringify(error, null, 2));
    return { message: `Failed to assign vendors: ${error.message}` };
  }

  const created = inserted?.length || 0;
  const skipped = rows.length - created;
  revalidatePath('/admin/vendors');
  revalidatePath('/vendors');
  return {
    success: true,
    message: `${created} event assignment${created === 1 ? '' : 's'} created${skipped ? `; ${skipped} existing assignment${skipped === 1 ? '' : 's'} unchanged` : ''}.`,
  };
}

export async function updateVendorEventApplication(
  applicationId: string,
  input: z.input<typeof eventApplicationUpdateSchema>,
): Promise<ActionState> {
  const adminError = await verifyAdmin();
  if (adminError) return { message: adminError };
  const id = z.string().uuid().safeParse(applicationId);
  const validated = eventApplicationUpdateSchema.safeParse(input);
  if (!id.success || !validated.success) return { message: 'Invalid application update.' };

  const supabase = await createSupabaseServerClient();
  const { data: application, error: fetchError } = await supabase
    .from('vendor_event_applications')
    .select('id, vendors(email, business_name, contact_name), events(title)')
    .eq('id', applicationId)
    .maybeSingle();

  if (fetchError || !application) return { message: 'Vendor event application not found.' };

  const { error } = await supabase
    .from('vendor_event_applications')
    .update({
      application_status: validated.data.status,
      booth_assignment: validated.data.booth_assignment || null,
      rejection_reason: validated.data.status === 'rejected'
        ? validated.data.rejection_reason || null
        : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', applicationId);

  if (error) {
    console.error('Error updating vendor event application:', JSON.stringify(error, null, 2));
    return { message: `Failed to update application: ${error.message}` };
  }

  const vendorValue = application.vendors as unknown as { email: string; business_name: string; contact_name: string } | { email: string; business_name: string; contact_name: string }[] | null;
  const eventValue = application.events as unknown as { title: string } | { title: string }[] | null;
  const vendor = Array.isArray(vendorValue) ? vendorValue[0] : vendorValue;
  const event = Array.isArray(eventValue) ? eventValue[0] : eventValue;
  if (vendor && validated.data.status === 'approved') {
    sendApprovalEmail(vendor.email, vendor.business_name, vendor.contact_name, event?.title)
      .catch((emailError) => console.error('Failed to send approval email:', emailError));
  }
  if (vendor && validated.data.status === 'rejected') {
    sendRejectionEmail(vendor.email, vendor.business_name, vendor.contact_name, validated.data.rejection_reason || undefined, event?.title)
      .catch((emailError) => console.error('Failed to send rejection email:', emailError));
  }

  revalidatePath('/admin/vendors');
  revalidatePath('/vendors');
  return { success: true, message: `Application marked ${validated.data.status}.` };
}

export async function removeVendorEventApplication(applicationId: string): Promise<ActionState> {
  const adminError = await verifyAdmin();
  if (adminError) return { message: adminError };
  if (!z.string().uuid().safeParse(applicationId).success) return { message: 'Invalid application.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('vendor_event_applications').delete().eq('id', applicationId);
  if (error) return { message: `Failed to remove application: ${error.message}` };

  revalidatePath('/admin/vendors');
  revalidatePath('/vendors');
  return { success: true, message: 'Event application removed.' };
}

export async function updateVendor(vendorId: string, data: VendorUpdateData): Promise<ActionState> {
  const adminError = await verifyAdmin();
  if (adminError) return { message: adminError };
  const id = z.string().uuid().safeParse(vendorId);
  const validated = vendorUpdateSchema.safeParse(data);
  if (!id.success || !validated.success) {
    return {
      message: 'Please fix the vendor profile fields.',
      errors: validated.success ? undefined : validated.error.flatten().fieldErrors,
    };
  }

  const supabase = await createSupabaseServerClient();
  const fields = validated.data;
  const { error } = await supabase.from('vendors').update({
    business_name: fields.business_name,
    contact_name: fields.contact_name,
    email: fields.email,
    phone: fields.phone || null,
    location_state: fields.location_state,
    description: fields.description || null,
    categories: fields.categories,
    social_links: fields.social_links || null,
    tables_requested: fields.tables_requested || null,
    power_requirements: fields.power_requirements || null,
    additional_notes: fields.additional_notes || null,
    booth_assignment: fields.booth_assignment || null,
  }).eq('id', vendorId);

  if (error) {
    if (error.code === '23505') return { message: 'This business name or email is already registered.' };
    return { message: `Failed to update vendor: ${error.message}` };
  }

  revalidatePath('/admin/vendors');
  revalidatePath('/vendors');
  return { success: true, message: 'Vendor profile updated.' };
}

export async function deleteVendor(vendorId: string): Promise<ActionState> {
  const adminError = await verifyAdmin();
  if (adminError) return { message: adminError };
  if (!z.string().uuid().safeParse(vendorId).success) return { message: 'Invalid vendor.' };

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.from('vendors').delete().eq('id', vendorId);
  if (error) return { message: `Failed to delete vendor: ${error.message}` };

  revalidatePath('/admin/vendors');
  revalidatePath('/vendors');
  return { success: true, message: 'Vendor and all event applications deleted.' };
}

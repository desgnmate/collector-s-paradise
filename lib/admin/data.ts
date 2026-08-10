import 'server-only';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { getEffectiveEventStatus } from '@/lib/events/status';
import type { Vendor, VendorEventApplication } from '@/app/actions/vendors';
import type { Volunteer } from '@/app/actions/volunteers';
import type { Sponsor } from '@/app/actions/sponsors';
import type { Event } from '@/app/actions/events';

export const ADMIN_DATA_SECTIONS = ['vendors', 'volunteers', 'sponsors', 'events'] as const;

export type AdminDataSection = (typeof ADMIN_DATA_SECTIONS)[number];

export type AdminDataSnapshot = {
  vendors?: Vendor[];
  volunteers?: Volunteer[];
  sponsors?: Sponsor[];
  events?: Event[];
  errors: Partial<Record<AdminDataSection, string>>;
  syncedAt: number;
};

type SupabaseServerClient = Awaited<ReturnType<typeof createSupabaseServerClient>>;

const ADMIN_VENDOR_COLUMNS = 'id, business_name, contact_name, email, phone, location_state, description, categories, logo_url, social_links, tables_requested, power_requirements, additional_notes, application_status, booth_assignment, event_id, rejection_reason, applied_at';
const ADMIN_VOLUNTEER_COLUMNS = 'id, full_name, email, phone, preferred_roles, availability, previous_experience, events_interested, t_shirt_size, emergency_contact_name, emergency_contact_phone, additional_notes, how_heard_about, application_status, rejection_reason, assigned_event_id, applied_at, updated_at';
const ADMIN_SPONSOR_COLUMNS = 'id, company_name, website, industry, company_size, contact_name, contact_email, contact_phone, contact_position, sponsorship_tier, sponsorship_interest, previous_sponsor, sponsorship_history, logo_url, brand_description, social_media_links, marketing_goals, events_interested, preferred_booth_size, additional_services, budget_range, custom_proposal, additional_notes, how_heard_about, application_status, rejection_reason, assigned_account_manager, contract_sent, contract_signed, payment_received, applied_at, updated_at';
const ADMIN_EVENT_COLUMNS = 'id, title, description, event_date, start_time, end_time, venue, venue_address, status, capacity, tickets_sold, ticket_price, cover_image_url, booking_link, created_at, updated_at';

function normalizeAdminEvent(event: Event): Event {
  return {
    ...event,
    status: getEffectiveEventStatus(event),
    cover_image_url: event.cover_image_url?.startsWith('data:')
      ? `/api/events/${event.id}/cover`
      : event.cover_image_url,
  };
}

async function requireAdminClient(): Promise<SupabaseServerClient> {
  const supabase = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    throw new Error('Authentication required.');
  }

  const { data: adminRecord, error: adminError } = await supabase
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (adminError || !adminRecord) {
    throw new Error('Admin access required.');
  }

  return supabase;
}

async function loadVendors(supabase: SupabaseServerClient): Promise<Vendor[]> {
  const { data, error } = await supabase
    .from('vendors')
    .select(ADMIN_VENDOR_COLUMNS)
    .order('applied_at', { ascending: false });

  if (error) throw error;

  const vendors = (data || []) as Omit<Vendor, 'event_applications'>[];
  if (vendors.length === 0) return [];

  const { data: applications, error: applicationsError } = await supabase
    .from('vendor_event_applications')
    .select('id, vendor_id, event_id, application_status, tables_requested, power_requirements, booth_assignment, rejection_reason, applied_at, updated_at, events(title, event_date, venue)')
    .in('vendor_id', vendors.map((vendor) => vendor.id))
    .order('applied_at', { ascending: false });

  if (applicationsError) throw applicationsError;

  const byVendor = new Map<string, VendorEventApplication[]>();
  for (const row of applications || []) {
    const eventValue = row.events as unknown as {
      title: string;
      event_date: string;
      venue: string | null;
    } | Array<{
      title: string;
      event_date: string;
      venue: string | null;
    }> | null;
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

async function loadVolunteers(supabase: SupabaseServerClient): Promise<Volunteer[]> {
  const { data, error } = await supabase
    .from('volunteers')
    .select(ADMIN_VOLUNTEER_COLUMNS)
    .order('applied_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Volunteer[];
}

async function loadSponsors(supabase: SupabaseServerClient): Promise<Sponsor[]> {
  const { data, error } = await supabase
    .from('sponsors')
    .select(ADMIN_SPONSOR_COLUMNS)
    .order('applied_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Sponsor[];
}

async function loadEvents(supabase: SupabaseServerClient): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select(ADMIN_EVENT_COLUMNS)
    .order('event_date', { ascending: false });

  if (error) throw error;
  return ((data || []) as Event[]).map(normalizeAdminEvent);
}

const sectionLoaders: Record<AdminDataSection, (supabase: SupabaseServerClient) => Promise<unknown>> = {
  vendors: loadVendors,
  volunteers: loadVolunteers,
  sponsors: loadSponsors,
  events: loadEvents,
};

/**
 * Loads one authenticated admin snapshot with a single auth check. Individual
 * database reads run concurrently, and failed sections do not erase good data.
 */
export async function loadAdminDataSnapshot(
  requestedSections: readonly AdminDataSection[] = ADMIN_DATA_SECTIONS,
): Promise<AdminDataSnapshot> {
  const sections = [...new Set(requestedSections)];
  const supabase = await requireAdminClient();
  const results = await Promise.allSettled(
    sections.map((section) => sectionLoaders[section](supabase)),
  );
  const snapshot: AdminDataSnapshot = {
    errors: {},
    syncedAt: Date.now(),
  };

  results.forEach((result, index) => {
    const section = sections[index];
    if (result.status === 'rejected') {
      console.error(`Failed to sync admin ${section}:`, result.reason);
      snapshot.errors[section] = `Could not sync ${section}. Please try again.`;
      return;
    }

    if (section === 'vendors') snapshot.vendors = result.value as Vendor[];
    if (section === 'volunteers') snapshot.volunteers = result.value as Volunteer[];
    if (section === 'sponsors') snapshot.sponsors = result.value as Sponsor[];
    if (section === 'events') snapshot.events = result.value as Event[];
  });

  return snapshot;
}

'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { sendApprovalEmail, sendRejectionEmail, sendSponsorApplicationEmails, sendWaitlistEmail } from '@/lib/email';

// ============================================
// Types
// ============================================
export type Sponsor = {
  id: string;
  company_name: string;
  website: string | null;
  industry: string | null;
  company_size: string | null;
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  contact_position: string | null;
  sponsorship_tier: string | null;
  sponsorship_interest: string[] | null;
  previous_sponsor: boolean | null;
  sponsorship_history: string | null;
  logo_url: string | null;
  brand_description: string | null;
  social_media_links: string | null;
  marketing_goals: string | null;
  events_interested: string[] | null;
  preferred_booth_size: string | null;
  additional_services: string[] | null;
  budget_range: string | null;
  custom_proposal: string | null;
  additional_notes: string | null;
  how_heard_about: string | null;
  application_status: 'pending' | 'approved' | 'rejected' | 'waitlisted' | 'negotiating';
  rejection_reason: string | null;
  assigned_account_manager: string | null;
  contract_sent: boolean;
  contract_signed: boolean;
  payment_received: boolean;
  applied_at: string;
  updated_at: string;
};

// Column selection for admin queries
const ADMIN_SPONSOR_COLUMNS = 'id, company_name, website, industry, company_size, contact_name, contact_email, contact_phone, contact_position, sponsorship_tier, sponsorship_interest, previous_sponsor, sponsorship_history, logo_url, brand_description, social_media_links, marketing_goals, events_interested, preferred_booth_size, additional_services, budget_range, custom_proposal, additional_notes, how_heard_about, application_status, rejection_reason, assigned_account_manager, contract_sent, contract_signed, payment_received, applied_at, updated_at';

// ============================================
// Validation Schema
// ============================================
const optionalText = (max: number) => z.string().trim().max(max, `Please keep this under ${max} characters`).optional();
const httpUrl = z.string().trim()
  .url('Please enter a valid website URL')
  .refine((value) => /^https?:\/\//i.test(value), 'Website must start with http:// or https://');

const sponsorApplicationSchema = z.object({
  company_name: z.string().trim().min(1, 'Company name is required').max(200),
  website: httpUrl.optional().or(z.literal('')),
  industry: optionalText(200),
  company_size: optionalText(100),
  contact_name: z.string().trim().min(1, 'Contact name is required').max(200),
  contact_email: z.string().trim().toLowerCase().email('Please enter a valid email address').max(320),
  contact_phone: optionalText(50),
  contact_position: optionalText(200),
  sponsorship_tier: optionalText(100),
  sponsorship_interest: z.array(z.string().max(200)).min(1, 'Please select at least one sponsorship interest').max(20),
  previous_sponsor: z.boolean().optional(),
  sponsorship_history: optionalText(2000),
  brand_description: z.string().trim()
    .min(10, 'Please describe your brand in at least 10 characters')
    .max(1000, 'Please keep your brand description under 1000 characters'),
  social_media_links: optionalText(1000),
  marketing_goals: optionalText(2000),
  events_interested: z.array(z.string().max(200)).max(20).optional(),
  preferred_booth_size: optionalText(200),
  additional_services: z.array(z.string().max(200)).max(20).optional(),
  budget_range: optionalText(100),
  custom_proposal: optionalText(2000),
  additional_notes: optionalText(2000),
  how_heard_about: optionalText(200),
});

const SPONSOR_TIER_LABELS: Record<string, string> = {
  platinum: 'Platinum ($5,000+)',
  gold: 'Gold ($2,500+)',
  silver: 'Silver ($1,000+)',
  custom: 'Custom',
};

type ActionState = {
  message: string;
  errors?: Record<string, string[]>;
  success?: boolean;
  fields?: Record<string, unknown>;
  email_error?: string;
};

// ============================================
// Public Actions
// ============================================

/** Submit a sponsor application (publicly accessible) */
export async function submitSponsorApplication(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();

  const sponsorship_interest = formData.getAll('sponsorship_interest') as string[];
  const events_interested = formData.getAll('events_interested') as string[];
  const additional_services = formData.getAll('additional_services') as string[];

  const fields = {
    company_name: formData.get('company_name') as string || '',
    website: formData.get('website') as string || '',
    industry: formData.get('industry') as string || '',
    company_size: formData.get('company_size') as string || '',
    contact_name: formData.get('contact_name') as string || '',
    contact_email: formData.get('contact_email') as string || '',
    contact_phone: formData.get('contact_phone') as string || '',
    contact_position: formData.get('contact_position') as string || '',
    sponsorship_tier: formData.get('sponsorship_tier') as string || '',
    previous_sponsor: formData.get('previous_sponsor') === 'on',
    sponsorship_history: formData.get('sponsorship_history') as string || '',
    brand_description: formData.get('brand_description') as string || '',
    social_media_links: formData.get('social_media_links') as string || '',
    marketing_goals: formData.get('marketing_goals') as string || '',
    preferred_booth_size: formData.get('preferred_booth_size') as string || '',
    budget_range: formData.get('budget_range') as string || '',
    custom_proposal: formData.get('custom_proposal') as string || '',
    additional_notes: formData.get('additional_notes') as string || '',
    how_heard_about: formData.get('how_heard_about') as string || '',
  };

  const validatedFields = sponsorApplicationSchema.safeParse({
    company_name: fields.company_name,
    website: fields.website || undefined,
    industry: fields.industry || undefined,
    company_size: fields.company_size || undefined,
    contact_name: fields.contact_name,
    contact_email: fields.contact_email,
    contact_phone: fields.contact_phone || undefined,
    contact_position: fields.contact_position || undefined,
    sponsorship_tier: fields.sponsorship_tier || undefined,
    sponsorship_interest,
    previous_sponsor: fields.previous_sponsor,
    sponsorship_history: fields.sponsorship_history || undefined,
    brand_description: fields.brand_description,
    social_media_links: fields.social_media_links || undefined,
    marketing_goals: fields.marketing_goals || undefined,
    events_interested: events_interested.length > 0 ? events_interested : undefined,
    preferred_booth_size: fields.preferred_booth_size || undefined,
    additional_services: additional_services.length > 0 ? additional_services : undefined,
    budget_range: fields.budget_range || undefined,
    custom_proposal: fields.custom_proposal || undefined,
    additional_notes: fields.additional_notes || undefined,
    how_heard_about: fields.how_heard_about || undefined,
  });

  if (!validatedFields.success) {
    return {
      message: 'Please fix the errors below.',
      errors: validatedFields.error.flatten().fieldErrors,
      fields,
    };
  }

  // Spam trap: real visitors never see this field. Pretend success so bots move on.
  if (String(formData.get('fax_number') || '')) {
    return { success: true, message: 'Sponsorship application submitted successfully!' };
  }

  // Save Sponsor Record. Duplicate emails are caught by the table's unique
  // constraint (anonymous visitors cannot read the table to check first).
  const sponsorId = crypto.randomUUID();
  const { error: dbError } = await supabase.from('sponsors').insert({
    id: sponsorId,
    company_name: validatedFields.data.company_name,
    website: validatedFields.data.website || null,
    industry: validatedFields.data.industry || null,
    company_size: validatedFields.data.company_size || null,
    contact_name: validatedFields.data.contact_name,
    contact_email: validatedFields.data.contact_email,
    contact_phone: validatedFields.data.contact_phone || null,
    contact_position: validatedFields.data.contact_position || null,
    sponsorship_tier: validatedFields.data.sponsorship_tier || null,
    sponsorship_interest: validatedFields.data.sponsorship_interest,
    previous_sponsor: validatedFields.data.previous_sponsor ?? null,
    sponsorship_history: validatedFields.data.sponsorship_history || null,
    brand_description: validatedFields.data.brand_description,
    social_media_links: validatedFields.data.social_media_links || null,
    marketing_goals: validatedFields.data.marketing_goals || null,
    events_interested: validatedFields.data.events_interested || null,
    preferred_booth_size: validatedFields.data.preferred_booth_size || null,
    additional_services: validatedFields.data.additional_services || null,
    budget_range: validatedFields.data.budget_range || null,
    custom_proposal: validatedFields.data.custom_proposal || null,
    additional_notes: validatedFields.data.additional_notes || null,
    how_heard_about: validatedFields.data.how_heard_about || null,
    application_status: 'pending',
  });

  if (dbError) {
    console.error('Error submitting sponsor application:', JSON.stringify(dbError, null, 2));
    
    if (dbError.code === '42703') {
      return { 
        message: 'Database schema mismatch: One or more required columns are missing from the sponsors table. Please run the provided SQL migration in lib/supabase/sponsor_form_fields.sql in your Supabase SQL Editor.',
        fields
      };
    }
    
    if (dbError.code === '23505') {
      return {
        message: 'We already have a sponsorship application from this email address. Our team will be in touch — reply to your confirmation email if anything has changed.',
        errors: { contact_email: ['An application with this email already exists.'] },
        fields,
      };
    }

    return { message: 'Something went wrong while saving your application. Please try again, or email us if it keeps happening.', fields };
  }

  // Emails are best-effort: the application is saved even if a send fails.
  const data = validatedFields.data;
  await sendSponsorApplicationEmails({
    sponsorId,
    recipientEmail: data.contact_email,
    companyName: data.company_name,
    contactName: data.contact_name,
    contactPhone: data.contact_phone || null,
    website: data.website || null,
    tier: data.sponsorship_tier ? SPONSOR_TIER_LABELS[data.sponsorship_tier] || data.sponsorship_tier : null,
    interests: data.sponsorship_interest,
    budgetRange: data.budget_range || null,
    brandDescription: data.brand_description,
  }, `sponsor-application-${sponsorId}`);

  return {
    message: 'Sponsorship application submitted successfully! We\'ve emailed you a copy, and we\'ll get back to you within 2-3 business days.',
    success: true,
  };
}

// ============================================
// Admin Actions (require admin auth via middleware)
// ============================================

async function requireAdminClient() {
  const sessionClient = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError || !user) return null;

  const { data: adminRecord, error: adminError } = await sessionClient
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (adminError || !adminRecord) return null;
  return createSupabaseAdminClient();
}

/** Get all sponsors with full details (admin only) */
export async function getAllSponsors(): Promise<Sponsor[]> {
  const supabase = await requireAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('sponsors')
    .select(ADMIN_SPONSOR_COLUMNS)
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('Error fetching all sponsors:', JSON.stringify(error, null, 2));
    return [];
  }

  return data as Sponsor[];
}

/** Get pending sponsor applications (admin only) */
export async function getPendingSponsors(): Promise<Sponsor[]> {
  const supabase = await requireAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('sponsors')
    .select(ADMIN_SPONSOR_COLUMNS)
    .eq('application_status', 'pending')
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending sponsors:', JSON.stringify(error, null, 2));
    return [];
  }

  return data as Sponsor[];
}

/** Approve a sponsor application */
export async function approveSponsor(sponsorId: string): Promise<ActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) return { message: 'Admin access required.' };

  const updatedAt = new Date().toISOString();

  const { data: sponsor, error } = await supabase
    .from('sponsors')
    .update({ application_status: 'approved', rejection_reason: null, updated_at: updatedAt })
    .select('contact_email, company_name, contact_name')
    .eq('id', sponsorId)
    .neq('application_status', 'approved')
    .maybeSingle();

  if (error) {
    console.error('Error approving sponsor:', JSON.stringify(error, null, 2));
    return { message: `Failed to approve sponsor: ${error.message}` };
  }

  if (!sponsor) return { success: true, message: 'Sponsor is already approved.' };

  const emailResult = await sendApprovalEmail(
    sponsor.contact_email,
    sponsor.company_name,
    sponsor.contact_name,
    `sponsor-approved-${sponsorId}-${updatedAt}`,
    'sponsor',
  );
  if (!emailResult.success) {
    return {
      success: true,
      email_error: emailResult.error,
      message: `Sponsor approved, but the approval email failed: ${emailResult.error}`,
    };
  }

  return { success: true, message: 'Sponsor approved and approval email sent.' };
}

/** Reject a sponsor application */
export async function rejectSponsor(sponsorId: string, reason?: string): Promise<ActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) return { message: 'Admin access required.' };

  const updatedAt = new Date().toISOString();

  const { data: sponsor, error } = await supabase
    .from('sponsors')
    .update({
      application_status: 'rejected',
      rejection_reason: reason || null,
      updated_at: updatedAt,
    })
    .eq('id', sponsorId)
    .neq('application_status', 'rejected')
    .select('contact_email, company_name, contact_name')
    .maybeSingle();

  if (error) {
    console.error('Error rejecting sponsor:', JSON.stringify(error, null, 2));
    return { message: `Failed to reject sponsor: ${error.message}` };
  }

  if (!sponsor) return { success: true, message: 'Sponsor is already rejected.' };

  const emailResult = await sendRejectionEmail(
    sponsor.contact_email,
    sponsor.company_name,
    sponsor.contact_name,
    reason || undefined,
    undefined,
    `sponsor-rejected-${sponsorId}-${updatedAt}`,
    'sponsor',
  );
  if (!emailResult.success) {
    return {
      success: true,
      email_error: emailResult.error,
      message: `Sponsor rejected, but the rejection email failed: ${emailResult.error}`,
    };
  }

  return { success: true, message: 'Sponsor rejected and rejection email sent.' };
}

/** Waitlist a sponsor application */
export async function waitlistSponsor(sponsorId: string): Promise<ActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) return { message: 'Admin access required.' };

  const updatedAt = new Date().toISOString();
  const { data: sponsor, error } = await supabase
    .from('sponsors')
    .update({ application_status: 'waitlisted', rejection_reason: null, updated_at: updatedAt })
    .eq('id', sponsorId)
    .neq('application_status', 'waitlisted')
    .select('contact_email, company_name, contact_name')
    .maybeSingle();

  if (error) {
    console.error('Error waitlisting sponsor:', JSON.stringify(error, null, 2));
    return { message: `Failed to waitlist sponsor: ${error.message}` };
  }

  if (!sponsor) return { success: true, message: 'Sponsor is already waitlisted.' };

  const emailResult = await sendWaitlistEmail(
    sponsor.contact_email,
    sponsor.company_name,
    sponsor.contact_name,
    undefined,
    `sponsor-waitlisted-${sponsorId}-${updatedAt}`,
    'sponsor',
  );
  if (!emailResult.success) {
    return {
      success: true,
      email_error: emailResult.error,
      message: `Sponsor waitlisted, but the waitlist email failed: ${emailResult.error}`,
    };
  }

  return { success: true, message: 'Sponsor waitlisted and waitlist email sent.' };
}

/** Set sponsor to negotiating status */
export async function negotiateSponsor(sponsorId: string): Promise<ActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) return { message: 'Admin access required.' };

  const { error } = await supabase
    .from('sponsors')
    .update({ application_status: 'negotiating' })
    .eq('id', sponsorId);

  if (error) {
    console.error('Error setting sponsor to negotiating:', JSON.stringify(error, null, 2));
    return { message: `Failed to update sponsor status: ${error.message}` };
  }

  return { success: true, message: 'Sponsor status set to negotiating.' };
}

/** Delete a sponsor (admin only) */
export async function deleteSponsor(sponsorId: string): Promise<ActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) return { message: 'Admin access required.' };

  const { error } = await supabase
    .from('sponsors')
    .delete()
    .eq('id', sponsorId);

  if (error) {
    console.error('Error deleting sponsor:', JSON.stringify(error, null, 2));
    return { message: `Failed to delete sponsor: ${error.message}` };
  }

  return { success: true, message: 'Sponsor deleted successfully!' };
}

/** Get approved sponsors (admin only) */
export async function getApprovedSponsorsAdmin(): Promise<Sponsor[]> {
  const supabase = await requireAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('sponsors')
    .select(ADMIN_SPONSOR_COLUMNS)
    .eq('application_status', 'approved')
    .order('company_name', { ascending: true });

  if (error) {
    console.error('Error fetching approved sponsors:', JSON.stringify(error, null, 2));
    return [];
  }

  return data as Sponsor[];
}

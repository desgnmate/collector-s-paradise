'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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
const sponsorApplicationSchema = z.object({
  company_name: z.string().min(1, 'Company name is required').max(200),
  website: z.string().url('Please enter a valid website URL').optional().or(z.literal('')),
  industry: z.string().optional(),
  company_size: z.string().optional(),
  contact_name: z.string().min(1, 'Contact name is required').max(200),
  contact_email: z.string().email('Please enter a valid email address'),
  contact_phone: z.string().optional(),
  contact_position: z.string().optional(),
  sponsorship_tier: z.string().optional(),
  sponsorship_interest: z.array(z.string()).min(1, 'Please select at least one sponsorship interest'),
  previous_sponsor: z.boolean().optional(),
  sponsorship_history: z.string().optional(),
  brand_description: z.string().min(10, 'Please provide a brief description of your brand').max(1000),
  social_media_links: z.string().optional(),
  marketing_goals: z.string().optional(),
  events_interested: z.array(z.string()).optional(),
  preferred_booth_size: z.string().optional(),
  additional_services: z.array(z.string()).optional(),
  budget_range: z.string().optional(),
  custom_proposal: z.string().optional(),
  additional_notes: z.string().optional(),
  how_heard_about: z.string().optional(),
});

type ActionState = {
  message: string;
  errors?: Record<string, string[]>;
  success?: boolean;
  fields?: Record<string, string>;
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

  // Check if company/email is already registered
  const { data: existingEmail } = await supabase
    .from('sponsors')
    .select('id')
    .eq('contact_email', validatedFields.data.contact_email)
    .maybeSingle();

  if (existingEmail) {
    return { message: 'An application with this email already exists.', fields };
  }

  // Save Sponsor Record
  const { error: dbError } = await supabase.from('sponsors').insert({
    id: crypto.randomUUID(),
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
    previous_sponsor: validatedFields.data.previous_sponsor || null,
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
    
    return { message: 'Something went wrong while saving your application. Please contact support.', fields };
  }

  revalidatePath('/admin/sponsors');
  return {
    message: 'Sponsorship application submitted successfully! We\'ll review your application and get back to you within 2-3 business days.',
    success: true,
  };
}

// ============================================
// Admin Actions (require admin auth via middleware)
// ============================================

/** Get all sponsors with full details (admin only) */
export async function getAllSponsors(): Promise<Sponsor[]> {
  const supabase = await createSupabaseServerClient();

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
  const supabase = await createSupabaseServerClient();

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
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('sponsors')
    .update({ application_status: 'approved' })
    .eq('id', sponsorId);

  if (error) {
    console.error('Error approving sponsor:', JSON.stringify(error, null, 2));
    return { message: `Failed to approve sponsor: ${error.message}` };
  }

  revalidatePath('/admin/sponsors');
  return { success: true, message: 'Sponsor approved successfully!' };
}

/** Reject a sponsor application */
export async function rejectSponsor(sponsorId: string, reason?: string): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();

  const updateData: Record<string, string> = { application_status: 'rejected' };
  if (reason) {
    updateData.rejection_reason = reason;
  }

  const { error } = await supabase
    .from('sponsors')
    .update(updateData)
    .eq('id', sponsorId);

  if (error) {
    console.error('Error rejecting sponsor:', JSON.stringify(error, null, 2));
    return { message: `Failed to reject sponsor: ${error.message}` };
  }

  revalidatePath('/admin/sponsors');
  return { success: true, message: 'Sponsor application rejected.' };
}

/** Waitlist a sponsor application */
export async function waitlistSponsor(sponsorId: string): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('sponsors')
    .update({ application_status: 'waitlisted' })
    .eq('id', sponsorId);

  if (error) {
    console.error('Error waitlisting sponsor:', JSON.stringify(error, null, 2));
    return { message: `Failed to waitlist sponsor: ${error.message}` };
  }

  revalidatePath('/admin/sponsors');
  return { success: true, message: 'Sponsor waitlisted successfully!' };
}

/** Set sponsor to negotiating status */
export async function negotiateSponsor(sponsorId: string): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('sponsors')
    .update({ application_status: 'negotiating' })
    .eq('id', sponsorId);

  if (error) {
    console.error('Error setting sponsor to negotiating:', JSON.stringify(error, null, 2));
    return { message: `Failed to update sponsor status: ${error.message}` };
  }

  revalidatePath('/admin/sponsors');
  return { success: true, message: 'Sponsor status set to negotiating.' };
}

/** Delete a sponsor (admin only) */
export async function deleteSponsor(sponsorId: string): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('sponsors')
    .delete()
    .eq('id', sponsorId);

  if (error) {
    console.error('Error deleting sponsor:', JSON.stringify(error, null, 2));
    return { message: `Failed to delete sponsor: ${error.message}` };
  }

  revalidatePath('/admin/sponsors');
  return { success: true, message: 'Sponsor deleted successfully!' };
}

/** Get approved sponsors (admin only) */
export async function getApprovedSponsorsAdmin(): Promise<Sponsor[]> {
  const supabase = await createSupabaseServerClient();

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

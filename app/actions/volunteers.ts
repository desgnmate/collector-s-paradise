'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';
import { z } from 'zod';
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email';

// ============================================
// Types
// ============================================
export type Volunteer = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  preferred_roles: string[];
  availability: string;
  previous_experience: string | null;
  events_interested: string[] | null;
  t_shirt_size: string | null;
  emergency_contact_name: string | null;
  emergency_contact_phone: string | null;
  additional_notes: string | null;
  how_heard_about: string | null;
  application_status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  rejection_reason: string | null;
  assigned_event_id: string | null;
  applied_at: string;
  updated_at: string;
};

// Column selection for admin queries
const ADMIN_VOLUNTEER_COLUMNS = 'id, full_name, email, phone, preferred_roles, availability, previous_experience, events_interested, t_shirt_size, emergency_contact_name, emergency_contact_phone, additional_notes, how_heard_about, application_status, rejection_reason, assigned_event_id, applied_at, updated_at';

// ============================================
// Validation Schema
// ============================================
const volunteerApplicationSchema = z.object({
  full_name: z.string().min(1, 'Full name is required').max(200),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
  preferred_roles: z.array(z.string()).min(1, 'Please select at least one volunteer role'),
  availability: z.string().min(10, 'Please describe your availability'),
  previous_experience: z.string().optional(),
  events_interested: z.array(z.string()).optional(),
  t_shirt_size: z.string().optional(),
  emergency_contact_name: z.string().optional(),
  emergency_contact_phone: z.string().optional(),
  additional_notes: z.string().optional(),
  how_heard_about: z.string().optional(),
});

type ActionState = {
  message: string;
  errors?: Record<string, string[]>;
  success?: boolean;
  fields?: Record<string, unknown>;
};

// ============================================
// Public Actions
// ============================================

/** Submit a volunteer application (publicly accessible) */
export async function submitVolunteerApplication(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();

  const preferred_roles = formData.getAll('preferred_roles') as string[];
  const events_interested = formData.getAll('events_interested') as string[];

  const fields = {
    full_name: formData.get('full_name') as string || '',
    email: formData.get('email') as string || '',
    phone: formData.get('phone') as string || '',
    availability: formData.get('availability') as string || '',
    previous_experience: formData.get('previous_experience') as string || '',
    t_shirt_size: formData.get('t_shirt_size') as string || '',
    emergency_contact_name: formData.get('emergency_contact_name') as string || '',
    emergency_contact_phone: formData.get('emergency_contact_phone') as string || '',
    additional_notes: formData.get('additional_notes') as string || '',
    how_heard_about: formData.get('how_heard_about') as string || '',
  };

  const validatedFields = volunteerApplicationSchema.safeParse({
    full_name: fields.full_name,
    email: fields.email,
    phone: fields.phone || undefined,
    preferred_roles,
    availability: fields.availability,
    previous_experience: fields.previous_experience || undefined,
    events_interested: events_interested.length > 0 ? events_interested : undefined,
    t_shirt_size: fields.t_shirt_size || undefined,
    emergency_contact_name: fields.emergency_contact_name || undefined,
    emergency_contact_phone: fields.emergency_contact_phone || undefined,
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

  // Check if email is already registered
  const { data: existingEmail } = await supabase
    .from('volunteers')
    .select('id')
    .eq('email', validatedFields.data.email)
    .maybeSingle();

  if (existingEmail) {
    return { message: 'An application with this email already exists.', fields };
  }

  // Save Volunteer Record
  const { error: dbError } = await supabase.from('volunteers').insert({
    id: crypto.randomUUID(),
    full_name: validatedFields.data.full_name,
    email: validatedFields.data.email,
    phone: validatedFields.data.phone || null,
    preferred_roles: validatedFields.data.preferred_roles,
    availability: validatedFields.data.availability,
    previous_experience: validatedFields.data.previous_experience || null,
    events_interested: validatedFields.data.events_interested || null,
    t_shirt_size: validatedFields.data.t_shirt_size || null,
    emergency_contact_name: validatedFields.data.emergency_contact_name || null,
    emergency_contact_phone: validatedFields.data.emergency_contact_phone || null,
    additional_notes: validatedFields.data.additional_notes || null,
    how_heard_about: validatedFields.data.how_heard_about || null,
    application_status: 'pending',
  });

  if (dbError) {
    console.error('Error submitting volunteer application:', JSON.stringify(dbError, null, 2));
    
    if (dbError.code === '42703') {
      return { 
        message: 'Database schema mismatch: One or more required columns are missing from the volunteers table. Please run the provided SQL migration in lib/supabase/volunteer_form_fields.sql in your Supabase SQL Editor.',
        fields
      };
    }
    
    return { message: 'Something went wrong while saving your application. Please contact support.', fields };
  }

  return {
    message: 'Application submitted successfully! We\'ll review your application and get back to you soon.',
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

/** Get all volunteers with full details (admin only) */
export async function getAllVolunteers(): Promise<Volunteer[]> {
  const supabase = await requireAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('volunteers')
    .select(ADMIN_VOLUNTEER_COLUMNS)
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('Error fetching all volunteers:', JSON.stringify(error, null, 2));
    return [];
  }

  return data as Volunteer[];
}

/** Get pending volunteer applications (admin only) */
export async function getPendingVolunteers(): Promise<Volunteer[]> {
  const supabase = await requireAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('volunteers')
    .select(ADMIN_VOLUNTEER_COLUMNS)
    .eq('application_status', 'pending')
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending volunteers:', JSON.stringify(error, null, 2));
    return [];
  }

  return data as Volunteer[];
}

/** Approve a volunteer application */
export async function approveVolunteer(volunteerId: string): Promise<ActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) return { message: 'Admin access required.' };

  const { data: volunteer, error } = await supabase
    .from('volunteers')
    .update({ application_status: 'approved' })
    .select('email, full_name')
    .eq('id', volunteerId)
    .maybeSingle();

  if (error) {
    console.error('Error approving volunteer:', JSON.stringify(error, null, 2));
    return { message: `Failed to approve volunteer: ${error.message}` };
  }

  // Send approval email (non-blocking)
  if (volunteer) {
    sendApprovalEmail(volunteer.email, volunteer.full_name, volunteer.full_name)
      .catch((err) => console.error('Failed to send approval email:', err));
  }

  return { success: true, message: 'Volunteer approved successfully!' };
}

/** Reject a volunteer application */
export async function rejectVolunteer(volunteerId: string, reason?: string): Promise<ActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) return { message: 'Admin access required.' };

  const updateData: Record<string, string> = { application_status: 'rejected' };
  if (reason) {
    updateData.rejection_reason = reason;
  }

  const { data: volunteer, error } = await supabase
    .from('volunteers')
    .update(updateData)
    .eq('id', volunteerId)
    .select('email, full_name')
    .maybeSingle();

  if (error) {
    console.error('Error rejecting volunteer:', JSON.stringify(error, null, 2));
    return { message: `Failed to reject volunteer: ${error.message}` };
  }

  // Send rejection email (non-blocking)
  if (volunteer) {
    sendRejectionEmail(volunteer.email, volunteer.full_name, volunteer.full_name, reason || undefined)
      .catch((err) => console.error('Failed to send rejection email:', err));
  }

  return { success: true, message: 'Volunteer application rejected.' };
}

/** Waitlist a volunteer application */
export async function waitlistVolunteer(volunteerId: string): Promise<ActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) return { message: 'Admin access required.' };

  const { error } = await supabase
    .from('volunteers')
    .update({ application_status: 'waitlisted' })
    .eq('id', volunteerId);

  if (error) {
    console.error('Error waitlisting volunteer:', JSON.stringify(error, null, 2));
    return { message: `Failed to waitlist volunteer: ${error.message}` };
  }

  return { success: true, message: 'Volunteer waitlisted successfully!' };
}

/** Delete a volunteer (admin only) */
export async function deleteVolunteer(volunteerId: string): Promise<ActionState> {
  const supabase = await requireAdminClient();
  if (!supabase) return { message: 'Admin access required.' };

  const { error } = await supabase
    .from('volunteers')
    .delete()
    .eq('id', volunteerId);

  if (error) {
    console.error('Error deleting volunteer:', JSON.stringify(error, null, 2));
    return { message: `Failed to delete volunteer: ${error.message}` };
  }

  return { success: true, message: 'Volunteer deleted successfully!' };
}

/** Get approved volunteers (admin only) */
export async function getApprovedVolunteersAdmin(): Promise<Volunteer[]> {
  const supabase = await requireAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('volunteers')
    .select(ADMIN_VOLUNTEER_COLUMNS)
    .eq('application_status', 'approved')
    .order('full_name', { ascending: true });

  if (error) {
    console.error('Error fetching approved volunteers:', JSON.stringify(error, null, 2));
    return [];
  }

  return data as Volunteer[];
}

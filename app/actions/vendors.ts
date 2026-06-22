'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sendNewApplicationEmail, sendApprovalEmail, sendRejectionEmail } from '@/lib/email';

// ============================================
// Types
// ============================================
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
  application_status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  booth_assignment: string | null;
  event_id: string | null;
  rejection_reason: string | null;
  applied_at: string;
};

// Column selection for admin queries - only fetch what's needed
const ADMIN_VENDOR_COLUMNS = 'id, business_name, contact_name, email, phone, location_state, description, categories, logo_url, social_links, tables_requested, power_requirements, additional_notes, application_status, booth_assignment, event_id, rejection_reason, applied_at';

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
  agreement: z.literal(true).refine((val) => val === true, { message: 'You must agree to the Terms and Conditions' }),
});

type ActionState = {
  message: string;
  errors?: Record<string, string[]>;
  success?: boolean;
  fields?: Record<string, any>;
};

// ============================================
// Public Actions
// ============================================

async function sendToGoogleSheet(data: Record<string, unknown>) {
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) return; // silently skip if not configured

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
}

export async function syncAllVendorsToSheet() {
  'use server';
  const webhookUrl = process.env.GOOGLE_SHEET_WEBHOOK_URL;
  if (!webhookUrl) return { success: false, message: 'Google Sheet webhook not configured.' };

  const supabase = await createSupabaseServerClient();
  const { data: vendors, error } = await supabase
    .from('vendors')
    .select('*')
    .order('applied_at', { ascending: false });

  if (error || !vendors) {
    return { success: false, message: 'Failed to fetch vendors.' };
  }

  for (const v of vendors) {
    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        business_name: v.business_name,
        contact_name: v.contact_name,
        email: v.email,
        phone: v.phone || '',
        location_state: v.location_state || '',
        categories: v.categories || [],
        tables_requested: v.tables_requested || '',
        power_requirements: v.power_requirements || '',
        social_links: v.social_links || '',
        description: v.description || '',
        logo_url: v.logo_url || '',
        application_status: v.application_status,
      }),
    });
  }

  return { success: true, message: `${vendors.length} applications synced to spreadsheet.` };
}

/** Submit a vendor application (publicly accessible) */
export async function submitVendorApplication(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  try {
  const supabase = await createSupabaseServerClient();

  const categories = formData.getAll('categories') as string[];
  const logo = formData.get('logo') as File | null;

  const fields = {
    business_name: formData.get('business_name') as string || '',
    contact_name: formData.get('contact_name') as string || '',
    email: formData.get('email') as string || '',
    phone: formData.get('phone') as string || '',
    location_state: formData.get('location_state') as string || '',
    description: formData.get('description') as string || '',
    social_links: formData.get('social_links') as string || '',
    tables_requested: formData.get('tables_requested') as string || '',
    power_requirements: formData.get('power_requirements') as string || '',
    additional_notes: formData.get('additional_notes') as string || '',
    agreement: formData.get('agreement') === 'on',
  };

  const validatedFields = vendorApplicationSchema.safeParse({
    business_name: fields.business_name,
    contact_name: fields.contact_name,
    email: fields.email,
    phone: fields.phone || undefined,
    location_state: fields.location_state,
    description: fields.description,
    categories,
    social_links: fields.social_links || undefined,
    tables_requested: fields.tables_requested,
    power_requirements: fields.power_requirements || undefined,
    additional_notes: fields.additional_notes || undefined,
    agreement: fields.agreement,
  });

  if (!validatedFields.success) {
    return {
      message: 'Please fix the errors below.',
      errors: validatedFields.error.flatten().fieldErrors,
      fields,
    };
  }

  // Check if logo is valid if provided
  if (!logo || logo.size === 0) {
    return { message: 'A business logo or profile avatar is required.', fields };
  }
  if (logo.size > 5 * 1024 * 1024) {
    return { message: 'Logo file size must be less than 5MB.', fields };
  }
  if (!logo.type.startsWith('image/')) {
    return { message: 'Logo must be an image file.', fields };
  }

  // 1. Check if business name is already taken (optimized: only select id)
  const { data: existingBusiness } = await supabase
    .from('vendors')
    .select('id')
    .eq('business_name', validatedFields.data.business_name)
    .maybeSingle();

  if (existingBusiness) {
    return { message: 'This Business Name is already registered.', fields };
  }

  // 2. Check if email is already registered
  const { data: existingEmail } = await supabase
    .from('vendors')
    .select('id')
    .eq('email', validatedFields.data.email)
    .maybeSingle();

  if (existingEmail) {
    return { message: 'An application with this email already exists.', fields };
  }

  // 3. Upload the logo
  const vendorId = crypto.randomUUID();
  const fileExt = logo.name.split('.').pop();
  const filePath = `${vendorId}/logo-${Date.now()}.${fileExt}`;

  const arrayBuffer = await logo.arrayBuffer();

  let logoUrl = '';
  const { error: uploadError } = await supabase.storage
    .from('vendor_logos')
    .upload(filePath, arrayBuffer, {
      contentType: logo.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    // Fallback: If storage bucket isn't properly configured or has RLS issues, 
    // we save the image directly as a base64 string to prevent blocking registration.
    if (uploadError.message.includes('security policy') || uploadError.message.includes('not found') || uploadError.message.includes('bucket')) {
      console.warn('Storage upload failed, falling back to Base64 encoding.');
      const base64String = Buffer.from(arrayBuffer).toString('base64');
      logoUrl = `data:${logo.type};base64,${base64String}`;
    } else {
      return { message: 'Failed to upload the logo file. Please try submitting again or contact support.', fields };
    }
  } else {
    logoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vendor_logos/${filePath}`;
  }

  // 5. Save Vendor Record
  const { error: dbError } = await supabase.from('vendors').insert({
    id: vendorId,
    business_name: validatedFields.data.business_name,
    contact_name: validatedFields.data.contact_name,
    email: validatedFields.data.email,
    phone: validatedFields.data.phone || null,
    location_state: validatedFields.data.location_state,
    description: validatedFields.data.description,
    categories: validatedFields.data.categories,
    logo_url: logoUrl,
    social_links: validatedFields.data.social_links || null,
    tables_requested: validatedFields.data.tables_requested,
    power_requirements: validatedFields.data.power_requirements || null,
    additional_notes: validatedFields.data.additional_notes || null,
    application_status: 'pending',
  });

  if (dbError) {
    console.error('Error submitting vendor application:', JSON.stringify(dbError, null, 2));
    
    if (dbError.code === '42703') {
      return { 
        message: 'Database schema mismatch: One or more required columns are missing from the vendors table. Please run the provided SQL migration in lib/supabase/vendor_auth_update.sql in your Supabase SQL Editor.',
        fields
      };
    }
    
    return { message: 'Something went wrong while saving your application. Please contact support.', fields };
  }

  // Send notification emails (non-blocking)
  sendNewApplicationEmail(
    validatedFields.data.email,
    validatedFields.data.business_name,
    validatedFields.data.contact_name
  ).catch((err) => console.error('Failed to send application emails:', err));

  // Push to Google Sheet (non-blocking)
  sendToGoogleSheet({
    business_name: validatedFields.data.business_name,
    contact_name: validatedFields.data.contact_name,
    email: validatedFields.data.email,
    phone: validatedFields.data.phone || '',
    location_state: validatedFields.data.location_state,
    categories: validatedFields.data.categories,
    tables_requested: validatedFields.data.tables_requested,
    power_requirements: validatedFields.data.power_requirements || '',
    social_links: validatedFields.data.social_links || '',
    description: validatedFields.data.description,
    logo_url: logoUrl,
    application_status: 'pending',
  }).catch((err) => console.error('Failed to push to Google Sheet:', err));

  revalidatePath('/admin');
  return {
    message: 'Application submitted securely! We\'ll review your application and get back to you soon.',
    success: true,
  };
  } catch (err) {
    console.error('Vendor application error:', err);
    return {
      message: 'Something went wrong while submitting your application. Please try again or contact support.',
      success: false,
    };
  }
}

/** Get all approved vendors (publicly accessible for vendor list) */
export async function getApprovedVendors(): Promise<Partial<Vendor>[]> {
  const supabase = await createSupabaseServerClient();

  // OPTIMIZED: Only select columns needed for public display
  const { data, error } = await supabase
    .from('vendors')
    .select('id, business_name, contact_name, description, categories, booth_assignment, logo_url')
    .eq('application_status', 'approved')
    .order('business_name', { ascending: true });

  if (error) {
    console.error('Error fetching vendors from Supabase:', JSON.stringify(error, null, 2));
    
    if (error.code === '42703') {
      console.warn('DATABASE ALERT: logo_url or other required columns are missing. Attempting fallback fetch.');
      const { data: fallbackData, error: fallbackError } = await supabase
        .from('vendors')
        .select('id, business_name, contact_name, description, categories, booth_assignment')
        .eq('application_status', 'approved')
        .order('business_name', { ascending: true });
      
      if (!fallbackError) return fallbackData as Partial<Vendor>[];
    }
    
    return [];
  }

  return data as Partial<Vendor>[];
}

// ============================================
// Admin Actions (require admin auth via middleware)
// ============================================

/** Get all vendors with full details (admin only) - OPTIMIZED: selects only needed columns */
export async function getAllVendors(): Promise<Vendor[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('vendors')
    .select(ADMIN_VENDOR_COLUMNS)
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('Error fetching all vendors:', JSON.stringify(error, null, 2));
    return [];
  }

  return data as Vendor[];
}

/** Get pending vendor applications (admin only) - OPTIMIZED: selects only needed columns */
export async function getPendingVendors(): Promise<Vendor[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('vendors')
    .select(ADMIN_VENDOR_COLUMNS)
    .eq('application_status', 'pending')
    .order('applied_at', { ascending: false });

  if (error) {
    console.error('Error fetching pending vendors:', JSON.stringify(error, null, 2));
    return [];
  }

  return data as Vendor[];
}

/** Approve a vendor application */
export async function approveVendor(vendorId: string): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();

  // Fetch vendor details first for email notification
  const { data: vendor } = await supabase
    .from('vendors')
    .select('email, business_name, contact_name')
    .eq('id', vendorId)
    .maybeSingle();

  const { error } = await supabase
    .from('vendors')
    .update({ application_status: 'approved' })
    .eq('id', vendorId);

  if (error) {
    console.error('Error approving vendor:', JSON.stringify(error, null, 2));
    return { message: `Failed to approve vendor: ${error.message}` };
  }

  // Send approval email (non-blocking)
  if (vendor) {
    sendApprovalEmail(vendor.email, vendor.business_name, vendor.contact_name)
      .catch((err) => console.error('Failed to send approval email:', err));
  }

  revalidatePath('/admin/vendors');
  revalidatePath('/vendors');
  return { success: true, message: 'Vendor approved successfully!' };
}

/** Reject a vendor application */
export async function rejectVendor(vendorId: string, reason?: string): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();

  // Fetch vendor details first for email notification
  const { data: vendor } = await supabase
    .from('vendors')
    .select('email, business_name, contact_name')
    .eq('id', vendorId)
    .maybeSingle();

  const updateData: Record<string, string> = { application_status: 'rejected' };
  if (reason) {
    updateData.rejection_reason = reason;
  }

  const { error } = await supabase
    .from('vendors')
    .update(updateData)
    .eq('id', vendorId);

  if (error) {
    console.error('Error rejecting vendor:', JSON.stringify(error, null, 2));
    return { message: `Failed to reject vendor: ${error.message}` };
  }

  // Send rejection email (non-blocking)
  if (vendor) {
    sendRejectionEmail(vendor.email, vendor.business_name, vendor.contact_name, reason || undefined)
      .catch((err) => console.error('Failed to send rejection email:', err));
  }

  revalidatePath('/admin/vendors');
  return { success: true, message: 'Vendor application rejected.' };
}

/** Waitlist a vendor application */
export async function waitlistVendor(vendorId: string): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('vendors')
    .update({ application_status: 'waitlisted' })
    .eq('id', vendorId);

  if (error) {
    console.error('Error waitlisting vendor:', JSON.stringify(error, null, 2));
    return { message: `Failed to waitlist vendor: ${error.message}` };
  }

  revalidatePath('/admin/vendors');
  return { success: true, message: 'Vendor waitlisted successfully!' };
}

/** Delete a vendor (admin only) — removes vendor from database */
export async function deleteVendor(vendorId: string): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase
    .from('vendors')
    .delete()
    .eq('id', vendorId);

  if (error) {
    console.error('Error deleting vendor:', JSON.stringify(error, null, 2));
    return { message: `Failed to delete vendor: ${error.message}` };
  }

  revalidatePath('/admin/vendors');
  revalidatePath('/vendors');
  return { success: true, message: 'Vendor deleted successfully!' };
}

/** Get approved vendors list for admin view (with more fields than public) - OPTIMIZED */
export async function getApprovedVendorsAdmin(): Promise<Vendor[]> {
  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('vendors')
    .select(ADMIN_VENDOR_COLUMNS)
    .eq('application_status', 'approved')
    .order('business_name', { ascending: true });

  if (error) {
    console.error('Error fetching approved vendors:', JSON.stringify(error, null, 2));
    return [];
  }

  return data as Vendor[];
}

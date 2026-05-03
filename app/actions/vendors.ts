'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { z } from 'zod';

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
  application_status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  booth_assignment: string | null;
  event_id: string | null;
  rejection_reason: string | null;
  applied_at: string;
};

// Column selection for admin queries - only fetch what's needed
const ADMIN_VENDOR_COLUMNS = 'id, business_name, contact_name, email, phone, description, categories, logo_url, application_status, booth_assignment, event_id, rejection_reason, applied_at';

// ============================================
// Validation Schema
// ============================================
const vendorApplicationSchema = z.object({
  business_name: z.string().min(1, 'Business name is required').max(200),
  contact_name: z.string().min(1, 'Contact name is required').max(200),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirm_password: z.string(),
  phone: z.string().optional(),
  description: z.string().min(10, 'Please provide at least a brief description of your business').max(1000),
  categories: z.array(z.string()).min(1, 'Please select at least one category'),
}).refine((data) => data.password === data.confirm_password, {
  message: "Passwords don't match",
  path: ["confirm_password"],
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

/** Submit a vendor application (publicly accessible) */
export async function submitVendorApplication(
  prevState: ActionState,
  formData: FormData
): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();

  const categories = formData.getAll('categories') as string[];
  const logo = formData.get('logo') as File | null;

  const fields = {
    business_name: formData.get('business_name') as string || '',
    contact_name: formData.get('contact_name') as string || '',
    email: formData.get('email') as string || '',
    phone: formData.get('phone') as string || '',
    description: formData.get('description') as string || '',
  };

  const validatedFields = vendorApplicationSchema.safeParse({
    business_name: fields.business_name,
    contact_name: fields.contact_name,
    email: fields.email,
    password: formData.get('password'),
    confirm_password: formData.get('confirm_password'),
    phone: fields.phone || undefined,
    description: fields.description,
    categories,
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

  // 2. Sign out any lingering session before creating a new account.
  await supabase.auth.signOut();

  // 3. Create the Auth Account
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
  });

  if (authError) {
    console.error('Auth error:', authError);
    if (authError.message.includes('already registered')) {
      return { message: 'An account with this email already exists.', fields };
    }
    return { message: authError.message, fields };
  }

  // Handle the Supabase edge case where duplicate emails return a fake
  // success with an empty identities array
  if (
    authData.user &&
    authData.user.identities &&
    authData.user.identities.length === 0
  ) {
    return { message: 'An account with this email already exists.', fields };
  }

  if (!authData.user) {
    return { message: 'Failed to create vendor account. Please try again.', fields };
  }

  // 4. Upload the logo
  const fileExt = logo.name.split('.').pop();
  const filePath = `${authData.user.id}/logo-${Date.now()}.${fileExt}`;

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
    user_id: authData.user.id,
    business_name: validatedFields.data.business_name,
    contact_name: validatedFields.data.contact_name,
    email: validatedFields.data.email,
    phone: validatedFields.data.phone || null,
    description: validatedFields.data.description,
    categories: validatedFields.data.categories,
    logo_url: logoUrl,
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

  revalidatePath('/admin');
  return {
    message: 'Application submitted securely! We\'ll review your application and get back to you soon.',
    success: true,
  };
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

  const { error } = await supabase
    .from('vendors')
    .update({ application_status: 'approved' })
    .eq('id', vendorId);

  if (error) {
    console.error('Error approving vendor:', JSON.stringify(error, null, 2));
    return { message: `Failed to approve vendor: ${error.message}` };
  }

  revalidatePath('/admin/vendors');
  revalidatePath('/vendors');
  return { success: true, message: 'Vendor approved successfully!' };
}

/** Reject a vendor application */
export async function rejectVendor(vendorId: string, reason?: string): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();

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

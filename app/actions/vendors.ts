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
  applied_at: string;
};

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

  // Collect selected categories from checkboxes
  const categories = formData.getAll('categories') as string[];
  const logo = formData.get('logo') as File | null;

  const validatedFields = vendorApplicationSchema.safeParse({
    business_name: formData.get('business_name'),
    contact_name: formData.get('contact_name'),
    email: formData.get('email'),
    password: formData.get('password'),
    confirm_password: formData.get('confirm_password'),
    phone: formData.get('phone') || undefined,
    description: formData.get('description'),
    categories,
  });

  if (!validatedFields.success) {
    return {
      message: 'Please fix the errors below.',
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  // Check if logo is valid if provided
  if (!logo || logo.size === 0) {
    return { message: 'A business logo or profile avatar is required.' };
  }
  if (logo.size > 5 * 1024 * 1024) {
    return { message: 'Logo file size must be less than 5MB.' };
  }
  if (!logo.type.startsWith('image/')) {
    return { message: 'Logo must be an image file.' };
  }

  // 1. Check if business name is already taken
  const { data: existingBusiness } = await supabase
    .from('vendors')
    .select('id')
    .eq('business_name', validatedFields.data.business_name)
    .maybeSingle();

  if (existingBusiness) {
    return { message: 'This Business Name is already registered.' };
  }

  // 2. Create the Auth Account
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
  });

  if (authError) {
    // Determine if it's already registered or another error
    console.error('Auth error:', authError);
    if (authError.message.includes('already registered')) {
      return { message: 'An account with this email already exists.' };
    }
    return { message: authError.message };
  }

  if (!authData.user) {
    return { message: 'Failed to create vendor account. Please try again.' };
  }

  // 3. Upload the logo
  const fileExt = logo.name.split('.').pop();
  const filePath = `${authData.user.id}/logo-${Date.now()}.${fileExt}`;

  const arrayBuffer = await logo.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('vendor_logos')
    .upload(filePath, arrayBuffer, {
      contentType: logo.type,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    console.error('Upload error:', uploadError);
    // Cleanup the user if possible or just log error - for now we fail gracefully
    return { message: 'Failed to upload the logo file. Please try submitting again or contact support.' };
  }

  const logoUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/vendor_logos/${filePath}`;

  // 4. Save Vendor Record
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
    
    // Check for "column does not exist" error (Postgres error code 42703)
    if (dbError.code === '42703') {
      return { 
        message: 'Database schema mismatch: One or more required columns are missing from the vendors table. Please run the provided SQL migration in lib/supabase/vendor_auth_update.sql in your Supabase SQL Editor.' 
      };
    }
    
    return { message: 'Something went wrong while saving your application. Please contact support.' };
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

  const { data, error } = await supabase
    .from('vendors')
    .select('id, business_name, contact_name, description, categories, booth_assignment, logo_url')
    .eq('application_status', 'approved')
    .order('business_name', { ascending: true });

  if (error) {
    console.error('Error fetching vendors from Supabase:', JSON.stringify(error, null, 2));
    
    // Fallback: If logo_url is the problem, try fetching without it
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

  console.log(`Successfully fetched ${data?.length || 0} approved vendors`);
  return data as Partial<Vendor>[];
}

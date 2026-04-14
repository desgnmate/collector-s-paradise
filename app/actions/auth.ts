'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

const signUpSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const profileSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  phone: z.string().optional().nullable(),
});

const passwordSchema = z.object({
  password: z.string().min(8, 'Password must be at least 8 characters long'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export type ActionState = {
  success?: boolean;
  message?: string;
  errors?: Record<string, string[]>;
};

/** Sign in with email and password */
export async function login(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  
  const validatedFields = loginSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
  });

  if (error) {
    return { message: error.message };
  }

  revalidatePath('/', 'layout');
  redirect('/');
}

/** Sign up as a Buyer/Collector */
export async function signUp(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  
  const validatedFields = signUpSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { data, error } = await supabase.auth.signUp({
    email: validatedFields.data.email,
    password: validatedFields.data.password,
    options: {
      data: {
        full_name: validatedFields.data.fullName,
      },
    },
  });

  if (error) {
    return { message: error.message };
  }

  // Create profile record (though ideally this should be handled by a Supabase trigger)
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        full_name: validatedFields.data.fullName,
      });
      
    if (profileError) {
      console.error('Error creating profile after signup:', JSON.stringify(profileError, null, 2));
      
      // Check for missing columns in profiles table
      if (profileError.code === '42703') {
        return { message: 'Account created, but profile setup failed due to a database schema mismatch. Please contact support.' };
      }
    }
  }

  revalidatePath('/', 'layout');
  redirect('/profile');
}

/** Sign out the current user */
export async function signOut() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  revalidatePath('/', 'layout');
  redirect('/');
}

/** Update personal information */
export async function updateProfile(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  
  // Handle avatar file upload separately
  const avatarFile = formData.get('avatar') as File | null;
  
  const validatedFields = profileSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'Not authenticated' };

  let avatarUrl = undefined;

  // 1. Process avatar upload if a new file is provided
  if (avatarFile && avatarFile.size > 0) {
    console.log("Storage Diagnostic - Project URL:", process.env.NEXT_PUBLIC_SUPABASE_URL);
    // Basic validation
    if (avatarFile.size > 5 * 1024 * 1024) return { message: 'Avatar image must be less than 5MB' };
    if (!avatarFile.type.startsWith('image/')) return { message: 'File must be an image' };

    const fileExt = avatarFile.name.split('.').pop();
    const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;
    const arrayBuffer = await avatarFile.arrayBuffer();

    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, arrayBuffer, {
        contentType: avatarFile.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Avatar upload error:', uploadError);
      return { message: `Upload failed: ${uploadError.message}. Please ensure you have run the profile_updates.sql migration.` };
    }

    const { data: { publicUrl } } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    avatarUrl = publicUrl;
  }

  // 2. Build update payload
  const updateData: any = {
    full_name: validatedFields.data.fullName,
    phone: validatedFields.data.phone,
  };

  if (avatarUrl) {
    updateData.avatar_url = avatarUrl;
  }

  // 3. Update profiles table
  const { error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id);

  if (error) {
    console.error('Profile update database error:', error);
    return { message: error.message };
  }

  revalidatePath('/profile');
  return { success: true, message: 'Profile updated successfully!' };
}

/** Update password */
export async function updatePassword(prevState: ActionState, formData: FormData): Promise<ActionState> {
  const supabase = await createSupabaseServerClient();
  
  const validatedFields = passwordSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { error } = await supabase.auth.updateUser({
    password: validatedFields.data.password,
  });

  if (error) {
    return { message: error.message };
  }

  return { success: true, message: 'Password updated successfully!' };
}

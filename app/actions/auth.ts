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
      console.error('Error creating profile after signup:', profileError);
      // We don't fail here as the user is already created
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
  
  const validatedFields = profileSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { message: 'Not authenticated' };

  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: validatedFields.data.fullName,
      phone: validatedFields.data.phone,
    })
    .eq('id', user.id);

  if (error) {
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

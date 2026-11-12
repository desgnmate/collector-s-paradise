'use server';

import { revalidatePath, updateTag } from 'next/cache';
import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export type RegistrationRequest = {
  id: string;
  kind: 'directory' | 'events';
  details: {
    business_name: string; contact_name: string; email: string; phone: string;
    description: string; location_state: string; social_links: string; logo_url: string;
    categories: string[]; tables_requested: string; power_requirements: string; additional_notes: string;
  };
  event_ids: string[];
  created_at: string;
};

async function adminClient() {
  const client = await createSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) throw new Error('Sign in as an admin.');
  const { data, error } = await client.from('admin_users').select('id').eq('user_id', user.id).maybeSingle();
  if (error || !data) throw new Error('Admin access required.');
  return client;
}

export async function getVendorRegistrations(): Promise<{ requests: RegistrationRequest[]; approved?: { id: string; business_name: string }[]; error?: string }> {
  try {
    await adminClient();
    // Public column grants intentionally exclude private fields and new columns.
    // Use the server client only after the explicit admin authorization above.
    const client = createSupabaseAdminClient();
    const { data, error } = await client.from('vendor_registration_requests')
      .select('id,kind,details,event_ids,created_at').eq('status', 'pending')
      .order('created_at').limit(100);
    if (error) throw new Error('Registration review is unavailable. Check that the directory registration migration is applied.');
    const { data: approved, error: approvalError } = await client.from('vendors').select('id,business_name').eq('directory_approved', true).order('business_name').limit(100);
    if (approvalError) throw new Error('Could not load directory approvals. Refresh and try again.');
    return { requests: data as RegistrationRequest[], approved: approved || [] };
  } catch (error) {
    return { requests: [], error: error instanceof Error ? error.message : 'Could not load registration requests.' };
  }
}

export async function reviewVendorRegistration(requestId: string, vendorId: string | null, decline: boolean) {
  try {
    z.string().uuid().parse(requestId);
    z.string().uuid().nullable().parse(vendorId);
    z.boolean().parse(decline);
    const client = await adminClient();
    const { error } = await client.rpc('review_vendor_registration', {
      p_request_id: requestId, p_vendor_id: vendorId, p_decline: decline,
    });
    if (error) {
      console.error('Registration review failed:', error);
      return { success: false, message: error.message };
    }
    revalidatePath('/admin/vendors');
    revalidatePath('/vendors');
    updateTag('vendors');
    return { success: true, message: decline ? 'Request declined.' : 'Request processed. Event applications, if any, remain subject to separate approval.' };
  } catch {
    return { success: false, message: 'Could not review this request. Check your admin session and try again.' };
  }
}

export async function removeDirectoryApproval(vendorId: string) {
  try {
    z.string().uuid().parse(vendorId);
    const client = await adminClient();
    const { error } = await client.rpc('remove_vendor_directory_approval', { p_vendor_id: vendorId });
    if (error) throw error;
    revalidatePath('/vendors');
    updateTag('vendors');
    return { success: true, message: 'Directory-only approval removed. Separately approved event appearances are unchanged.' };
  } catch {
    return { success: false, message: 'Could not remove directory approval. Refresh and try again.' };
  }
}

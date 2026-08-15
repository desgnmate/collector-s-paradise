'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { createSupabaseAdminClient } from '@/lib/supabase/admin';

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

export async function getDashboardStats() {
  const supabase = await requireAdminClient();
  if (!supabase) {
    return {
      totalVendors: 0,
      pendingVendors: 0,
      approvedVendors: 0,
      totalEvents: 0,
    };
  }
  const [
    { count: totalVendors },
    { count: pendingVendors },
    { count: approvedVendors },
    { count: totalEvents },
  ] = await Promise.all([
    supabase.from('vendors').select('id', { count: 'exact', head: true }),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('application_status', 'pending'),
    supabase.from('vendors').select('id', { count: 'exact', head: true }).eq('application_status', 'approved'),
    supabase.from('events').select('id', { count: 'exact', head: true }),
  ]);

  return {
    totalVendors: totalVendors || 0,
    pendingVendors: pendingVendors || 0,
    approvedVendors: approvedVendors || 0,
    totalEvents: totalEvents || 0,
  };
}

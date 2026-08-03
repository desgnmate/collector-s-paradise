'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getDashboardStats() {
  const supabase = await createSupabaseServerClient();
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

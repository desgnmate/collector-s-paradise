'use server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function getDashboardStats() {
  const supabase = await createSupabaseServerClient();

  // Single query with conditional aggregation - much more efficient
  const { data, error } = await supabase.rpc('get_dashboard_stats');
  
  if (error || !data) {
    // Fallback: use individual count queries with id only (minimal data transfer)
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

  return {
    totalVendors: data.total_vendors || 0,
    pendingVendors: data.pending_vendors || 0,
    approvedVendors: data.approved_vendors || 0,
    totalEvents: data.total_events || 0,
  };
}

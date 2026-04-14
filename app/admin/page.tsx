import { createSupabaseServerClient } from '@/lib/supabase/server';

export default async function AdminDashboard() {
  const supabase = await createSupabaseServerClient();

  // Fetch stats
  const { count: eventCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true });

  const { count: bookingCount } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true });

  const { count: vendorCount } = await supabase
    .from('vendors')
    .select('*', { count: 'exact', head: true });

  const { count: pendingVendors } = await supabase
    .from('vendors')
    .select('*', { count: 'exact', head: true })
    .eq('application_status', 'pending');

  const stats = [
    { label: 'Total Events', value: eventCount ?? 0, icon: '📅' },
    { label: 'Total Bookings', value: bookingCount ?? 0, icon: '🎟️' },
    { label: 'Vendors', value: vendorCount ?? 0, icon: '🏪' },
    { label: 'Pending Applications', value: pendingVendors ?? 0, icon: '⏳' },
  ];

  return (
    <div className="admin-page">
      <h1 className="admin-page-title">Dashboard</h1>
      <p className="admin-page-subtitle">Welcome to the Collector&apos;s Paradise admin panel.</p>

      <div className="admin-stats-grid">
        {stats.map((stat) => (
          <div key={stat.label} className="admin-stat-card">
            <div className="admin-stat-icon">{stat.icon}</div>
            <div className="admin-stat-value">{stat.value}</div>
            <div className="admin-stat-label">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

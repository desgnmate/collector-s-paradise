'use client';

import { useMemo } from 'react';
import { useAdminData } from '@/contexts/AdminDataContext';
import { useAdminRouter, type AdminRoute } from '@/contexts/AdminRouterContext';
import { requestVendorView } from '@/contexts/RegistrationQueueContext';
import { useAdminAttention } from '@/components/admin/useAdminAttention';
import { RowChevron } from '@/components/admin/ui';
import { formatEventTimeRange } from '@/lib/event-date';

type AttentionItem = {
  key: string;
  title: string;
  detail: string;
  tone: 'attention' | 'alert' | 'neutral';
  route: AdminRoute;
  vendorView?: 'events' | 'unassigned' | 'vendors' | 'review';
};

function plural(count: number, one: string, many = `${one}s`) {
  return `${count} ${count === 1 ? one : many}`;
}

export default function DashboardContent() {
  const { stats, events, vendors, loading } = useAdminData();
  const { navigate } = useAdminRouter();
  const attention = useAdminAttention();

  const upcomingEvents = useMemo(() => events
    .filter((event) => event.status === 'upcoming')
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, 5), [events]);

  const approvedByEvent = useMemo(() => {
    const counts = new Map<string, number>();
    for (const vendor of vendors) {
      for (const application of vendor.event_applications) {
        if (application.application_status === 'approved') {
          counts.set(application.event_id, (counts.get(application.event_id) || 0) + 1);
        }
      }
    }
    return counts;
  }, [vendors]);

  const items: AttentionItem[] = [];
  if (attention.reviewQueue > 0) items.push({
    key: 'queue', tone: 'attention', route: '/admin/vendors', vendorView: 'review',
    title: `${plural(attention.reviewQueue, 'submission')} in the review queue`,
    detail: 'Repeat applicants and directory sign-ups to link to a profile',
  });
  if (attention.pendingApplications > 0) items.push({
    key: 'applications', tone: 'attention', route: '/admin/vendors', vendorView: 'events',
    title: `${plural(attention.pendingApplications, 'pending vendor application')}`,
    detail: 'Approve, waitlist or reject from each event roster',
  });
  if (attention.failedInvitations > 0) items.push({
    key: 'invitations', tone: 'alert', route: '/admin/vendors', vendorView: 'events',
    title: `${plural(attention.failedInvitations, 'invitation email')} did not send`,
    detail: 'Open the vendor on its event roster to resend',
  });
  if (attention.openReports > 0) items.push({
    key: 'reports', tone: attention.urgentReports > 0 ? 'alert' : 'attention', route: '/admin/reports',
    title: `${plural(attention.openReports, 'open report')}${attention.urgentReports > 0 ? `, ${attention.urgentReports} urgent` : ''}`,
    detail: attention.oldestOpenReport ? `Oldest: “${attention.oldestOpenReport.subject}”` : 'Website and booking issues from visitors',
  });
  if (attention.pendingSponsors > 0) items.push({
    key: 'sponsors', tone: 'attention', route: '/admin/sponsors',
    title: `${plural(attention.pendingSponsors, 'sponsor application')} to review`, detail: 'New partnership enquiries',
  });
  if (attention.pendingVolunteers > 0) items.push({
    key: 'volunteers', tone: 'attention', route: '/admin/volunteers',
    title: `${plural(attention.pendingVolunteers, 'volunteer application')} to review`, detail: 'People offering to help at events',
  });

  const open = (item: AttentionItem) => {
    if (item.vendorView) requestVendorView(item.vendorView);
    navigate(item.route);
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-dashboard-loading">
          <div className="admin-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  const summary = [
    { label: 'Vendor profiles', value: stats.totalVendors },
    { label: 'Pending applications', value: attention.pendingApplications },
    { label: 'In review queue', value: attention.reviewQueueLoading && attention.reviewQueue === 0 ? '…' : attention.reviewQueue },
    { label: 'Upcoming events', value: upcomingEvents.length },
    { label: 'Open reports', value: stats.openReports },
  ];

  return (
    <div className="admin-page admin-dashboard">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">What needs you today, and what’s coming up.</p>
      </div>

      <section className="admin-summary-grid" aria-label="Summary">
        {summary.map((card) => (
          <div key={card.label} className="admin-summary-card">
            <span>{card.label}</span>
            <strong>{card.value}</strong>
          </div>
        ))}
      </section>

      <div className="admin-dashboard-columns">
        <section className="admin-card-list" aria-labelledby="attention-title">
          <h2 id="attention-title" className="admin-card-list-title">Needs your attention</h2>
          {items.length === 0 ? (
            <p className="admin-card-list-empty">You’re all caught up. New applications and reports will show up here.</p>
          ) : items.map((item) => (
            <button key={item.key} type="button" className="admin-list-row" onClick={() => open(item)}>
              <span className={`admin-dot is-${item.tone}`} aria-hidden="true" />
              <span className="admin-list-row-copy">
                <strong>{item.title}</strong>
                <span>{item.detail}</span>
              </span>
              <RowChevron />
            </button>
          ))}
        </section>

        <section className="admin-card-list" aria-labelledby="events-title">
          <div className="admin-card-list-heading">
            <h2 id="events-title" className="admin-card-list-title">Upcoming events</h2>
            <button type="button" className="admin-text-button" onClick={() => navigate('/admin/events')}>View all</button>
          </div>
          {upcomingEvents.length === 0 ? (
            <p className="admin-card-list-empty">No upcoming events scheduled.</p>
          ) : upcomingEvents.map((event) => {
            const date = new Date(`${event.event_date}T00:00:00`);
            const approved = approvedByEvent.get(event.id) || 0;
            return (
              <button
                key={event.id}
                type="button"
                className="admin-list-row"
                onClick={() => { requestVendorView('events'); navigate('/admin/vendors'); }}
                aria-label={`${event.title}, ${date.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}. Open vendor roster`}
              >
                <span className="admin-date-chip" aria-hidden="true">
                  <small>{date.toLocaleDateString('en-AU', { month: 'short' })}</small>
                  <strong>{date.getDate()}</strong>
                </span>
                <span className="admin-list-row-copy">
                  <strong>{event.title}</strong>
                  <span>{[event.venue, formatEventTimeRange(event.start_time, event.end_time)].filter(Boolean).join(' · ')}</span>
                </span>
                <span className="admin-list-row-meta">{plural(approved, 'vendor')}</span>
                <RowChevron />
              </button>
            );
          })}
        </section>
      </div>
    </div>
  );
}

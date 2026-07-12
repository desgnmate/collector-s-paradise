'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAdminData } from '@/contexts/AdminDataContext';
import { getAdminEvents, type Event } from '@/app/actions/events';

export default function DashboardContent() {
  const { stats, loading, error, refreshData } = useAdminData();

  // Fallback stats while loading or if stats is null
  const displayStats = stats || {
    totalVendors: 0,
    pendingVendors: 0,
    approvedVendors: 0,
    totalEvents: 0,
  };

  const [events, setEvents] = useState<Event[]>([]);
  const [eventsLoading, setEventsLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const data = await getAdminEvents();
        setEvents(data);
      } catch (err) {
        console.error('Failed to fetch events for dashboard:', err);
      } finally {
        setEventsLoading(false);
      }
    };
    fetchEvents();
  }, []);

  const upcomingEvents = events
    .filter(e => e.status === 'upcoming')
    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime())
    .slice(0, 5);

  const statCards = [
    {
      label: 'Total Vendors',
      value: displayStats.totalVendors,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
      ),
      tone: 'yellow',
    },
    {
      label: 'Pending',
      value: displayStats.pendingVendors,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      ),
      tone: 'red',
    },
    {
      label: 'Approved',
      value: displayStats.approvedVendors,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
          <polyline points="22 4 12 14.01 9 11.01" />
        </svg>
      ),
      tone: 'green',
    },
    {
      label: 'Events',
      value: displayStats.totalEvents,
      icon: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
      ),
      tone: 'blue',
    },
  ];

  if (loading && !stats) {
    return (
      <div className="admin-page">
        <div className="admin-dashboard-loading">
          <div className="admin-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1 className="admin-page-title">Dashboard</h1>
        <p className="admin-page-subtitle">Welcome to Collector&apos;s Paradise Admin Panel.</p>
      </div>

      <div className="admin-stats-grid">
        {statCards.map((card, index) => (
          <div key={index} className={`admin-stat-card admin-stat-card--${card.tone}`}>
            <div className="admin-stat-icon">
              {card.icon}
            </div>
            <div className="admin-stat-content">
              <span className="admin-stat-value">{card.value}</span>
              <span className="admin-stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="admin-dashboard-workspace">
        <section className="admin-dashboard-section admin-dashboard-section--events">
          <div className="admin-section-heading">
            <div>
              <span className="admin-section-kicker">Schedule</span>
              <h2 className="admin-section-title">Upcoming Events</h2>
            </div>
            <a href="/admin/events" className="admin-section-link">View all events</a>
          </div>
          {eventsLoading ? (
            <div className="admin-dashboard-message">
              <div className="admin-spinner"></div>
              <span>Loading upcoming events...</span>
            </div>
          ) : upcomingEvents.length > 0 ? (
            <div className="events-grid">
              {upcomingEvents.map(event => (
                <div key={event.id} className="event-card">
                  {event.cover_image_url && (
                    <div className="event-cover-image-wrapper">
                      <Image src={event.cover_image_url} alt={event.title} className="event-cover-image" fill style={{ objectFit: 'cover' }} />
                    </div>
                  )}

                  <h3 className="event-card-title">{event.title}</h3>

                  <div className="event-card-details">
                    <div className="event-detail">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span>{new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>

                    <div className="event-detail">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <polyline points="12 6 12 12 16 14" />
                      </svg>
                      <span>{event.start_time} – {event.end_time}</span>
                    </div>

                    {(event.venue_address || event.venue) && (
                      <div className="event-detail">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                          <circle cx="12" cy="10" r="3" />
                        </svg>
                        <span>{event.venue_address || event.venue}</span>
                      </div>
                    )}

                    <div className="event-detail">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                        <circle cx="9" cy="7" r="4" />
                        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                      </svg>
                      <span>{event.tickets_sold} / {event.capacity} sold</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="admin-dashboard-message">No upcoming events scheduled.</div>
          )}
        </section>

        <section className="admin-dashboard-section admin-dashboard-section--actions">
          <span className="admin-section-kicker">Shortcuts</span>
          <h2 className="admin-section-title">Quick Actions</h2>
          <div className="admin-quick-actions">
            <a href="/admin/vendors" className="admin-action-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
              <path d="M16 3.13a4 4 0 0 1 0 7.75" />
            </svg>
            <span>Manage Vendors</span>
            </a>
            <a href="/admin/events" className="admin-action-card">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
              <line x1="16" y1="2" x2="16" y2="6" />
              <line x1="8" y1="2" x2="8" y2="6" />
              <line x1="3" y1="10" x2="21" y2="10" />
            </svg>
            <span>View Events</span>
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}

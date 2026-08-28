'use client';

import { useAdminRouter, type AdminRoute } from '@/contexts/AdminRouterContext';
import DashboardContent from '@/components/DashboardContent';
import VendorsContent from '@/app/admin/vendors/AdminVendorsClient';
import VolunteersContent from '@/app/admin/volunteers/AdminVolunteersClient';
import SponsorsContent from '@/app/admin/sponsors/AdminSponsorsClient';
import EventsContent from '@/components/EventsContent';
import AboutContent from '@/components/AboutContent';
import ReportsContent from '@/app/admin/reports/AdminReportsClient';

const adminViews: Array<{ route: AdminRoute; content: React.ReactNode }> = [
  { route: '/admin', content: <DashboardContent /> },
  { route: '/admin/vendors', content: <VendorsContent /> },
  { route: '/admin/volunteers', content: <VolunteersContent /> },
  { route: '/admin/sponsors', content: <SponsorsContent /> },
  { route: '/admin/events', content: <EventsContent /> },
  { route: '/admin/reports', content: <ReportsContent /> },
  { route: '/admin/about', content: <AboutContent /> },
];

export default function AdminContentRouter() {
  const { currentRoute } = useAdminRouter();

  // Static wrapper tree keeps SSR and hydration identical. Views stay mounted,
  // so filters, pagination, and fetched data survive admin tab navigation.
  return adminViews.map(({ route, content }) => {
    const isActive = route === currentRoute;

    return (
      <section
        key={route}
        className="admin-route-view"
        hidden={!isActive}
        aria-hidden={!isActive}
        inert={!isActive}
      >
        {content}
      </section>
    );
  });
}

'use client';

import { useAdminRouter } from '@/contexts/AdminRouterContext';
import DashboardContent from '@/components/DashboardContent';
import VendorsContent from '@/app/admin/vendors/AdminVendorsClient';
import VolunteersContent from '@/app/admin/volunteers/AdminVolunteersClient';
import SponsorsContent from '@/app/admin/sponsors/AdminSponsorsClient';
import EventsContent from '@/components/EventsContent';
import AboutContent from '@/components/AboutContent';

export default function AdminContentRouter() {
  const { currentRoute } = useAdminRouter();

  // Render content based on route - all client-side, no server fetch
  switch (currentRoute) {
    case '/admin':
      return <DashboardContent />;
    case '/admin/vendors':
      return <VendorsContent />;
    case '/admin/volunteers':
      return <VolunteersContent />;
    case '/admin/sponsors':
      return <SponsorsContent />;
    case '/admin/events':
      return <EventsContent />;
    case '/admin/about':
      return <AboutContent />;
    default:
      return <DashboardContent />;
  }
}

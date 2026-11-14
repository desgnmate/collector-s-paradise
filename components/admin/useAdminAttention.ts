'use client';

import { useMemo } from 'react';
import { useAdminData } from '@/contexts/AdminDataContext';
import { useRegistrationQueue } from '@/contexts/RegistrationQueueContext';

/** Counts of work waiting for an admin, shared by the sidebar and dashboard. */
export function useAdminAttention() {
  const { vendors, sponsors, volunteers, reports } = useAdminData();
  const queue = useRegistrationQueue();

  return useMemo(() => {
    const applications = vendors.flatMap((vendor) => vendor.event_applications);
    const openReports = reports.filter((report) => !['resolved', 'closed'].includes(report.status));
    return {
      reviewQueue: queue.requests.length,
      reviewQueueLoading: queue.loading,
      pendingApplications: applications.filter((application) => application.application_status === 'pending').length,
      failedInvitations: applications.filter((application) => application.invitation_status === 'failed').length,
      pendingSponsors: sponsors.filter((sponsor) => sponsor.application_status === 'pending').length,
      pendingVolunteers: volunteers.filter((volunteer) => volunteer.application_status === 'pending').length,
      openReports: openReports.length,
      urgentReports: openReports.filter((report) => report.priority === 'urgent' || report.impact === 'urgent').length,
      oldestOpenReport: [...openReports].sort((a, b) => a.created_at.localeCompare(b.created_at))[0] || null,
    };
  }, [vendors, sponsors, volunteers, reports, queue.requests.length, queue.loading]);
}

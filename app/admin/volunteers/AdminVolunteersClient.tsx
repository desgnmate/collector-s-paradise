'use client';

import { useCallback } from 'react';
import { useAdminData } from '@/contexts/AdminDataContext';
import { approveVolunteer, deleteVolunteer, rejectVolunteer, waitlistVolunteer } from '@/app/actions/volunteers';
import type { Volunteer } from '@/app/actions/volunteers';
import ApplicantsBoard, { type ApplicantStatusConfig } from '@/components/admin/ApplicantsBoard';
import { DetailList } from '@/components/admin/ui';

type VolunteerStatus = Volunteer['application_status'];

const STATUSES: ApplicantStatusConfig<VolunteerStatus>[] = [
  { value: 'pending', label: 'Pending', decisionLabel: 'Pending', tone: 'neutral', pill: 'pending', emails: false },
  { value: 'approved', label: 'Approved', decisionLabel: 'Approve', tone: 'positive', pill: 'approved', emails: true },
  { value: 'waitlisted', label: 'Waitlisted', decisionLabel: 'Waitlist', tone: 'caution', pill: 'waitlisted', emails: true },
  { value: 'rejected', label: 'Rejected', decisionLabel: 'Reject', tone: 'negative', pill: 'rejected', emails: true },
];

const formatDate = (value: string) => new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminVolunteersClient() {
  const { volunteers, loading, errors, setVolunteers, refreshData } = useAdminData();

  const decide = useCallback(async (volunteer: Volunteer, status: VolunteerStatus, reason: string) => {
    switch (status) {
      case 'approved': return approveVolunteer(volunteer.id);
      case 'rejected': return rejectVolunteer(volunteer.id, reason || undefined);
      case 'waitlisted': return waitlistVolunteer(volunteer.id);
      default: return { success: false, message: 'Pending cannot be set again.' };
    }
  }, []);

  return (
    <ApplicantsBoard<Volunteer, VolunteerStatus>
      title="Volunteers"
      subtitle="People offering to help at events. Open one to see their availability and record a decision."
      noun="volunteer"
      items={volunteers}
      statuses={STATUSES}
      loading={loading}
      error={errors.volunteers}
      onRetry={() => void refreshData(['volunteers'])}
      getId={(volunteer) => volunteer.id}
      getName={(volunteer) => volunteer.full_name}
      getStatus={(volunteer) => volunteer.application_status}
      getSearchText={(volunteer) => [volunteer.full_name, volunteer.email, volunteer.phone, ...(volunteer.preferred_roles || [])].filter(Boolean).join(' ')}
      renderRowMeta={(volunteer) => [
        volunteer.preferred_roles?.slice(0, 2).join(', '),
        formatDate(volunteer.applied_at),
      ].filter(Boolean).join(' · ')}
      decide={decide}
      remove={(volunteer) => deleteVolunteer(volunteer.id)}
      applyStatus={(id, status, reason) => setVolunteers((current) => current.map((volunteer) => volunteer.id === id
        ? { ...volunteer, application_status: status, rejection_reason: status === 'rejected' ? reason : null, updated_at: new Date().toISOString() }
        : volunteer))}
      removeItem={(id) => setVolunteers((current) => current.filter((volunteer) => volunteer.id !== id))}
      renderDetails={(volunteer) => (
        <DetailList rows={[
          ['Email', <a key="email" href={`mailto:${volunteer.email}`}>{volunteer.email}</a>],
          ['Phone', volunteer.phone],
          ['Roles', volunteer.preferred_roles?.join(', ')],
          ['Availability', <span key="availability" className="admin-preserve-lines">{volunteer.availability}</span>],
          ['Events', volunteer.events_interested?.join(', ')],
          ['Experience', volunteer.previous_experience],
          ['T-shirt', volunteer.t_shirt_size],
          ['Emergency contact', [volunteer.emergency_contact_name, volunteer.emergency_contact_phone].filter(Boolean).join(' · ')],
          ['Notes', volunteer.additional_notes],
          ['Heard via', volunteer.how_heard_about],
          ['Rejection reason', volunteer.application_status === 'rejected' ? volunteer.rejection_reason : null],
          ['Applied', formatDate(volunteer.applied_at)],
        ]} />
      )}
    />
  );
}

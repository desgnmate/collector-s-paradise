'use client';

import { useCallback } from 'react';
import { useAdminData } from '@/contexts/AdminDataContext';
import { approveSponsor, deleteSponsor, negotiateSponsor, rejectSponsor, waitlistSponsor } from '@/app/actions/sponsors';
import type { Sponsor } from '@/app/actions/sponsors';
import ApplicantsBoard, { type ApplicantStatusConfig } from '@/components/admin/ApplicantsBoard';
import { DetailList } from '@/components/admin/ui';

type SponsorStatus = Sponsor['application_status'];

const STATUSES: ApplicantStatusConfig<SponsorStatus>[] = [
  { value: 'pending', label: 'Pending', decisionLabel: 'Pending', tone: 'neutral', pill: 'pending', emails: false },
  { value: 'negotiating', label: 'Negotiating', decisionLabel: 'Negotiate', tone: 'info', pill: 'info', emails: false },
  { value: 'approved', label: 'Approved', decisionLabel: 'Approve', tone: 'positive', pill: 'approved', emails: true },
  { value: 'waitlisted', label: 'Waitlisted', decisionLabel: 'Waitlist', tone: 'caution', pill: 'waitlisted', emails: true },
  { value: 'rejected', label: 'Rejected', decisionLabel: 'Reject', tone: 'negative', pill: 'rejected', emails: true },
];

const formatDate = (value: string) => new Date(value).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' });
const titleCase = (value: string | null) => value ? value.charAt(0).toUpperCase() + value.slice(1) : null;
const safeLink = (url: string | null) => url && /^https?:\/\//i.test(url) ? url : null;

function ContractProgress({ sponsor }: { sponsor: Sponsor }) {
  const steps = [
    ['Contract sent', sponsor.contract_sent],
    ['Contract signed', sponsor.contract_signed],
    ['Payment received', sponsor.payment_received],
  ] as const;
  const done = steps.filter(([, value]) => value).length;
  return (
    <span className="admin-progress-dots" title={steps.map(([label, value]) => `${label}: ${value ? 'yes' : 'no'}`).join(' · ')}>
      {steps.map(([label, value]) => <span key={label} className={value ? 'is-done' : ''} aria-hidden="true" />)}
      <span className="sr-only">{done} of 3 contract steps done</span>
    </span>
  );
}

export default function AdminSponsorsClient() {
  const { sponsors, loading, errors, setSponsors, refreshData } = useAdminData();

  const decide = useCallback(async (sponsor: Sponsor, status: SponsorStatus, reason: string) => {
    switch (status) {
      case 'approved': return approveSponsor(sponsor.id);
      case 'rejected': return rejectSponsor(sponsor.id, reason || undefined);
      case 'waitlisted': return waitlistSponsor(sponsor.id);
      case 'negotiating': return negotiateSponsor(sponsor.id);
      default: return { success: false, message: 'Pending cannot be set again.' };
    }
  }, []);

  return (
    <ApplicantsBoard<Sponsor, SponsorStatus>
      title="Sponsors"
      subtitle="Partnership enquiries. Open one to read the details and record a decision."
      noun="sponsor"
      items={sponsors}
      statuses={STATUSES}
      loading={loading}
      error={errors.sponsors}
      onRetry={() => void refreshData(['sponsors'])}
      getId={(sponsor) => sponsor.id}
      getName={(sponsor) => sponsor.company_name}
      getStatus={(sponsor) => sponsor.application_status}
      getSearchText={(sponsor) => [sponsor.company_name, sponsor.contact_name, sponsor.contact_email, sponsor.industry].filter(Boolean).join(' ')}
      renderRowMeta={(sponsor) => [
        titleCase(sponsor.sponsorship_tier),
        sponsor.sponsorship_interest?.slice(0, 2).join(', '),
        formatDate(sponsor.applied_at),
      ].filter(Boolean).join(' · ')}
      renderRowExtra={(sponsor) => <ContractProgress sponsor={sponsor} />}
      decide={decide}
      remove={(sponsor) => deleteSponsor(sponsor.id)}
      applyStatus={(id, status, reason) => setSponsors((current) => current.map((sponsor) => sponsor.id === id
        ? { ...sponsor, application_status: status, rejection_reason: status === 'rejected' ? reason : null, updated_at: new Date().toISOString() }
        : sponsor))}
      removeItem={(id) => setSponsors((current) => current.filter((sponsor) => sponsor.id !== id))}
      renderDetails={(sponsor) => {
        const website = safeLink(sponsor.website);
        return (
          <>
            {sponsor.brand_description && <p className="admin-panel-lead">{sponsor.brand_description}</p>}
            <DetailList rows={[
              ['Contact', [sponsor.contact_name, sponsor.contact_position].filter(Boolean).join(', ')],
              ['Email', <a key="email" href={`mailto:${sponsor.contact_email}`}>{sponsor.contact_email}</a>],
              ['Phone', sponsor.contact_phone],
              ['Website', website ? <a key="web" href={website} target="_blank" rel="noopener noreferrer">{website.replace(/^https?:\/\//, '')}</a> : sponsor.website],
              ['Industry', [sponsor.industry, sponsor.company_size].filter(Boolean).join(' · ')],
              ['Tier', titleCase(sponsor.sponsorship_tier)],
              ['Budget', sponsor.budget_range],
              ['Interests', sponsor.sponsorship_interest?.join(', ')],
              ['Events', sponsor.events_interested?.join(', ')],
              ['Extras', sponsor.additional_services?.join(', ')],
              ['Booth size', sponsor.preferred_booth_size],
              ['Goals', sponsor.marketing_goals],
              ['Social', sponsor.social_media_links],
              ['Custom idea', sponsor.custom_proposal],
              ['Sponsored before', sponsor.previous_sponsor === null ? null : sponsor.previous_sponsor ? 'Yes' : 'No'],
              ['Notes', sponsor.additional_notes],
              ['Heard via', sponsor.how_heard_about],
              ['Contract', `${sponsor.contract_sent ? 'Sent' : 'Not sent'} · ${sponsor.contract_signed ? 'Signed' : 'Not signed'} · ${sponsor.payment_received ? 'Paid' : 'Payment pending'}`],
              ['Rejection reason', sponsor.application_status === 'rejected' ? sponsor.rejection_reason : null],
              ['Applied', formatDate(sponsor.applied_at)],
            ]} />
          </>
        );
      }}
    />
  );
}

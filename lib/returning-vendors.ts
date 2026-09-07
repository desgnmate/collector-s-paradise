import { z } from 'zod';

export const returningRequirementsSchema = z.object({
  vendor_id: z.string().uuid('Select your business profile.'),
  event_ids: z.array(z.string().uuid()).min(1, 'Select at least one event.').max(50),
  tables_requested: z.enum(['1', '2', '3', '4', '5+'], { error: 'Select the number of tables.' }),
  power_requirements: z.enum(['', 'none', 'standard', 'multiple', 'heavy']),
  additional_notes: z.string().trim().max(2000, 'Keep notes under 2,000 characters.'),
  agreement: z.literal(true, { error: 'Please agree to the terms.' }),
});

export const returningProfilesSchema = z.array(z.object({
  id: z.string().uuid(), business_name: z.string(), contact_name: z.string(),
  logo_url: z.string().nullable(), duplicate_count: z.number(),
  applications: z.array(z.object({ event_id: z.string().uuid(), status: z.enum(['pending', 'approved', 'rejected', 'waitlisted']) })),
}));
export type ReturningProfile = z.infer<typeof returningProfilesSchema>[number];

export const returningResultSchema = z.object({
  vendor_id: z.string().uuid(),
  receipt_ids: z.array(z.string().uuid()),
  outcomes: z.array(z.object({
    event_id: z.string().uuid(), title: z.string(),
    outcome: z.enum(['created', 'existing', 'unavailable']),
    status: z.enum(['pending', 'approved', 'rejected', 'waitlisted', 'needs_review', 'unavailable']),
  })).min(1),
});
export type ReturningResult = z.infer<typeof returningResultSchema>;

export function applicationStatusText(status: ReturningResult['outcomes'][number]['status']) {
  return {
    pending: 'Pending review', approved: 'Already approved',
    rejected: 'Previously declined — contact support to request reconsideration',
    waitlisted: 'On the waitlist', needs_review: 'Conflicting records — our team needs to review this',
    unavailable: 'Not accepting applications — no application created',
  }[status];
}

export function readReturningRequirements(formData: FormData) {
  return {
    vendor_id: String(formData.get('vendor_id') || ''),
    event_ids: [...new Set(formData.getAll('event_ids').map(String))],
    tables_requested: String(formData.get('tables_requested') || ''),
    power_requirements: String(formData.get('power_requirements') || ''),
    additional_notes: String(formData.get('additional_notes') || ''),
    agreement: formData.get('agreement') === 'on',
  };
}

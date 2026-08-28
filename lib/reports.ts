export const REPORT_CATEGORY_OPTIONS = [
  { value: 'website_bug', label: 'Website bug or error' },
  { value: 'ticket_booking', label: 'Ticket or booking issue' },
  { value: 'vendor_account', label: 'Vendor application or account' },
  { value: 'event_information', label: 'Event information' },
  { value: 'accessibility', label: 'Accessibility issue' },
  { value: 'payment_refund', label: 'Payment or refund' },
  { value: 'other', label: 'Something else' },
] as const;

export const REPORT_IMPACT_OPTIONS = [
  { value: 'low', label: 'Minor', description: 'I can still use the website.' },
  { value: 'medium', label: 'Disruptive', description: 'Part of the website is not working.' },
  { value: 'high', label: 'Blocking', description: 'I cannot complete what I need to do.' },
  { value: 'urgent', label: 'Urgent', description: 'Payments, privacy, or many users may be affected.' },
] as const;

export const REPORT_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'waiting_on_reporter', label: 'Waiting on reporter' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
] as const;

export const REPORT_PRIORITY_OPTIONS = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
] as const;

export type ReportCategory = (typeof REPORT_CATEGORY_OPTIONS)[number]['value'];
export type ReportImpact = (typeof REPORT_IMPACT_OPTIONS)[number]['value'];
export type ReportStatus = (typeof REPORT_STATUS_OPTIONS)[number]['value'];
export type ReportPriority = (typeof REPORT_PRIORITY_OPTIONS)[number]['value'];
export type ReportNotificationStatus = 'pending' | 'sent' | 'failed';

export type SupportReport = {
  id: string;
  ticket_number: string;
  reporter_name: string;
  reporter_email: string;
  category: ReportCategory;
  impact: ReportImpact;
  priority: ReportPriority;
  subject: string;
  description: string;
  page_url: string | null;
  browser_details: string | null;
  status: ReportStatus;
  admin_notes: string | null;
  admin_notification_status: ReportNotificationStatus;
  admin_notification_resend_id: string | null;
  admin_notification_error: string | null;
  admin_notification_attempt_count: number;
  admin_notification_sent_at: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
};

export function reportPriorityForImpact(impact: ReportImpact): ReportPriority {
  if (impact === 'urgent') return 'urgent';
  if (impact === 'high') return 'high';
  if (impact === 'low') return 'low';
  return 'normal';
}

export function reportOptionLabel(
  options: readonly { value: string; label: string }[],
  value: string,
) {
  return options.find((option) => option.value === value)?.label || value;
}

export function generateReportTicketNumber(now = new Date(), randomId = crypto.randomUUID()) {
  const date = now.toISOString().slice(0, 10).replaceAll('-', '');
  const suffix = randomId.replaceAll('-', '').slice(0, 8).toUpperCase();
  return `CP-REP-${date}-${suffix}`;
}

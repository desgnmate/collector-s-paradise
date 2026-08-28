'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { sendReportNotificationEmail } from '@/lib/email';
import {
  REPORT_CATEGORY_OPTIONS,
  REPORT_IMPACT_OPTIONS,
  REPORT_PRIORITY_OPTIONS,
  REPORT_STATUS_OPTIONS,
  generateReportTicketNumber,
  reportPriorityForImpact,
  type ReportCategory,
  type ReportImpact,
  type ReportPriority,
  type ReportStatus,
  type SupportReport,
} from '@/lib/reports';
import {
  createSupabaseAdminClient,
  SupabaseAdminConfigurationError,
} from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const categoryValues = REPORT_CATEGORY_OPTIONS.map((option) => option.value) as [
  ReportCategory,
  ...ReportCategory[],
];
const impactValues = REPORT_IMPACT_OPTIONS.map((option) => option.value) as [
  ReportImpact,
  ...ReportImpact[],
];
const priorityValues = REPORT_PRIORITY_OPTIONS.map((option) => option.value) as [
  ReportPriority,
  ...ReportPriority[],
];
const statusValues = REPORT_STATUS_OPTIONS.map((option) => option.value) as [
  ReportStatus,
  ...ReportStatus[],
];

const reportSchema = z.object({
  reporter_name: z.string().trim().min(2, 'Please enter your name.').max(120),
  reporter_email: z.string().trim().toLowerCase().email('Please enter a valid email address.').max(254),
  category: z.enum(categoryValues),
  impact: z.enum(impactValues),
  subject: z.string().trim().min(5, 'Please add a little more detail to the subject.').max(160),
  description: z.string().trim().min(20, 'Please describe what happened in at least 20 characters.').max(5000),
  page_url: z.string().trim().max(2048).optional().refine((value) => {
    if (!value) return true;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }, 'Please enter a valid http or https URL.'),
  browser_details: z.string().trim().max(1000).optional(),
  privacy_acknowledgement: z.literal(true, {
    error: 'Please confirm that we may use these details to investigate your report.',
  }),
});

const adminUpdateSchema = z.object({
  reportId: z.string().uuid(),
  status: z.enum(statusValues),
  priority: z.enum(priorityValues),
  admin_notes: z.string().trim().max(5000),
});

export type ReportFormState = {
  success?: boolean;
  message: string;
  ticketNumber?: string;
  errors?: Record<string, string[]>;
  fields?: Record<string, string>;
};

export type ReportAdminActionState = {
  success?: boolean;
  message: string;
  report?: SupportReport;
};

async function requireAdminClient() {
  const sessionClient = await createSupabaseServerClient();
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError || !user) return null;

  const { data: adminRecord, error: adminError } = await sessionClient
    .from('admin_users')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (adminError || !adminRecord) return null;
  return createSupabaseAdminClient();
}

function reportFields(formData: FormData) {
  return {
    reporter_name: String(formData.get('reporter_name') || ''),
    reporter_email: String(formData.get('reporter_email') || ''),
    category: String(formData.get('category') || ''),
    impact: String(formData.get('impact') || ''),
    subject: String(formData.get('subject') || ''),
    description: String(formData.get('description') || ''),
    page_url: String(formData.get('page_url') || ''),
    browser_details: String(formData.get('browser_details') || ''),
  };
}

async function persistNotificationResult(
  report: SupportReport,
  attemptNumber: number,
  result: Awaited<ReturnType<typeof sendReportNotificationEmail>>,
) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const update = result.success
    ? {
        admin_notification_status: 'sent' as const,
        admin_notification_resend_id: result.id,
        admin_notification_error: null,
        admin_notification_attempt_count: attemptNumber,
        admin_notification_sent_at: now,
      }
    : {
        admin_notification_status: 'failed' as const,
        admin_notification_resend_id: null,
        admin_notification_error: result.error.slice(0, 1000),
        admin_notification_attempt_count: attemptNumber,
        admin_notification_sent_at: null,
      };

  const { data, error } = await supabase
    .from('reports')
    .update(update)
    .eq('id', report.id)
    .select('*')
    .single();

  if (error) {
    console.error('Failed to record report notification state:', error);
    return report;
  }

  return data as SupportReport;
}

export async function submitSupportReport(
  _previousState: ReportFormState,
  formData: FormData,
): Promise<ReportFormState> {
  const fields = reportFields(formData);
  const honeypot = String(formData.get('website') || '');

  if (honeypot) {
    return {
      success: true,
      message: 'Thanks. Your report has been received.',
      ticketNumber: generateReportTicketNumber(),
    };
  }

  const parsed = reportSchema.safeParse({
    ...fields,
    page_url: fields.page_url || undefined,
    browser_details: fields.browser_details || undefined,
    privacy_acknowledgement: formData.get('privacy_acknowledgement') === 'on',
  });

  if (!parsed.success) {
    return {
      message: 'Please check the highlighted fields and try again.',
      errors: parsed.error.flatten().fieldErrors,
      fields,
    };
  }

  try {
    const supabase = createSupabaseAdminClient();
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count, error: countError } = await supabase
      .from('reports')
      .select('id', { count: 'exact', head: true })
      .eq('reporter_email', parsed.data.reporter_email)
      .gte('created_at', oneHourAgo);

    if (countError) throw countError;
    if ((count || 0) >= 3) {
      return {
        message: 'You have submitted several reports recently. Please wait an hour before trying again.',
        fields,
      };
    }

    const id = crypto.randomUUID();
    const ticketNumber = generateReportTicketNumber(new Date(), id);
    const { data, error } = await supabase
      .from('reports')
      .insert({
        id,
        ticket_number: ticketNumber,
        reporter_name: parsed.data.reporter_name,
        reporter_email: parsed.data.reporter_email,
        category: parsed.data.category,
        impact: parsed.data.impact,
        priority: reportPriorityForImpact(parsed.data.impact),
        subject: parsed.data.subject,
        description: parsed.data.description,
        page_url: parsed.data.page_url || null,
        browser_details: parsed.data.browser_details || null,
      })
      .select('*')
      .single();

    if (error) throw error;
    const report = data as SupportReport;
    const emailResult = await sendReportNotificationEmail(
      report,
      `report-admin-${report.id}-attempt-1`,
    );
    await persistNotificationResult(report, 1, emailResult);

    revalidatePath('/admin/reports');
    return {
      success: true,
      message: 'Your report has been filed. Keep the reference below in case you need to follow up.',
      ticketNumber,
    };
  } catch (error) {
    if (error instanceof SupabaseAdminConfigurationError) {
      console.error('Report submission is unavailable because the service role is not configured.');
      return { message: 'Reporting is temporarily unavailable. Please email admin@collectorsparadise.au.', fields };
    }

    console.error('Failed to submit support report:', error);
    const errorCode = typeof error === 'object' && error && 'code' in error
      ? String(error.code)
      : '';
    if (errorCode === '42P01') {
      return { message: 'Reporting is not set up yet. An administrator needs to run supabase/migrations/add_support_reports.sql.', fields };
    }
    return { message: 'We could not file your report just now. Please try again or email admin@collectorsparadise.au.', fields };
  }
}

export async function updateSupportReport(input: {
  reportId: string;
  status: ReportStatus;
  priority: ReportPriority;
  admin_notes: string;
}): Promise<ReportAdminActionState> {
  const parsed = adminUpdateSchema.safeParse(input);
  if (!parsed.success) return { message: 'The report update contains invalid values.' };

  const supabase = await requireAdminClient();
  if (!supabase) return { message: 'Admin access required.' };

  const resolved = parsed.data.status === 'resolved' || parsed.data.status === 'closed';
  const { data, error } = await supabase
    .from('reports')
    .update({
      status: parsed.data.status,
      priority: parsed.data.priority,
      admin_notes: parsed.data.admin_notes || null,
      resolved_at: resolved ? new Date().toISOString() : null,
    })
    .eq('id', parsed.data.reportId)
    .select('*')
    .single();

  if (error) {
    console.error('Failed to update support report:', error);
    return { message: `Could not update the report: ${error.message}` };
  }

  revalidatePath('/admin/reports');
  return { success: true, message: 'Report updated.', report: data as SupportReport };
}

export async function retryReportNotification(
  reportId: string,
): Promise<ReportAdminActionState> {
  if (!z.string().uuid().safeParse(reportId).success) return { message: 'Invalid report ID.' };
  const supabase = await requireAdminClient();
  if (!supabase) return { message: 'Admin access required.' };

  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('id', reportId)
    .single();

  if (error || !data) return { message: 'The report could not be found.' };
  const report = data as SupportReport;
  const attempt = report.admin_notification_attempt_count + 1;
  const emailResult = await sendReportNotificationEmail(
    report,
    `report-admin-${report.id}-attempt-${attempt}`,
  );
  const updatedReport = await persistNotificationResult(report, attempt, emailResult);

  revalidatePath('/admin/reports');
  return emailResult.success
    ? { success: true, message: 'Admin notification sent.', report: updatedReport }
    : { message: `Email could not be sent: ${emailResult.error}`, report: updatedReport };
}

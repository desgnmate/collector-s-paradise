import { Resend } from 'resend';
import type { SupportReport } from './reports';

// This module is imported directly by Node's test runner (tests/*.test.mjs),
// so it must not have runtime imports that rely on the `@/` path alias.

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@collectorsparadise.au';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const FROM = "Collector's Paradise <" + FROM_EMAIL + ">";
/** Production origin. Images always load from here so they render in every inbox, even for mail sent from a dev machine. */
const PUBLIC_SITE_URL = 'https://www.collectorsparadise.au';
const LOGO_URL = `${PUBLIC_SITE_URL}/images/email-logo.png`;
const INSTAGRAM_URL = 'https://www.instagram.com/collectorsparadise25';

function getAppUrl() {
  return (process.env.NEXT_PUBLIC_APP_URL || PUBLIC_SITE_URL).replace(/\/$/, '');
}

// ============================================
// Formatting helpers
// ============================================

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

/** Single-line text safe for subjects and plain-text bodies. */
function plainText(value: string | number | null | undefined) {
  return String(value ?? '')
    .replaceAll('\r', ' ')
    .replaceAll('\n', ' ')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/** Multi-line text for plain-text bodies (keeps line breaks, strips tags). */
function plainBlock(value: string | null | undefined) {
  return String(value ?? '')
    .replaceAll('\r\n', '\n')
    .replace(/<[^>]*>/g, '')
    .trim();
}

/** Only allow link schemes that are safe to place in an href. */
function safeUrl(value: string | null | undefined): string | null {
  if (!value) return null;
  try {
    const url = new URL(value.trim());
    return ['https:', 'http:', 'mailto:'].includes(url.protocol) ? url.toString() : null;
  } catch {
    return null;
  }
}

function formatAustralianDate(value: string | null | undefined) {
  if (!value) return null;
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('en-AU', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

function formatTime(value: string | null | undefined) {
  if (!value) return null;
  const [hours, minutes] = value.split(':').map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  const date = new Date(2000, 0, 1, hours, minutes);
  return date.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
}

function formatAud(value: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
  }).format(value);
}

/** "event_setup" / "gold" -> "Event setup" / "Gold" for option IDs without a label. */
function humanize(value: string) {
  const text = value.replace(/[_-]+/g, ' ').trim();
  return text ? text.charAt(0).toUpperCase() + text.slice(1) : text;
}

// ============================================
// Shared layout
// ============================================

const COLORS = {
  page: '#efede6',
  card: '#ffffff',
  border: '#dedad1',
  ink: '#242522',
  body: '#4f4f4a',
  muted: '#7a776f',
  soft: '#f5f3ed',
  accent: '#f3c447',
  dark: '#2b2c29',
};
const FONT = "'Helvetica Neue',Helvetica,Arial,sans-serif";

type EmailCta = { label: string; url: string | null | undefined };

type EmailLayout = {
  /** Inbox preview text shown after the subject line. */
  preheader: string;
  eyebrow: string;
  eyebrowColor?: string;
  /** Trusted HTML — callers must escape any user-supplied values. */
  headingHtml: string;
  /** Trusted HTML — callers must escape any user-supplied values. */
  bodyHtml: string;
  cta?: EmailCta | null;
  /** Small print under the card explaining why the recipient got this email. */
  footnote: string;
};

function paragraph(html: string, options: { last?: boolean; muted?: boolean } = {}) {
  return '<p style="margin:0 0 ' + (options.last ? '0' : '16px') + ';color:' + (options.muted ? COLORS.muted : COLORS.body) +
    ';font-size:' + (options.muted ? '13px' : '15px') + ';line-height:1.65">' + html + '</p>';
}

function strong(value: string | null | undefined) {
  return '<strong style="color:' + COLORS.ink + '">' + escapeHtml(value) + '</strong>';
}

type DetailRow = [label: string, value: string | null | undefined];

function detailsTable(rows: DetailRow[], total?: { label: string; value: string }) {
  const visible = rows.filter(([, value]) => value !== null && value !== undefined && value !== '');
  if (visible.length === 0 && !total) return '';
  const body = visible.map(([label, value]) =>
    '<tr>' +
    '<td style="padding:10px 12px 10px 0;border-bottom:1px solid #ece9e1;color:' + COLORS.muted + ';font-size:13px;line-height:1.5;vertical-align:top;width:38%">' + escapeHtml(label) + '</td>' +
    '<td style="padding:10px 0;border-bottom:1px solid #ece9e1;color:' + COLORS.ink + ';font-size:13px;line-height:1.5;font-weight:700;text-align:right;vertical-align:top;word-break:break-word">' + escapeHtml(value) + '</td>' +
    '</tr>',
  ).join('');
  const totalRow = total
    ? '<tr><td style="padding:14px 12px 4px 0;color:' + COLORS.ink + ';font-size:15px;font-weight:800">' + escapeHtml(total.label) + '</td>' +
      '<td style="padding:14px 0 4px;color:' + COLORS.ink + ';font-size:20px;font-weight:900;text-align:right">' + escapeHtml(total.value) + '</td></tr>'
    : '';
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:8px 0 24px;border-top:1px solid #ece9e1">' +
    body + totalRow + '</table>';
}

function panel(label: string, innerHtml: string, accent = COLORS.accent) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:separate;margin:0 0 24px">' +
    '<tr><td style="padding:18px 20px;border-left:4px solid ' + accent + ';border-radius:0 12px 12px 0;background:' + COLORS.soft + '">' +
    '<p style="margin:0 0 8px;color:' + COLORS.muted + ';font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">' + escapeHtml(label) + '</p>' +
    innerHtml +
    '</td></tr></table>';
}

function preformatted(value: string | null | undefined) {
  return '<p style="margin:0;color:' + COLORS.body + ';font-size:14px;line-height:1.7;white-space:pre-wrap;word-break:break-word">' + escapeHtml(value) + '</p>';
}

function bulletList(items: string[]) {
  if (items.length === 0) return '';
  return '<ul style="margin:0 0 20px;padding-left:20px;color:' + COLORS.body + ';font-size:15px;line-height:1.6">' +
    items.map((item) => '<li style="margin:4px 0">' + escapeHtml(item) + '</li>').join('') +
    '</ul>';
}

function numberedSteps(steps: string[]) {
  return '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 24px">' +
    steps.map((step, index) =>
      '<tr><td style="width:34px;padding:6px 0;vertical-align:top">' +
      '<div style="width:24px;height:24px;border-radius:12px;background:' + COLORS.accent + ';color:' + COLORS.ink + ';font-size:12px;font-weight:800;line-height:24px;text-align:center">' + (index + 1) + '</div></td>' +
      '<td style="padding:8px 0;color:' + COLORS.body + ';font-size:14px;line-height:1.55;vertical-align:top">' + step + '</td></tr>',
    ).join('') +
    '</table>';
}

function button(cta: EmailCta | null | undefined) {
  const url = safeUrl(cta?.url);
  if (!cta || !url) return '';
  return '<table role="presentation" cellpadding="0" cellspacing="0" align="center" style="margin:8px auto 4px">' +
    '<tr><td style="border-radius:999px;background:' + COLORS.accent + '">' +
    '<a href="' + escapeHtml(url) + '" style="display:inline-block;padding:14px 28px;border-radius:999px;color:' + COLORS.ink + ';font-family:' + FONT + ';font-size:15px;font-weight:800;text-decoration:none">' + escapeHtml(cta.label) + '</a>' +
    '</td></tr></table>';
}

function renderEmail(layout: EmailLayout) {
  const appUrl = getAppUrl();
  return '<!DOCTYPE html><html lang="en-AU"><head>' +
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">' +
    '<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">' +
    '<title>' + escapeHtml(layout.preheader) + '</title></head>' +
    '<body style="margin:0;padding:0;background:' + COLORS.page + ';-webkit-text-size-adjust:100%">' +
    // Preview text, padded so the inbox does not pull in body copy after it.
    '<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">' + escapeHtml(layout.preheader) +
    '&#8199;&#65279;&#847;'.repeat(30) + '</div>' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;background:' + COLORS.page + '">' +
    '<tr><td align="center" style="padding:28px 12px 36px;font-family:' + FONT + '">' +
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;border-collapse:collapse">' +
    // Logo
    '<tr><td align="center" style="padding:0 0 20px">' +
    '<a href="' + escapeHtml(appUrl) + '" style="text-decoration:none"><img src="' + LOGO_URL + '" width="160" height="67" alt="Collector&#039;s Paradise" style="display:block;width:160px;height:auto;border:0;outline:none;color:' + COLORS.ink + ';font-size:20px;font-weight:800"></a>' +
    '</td></tr>' +
    // Card
    '<tr><td style="border:1px solid ' + COLORS.border + ';border-radius:20px;background:' + COLORS.card + ';overflow:hidden">' +
    '<div style="height:6px;line-height:6px;font-size:0;background:' + COLORS.accent + ';border-radius:20px 20px 0 0">&nbsp;</div>' +
    '<div style="padding:32px 32px 36px">' +
    '<p style="margin:0 0 10px;color:' + (layout.eyebrowColor || '#8a6608') + ';font-size:11px;font-weight:800;letter-spacing:.15em;text-transform:uppercase">' + escapeHtml(layout.eyebrow) + '</p>' +
    '<h1 style="margin:0 0 22px;color:' + COLORS.ink + ';font-size:26px;line-height:1.2;letter-spacing:-.02em;font-weight:800">' + layout.headingHtml + '</h1>' +
    layout.bodyHtml +
    button(layout.cta) +
    '</div></td></tr>' +
    // Footer
    '<tr><td align="center" style="padding:24px 16px 0;color:' + COLORS.muted + ';font-size:12px;line-height:1.6">' +
    '<p style="margin:0 0 8px">' + layout.footnote + '</p>' +
    '<p style="margin:0">' +
    '<a href="' + escapeHtml(appUrl + '/events') + '" style="color:' + COLORS.ink + ';font-weight:700;text-decoration:none">Upcoming events</a>' +
    ' &nbsp;·&nbsp; <a href="' + escapeHtml(appUrl + '/faq') + '" style="color:' + COLORS.ink + ';font-weight:700;text-decoration:none">FAQ</a>' +
    ' &nbsp;·&nbsp; <a href="' + INSTAGRAM_URL + '" style="color:' + COLORS.ink + ';font-weight:700;text-decoration:none">Instagram</a>' +
    '</p>' +
    '<p style="margin:10px 0 0">Collector&#039;s Paradise · Australia&#039;s trading card &amp; collectibles events</p>' +
    '</td></tr>' +
    '</table></td></tr></table></body></html>';
}

/** Shared plain-text footer so every message ends the same way. */
function textFooter(note: string) {
  return ['', '—', note, `Collector's Paradise · ${getAppUrl()}`].join('\n');
}

// ============================================
// Sending
// ============================================

export type VendorInvitationEmailResult =
  | { success: true; id: string }
  | { success: false; error: string };

export type ApplicationStatusEmailResult = VendorInvitationEmailResult;
export type EmailSendResult = VendorInvitationEmailResult;

type EmailPayload = Parameters<Resend['emails']['send']>[0];

async function sendEmail(
  payload: EmailPayload,
  idempotencyKey?: string,
): Promise<EmailSendResult> {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Resend not configured' };
  try {
    const { data, error } = await resend.emails.send(
      payload,
      idempotencyKey ? { idempotencyKey } : undefined,
    );
    if (error || !data?.id) return { success: false, error: error?.message || 'Email send failed' };
    return { success: true, id: data.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown email error' };
  }
}

// ============================================
// Support reports
// ============================================

const REPORT_CATEGORY_LABELS: Record<SupportReport['category'], string> = {
  website_bug: 'Website bug or error',
  ticket_booking: 'Ticket or booking issue',
  vendor_account: 'Vendor application or account',
  event_information: 'Event information',
  accessibility: 'Accessibility issue',
  payment_refund: 'Payment or refund',
  other: 'Something else',
};

const REPORT_IMPACT_LABELS: Record<SupportReport['impact'], string> = {
  low: 'Minor',
  medium: 'Disruptive',
  high: 'Blocking',
  urgent: 'Urgent',
};

const IMPACT_COLORS: Record<SupportReport['impact'], string> = {
  low: '#5b6b4f',
  medium: '#8a6608',
  high: '#b54708',
  urgent: '#b42318',
};

/** Email: admin notification for a new support report. */
export async function sendReportNotificationEmail(
  report: SupportReport,
  idempotencyKey: string,
): Promise<ApplicationStatusEmailResult> {
  const category = REPORT_CATEGORY_LABELS[report.category];
  const impact = REPORT_IMPACT_LABELS[report.impact];
  const adminUrl = `${getAppUrl()}/admin/reports`;

  const result = await sendEmail({
    from: FROM,
    to: ADMIN_EMAIL,
    replyTo: report.reporter_email,
    subject: `[${report.ticket_number}] ${impact}: ${plainText(report.subject)}`,
    tags: [{ name: 'ticket_number', value: report.ticket_number }],
    html: renderEmail({
      preheader: `${impact} · ${category} — from ${plainText(report.reporter_name)}`,
      eyebrow: `New report · ${impact}`,
      eyebrowColor: IMPACT_COLORS[report.impact],
      headingHtml: escapeHtml(report.subject),
      bodyHtml:
        detailsTable([
          ['Ticket', report.ticket_number],
          ['Reporter', report.reporter_name],
          ['Email', report.reporter_email],
          ['Category', category],
          ['Impact', impact],
          ['Affected page', report.page_url],
          ['Browser / device', report.browser_details],
        ]) +
        panel('What happened', preformatted(report.description), IMPACT_COLORS[report.impact]) +
        paragraph('Reply to this email to contact ' + escapeHtml(report.reporter_name) + ' directly.', { muted: true }),
      cta: { label: 'Open Reports dashboard', url: adminUrl },
      footnote: 'Admin notification — sent because a visitor filed a report on the website.',
    }),
    text: [
      `New website report: ${plainText(report.ticket_number)}`,
      `Subject: ${plainText(report.subject)}`,
      `Reporter: ${plainText(report.reporter_name)} <${plainText(report.reporter_email)}>`,
      `Category: ${plainText(category)}`,
      `Impact: ${plainText(impact)}`,
      report.page_url ? `Affected page: ${plainText(report.page_url)}` : '',
      report.browser_details ? `Browser / device: ${plainText(report.browser_details)}` : '',
      '',
      plainBlock(report.description),
      '',
      `Manage this report: ${adminUrl}`,
    ].filter((line, index, lines) => line !== '' || lines[index - 1] !== '').join('\n'),
  }, idempotencyKey);

  if (!result.success) console.error('Error sending report notification:', result.error);
  return result;
}

/** Email: acknowledgement to the person who filed a support report. */
export async function sendReportReceiptEmail(
  report: Pick<SupportReport, 'id' | 'ticket_number' | 'reporter_name' | 'reporter_email' | 'subject' | 'category' | 'impact'>,
  idempotencyKey: string,
): Promise<EmailSendResult> {
  const category = REPORT_CATEGORY_LABELS[report.category];
  const result = await sendEmail({
    from: FROM,
    to: report.reporter_email,
    replyTo: ADMIN_EMAIL,
    subject: `We received your report [${report.ticket_number}]`,
    tags: [{ name: 'ticket_number', value: report.ticket_number }],
    html: renderEmail({
      preheader: `Reference ${report.ticket_number} — our team will look into it.`,
      eyebrow: 'Report received',
      headingHtml: 'Thanks — we’re on it',
      bodyHtml:
        paragraph('Hi ' + escapeHtml(report.reporter_name) + ',') +
        paragraph('Thanks for letting us know. Your report has been logged and our team will look into it. If we need more detail, we will reply to this email address.') +
        detailsTable([
          ['Reference', report.ticket_number],
          ['Subject', report.subject],
          ['Category', category],
        ]) +
        paragraph('Have something to add, like a screenshot? Reply to this email and include your reference number.', { muted: true, last: true }),
      footnote: 'You’re receiving this because you filed a report on collectorsparadise.au.',
    }),
    text: [
      `Hi ${plainText(report.reporter_name)},`,
      '',
      'Thanks for letting us know. Your report has been logged and our team will look into it.',
      '',
      `Reference: ${plainText(report.ticket_number)}`,
      `Subject: ${plainText(report.subject)}`,
      `Category: ${plainText(category)}`,
      '',
      'Have something to add? Reply to this email and include your reference number.',
      textFooter('You’re receiving this because you filed a report on our website.'),
    ].join('\n'),
  }, idempotencyKey);

  if (!result.success) console.error('Error sending report receipt:', result.error);
  return result;
}

// ============================================
// Vendor applications
// ============================================

export type NewApplicationEmailInput = {
  vendorId: string;
  vendorEmail: string;
  businessName: string;
  contactName: string;
  eventNames: string[];
  reference: string;
};

export type NewApplicationEmailResult = {
  vendor: VendorInvitationEmailResult;
  admin: VendorInvitationEmailResult;
};

/** Email: new vendor application — admin alert plus applicant receipt. */
export async function sendNewApplicationEmail(
  input: NewApplicationEmailInput,
  idempotencyKey: string,
): Promise<NewApplicationEmailResult> {
  if (!getResend()) {
    console.warn('Resend not configured. Skipping email notifications.');
    const result = { success: false, error: 'Resend not configured' } as const;
    return { vendor: result, admin: result };
  }

  const appUrl = getAppUrl();
  const eventListText = input.eventNames.length > 0
    ? `Events:\n${input.eventNames.map((eventName) => `- ${plainText(eventName)}`).join('\n')}`
    : '';
  const tags = [{ name: 'vendor_id', value: input.vendorId }];

  const sendAdmin = () => sendEmail({
    from: FROM,
    to: ADMIN_EMAIL,
    replyTo: input.vendorEmail,
    subject: 'New Vendor Application: ' + plainText(input.businessName),
    tags,
    html: renderEmail({
      preheader: `${plainText(input.businessName)} applied${input.eventNames.length ? ` for ${input.eventNames.length} event${input.eventNames.length === 1 ? '' : 's'}` : ''} · ${plainText(input.reference)}`,
      eyebrow: 'New vendor application',
      headingHtml: escapeHtml(input.businessName),
      bodyHtml:
        detailsTable([
          ['Contact', input.contactName],
          ['Email', input.vendorEmail],
          ['Reference', input.reference],
        ]) +
        (input.eventNames.length > 0
          ? paragraph(strong('Events applied for'), { last: true }) + bulletList(input.eventNames)
          : paragraph('Directory registration only — no events selected.')) +
        paragraph('Reply to this email to contact the vendor directly.', { muted: true }),
      cta: { label: 'Review in admin', url: `${appUrl}/admin/vendors` },
      footnote: 'Admin notification — sent because a vendor applied on the website.',
    }),
    text: [
      'New vendor application',
      `Business: ${plainText(input.businessName)}`,
      `Contact: ${plainText(input.contactName)}`,
      `Email: ${plainText(input.vendorEmail)}`,
      `Reference: ${plainText(input.reference)}`,
      eventListText,
      '',
      `Review in admin: ${appUrl}/admin/vendors`,
    ].filter(Boolean).join('\n'),
  }, `${idempotencyKey}-admin`);

  const sendVendor = () => sendEmail({
    from: FROM,
    to: input.vendorEmail,
    replyTo: ADMIN_EMAIL,
    subject: 'Application Received — Collector\'s Paradise',
    tags,
    html: renderEmail({
      preheader: `Your application for ${plainText(input.businessName)} is pending review. Reference ${plainText(input.reference)}.`,
      eyebrow: 'Application received',
      headingHtml: 'Thanks for applying, ' + escapeHtml(input.contactName),
      bodyHtml:
        paragraph('Your application for ' + strong(input.businessName) + ' has been received and is pending review.') +
        (input.eventNames.length > 0
          ? paragraph('You applied to trade at:', { last: true }) + bulletList(input.eventNames)
          : '') +
        detailsTable([['Application reference', input.reference]]) +
        paragraph(strong('What happens next'), { last: true }) +
        '<div style="height:10px;line-height:10px;font-size:0">&nbsp;</div>' +
        numberedSteps([
          'Our team reviews each application against the space available at every event.',
          'If you are approved, you will receive a separate invitation with your booth, fees and payment link.',
          'Your business only appears in the public vendor directory once an event application is approved.',
        ]) +
        paragraph('Questions? Reply to this email and quote your reference.', { muted: true, last: true }),
      cta: { label: 'Vendor booth information', url: `${appUrl}/vendors/booth-information` },
      footnote: 'You’re receiving this because you applied to trade at a Collector’s Paradise event.',
    }),
    text: [
      `Hi ${plainText(input.contactName)},`,
      '',
      `Your application for ${plainText(input.businessName)} has been received and is pending review.`,
      eventListText,
      `Application reference: ${plainText(input.reference)}`,
      '',
      'What happens next:',
      '1. Our team reviews each application against the space available at every event.',
      '2. If you are approved, you will receive a separate invitation with your booth, fees and payment link.',
      '3. Your business will not appear in the approved vendor directory unless an event application is approved.',
      '',
      `Booth information: ${appUrl}/vendors/booth-information`,
      textFooter('You’re receiving this because you applied to trade at a Collector’s Paradise event.'),
    ].filter(Boolean).join('\n'),
  }, `${idempotencyKey}-vendor`);

  const [admin, vendor] = await Promise.all([sendAdmin(), sendVendor()]);
  if (!admin.success) console.error('Error sending new application admin email:', admin.error);
  if (!vendor.success) console.error('Error sending new application vendor email:', vendor.error);
  return { admin, vendor };
}

export type VendorReviewRequestEmailInput = {
  reviewRequestId: string;
  kind: 'events' | 'directory';
  businessName: string;
  contactName: string;
  vendorEmail: string;
  eventNames: string[];
};

/**
 * Email: admin-only alert for a vendor submission that went to the manual
 * review queue (directory-only registrations, or details matching an existing
 * vendor). The applicant gets no receipt here because nothing is confirmed yet.
 */
export async function sendVendorReviewRequestAdminEmail(
  input: VendorReviewRequestEmailInput,
): Promise<EmailSendResult> {
  const appUrl = getAppUrl();
  const kindLabel = input.kind === 'directory' ? 'Directory registration' : 'Event application (needs review)';
  const result = await sendEmail({
    from: FROM,
    to: ADMIN_EMAIL,
    replyTo: input.vendorEmail,
    subject: `Vendor review needed: ${plainText(input.businessName)}`,
    tags: [{ name: 'review_request_id', value: input.reviewRequestId.replace(/[^A-Za-z0-9_-]/g, '_') }],
    html: renderEmail({
      preheader: `${kindLabel} from ${plainText(input.businessName)} is waiting in the review queue.`,
      eyebrow: 'Vendor review queue',
      eyebrowColor: '#6d4db3',
      headingHtml: escapeHtml(input.businessName),
      bodyHtml:
        paragraph(input.kind === 'directory'
          ? 'A vendor asked to join the public directory. Their listing stays hidden until you approve it.'
          : 'This application matched an existing vendor’s email or business name, so it was held for review instead of being linked automatically.') +
        detailsTable([
          ['Type', kindLabel],
          ['Contact', input.contactName],
          ['Email', input.vendorEmail],
          ['Reference', input.reviewRequestId],
        ]) +
        (input.eventNames.length > 0 ? paragraph(strong('Events requested'), { last: true }) + bulletList(input.eventNames) : ''),
      cta: { label: 'Open the review queue', url: `${appUrl}/admin/vendors` },
      footnote: 'Admin notification — sent because a vendor submission needs manual review.',
    }),
    text: [
      `Vendor review needed: ${plainText(input.businessName)}`,
      `Type: ${kindLabel}`,
      `Contact: ${plainText(input.contactName)} <${plainText(input.vendorEmail)}>`,
      `Reference: ${plainText(input.reviewRequestId)}`,
      input.eventNames.length ? `Events:\n${input.eventNames.map((name) => `- ${plainText(name)}`).join('\n')}` : '',
      '',
      `Open the review queue: ${appUrl}/admin/vendors`,
    ].filter(Boolean).join('\n'),
  }, `vendor-review-request-${input.reviewRequestId}`);

  if (!result.success) console.error('Error sending vendor review alert:', result.error);
  return result;
}

export type VendorInvitationEmailInput = {
  applicationId: string;
  eventId: string;
  vendorEmail: string;
  businessName: string;
  contactName: string;
  eventName: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  venue: string | null;
  venueAddress: string | null;
  boothAssignment: string | null;
  tablesRequested: string | null;
  powerRequirements: string | null;
  approvedVendorFee: number;
  tablePrice: number | null;
  powerFee: number;
  responseDeadline: string | null;
  loadInTime: string | null;
  paymentLink: string | null;
  contactEmail: string | null;
  instructions: string | null;
};

/** Email: event-specific vendor approval and invitation. */
export async function sendVendorInvitationEmail(
  input: VendorInvitationEmailInput,
  idempotencyKey: string,
): Promise<VendorInvitationEmailResult> {
  if (!getResend()) {
    console.warn('Resend not configured. Skipping vendor invitation email.');
    return { success: false, error: 'Resend not configured' };
  }

  const eventDate = formatAustralianDate(input.eventDate) || input.eventDate;
  const eventTime = [formatTime(input.startTime), formatTime(input.endTime)].filter(Boolean).join('–');
  const responseDeadline = formatAustralianDate(input.responseDeadline);
  const loadInTime = formatTime(input.loadInTime);
  const paymentLink = safeUrl(input.paymentLink);
  const contactEmail = input.contactEmail?.trim() || null;
  const powerRequest = input.powerRequirements && input.powerRequirements !== 'none'
    ? humanize(input.powerRequirements)
    : 'No power required';
  const mapsUrl = input.venueAddress
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(input.venueAddress)}`
    : null;

  const result = await sendEmail({
    from: FROM,
    to: input.vendorEmail,
    replyTo: contactEmail || ADMIN_EMAIL,
    subject: `You are approved for ${plainText(input.eventName)}`,
    tags: [
      { name: 'application_id', value: input.applicationId },
      { name: 'event_id', value: input.eventId },
    ],
    html: renderEmail({
      preheader: `${plainText(input.businessName)} is approved to trade on ${eventDate}.` +
        (responseDeadline ? ` Please confirm by ${responseDeadline}.` : ''),
      eyebrow: 'Vendor invitation',
      eyebrowColor: '#2f7a4d',
      headingHtml: 'You’re approved for<br>' + escapeHtml(input.eventName),
      bodyHtml:
        paragraph('Hi ' + escapeHtml(input.contactName) + ',') +
        paragraph('Great news — ' + strong(input.businessName) + ' has been approved to trade at this event. Your confirmed details are below.') +
        (responseDeadline && paymentLink
          ? panel('Action required', paragraph('Confirm your place and pay your vendor fee by ' + strong(responseDeadline) + ' to hold your booth.', { last: true }), '#2f7a4d')
          : '') +
        detailsTable([
          ['Event', input.eventName],
          ['Date', eventDate],
          ['Event time', eventTime],
          ['Vendor load-in', loadInTime],
          ['Venue', input.venue],
          ['Address', input.venueAddress],
          ['Booth', input.boothAssignment || 'To be confirmed'],
          ['Tables', input.tablesRequested],
          ['Power request', powerRequest],
          ['Price per table', input.tablePrice === null ? null : formatAud(input.tablePrice)],
          ['Power fee', input.powerFee > 0 ? formatAud(input.powerFee) : null],
          ['Confirmation deadline', responseDeadline],
        ], { label: 'Total vendor fee', value: formatAud(input.approvedVendorFee) }) +
        (input.instructions ? panel('Event instructions', preformatted(input.instructions)) : '') +
        (mapsUrl ? paragraph('<a href="' + escapeHtml(mapsUrl) + '" style="color:' + COLORS.ink + ';font-weight:700">Open the venue in Google Maps →</a>') : ''),
      cta: paymentLink ? { label: 'Confirm your place', url: paymentLink } : null,
      footnote: 'Questions? Reply to this email' +
        (contactEmail ? ' or contact <a href="mailto:' + escapeHtml(contactEmail) + '" style="color:' + COLORS.ink + ';font-weight:700">' + escapeHtml(contactEmail) + '</a>' : '') +
        '.<br>You’re receiving this because you applied to trade at this event.',
    }),
    text: [
      `Hi ${plainText(input.contactName)},`,
      '',
      `${plainText(input.businessName)} has been approved to trade at ${plainText(input.eventName)}.`,
      '',
      `Date: ${eventDate}`,
      eventTime ? `Event time: ${eventTime}` : '',
      loadInTime ? `Vendor load-in: ${loadInTime}` : '',
      input.venue ? `Venue: ${plainText(input.venue)}` : '',
      input.venueAddress ? `Address: ${plainText(input.venueAddress)}` : '',
      `Booth: ${plainText(input.boothAssignment) || 'To be confirmed'}`,
      input.tablesRequested ? `Tables: ${plainText(input.tablesRequested)}` : '',
      `Power request: ${powerRequest}`,
      input.tablePrice === null ? '' : `Price per table: ${formatAud(input.tablePrice)}`,
      input.powerFee > 0 ? `Power fee: ${formatAud(input.powerFee)}` : '',
      `Total vendor fee: ${formatAud(input.approvedVendorFee)}`,
      responseDeadline ? `Confirmation deadline: ${responseDeadline}` : '',
      input.instructions ? `\nEvent instructions:\n${plainBlock(input.instructions)}` : '',
      paymentLink ? `\nConfirm your place: ${paymentLink}` : '',
      `\nQuestions? Reply to this email${contactEmail ? ` or contact ${contactEmail}` : ''}.`,
      textFooter('You’re receiving this because you applied to trade at this event.'),
    ].filter(Boolean).join('\n'),
  }, idempotencyKey);

  if (!result.success) console.error('Error sending vendor invitation:', result.error);
  return result;
}

// ============================================
// Application status updates (vendors, sponsors, volunteers)
// ============================================

export type ApplicationAudience = 'vendor' | 'sponsor' | 'volunteer';

type ApplicationStatusEmailInput = {
  recipientEmail: string;
  organisationName: string;
  contactName: string;
  status: 'approved' | 'rejected' | 'waitlisted';
  reason?: string;
  eventName?: string;
  idempotencyKey?: string;
  audience?: ApplicationAudience;
};

const NEXT_STEPS: Record<ApplicationAudience, string> = {
  vendor: 'Our team will contact you with the next steps.',
  sponsor: 'Our partnerships team will be in touch shortly to finalise your package and timeline.',
  volunteer: 'We will be in touch before the event with your shift, briefing details and what to bring.',
};

async function sendApplicationStatusEmail(
  input: ApplicationStatusEmailInput,
): Promise<ApplicationStatusEmailResult> {
  const audience = input.audience || 'vendor';
  const appUrl = getAppUrl();
  const eventSuffixHtml = input.eventName ? ' at ' + strong(input.eventName) : '';
  const eventSuffixText = input.eventName ? ` at ${plainText(input.eventName)}` : '';
  // Volunteers apply as themselves, so "your application for <their name>" reads oddly.
  const contextHtml = audience === 'volunteer'
    ? 'your volunteer application' + (input.eventName ? ' for ' + strong(input.eventName) : '')
    : 'your ' + (audience === 'sponsor' ? 'sponsorship ' : '') + 'application for ' + strong(input.organisationName) + eventSuffixHtml;
  const contextText = audience === 'volunteer'
    ? 'your volunteer application' + (input.eventName ? ` for ${plainText(input.eventName)}` : '')
    : `your ${audience === 'sponsor' ? 'sponsorship ' : ''}application for ${plainText(input.organisationName)}${eventSuffixText}`;
  const capitalise = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

  const statusContent = {
    approved: {
      subject: 'Application approved — Collector\'s Paradise',
      eyebrow: 'Application approved',
      eyebrowColor: '#2f7a4d',
      heading: 'Your application is approved',
      messageHtml: 'Great news — ' + contextHtml + ' has been approved. ' + NEXT_STEPS[audience],
      messageText: `Great news — ${contextText} has been approved. ${NEXT_STEPS[audience]}`,
      cta: { label: 'See upcoming events', url: `${appUrl}/events` },
    },
    rejected: {
      subject: 'Application Status Update — Collector\'s Paradise',
      eyebrow: 'Application update',
      eyebrowColor: '#b42318',
      heading: 'An update on your application',
      messageHtml: 'Thank you for your interest in Collector&#039;s Paradise. ' + capitalise(contextHtml) + ' was not approved at this time.',
      messageText: `Thank you for your interest in Collector's Paradise. ${capitalise(contextText)} was not approved at this time.`,
      cta: { label: 'See upcoming events', url: `${appUrl}/events` },
    },
    waitlisted: {
      subject: 'Application waitlisted — Collector\'s Paradise',
      eyebrow: 'Application update',
      eyebrowColor: '#6d4db3',
      heading: 'You’re on the waitlist',
      messageHtml: capitalise(contextHtml) + ' has been placed on our waitlist. We will contact you if a place becomes available — there is nothing you need to do in the meantime.',
      messageText: `${capitalise(contextText)} has been placed on our waitlist. We will contact you if a place becomes available — there is nothing you need to do in the meantime.`,
      cta: null,
    },
  }[input.status];
  const reason = input.status === 'rejected' && input.reason?.trim() ? input.reason.trim() : null;
  const closing = input.status === 'rejected'
    ? 'We genuinely appreciate you applying, and we would love to hear from you again for a future event.'
    : 'Questions? Just reply to this email.';

  const result = await sendEmail({
    from: FROM,
    to: input.recipientEmail,
    replyTo: ADMIN_EMAIL,
    subject: statusContent.subject,
    tags: [{ name: 'audience', value: audience }, { name: 'status', value: input.status }],
    html: renderEmail({
      preheader: statusContent.messageText.slice(0, 140),
      eyebrow: statusContent.eyebrow,
      eyebrowColor: statusContent.eyebrowColor,
      headingHtml: escapeHtml(statusContent.heading),
      bodyHtml:
        paragraph('Hi ' + escapeHtml(input.contactName) + ',') +
        paragraph(statusContent.messageHtml) +
        (reason ? panel('Reason', preformatted(reason), '#b42318') : '') +
        paragraph(closing, { last: !statusContent.cta }),
      cta: statusContent.cta,
      footnote: 'You’re receiving this because you applied ' +
        (audience === 'volunteer' ? 'to volunteer with' : audience === 'sponsor' ? 'to sponsor' : 'to trade at') +
        ' Collector’s Paradise.',
    }),
    text: [
      `Hi ${plainText(input.contactName)},`,
      '',
      statusContent.messageText,
      ...(reason ? ['', `Reason: ${plainBlock(reason)}`] : []),
      '',
      closing,
      textFooter('You’re receiving this because you applied with Collector’s Paradise.'),
    ].join('\n'),
  }, input.idempotencyKey);

  if (!result.success) console.error(`Error sending ${input.status} email:`, result.error);
  return result;
}

export async function sendApprovalEmail(
  recipientEmail: string,
  organisationName: string,
  contactName: string,
  idempotencyKey?: string,
  audience?: ApplicationAudience,
): Promise<ApplicationStatusEmailResult> {
  return sendApplicationStatusEmail({
    recipientEmail,
    organisationName,
    contactName,
    status: 'approved',
    idempotencyKey,
    audience,
  });
}

export async function sendRejectionEmail(
  recipientEmail: string,
  organisationName: string,
  contactName: string,
  reason?: string,
  eventName?: string,
  idempotencyKey?: string,
  audience?: ApplicationAudience,
): Promise<ApplicationStatusEmailResult> {
  return sendApplicationStatusEmail({
    recipientEmail,
    organisationName,
    contactName,
    status: 'rejected',
    reason,
    eventName,
    idempotencyKey,
    audience,
  });
}

export async function sendWaitlistEmail(
  recipientEmail: string,
  organisationName: string,
  contactName: string,
  eventName?: string,
  idempotencyKey?: string,
  audience?: ApplicationAudience,
): Promise<ApplicationStatusEmailResult> {
  return sendApplicationStatusEmail({
    recipientEmail,
    organisationName,
    contactName,
    status: 'waitlisted',
    eventName,
    idempotencyKey,
    audience,
  });
}

// ============================================
// Sponsor & volunteer application receipts
// ============================================

export type ApplicationReceiptResult = {
  applicant: EmailSendResult;
  admin: EmailSendResult;
};

export type SponsorApplicationEmailInput = {
  sponsorId: string;
  recipientEmail: string;
  companyName: string;
  contactName: string;
  contactPhone?: string | null;
  website?: string | null;
  tier?: string | null;
  interests: string[];
  budgetRange?: string | null;
  brandDescription?: string | null;
};

/** Email: new sponsor application — applicant receipt plus admin alert. */
export async function sendSponsorApplicationEmails(
  input: SponsorApplicationEmailInput,
  idempotencyKey: string,
): Promise<ApplicationReceiptResult> {
  const appUrl = getAppUrl();
  const reference = `CP-S-${input.sponsorId.slice(0, 8).toUpperCase()}`;
  const tags = [{ name: 'sponsor_id', value: input.sponsorId }];
  const details: DetailRow[] = [
    ['Reference', reference],
    ['Company', input.companyName],
    ['Tier of interest', input.tier],
    ['Sponsorship interests', input.interests.join(', ')],
    ['Budget range', input.budgetRange],
  ];

  const [applicant, admin] = await Promise.all([
    sendEmail({
      from: FROM,
      to: input.recipientEmail,
      replyTo: ADMIN_EMAIL,
      subject: 'Sponsorship application received — Collector\'s Paradise',
      tags,
      html: renderEmail({
        preheader: `Thanks for your interest in partnering with us. Reference ${reference}.`,
        eyebrow: 'Sponsorship application',
        headingHtml: 'Thanks for reaching out, ' + escapeHtml(input.contactName),
        bodyHtml:
          paragraph('We’ve received the sponsorship application for ' + strong(input.companyName) + '. Here’s a summary of what you sent us:') +
          detailsTable(details) +
          paragraph(strong('What happens next'), { last: true }) +
          '<div style="height:10px;line-height:10px;font-size:0">&nbsp;</div>' +
          numberedSteps([
            'Our partnerships team reviews your goals and the events coming up.',
            'We’ll contact you to talk through packages, timing and any custom ideas.',
            'Once we agree on a package, we’ll send the agreement and next steps.',
          ]) +
          paragraph('Questions in the meantime? Reply to this email and quote your reference.', { muted: true, last: true }),
        cta: { label: 'Explore sponsorship', url: `${appUrl}/sponsorship` },
        footnote: 'You’re receiving this because you applied to sponsor Collector’s Paradise.',
      }),
      text: [
        `Hi ${plainText(input.contactName)},`,
        '',
        `We've received the sponsorship application for ${plainText(input.companyName)}.`,
        '',
        ...details.filter(([, value]) => value).map(([label, value]) => `${label}: ${plainText(value)}`),
        '',
        'What happens next: our partnerships team will review your application and contact you to talk through packages and timing.',
        textFooter('You’re receiving this because you applied to sponsor Collector’s Paradise.'),
      ].join('\n'),
    }, `${idempotencyKey}-applicant`),
    sendEmail({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: input.recipientEmail,
      subject: 'New Sponsor Application: ' + plainText(input.companyName),
      tags,
      html: renderEmail({
        preheader: `${plainText(input.companyName)} · ${input.tier ? humanize(input.tier) : 'No tier selected'} · ${reference}`,
        eyebrow: 'New sponsor application',
        headingHtml: escapeHtml(input.companyName),
        bodyHtml:
          detailsTable([
            ...details,
            ['Contact', input.contactName],
            ['Email', input.recipientEmail],
            ['Phone', input.contactPhone],
            ['Website', input.website],
          ]) +
          (input.brandDescription ? panel('About the brand', preformatted(input.brandDescription)) : '') +
          paragraph('Reply to this email to contact the applicant directly.', { muted: true }),
        cta: { label: 'Review in admin', url: `${appUrl}/admin/sponsors` },
        footnote: 'Admin notification — sent because a sponsor applied on the website.',
      }),
      text: [
        'New sponsor application',
        ...details.filter(([, value]) => value).map(([label, value]) => `${label}: ${plainText(value)}`),
        `Contact: ${plainText(input.contactName)} <${plainText(input.recipientEmail)}>`,
        input.contactPhone ? `Phone: ${plainText(input.contactPhone)}` : '',
        input.website ? `Website: ${plainText(input.website)}` : '',
        input.brandDescription ? `\nAbout the brand:\n${plainBlock(input.brandDescription)}` : '',
        '',
        `Review in admin: ${appUrl}/admin/sponsors`,
      ].filter(Boolean).join('\n'),
    }, `${idempotencyKey}-admin`),
  ]);

  if (!applicant.success) console.error('Error sending sponsor receipt:', applicant.error);
  if (!admin.success) console.error('Error sending sponsor admin alert:', admin.error);
  return { applicant, admin };
}

export type VolunteerApplicationEmailInput = {
  volunteerId: string;
  recipientEmail: string;
  fullName: string;
  phone?: string | null;
  roles: string[];
  availability: string;
  events?: string[];
};

/** Email: new volunteer application — applicant receipt plus admin alert. */
export async function sendVolunteerApplicationEmails(
  input: VolunteerApplicationEmailInput,
  idempotencyKey: string,
): Promise<ApplicationReceiptResult> {
  const appUrl = getAppUrl();
  const reference = `CP-VOL-${input.volunteerId.slice(0, 8).toUpperCase()}`;
  const tags = [{ name: 'volunteer_id', value: input.volunteerId }];
  const events = input.events?.filter(Boolean) || [];
  const details: DetailRow[] = [
    ['Reference', reference],
    ['Preferred roles', input.roles.join(', ')],
    ['Events', events.join(', ')],
  ];

  const [applicant, admin] = await Promise.all([
    sendEmail({
      from: FROM,
      to: input.recipientEmail,
      replyTo: ADMIN_EMAIL,
      subject: 'Volunteer application received — Collector\'s Paradise',
      tags,
      html: renderEmail({
        preheader: `Thanks for offering to help out! Reference ${reference}.`,
        eyebrow: 'Volunteer application',
        headingHtml: 'Thanks for offering to help, ' + escapeHtml(input.fullName.split(/\s+/)[0] || input.fullName),
        bodyHtml:
          paragraph('We’ve received your application to volunteer at Collector’s Paradise. Volunteers make our events happen, so thank you!') +
          detailsTable(details) +
          panel('Your availability', preformatted(input.availability)) +
          paragraph(strong('What happens next'), { last: true }) +
          '<div style="height:10px;line-height:10px;font-size:0">&nbsp;</div>' +
          numberedSteps([
            'We match volunteers to roles as each event’s roster comes together.',
            'If there’s a spot for you, we’ll email you with your shift and a short briefing.',
            'On the day, check in at the registration desk and we’ll get you set up.',
          ]) +
          paragraph('Need to update your availability? Reply to this email.', { muted: true, last: true }),
        cta: { label: 'See upcoming events', url: `${appUrl}/events` },
        footnote: 'You’re receiving this because you applied to volunteer with Collector’s Paradise.',
      }),
      text: [
        `Hi ${plainText(input.fullName)},`,
        '',
        "We've received your application to volunteer at Collector's Paradise. Thank you!",
        '',
        ...details.filter(([, value]) => value).map(([label, value]) => `${label}: ${plainText(value)}`),
        '',
        `Your availability:\n${plainBlock(input.availability)}`,
        '',
        "What happens next: if there's a spot for you, we'll email you with your shift and a short briefing.",
        textFooter('You’re receiving this because you applied to volunteer with Collector’s Paradise.'),
      ].join('\n'),
    }, `${idempotencyKey}-applicant`),
    sendEmail({
      from: FROM,
      to: ADMIN_EMAIL,
      replyTo: input.recipientEmail,
      subject: 'New Volunteer Application: ' + plainText(input.fullName),
      tags,
      html: renderEmail({
        preheader: `${plainText(input.fullName)} · ${input.roles.join(', ')} · ${reference}`,
        eyebrow: 'New volunteer application',
        headingHtml: escapeHtml(input.fullName),
        bodyHtml:
          detailsTable([
            ...details,
            ['Email', input.recipientEmail],
            ['Phone', input.phone],
          ]) +
          panel('Availability', preformatted(input.availability)) +
          paragraph('Reply to this email to contact the volunteer directly.', { muted: true }),
        cta: { label: 'Review in admin', url: `${appUrl}/admin/volunteers` },
        footnote: 'Admin notification — sent because someone applied to volunteer on the website.',
      }),
      text: [
        'New volunteer application',
        ...details.filter(([, value]) => value).map(([label, value]) => `${label}: ${plainText(value)}`),
        `Name: ${plainText(input.fullName)} <${plainText(input.recipientEmail)}>`,
        input.phone ? `Phone: ${plainText(input.phone)}` : '',
        `\nAvailability:\n${plainBlock(input.availability)}`,
        '',
        `Review in admin: ${appUrl}/admin/volunteers`,
      ].filter(Boolean).join('\n'),
    }, `${idempotencyKey}-admin`),
  ]);

  if (!applicant.success) console.error('Error sending volunteer receipt:', applicant.error);
  if (!admin.success) console.error('Error sending volunteer admin alert:', admin.error);
  return { applicant, admin };
}

// ============================================
// Vendor applications closed (batch)
// ============================================

export type ApplicationsClosedEmailInput = {
  applicationId: string;
  eventId: string;
  recipientEmail: string;
  businessName: string;
  contactName: string;
  eventName: string;
  eventDate: string | null;
  replyTo: string | null;
};

/** Resend accepts at most 100 emails per batch request. */
export const APPLICATIONS_CLOSED_EMAIL_BATCH_SIZE = 100;

function buildApplicationsClosedEmail(input: ApplicationsClosedEmailInput) {
  const eventsUrl = `${getAppUrl()}/events`;
  const eventDate = formatAustralianDate(input.eventDate);
  const eventLabel = eventDate
    ? `${plainText(input.eventName)} (${eventDate})`
    : plainText(input.eventName);

  return {
    from: FROM,
    to: input.recipientEmail,
    replyTo: input.replyTo || ADMIN_EMAIL,
    subject: `Vendor applications closed — ${plainText(input.eventName)}`,
    tags: [
      { name: 'application_id', value: input.applicationId },
      { name: 'event_id', value: input.eventId },
    ],
    html: renderEmail({
      preheader: `All vendor spots for ${plainText(input.eventName)} have been filled.`,
      eyebrow: 'Vendor application update',
      eyebrowColor: COLORS.muted,
      headingHtml: 'Vendor spots are now filled',
      bodyHtml:
        paragraph('Hi ' + escapeHtml(input.contactName) + ',') +
        paragraph('Thank you for applying to trade at ' + strong(eventLabel) + '. All vendor spots for this event have now been filled and applications are closed.') +
        paragraph('Unfortunately we were not able to offer ' + strong(input.businessName) + ' a place this time. We received more applications than we have room for, so this is not a reflection on your business.') +
        paragraph('We would love to see you apply for a future event.'),
      cta: { label: 'See upcoming events', url: eventsUrl },
      footnote: 'Questions? Reply to this email.<br>You’re receiving this because you applied to trade at this event.',
    }),
    text: [
      `Hi ${plainText(input.contactName)},`,
      '',
      `Thank you for applying to trade at ${eventLabel}. All vendor spots for this event have now been filled and applications are closed.`,
      '',
      `Unfortunately we were not able to offer ${plainText(input.businessName)} a place this time. We received more applications than we have room for, so this is not a reflection on your business.`,
      '',
      `We would love to see you apply for a future event: ${eventsUrl}`,
      '',
      'Questions? Reply to this email.',
    ].join('\n'),
  };
}

/**
 * Email: vendor spots filled — sent in one provider request to every applicant
 * who was not accepted. Returns one result per input, in the same order.
 */
export async function sendApplicationsClosedEmails(
  inputs: ApplicationsClosedEmailInput[],
  idempotencyKey: string,
): Promise<ApplicationStatusEmailResult[]> {
  if (inputs.length === 0) return [];
  const failAll = (error: string): ApplicationStatusEmailResult[] =>
    inputs.map(() => ({ success: false, error }));

  if (inputs.length > APPLICATIONS_CLOSED_EMAIL_BATCH_SIZE) {
    return failAll(`A batch can contain at most ${APPLICATIONS_CLOSED_EMAIL_BATCH_SIZE} emails.`);
  }
  const resend = getResend();
  if (!resend) return failAll('Resend not configured');

  try {
    // Permissive validation: one malformed address must not block everyone else.
    const { data, error } = await resend.batch.send(
      inputs.map(buildApplicationsClosedEmail),
      { idempotencyKey, batchValidation: 'permissive' },
    );
    if (error || !data) return failAll(error?.message || 'Email send failed');

    const rejected = new Map<number, string>();
    for (const item of data.errors || []) rejected.set(item.index, item.message);
    const accepted = data.data || [];
    // Accepted IDs are returned in request order with rejected entries left out.
    const idsAlign = accepted.length === inputs.length - rejected.size;
    let acceptedIndex = 0;

    return inputs.map((_, index) => {
      const rejection = rejected.get(index);
      if (rejection !== undefined) return { success: false, error: rejection || 'Rejected by email provider' };
      const id = idsAlign ? accepted[acceptedIndex++]?.id : undefined;
      // The provider accepted the batch, so never report a failure that would
      // trigger a duplicate send; an unmatched ID only loses delivery tracking.
      return { success: true, id: id || '' };
    });
  } catch (error) {
    return failAll(error instanceof Error ? error.message : 'Unknown email error');
  }
}

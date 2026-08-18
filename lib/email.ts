import { Resend } from 'resend';

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@collectorsparadise.au';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

function escapeHtml(value: string | number | null | undefined) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
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

export type VendorInvitationEmailResult =
  | { success: true; id: string }
  | { success: false; error: string };

// Email: New Vendor Application Submitted
export async function sendNewApplicationEmail(
  vendorEmail: string,
  businessName: string,
  contactName: string
) {
  const resend = getResend();
  if (!resend) {
    console.warn('Resend not configured. Skipping email notifications.');
    return { success: false, error: 'Resend not configured' };
  }
  try {
    // Notify admin
    await resend.emails.send({
      from: "Collector's Paradise <" + FROM_EMAIL + ">",
      to: ADMIN_EMAIL,
      subject: 'New Vendor Application: ' + businessName,
      html:
        '<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">' +
        '<div style="background: #0f0f0f; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px;">' +
        '<h1 style="color: #F4C542; margin: 0 0 8px 0; font-size: 24px;">New Vendor Application</h1>' +
        '<p style="color: rgba(255,255,255,0.6); margin: 0 0 24px 0;">A new vendor has applied to join Collector\'s Paradise.</p>' +
        '<div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin-bottom: 24px;">' +
        '<p style="margin: 0 0 12px 0; color: #ffffff;"><strong>Business:</strong> ' + businessName + '</p>' +
        '<p style="margin: 0 0 12px 0; color: #ffffff;"><strong>Contact:</strong> ' + contactName + '</p>' +
        '<p style="margin: 0; color: #ffffff;"><strong>Email:</strong> ' + vendorEmail + '</p>' +
        '</div>' +
        '<p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">Review and manage applications in your admin dashboard.</p>' +
        '</div></div>',
    });

    // Notify vendor
    await resend.emails.send({
      from: "Collector's Paradise <" + FROM_EMAIL + ">",
      to: vendorEmail,
      subject: 'Application Received — Collector\'s Paradise',
      html:
        '<table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">' +
        '<tbody><tr><td style="background-color:#ffffff">' +
        '<table align="left" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:600px;width:100%;color:#000000;background-color:#ffffff;border-radius:0px">' +
        '<tbody><tr style="width:100%"><td style="padding:0">' +
        '<br/>' +
        '<img alt="" height="200" src="https://resend-attachments.s3.amazonaws.com/9a7b543b-93f0-4cce-8f42-44953ddf8572" style="display:block;outline:none;border:none;text-decoration:none;max-width:100%;height:auto" width="600"/>' +
        '<br/>' +
        '<p style="margin:0;padding:0">Hi ' + contactName + ',</p>' +
        '<p style="margin:0;padding:0">Thank you for applying to become a vendor at Collector&#x27;s Paradise!<br/>Your application for ' + businessName + ' has been successfully submitted.</p>' +
        '<br/>' +
        '<p style="margin:0;padding:0;font-size:12px;color:#888">Collector\'s Paradise — Australia\'s home of trading card events.</p>' +
        '</td></tr></tbody></table>' +
        '</td></tr></tbody></table>',
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending new application emails:', error);
    return { success: false, error };
  }
}

// Email: event-specific vendor approval and invitation
export async function sendVendorInvitationEmail(
  input: VendorInvitationEmailInput,
  idempotencyKey: string,
): Promise<VendorInvitationEmailResult> {
  const resend = getResend();
  if (!resend) {
    console.warn('Resend not configured. Skipping vendor invitation email.');
    return { success: false, error: 'Resend not configured' };
  }

  const eventDate = formatAustralianDate(input.eventDate) || input.eventDate;
  const eventTime = [formatTime(input.startTime), formatTime(input.endTime)].filter(Boolean).join('–');
  const responseDeadline = formatAustralianDate(input.responseDeadline);
  const loadInTime = formatTime(input.loadInTime);
  const replyTo = input.contactEmail || ADMIN_EMAIL;
  const cta = input.paymentLink
    ? '<div style="margin:32px 0 8px;text-align:center">' +
      '<a href="' + escapeHtml(input.paymentLink) + '" style="display:inline-block;padding:14px 26px;border-radius:999px;background:#f3c447;color:#242522;font-size:14px;font-weight:800;text-decoration:none">Confirm your place</a>' +
      '</div>'
    : '';
  const instructionBlock = input.instructions
    ? '<div style="margin-top:24px;padding:20px;border-radius:14px;background:#f3f1eb">' +
      '<p style="margin:0 0 8px;color:#77736c;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase">Event instructions</p>' +
      '<p style="margin:0;color:#3a3a36;font-size:14px;line-height:1.7;white-space:pre-line">' + escapeHtml(input.instructions) + '</p>' +
      '</div>'
    : '';
  const detailRow = (label: string, value: string | null | undefined) => value
    ? '<tr><td style="padding:8px 0;color:#77736c;font-size:13px;vertical-align:top">' + escapeHtml(label) + '</td>' +
      '<td style="padding:8px 0;color:#242522;font-size:13px;font-weight:700;text-align:right;vertical-align:top">' + escapeHtml(value) + '</td></tr>'
    : '';

  try {
    const { data, error } = await resend.emails.send({
      from: "Collector's Paradise <" + FROM_EMAIL + ">",
      to: input.vendorEmail,
      replyTo,
      subject: `You are approved for ${input.eventName}`,
      tags: [
        { name: 'application_id', value: input.applicationId },
        { name: 'event_id', value: input.eventId },
      ],
      html:
        '<div style="margin:0;background:#efede6;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">' +
        '<div style="max-width:620px;margin:0 auto;overflow:hidden;border:1px solid #d5d1c8;border-radius:22px;background:#fff">' +
        '<div style="padding:32px;background:#2b2c29;color:#fff">' +
        '<p style="margin:0 0 12px;color:#f3c447;font-size:11px;font-weight:800;letter-spacing:.16em;text-transform:uppercase">Vendor invitation</p>' +
        '<h1 style="margin:0;font-size:30px;line-height:1.12;letter-spacing:-.03em">You\'re approved for<br/>' + escapeHtml(input.eventName) + '</h1>' +
        '</div>' +
        '<div style="padding:32px">' +
        '<p style="margin:0 0 16px;color:#242522;font-size:16px;line-height:1.7">Hi ' + escapeHtml(input.contactName) + ',</p>' +
        '<p style="margin:0 0 24px;color:#565650;font-size:15px;line-height:1.7">Great news—<strong style="color:#242522">' + escapeHtml(input.businessName) + '</strong> has been approved to trade at this event. Your confirmed information is below.</p>' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-top:1px solid #e2dfd7;border-bottom:1px solid #e2dfd7">' +
        detailRow('Event', input.eventName) +
        detailRow('Date', eventDate) +
        detailRow('Event time', eventTime) +
        detailRow('Vendor load-in', loadInTime) +
        detailRow('Venue', input.venue) +
        detailRow('Address', input.venueAddress) +
        detailRow('Booth', input.boothAssignment || 'To be confirmed') +
        detailRow('Tables', input.tablesRequested) +
        detailRow('Power request', input.powerRequirements && input.powerRequirements !== 'none' ? input.powerRequirements : 'No power required') +
        detailRow('Price per table', input.tablePrice === null ? null : formatAud(input.tablePrice)) +
        detailRow('Power fee', input.powerFee > 0 ? formatAud(input.powerFee) : null) +
        detailRow('Confirmation deadline', responseDeadline) +
        '<tr><td style="padding:14px 0;color:#242522;font-size:15px;font-weight:800">Total vendor fee</td>' +
        '<td style="padding:14px 0;color:#242522;font-size:20px;font-weight:900;text-align:right">' + escapeHtml(formatAud(input.approvedVendorFee)) + '</td></tr>' +
        '</table>' +
        instructionBlock + cta +
        '<p style="margin:28px 0 0;color:#77736c;font-size:13px;line-height:1.6">Questions? Reply to this email' + (input.contactEmail ? ' or contact <a href="mailto:' + escapeHtml(input.contactEmail) + '" style="color:#242522;font-weight:700">' + escapeHtml(input.contactEmail) + '</a>' : '') + '.</p>' +
        '</div>' +
        '<div style="padding:18px 32px;background:#f7f5ef;color:#8a8981;font-size:11px;line-height:1.5">Collector\'s Paradise · Australia\'s home of trading card events</div>' +
        '</div></div>',
      text: [
        `Hi ${input.contactName},`,
        '',
        `${input.businessName} has been approved to trade at ${input.eventName}.`,
        `Date: ${eventDate}`,
        eventTime ? `Event time: ${eventTime}` : '',
        loadInTime ? `Vendor load-in: ${loadInTime}` : '',
        input.venue ? `Venue: ${input.venue}` : '',
        input.venueAddress ? `Address: ${input.venueAddress}` : '',
        `Booth: ${input.boothAssignment || 'To be confirmed'}`,
        input.tablesRequested ? `Tables: ${input.tablesRequested}` : '',
        `Total vendor fee: ${formatAud(input.approvedVendorFee)}`,
        responseDeadline ? `Confirmation deadline: ${responseDeadline}` : '',
        input.instructions ? `\nEvent instructions:\n${input.instructions}` : '',
        input.paymentLink ? `\nConfirm your place: ${input.paymentLink}` : '',
        `\nQuestions? Reply to this email${input.contactEmail ? ` or contact ${input.contactEmail}` : ''}.`,
      ].filter(Boolean).join('\n'),
    }, { idempotencyKey });

    if (error || !data?.id) {
      const message = error?.message || 'Resend did not return a message ID.';
      console.error('Error sending vendor invitation:', message);
      return { success: false, error: message };
    }

    return { success: true, id: data.id };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown email error';
    console.error('Error sending vendor invitation:', error);
    return { success: false, error: message };
  }
}

// Compatibility email used by the existing sponsor and volunteer approval flows.
export async function sendApprovalEmail(
  recipientEmail: string,
  organisationName: string,
  contactName: string,
) {
  const resend = getResend();
  if (!resend) return { success: false, error: 'Resend not configured' };

  try {
    const { data, error } = await resend.emails.send({
      from: "Collector's Paradise <" + FROM_EMAIL + ">",
      to: recipientEmail,
      subject: 'Application approved — Collector\'s Paradise',
      html:
        '<div style="margin:0;background:#efede6;padding:24px 12px;font-family:Arial,Helvetica,sans-serif">' +
        '<div style="max-width:600px;margin:0 auto;padding:32px;border:1px solid #d5d1c8;border-radius:20px;background:#fff">' +
        '<p style="margin:0 0 10px;color:#8a6608;font-size:11px;font-weight:800;letter-spacing:.14em;text-transform:uppercase">Application update</p>' +
        '<h1 style="margin:0 0 20px;color:#242522;font-size:28px">Your application is approved</h1>' +
        '<p style="margin:0 0 14px;color:#565650;font-size:15px;line-height:1.7">Hi ' + escapeHtml(contactName) + ',</p>' +
        '<p style="margin:0;color:#565650;font-size:15px;line-height:1.7">Great news—your application for <strong style="color:#242522">' + escapeHtml(organisationName) + '</strong> has been approved. Our team will contact you with the next steps.</p>' +
        '</div></div>',
    });
    if (error || !data?.id) return { success: false, error: error?.message || 'Email send failed' };
    return { success: true, id: data.id };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown email error' };
  }
}

// Email: Vendor Application Rejected
export async function sendRejectionEmail(
  vendorEmail: string,
  businessName: string,
  contactName: string,
  reason?: string,
  eventName?: string,
) {
  const resend = getResend();
  if (!resend) {
    console.warn('Resend not configured. Skipping rejection email.');
    return { success: false, error: 'Resend not configured' };
  }
  try {
    await resend.emails.send({
      from: "Collector's Paradise <" + FROM_EMAIL + ">",
      to: vendorEmail,
      subject: 'Application Status Update — Collector\'s Paradise',
      html:
        '<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">' +
        '<div style="background: #0f0f0f; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px;">' +
        '<h1 style="color: #f87171; margin: 0 0 8px 0; font-size: 24px;">Application Update</h1>' +
        '<p style="color: rgba(255,255,255,0.8); margin: 0 0 24px 0;">Hi ' + contactName + ',</p>' +
        '<p style="color: rgba(255,255,255,0.7); margin: 0 0 16px 0;">Thank you for your interest in becoming a vendor at Collector\'s Paradise. Your application for <strong>' + businessName + '</strong>' + (eventName ? ' at <strong>' + eventName + '</strong>' : '') + ' was not approved at this time.</p>' +
        (reason ? '<div style="background: rgba(239,68,68,0.1); border-left: 3px solid #f87171; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;"><p style="color: rgba(255,255,255,0.7); margin: 0;"><strong>Reason:</strong> ' + reason + '</p></div>' : '') +
        '<p style="color: rgba(255,255,255,0.7); margin: 0 0 24px 0;">We encourage you to apply again in the future. You\'re always welcome to reach out if you have questions.</p>' +
        '<p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">Thank you for understanding.</p>' +
        '</div></div>',
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return { success: false, error };
  }
}

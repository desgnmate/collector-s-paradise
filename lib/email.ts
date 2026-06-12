import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@collectorsparadise.au';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

// Helper to check if Resend is configured
function isResendConfigured() {
  return !!resend;
}

// Email: New Vendor Application Submitted
export async function sendNewApplicationEmail(
  vendorEmail: string,
  businessName: string,
  contactName: string
) {
  if (!resend) {
    console.warn('Resend not configured. Skipping email notifications.');
    return { success: false, error: 'Resend not configured' };
  }
  try {
    // Notify admin
    await resend.emails.send({
      from: `Collector's Paradise <${FROM_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `New Vendor Application: ${businessName}`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0f0f0f; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px;">
            <h1 style="color: #F4C542; margin: 0 0 8px 0; font-size: 24px;">New Vendor Application</h1>
            <p style="color: rgba(255,255,255,0.6); margin: 0 0 24px 0;">A new vendor has applied to join Collector's Paradise.</p>
            
            <div style="background: rgba(255,255,255,0.05); border-radius: 8px; padding: 20px; margin-bottom: 24px;">
              <p style="margin: 0 0 12px 0; color: #ffffff;"><strong>Business:</strong> ${businessName}</p>
              <p style="margin: 0 0 12px 0; color: #ffffff;"><strong>Contact:</strong> ${contactName}</p>
              <p style="margin: 0; color: #ffffff;"><strong>Email:</strong> ${vendorEmail}</p>
            </div>
            
            <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">Review and manage applications in your admin dashboard.</p>
          </div>
        </div>
      `,
    });

    // Notify vendor
    await resend.emails.send({
      from: `Collector's Paradise <${FROM_EMAIL}>`,
      to: vendorEmail,
      subject: 'Application Received — Collector\'s Paradise',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0f0f0f; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px;">
            <h1 style="color: #F4C542; margin: 0 0 8px 0; font-size: 24px;">Application Received 💛</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 0 0 24px 0;">Hi ${contactName},</p>
            <p style="color: rgba(255,255,255,0.7); margin: 0 0 16px 0;">Thank you for applying to become a vendor at <strong>Collector's Paradise</strong>! Your application for <strong>${businessName}</strong> has been successfully submitted.</p>
            <p style="color: rgba(255,255,255,0.7); margin: 0 0 24px 0;">Our team will review your application and get back to you within 24-48 hours. You'll receive another email once your application status is updated.</p>
            <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">If you have any questions, feel free to reach out to us.</p>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending new application emails:', error);
    return { success: false, error };
  }
}

// Email: Vendor Application Approved
export async function sendApprovalEmail(
  vendorEmail: string,
  businessName: string,
  contactName: string
) {
  if (!resend) {
    console.warn('Resend not configured. Skipping approval email.');
    return { success: false, error: 'Resend not configured' };
  }
  try {
    await resend.emails.send({
      from: `Collector's Paradise <${FROM_EMAIL}>`,
      to: vendorEmail,
      subject: `Welcome Aboard! 🎉 Your Application is Approved`,
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0f0f0f; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px;">
            <h1 style="color: #4ade80; margin: 0 0 8px 0; font-size: 24px;">Application Approved! </h1>
            <p style="color: rgba(255,255,255,0.8); margin: 0 0 24px 0;">Hi ${contactName},</p>
            <p style="color: rgba(255,255,255,0.7); margin: 0 0 16px 0;">Great news! Your vendor application for <strong>${businessName}</strong> has been <strong style="color: #4ade80;">approved</strong>!</p>
            <p style="color: rgba(255,255,255,0.7); margin: 0 0 24px 0;">You can now access your vendor dashboard to manage your booth, view events, and update your profile.</p>
            <div style="text-align: center; margin: 32px 0;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/login" style="display: inline-block; background: #F4C542; color: #0f0f0f; padding: 12px 32px; border-radius: 8px; text-decoration: none; font-weight: 600;">Go to Dashboard</a>
            </div>
            <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">Welcome to the Collector's Paradise community! 💛</p>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending approval email:', error);
    return { success: false, error };
  }
}

// Email: Vendor Application Rejected
export async function sendRejectionEmail(
  vendorEmail: string,
  businessName: string,
  contactName: string,
  reason?: string
) {
  if (!resend) {
    console.warn('Resend not configured. Skipping rejection email.');
    return { success: false, error: 'Resend not configured' };
  }
  try {
    await resend.emails.send({
      from: `Collector's Paradise <${FROM_EMAIL}>`,
      to: vendorEmail,
      subject: 'Application Status Update — Collector\'s Paradise',
      html: `
        <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: #0f0f0f; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; padding: 32px;">
            <h1 style="color: #f87171; margin: 0 0 8px 0; font-size: 24px;">Application Update</h1>
            <p style="color: rgba(255,255,255,0.8); margin: 0 0 24px 0;">Hi ${contactName},</p>
            <p style="color: rgba(255,255,255,0.7); margin: 0 0 16px 0;">Thank you for your interest in becoming a vendor at Collector's Paradise. After careful review, we regret to inform you that your application for <strong>${businessName}</strong> was not approved at this time.</p>
            ${reason ? `<div style="background: rgba(239,68,68,0.1); border-left: 3px solid #f87171; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;"><p style="color: rgba(255,255,255,0.7); margin: 0;"><strong>Reason:</strong> ${reason}</p></div>` : ''}
            <p style="color: rgba(255,255,255,0.7); margin: 0 0 24px 0;">We encourage you to apply again in the future. You're always welcome to reach out if you have questions.</p>
            <p style="color: rgba(255,255,255,0.5); font-size: 14px; margin: 0;">Thank you for understanding.</p>
          </div>
        </div>
      `,
    });

    return { success: true };
  } catch (error) {
    console.error('Error sending rejection email:', error);
    return { success: false, error };
  }
}

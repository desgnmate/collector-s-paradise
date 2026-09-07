'use server';

import { z } from 'zod';
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { sendNewApplicationEmail } from '@/lib/email';
import { SITE_URL } from '@/lib/site';
import { readReturningRequirements, returningRequirementsSchema, returningResultSchema, type ReturningResult } from '@/lib/returning-vendors';

export type ReturningActionState = {
  message: string;
  errors?: Record<string, string[]>;
  result?: ReturningResult;
};

export async function requestVendorSignIn(_previous: { message: string }, formData: FormData) {
  const email = z.string().trim().toLowerCase().email().max(254).safeParse(formData.get('email'));
  if (!email.success) return { message: 'Enter a valid email address.' };
  const reference = crypto.randomUUID();
  try {
    const supabase = await createSupabaseServerClient();
    // Configured origin, never a caller-supplied redirect. Supabase additionally
    // enforces its redirect allowlist and authentication email rate limits.
    const origin = process.env.NODE_ENV === 'development'
      ? process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      : SITE_URL;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.data,
      options: { shouldCreateUser: true, emailRedirectTo: new URL('/vendors/auth/callback', origin).toString() },
    });
    if (error) {
      console.error('vendor_sign_in', { reference, code: error.code, status: error.status });
      return { message: `We could not send a sign-in link. Wait a minute and try again, or contact support. Reference: ${reference}` };
    }
    // Does not reveal whether a vendor profile exists for the address.
    return { message: 'Check your email for a sign-in link. Open it in this browser to continue. If it does not arrive, check spam or contact support.' };
  } catch {
    console.error('vendor_sign_in', { reference, code: 'connection_failure' });
    return { message: `Connection interrupted. Please try again. Reference: ${reference}` };
  }
}

export async function signOutReturningVendor() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut({ scope: 'local' });
}

const receiptSchema = z.object({
  id: z.string().uuid(), vendor_id: z.string().uuid(), claim_token: z.string().uuid(),
  email: z.string().email(), business_name: z.string(), contact_name: z.string(),
  events: z.array(z.object({ id: z.string().uuid(), title: z.string() })),
});

export async function submitReturningVendor(_previous: ReturningActionState, formData: FormData): Promise<ReturningActionState> {
  const reference = crypto.randomUUID();
  const validated = returningRequirementsSchema.safeParse(readReturningRequirements(formData));
  if (!validated.success) return { message: 'Please check your event requirements.', errors: validated.error.flatten().fieldErrors };
  let saved: ReturningResult | undefined;
  try {
    const supabase = await createSupabaseServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user?.email_confirmed_at) return { message: 'Your session expired. Sign in again before submitting. Your entries are still here.' };
    const fields = validated.data;
    const { data, error } = await supabase.rpc('submit_returning_vendor', {
      p_vendor_id: fields.vendor_id, p_event_ids: fields.event_ids,
      p_tables_requested: fields.tables_requested, p_power_requirements: fields.power_requirements,
      p_additional_notes: fields.additional_notes, p_agreement: fields.agreement,
    });
    if (error) {
      console.error('vendor_reapplication', { reference, stage: 'save', code: error.code });
      return { message: error.code === '42501'
        ? 'This profile is not available for your verified email. Sign in with the original email or contact support.'
        : `We could not confirm the save. Please retry; an existing application will not be duplicated. Reference: ${reference}` };
    }
    // A malformed/ambiguous response must never invent success or event IDs.
    saved = returningResultSchema.parse(data);
    console.info('vendor_reapplication', { reference, stage: 'saved', created: saved.outcomes.filter(x => x.outcome === 'created').length });
    let receiptPending = false;
    for (const receiptId of saved.receipt_ids) {
      const claim = await supabase.rpc('claim_vendor_application_receipt', { p_id: receiptId });
      if (claim.error || !claim.data) { receiptPending = true; continue; }
      const receipt = receiptSchema.parse(claim.data);
      const result = await sendNewApplicationEmail({
        vendorId: receipt.vendor_id, vendorEmail: receipt.email, businessName: receipt.business_name,
        contactName: receipt.contact_name, eventNames: receipt.events.map(event => event.title), reference: receipt.id,
      }, `returning-vendor-${receipt.id}`);
      const completed = await supabase.rpc('finish_vendor_application_receipt', {
        p_id: receipt.id, p_claim_token: receipt.claim_token,
        p_provider_id: result.vendor.success ? result.vendor.id : null,
      });
      if (!result.vendor.success || completed.error || !completed.data) receiptPending = true;
    }
    return {
      result: saved,
      message: receiptPending
        ? 'Your event results are saved below, but a receipt is still pending. You can safely retry after two minutes or contact support with your reference.'
        : saved.outcomes.some(event => event.outcome === 'created')
          ? 'Your new applications are pending review. A receipt has been sent for the newly added events.'
          : 'No new applications were created. Existing decisions have not changed.',
    };
  } catch {
    console.error('vendor_reapplication', { reference, stage: saved ? 'receipt' : 'save', code: 'unexpected_failure' });
    return saved
      ? { result: saved, message: 'Your applications are saved. Receipt delivery could not be confirmed; please keep your reference and contact support.' }
      : { message: `We could not confirm the save. Your entries are still here. Retry safely or contact support. Reference: ${reference}` };
  }
}

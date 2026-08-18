import { Resend } from 'resend';

import { createSupabaseAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

const TRACKED_EVENTS = new Set([
  'email.delivered',
  'email.bounced',
  'email.complained',
  'email.failed',
  'email.suppressed',
]);

export async function POST(request: Request) {
  const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return Response.json({ error: 'Webhook is not configured.' }, { status: 503 });
  }

  const payload = await request.text();
  const id = request.headers.get('svix-id');
  const timestamp = request.headers.get('svix-timestamp');
  const signature = request.headers.get('svix-signature');
  if (!id || !timestamp || !signature) {
    return Response.json({ error: 'Missing webhook signature.' }, { status: 400 });
  }

  let event: ReturnType<Resend['webhooks']['verify']>;
  try {
    const resend = new Resend(process.env.RESEND_API_KEY);
    event = resend.webhooks.verify({
      payload,
      headers: { id, timestamp, signature },
      webhookSecret,
    });
  } catch {
    return Response.json({ error: 'Invalid webhook signature.' }, { status: 400 });
  }

  if (!TRACKED_EVENTS.has(event.type) || !('email_id' in event.data)) {
    return Response.json({ received: true });
  }

  const status = event.type.replace('email.', '');
  let invitationError: string | null = null;
  if (event.type === 'email.failed') invitationError = event.data.failed.reason;
  if (event.type === 'email.bounced') invitationError = event.data.bounce.message;
  if (event.type === 'email.complained') invitationError = 'Recipient marked the email as spam.';
  if (event.type === 'email.suppressed') invitationError = event.data.suppressed.message;

  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from('vendor_event_applications')
    .update({
      invitation_status: status,
      invitation_error: invitationError,
      updated_at: new Date().toISOString(),
    })
    .eq('invitation_resend_id', event.data.email_id)
    .select('id')
    .maybeSingle();

  if (error) {
    console.error('Failed to record Resend webhook status:', JSON.stringify(error, null, 2));
    return Response.json({ error: 'Could not record delivery status.' }, { status: 500 });
  }

  return Response.json({ received: true, matched: Boolean(data) });
}

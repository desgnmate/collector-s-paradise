# Deployment Guide — Collector's Paradise

This project deploys to **Vercel** using Vercel's native Next.js integration.
No framework adapter or custom build output directory is required.

## Local production verification

Before deploying, create and run the same standard Next.js production build:

```bash
npm run build
npm run start
```

## Vercel setup

1. Import the Git repository into Vercel.
2. Keep the detected framework preset as **Next.js**.
3. Keep the build command as `npm run build` and the output directory unset.
4. Add the variables from `.env.local.example` in the Vercel project's
   Environment Variables settings.
5. Assign `collectorsparadise.au` in the project's Domains settings.

Before the first production deploy, run `lib/supabase/security_hardening.sql`
in the Supabase SQL editor. It removes public access to private vendor,
sponsor, volunteer, and legacy event-image fields while preserving public
directory/form behavior. Apply it only after reviewing the deployed schema.

Before deploying the approved-only vendor directory and receipt tracking code,
apply `supabase/migrations/20260901010000_fix_vendor_visibility_and_email_tracking.sql`.
The migration must land first because the admin vendor query expects the new
application-receipt columns. It also immediately prevents pending and
waitlisted applications from appearing in the public vendor directory.

Vercel creates production deployments from the production branch and preview
deployments from other branches and pull requests.

## Environment variables

Configure the required Supabase variables for Production, Preview, and
Development as appropriate. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and do
not expose it with a `NEXT_PUBLIC_` prefix.

`SUPABASE_SERVICE_ROLE_KEY` is required in Vercel for protected admin actions
and the legacy event/vendor image route. The app intentionally fails closed if
that server-only key is missing.

For transactional email, configure `RESEND_API_KEY`, `RESEND_FROM_EMAIL`,
`ADMIN_EMAIL`, and `NEXT_PUBLIC_APP_URL`. In production,
`RESEND_WEBHOOK_SECRET` is also required. Add a Resend webhook for
`https://<your-production-domain>/api/webhooks/resend` and subscribe to
`email.delivered`, `email.bounced`, `email.complained`, `email.failed`, and
`email.suppressed`.

The website contact address and every `vendor_contact_email` must be a real,
receive-capable mailbox. Outbound Resend domain verification does not create an
inbox. Configure the mail provider's MX records for `collectorsparadise.au`,
then verify inbound and reply delivery from at least two external providers
(for example Gmail and Outlook) before approving vendors.

For every event that accepts vendors, configure a vendor contact email and
confirmation deadline. Paid invitations also require a payment or confirmation
link. The admin approval action intentionally refuses to send until these
required details are present.

## Runtime behavior

- Server Components, Server Actions, dynamic routes, and Route Handlers run
  through Vercel's native Next.js runtime.
- Static assets in `public/` and generated `/_next/static` assets are served by
  Vercel's CDN.
- No `.open-next` output, Wrangler configuration, or Cloudflare compatibility
  flags are needed.

---

[Back to README](../README.md)

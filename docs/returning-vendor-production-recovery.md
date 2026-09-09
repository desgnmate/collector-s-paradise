# Returning vendor production recovery — 2026-09-08

## Applied in production

Project: `gzebdkjlwtcgdjxbxpwf` (Collector's Paradise).

- Corrected Auth Site URL from localhost to `https://www.collectorsparadise.au`.
- Added the exact allowed redirect `https://www.collectorsparadise.au/vendors/auth/callback`.
- Installed the definitions in `supabase/migrations/20260907000000_verified_vendor_reapplications.sql` through the SQL editor as a transaction. No migration-history table existed. Do not blindly rerun this non-idempotent migration: it creates a table and renames the original registration function.
- Before and after: 276 vendor profiles, 122 event applications, 1 approved application.
- Verified profile RPC and receipt table exist and anonymous profile RPC execution is denied.
- No production test applications or emails were created.

## Outstanding production requirement

The Authentication → Emails dashboard still reports use of the built-in email service, which is not intended for production. Configure a production SMTP provider with a verified sender. This is separate from the application's Resend API integration used for application receipts. SMTP credentials must be entered securely by the operator; never paste them into chat or commit them.

After SMTP is saved, use an operator-controlled existing vendor mailbox to request a link, open it in the requesting browser, confirm the correct saved profile, submit to a designated test event, retry, and verify one pending application and receipt. Check that existing approvals/fees/invitations remain unchanged. Do not test with real vendors' mailboxes without their authorization.

## Email-code fallback

Code entry is implemented behind `VENDOR_EMAIL_CODE_ENABLED=true`, disabled by default. Do not enable it yet. Supabase's POST verification produces generic `otp` AMR sessions (including phone verification); the current database permits only `magiclink` and `email/signup`. Enabling code entry without a reviewed email-specific ownership proof would either reject valid codes or weaken ownership protection if generic OTP were simply whitelisted. The SMTP templates also need to include the code before rollout.

## Local verification

`npm run test:vendor-reapplications` covers ownership, canonical profile lookup, duplicate retries, preserved decisions, receipt claims, and new registration compatibility. `npm run test:vendor-browser` covers the existing PKCE flow using isolated database/email fixtures. These do not substitute for a real production SMTP and session check.

New diagnostics log a random reference, stage, and error code for callback/profile failures. They deliberately exclude emails, tokens, and full database errors.

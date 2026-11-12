# Directory-only vendor registrations

## Agreed behavior

- No account is required. Applicants fill in their details and upload a logo each time.
- Directory-only requests have no event, booth, table, invitation, or payment assignment.
- New event-only identities retain the existing registration and receipt workflow.
- An email or business-name match queues the submitted information for admin review; it never exposes or edits a saved profile.
- Admins review the queue at the top of Vendor Management, explicitly choose a profile or create a new one, and approve or decline the request.
- Linking preserves the saved contact information, logo, prior decisions and fees. Admins must establish identity through their normal contact process before linking uncertain matches. A suggested match is not identity verification.
- Directory approval is independent of event approval. Later event applications start pending; existing decisions are preserved.
- Queue submissions show an on-screen reference. They do not send automated receipt, acceptance, rejection, payment, or invitation emails. Admins follow up manually; normal event approval emails continue through the existing event workflow.
- The optional verified-email returning-vendor route remains available.

## Release order

1. Apply `supabase/migrations/20260928000000_vendor_directory_registrations.sql` in the production Supabase SQL editor. It depends on the existing September 7 verified-reapplications migration. Run the new file as a single transaction. No existing profiles are merged or deleted.
2. Deploy the code. The directory choice is shown only if the migration readiness RPC returns true. If the new submission RPC is absent, event-only registration falls back to the previous RPC. Other errors do not silently fall back.
3. In a staging project, register directory-only, approve through Vendor Management, and check the public directory. Submit an event application for that same identity, link it, and verify it is pending and not in the public event roster. Also verify a new event applicant receives the established receipt and an existing approved event application is not reset by a repeat submission.
4. Check the review queue and production logs after activation. No live records or emails were created during local verification.

## Data and admin controls

The new RLS-protected `vendor_registration_requests` table holds submitted details and review history. Public callers cannot read the queue or execute review functions. Only admins can process requests; the database checks admin membership even if a server action is bypassed.

`vendors.directory_approved` defaults to false for all existing vendors. The public directory RPC retains legacy behavior and additionally includes explicitly approved directory listings. Event-specific rosters still require event approval. Admins can remove directory-only approval from the review panel without changing event decisions.

The queue shows the oldest 100 pending requests; processing and refreshing reveals the next batch. Approved directory listings are shown separately, up to 100. Submitted logos remain retained for review history; linking does not replace the saved logo. No new automatic Google Sheet export is added for queue requests.

## Verification

- `npm test` includes SQL integration tests running the actual migration in isolated PostgreSQL (PGlite).
- Tests cover private pending registration, admin-only processing, anonymous profile protection, normal event registration, repeat decision preservation, closed events, directory persistence after an event application, and removing directory approval.
- Run `npm run build` and targeted ESLint before release.
- Production migration execution and authenticated browser submission still require verification after activation.

## Rollback

Redeploy the previous application version to hide the new form path. Keep queued data and the additive migration intact while reviewing any processed directory approvals. Do not drop tables or undo existing vendor/event records as a blanket rollback.

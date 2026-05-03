# Implementation Plan: Collections Community Feature

## Overview

Implement the Collections community gallery feature end-to-end: database migration, server actions, UI components, and page routes. Tasks follow the file list provided and build incrementally toward a fully wired feature.

## Tasks

- [x] 1. SQL migration — create collections table and storage bucket
  - Write `lib/supabase/collections_migration.sql` with the `collections` table, `price_range_valid` constraint, `updated_at` trigger, indexes, RLS policies, and `collection_images` storage bucket + policies
  - _Requirements: 10.1, 10.2, 10.3, 10.4_

- [x] 2. Server actions — `app/actions/collections.ts`
  - [x] 2.1 Define `Collection` type, `CollectionActionState` type, and `COLLECTION_CATEGORIES` constant
    - Mirror the schema from the migration; export all three for use by components
    - _Requirements: 8.1, 10.1_

  - [x] 2.2 Implement read actions: `getCollections`, `getCollectionById`, `getVendorCollections`
    - `getCollections` — SELECT all, join vendor business_name + logo_url, order by created_at DESC
    - `getCollectionById` — SELECT single row by id with vendor join; return null if not found
    - `getVendorCollections` — SELECT only rows where user_id matches the authenticated user
    - _Requirements: 2.2, 3.1, 9.1_

  - [x] 2.3 Implement `checkVendorStatus` helper
    - Return `{ isVendor: boolean; vendorId?: string }` by querying vendors table for approved record
    - _Requirements: 4.1, 4.2_

  - [x] 2.4 Implement `createCollection` server action
    - Validate with Zod (all required fields, price_min <= price_max, 1–6 image URLs, valid categories)
    - Call `requireApprovedVendor`; return redirect/access-denied errors as appropriate
    - INSERT into collections; revalidate `/collections`
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8_

  - [ ]* 2.5 Write property tests for `createCollection` validation
    - **Property 5: Invalid inputs rejected** — generate submissions missing required fields, assert field errors returned and no DB insert
    - **Property 6: Price constraint enforced** — generate price_min > price_max pairs, assert validation error
    - **Validates: Requirements 5.5, 10.2**

  - [x] 2.6 Implement `updateCollection` server action
    - Verify ownership (user_id match) before UPDATE; return `{ message: 'Unauthorized' }` if not owner
    - Validate fields with same Zod schema; revalidate `/collections` and `/collections/[id]`
    - _Requirements: 6.3, 6.4_

  - [ ]* 2.7 Write property tests for `updateCollection`
    - **Property 8: Update round-trip** — generate valid updates, update + fetch, assert fields match and updated_at > created_at
    - **Property 9: Non-owner update blocked** — generate collection + non-owner user, assert auth error and no mutation
    - **Validates: Requirements 6.3, 6.4, 10.3, 10.4**

  - [x] 2.8 Implement `deleteCollection` server action
    - Verify ownership before DELETE; remove images from `collection_images` storage bucket; revalidate `/collections`
    - _Requirements: 7.2, 7.3, 7.4, 7.5_

  - [ ]* 2.9 Write property tests for `deleteCollection`
    - **Property 10: Delete removes collection from gallery** — delete + getCollectionById, assert null; assert absent from getCollections
    - **Property 11: Non-owner delete blocked** — assert auth error and record intact
    - **Validates: Requirements 7.2, 7.4, 7.5, 10.4**

  - [ ]* 2.10 Write property tests for read actions
    - **Property 1: Round-trip serialization** — insert via mock, fetch by ID, compare all fields
    - **Property 7: Create round-trip** — valid input → createCollection → getCollectionById, compare fields
    - **Property 12: Vendor collections isolated** — multi-vendor scenario, assert each vendor sees only their own
    - **Property 13: Vendor count matches list length** — assert count === getVendorCollections length
    - **Property 14: Categories round-trip** — create with category subset, fetch, assert same categories
    - **Validates: Requirements 5.3, 8.2, 9.1, 9.2, 10.1, 10.5**

- [ ] 3. Checkpoint — Ensure all server action tests pass, ask the user if questions arise.

- [x] 4. `components/CollectionCard.tsx` — gallery card component
  - Render: primary image (next/image), title, vendor business name, price range (`$min – $max`), category pills (`--color-yellow` bg, `--color-dark` text, 2px solid border), date posted
  - Wrap entire card in `<Link href="/collections/[id]">` with 2px solid dark border
  - _Requirements: 2.4, 8.3_

  - [ ]* 4.1 Write property tests for `CollectionCard`
    - **Property 2: Gallery renders a card for every collection** — generate random collection arrays, render gallery, assert card count equals array length
    - **Property 3: CollectionCard displays all required fields** — generate random Collection, render card, assert title/vendor/price/categories/date all present
    - **Validates: Requirements 2.2, 2.4, 8.3**

- [x] 5. `components/CollectionForm.tsx` — create/edit form with image upload
  - Client component; accept `initialData?: Collection` and `vendorId: string` props
  - Fields: title, description, images (1–6, max 5MB each, image/* only — client-side validation before upload), price_min, price_max (enforce min <= max client-side), categories (checkboxes from `COLLECTION_CATEGORIES`)
  - Upload images to `collection_images` bucket via browser Supabase client; pass resulting public URLs as hidden fields to server action
  - Pre-populate all fields when `initialData` is provided
  - Display field-level validation errors returned from server action
  - _Requirements: 5.2, 5.5, 5.6, 5.7, 6.2_

  - [ ]* 5.1 Write property test for `CollectionForm` pre-population
    - **Property 15: Edit form pre-populates with existing data** — generate Collection, render form with initialData, assert every field value matches
    - **Validates: Requirements 6.2**

- [x] 6. Page routes
  - [x] 6.1 `app/collections/page.tsx` — public gallery
    - Server component; call `getCollections()` and `checkVendorStatus()` in parallel
    - Render: "COLLECTIONS" heading (Baloo font, uppercase), gallery grid of `<CollectionCard>`, empty-state message when no collections
    - If vendor: render "Post a Collection" button (links to `/collections/new`) + Vendor Dashboard section (collection count + list of their own cards with Edit/Delete actions)
    - Apply design system: `--color-cream` background, `--color-dark` text
    - _Requirements: 2.1, 2.2, 2.3, 2.5, 2.6, 5.1, 9.1, 9.2, 9.3_

  - [x] 6.2 `app/collections/[id]/page.tsx` — collection detail
    - Server component; call `getCollectionById(id)`; call `notFound()` if null
    - Render: all image URLs, title, full description, vendor business name + logo, price range, categories, date posted; link back to `/collections`
    - _Requirements: 3.1, 3.2, 3.3_

  - [ ]* 6.3 Write property test for detail page
    - **Property 4: Detail page displays all required fields** — generate random Collection, render detail, assert all fields present
    - **Validates: Requirements 3.2**

  - [x] 6.4 `app/collections/new/page.tsx` — create collection (vendor only)
    - Server component; call `checkVendorStatus()`; redirect to `/login` if unauthenticated; render access-denied message if not an approved vendor
    - Render `<CollectionForm vendorId={vendorId}>` wired to `createCollection` action
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 6.5 `app/collections/[id]/edit/page.tsx` — edit collection (vendor only)
    - Server component; call `getCollectionById(id)` and `checkVendorStatus()`; verify ownership; redirect/deny as appropriate
    - Render `<CollectionForm initialData={collection} vendorId={vendorId}>` wired to `updateCollection` action
    - _Requirements: 6.1, 6.2, 6.4_

- [x] 7. Update `components/Navbar.tsx` — replace "Experience" with "Collections"
  - Replace the `<a href="/#experience">` menu item with `<Link href="/collections">` labeled "Collections"
  - Apply active link style when `pathname` starts with `/collections`
  - _Requirements: 1.1, 1.2, 1.3_

- [x] 8. Add collection styles to `app/globals.css`
  - Add CSS classes for: `.collections-page`, `.collections-grid`, `.collection-card`, `.collection-card-image`, `.collection-card-body`, `.category-pill`, `.collections-empty-state`, `.vendor-dashboard`
  - Use existing design tokens (`--color-cream`, `--color-dark`, `--color-yellow`, `--radius-md`, etc.)
  - _Requirements: 2.6, 8.3_

- [ ] 9. Final checkpoint — Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Property tests use **fast-check** with a minimum of 100 iterations; tag each with `// Feature: collections, Property N: <text>`
- Image uploads happen client-side (browser Supabase client) before the server action is called; server action receives only the resulting public URLs
- The `requireApprovedVendor` helper is internal to `collections.ts` and not exported

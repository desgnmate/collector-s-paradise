# Requirements Document

## Introduction

The Collections feature adds a community gallery to the Collector's Paradise Pokémon TCG event website. It replaces the "Experience" navbar link with "Collections" and introduces a `/collections` page where approved vendors can post their Pokémon card collections for the community to browse. All visitors (including guests) can view the gallery, while only approved vendor accounts can create, edit, or delete their own collection posts.

## Glossary

- **Collections_Page**: The `/collections` route displaying the community gallery of all posted collections.
- **Collection**: A post created by an approved vendor showcasing a set of Pokémon cards, including a title, description, images, price range, and categories.
- **Collection_Card**: The UI card component that renders a single Collection's summary in the gallery grid.
- **Vendor**: A user whose record in the `vendors` table has `application_status = 'approved'`.
- **Buyer**: A registered user who is not a Vendor (i.e., has no approved vendor record).
- **Guest**: An unauthenticated visitor to the site.
- **Gallery**: The paginated grid of Collection_Cards displayed on the Collections_Page.
- **Collection_Form**: The form used by Vendors to create or edit a Collection.
- **Vendor_Dashboard**: The vendor-specific section of the Collections_Page where a Vendor can manage their own Collections.
- **Navbar**: The site-wide navigation component currently containing: About, Experience, Events, Vendors, Tickets.
- **Supabase_Storage**: The Supabase storage bucket used to host uploaded collection images.
- **Collections_Table**: The `collections` database table storing all Collection records.

---

## Requirements

### Requirement 1: Navbar Update

**User Story:** As a site visitor, I want the navbar to include a "Collections" link, so that I can easily navigate to the community gallery.

#### Acceptance Criteria

1. THE Navbar SHALL replace the "Experience" link with a "Collections" link that navigates to `/collections`.
2. THE Navbar SHALL render the "Collections" link in uppercase, consistent with the existing navbar link style.
3. WHEN a user is on the `/collections` route, THE Navbar SHALL apply the active link style to the "Collections" link.

---

### Requirement 2: Public Collections Gallery

**User Story:** As a Guest or Buyer, I want to browse all posted collections on the Collections page, so that I can discover Pokémon card collections available from vendors.

#### Acceptance Criteria

1. THE Collections_Page SHALL be publicly accessible without authentication.
2. THE Collections_Page SHALL display a Gallery of all published Collections in a responsive card grid layout.
3. WHEN no Collections have been posted, THE Collections_Page SHALL display an empty-state message indicating no collections are available yet.
4. THE Gallery SHALL render each Collection as a Collection_Card displaying: the primary card image, title, vendor business name, price range, categories, and date posted.
5. THE Collections_Page SHALL display a page heading of "COLLECTIONS" in uppercase using the Baloo font, consistent with the site's design system.
6. THE Collections_Page SHALL apply the site design system: `--color-cream` background, `--color-dark` text, 2px solid dark borders on Collection_Cards, and pill-style category tags.

---

### Requirement 3: Collection Detail View

**User Story:** As a Guest or Buyer, I want to view the full details of a collection, so that I can see all images, the full description, and contact the vendor.

#### Acceptance Criteria

1. WHEN a user clicks a Collection_Card, THE Collections_Page SHALL navigate to `/collections/[id]` displaying the full Collection detail.
2. THE Collection detail page SHALL display: all uploaded images, title, full description, vendor business name, vendor logo, price range, categories, and date posted.
3. IF a Collection with the given `id` does not exist, THEN THE Collections_Page SHALL render a not-found message and a link back to `/collections`.

---

### Requirement 4: Vendor Authorization Check

**User Story:** As the system, I want to restrict collection creation to approved vendors only, so that the gallery maintains quality and trust.

#### Acceptance Criteria

1. WHEN a user attempts to access collection creation, THE Collections_Page SHALL verify the user has an authenticated session.
2. WHEN an authenticated user attempts to create a Collection, THE Collections_Page SHALL verify the user's `user_id` matches a record in the `vendors` table with `application_status = 'approved'`.
3. IF the user is not authenticated, THEN THE Collections_Page SHALL redirect the user to `/login`.
4. IF the authenticated user does not have an approved vendor record, THEN THE Collections_Page SHALL display an access-denied message explaining that only approved vendors can post collections.

---

### Requirement 5: Create a Collection

**User Story:** As an approved Vendor, I want to post a new collection, so that buyers and collectors can discover my Pokémon cards.

#### Acceptance Criteria

1. WHILE a Vendor is authenticated, THE Collections_Page SHALL display a "Post a Collection" button that opens the Collection_Form.
2. THE Collection_Form SHALL include the following fields: title (required), description (required), images (at least 1 required, up to 6), price range (minimum and maximum, required), and categories (at least 1 required, from a predefined list).
3. WHEN a Vendor submits the Collection_Form with valid data, THE Collections_Table SHALL insert a new Collection record associated with the Vendor's `user_id`.
4. WHEN a Vendor submits the Collection_Form with valid data, THE Supabase_Storage SHALL store the uploaded images and THE Collections_Table SHALL persist the resulting public image URLs.
5. IF the Collection_Form is submitted with missing required fields, THEN THE Collection_Form SHALL display a field-level validation error for each missing field without submitting.
6. IF an uploaded image exceeds 5MB, THEN THE Collection_Form SHALL display an error message and SHALL NOT upload the file.
7. IF an uploaded file is not an image type, THEN THE Collection_Form SHALL display an error message and SHALL NOT upload the file.
8. WHEN a Collection is successfully created, THE Collections_Page SHALL revalidate the Gallery and display the new Collection.

---

### Requirement 6: Edit a Collection

**User Story:** As an approved Vendor, I want to edit my existing collections, so that I can keep the information accurate and up to date.

#### Acceptance Criteria

1. WHILE a Vendor is viewing their own Collection, THE Collections_Page SHALL display an "Edit" action for that Collection.
2. WHEN a Vendor initiates an edit, THE Collection_Form SHALL pre-populate with the Collection's existing data.
3. WHEN a Vendor submits the edited Collection_Form with valid data, THE Collections_Table SHALL update the corresponding Collection record.
4. IF a Vendor attempts to edit a Collection they do not own, THEN THE Collections_Page SHALL return an authorization error and SHALL NOT update the record.

---

### Requirement 7: Delete a Collection

**User Story:** As an approved Vendor, I want to delete my collections, so that I can remove listings that are no longer available.

#### Acceptance Criteria

1. WHILE a Vendor is viewing their own Collection, THE Collections_Page SHALL display a "Delete" action for that Collection.
2. WHEN a Vendor confirms deletion, THE Collections_Table SHALL remove the Collection record.
3. WHEN a Collection is deleted, THE Supabase_Storage SHALL remove the associated image files.
4. IF a Vendor attempts to delete a Collection they do not own, THEN THE Collections_Page SHALL return an authorization error and SHALL NOT delete the record.
5. WHEN a Collection is successfully deleted, THE Collections_Page SHALL revalidate the Gallery and remove the deleted Collection from view.

---

### Requirement 8: Collection Categories

**User Story:** As a Vendor, I want to tag my collection with categories, so that buyers can understand what type of cards are in the collection.

#### Acceptance Criteria

1. THE Collection_Form SHALL provide a predefined list of categories including at minimum: Singles, Booster Packs, Sealed Products, Graded Cards, Vintage, Modern, and Accessories.
2. WHEN a Vendor selects one or more categories, THE Collections_Table SHALL persist the selected categories as an array on the Collection record.
3. THE Collection_Card SHALL render each category as a pill-style tag using `--color-yellow` background and `--color-dark` text with a 2px solid border.

---

### Requirement 9: Vendor Dashboard (My Collections)

**User Story:** As an approved Vendor, I want to see and manage only my own collections in one place, so that I can efficiently maintain my listings.

#### Acceptance Criteria

1. WHILE a Vendor is authenticated on the Collections_Page, THE Vendor_Dashboard SHALL display a section listing only the Vendor's own Collections.
2. THE Vendor_Dashboard SHALL display the count of the Vendor's active Collections.
3. WHEN a Vendor has no Collections, THE Vendor_Dashboard SHALL display a prompt encouraging the Vendor to post their first collection.

---

### Requirement 10: Data Persistence and Integrity

**User Story:** As the system, I want collection data to be stored reliably in Supabase, so that the gallery is always consistent and accurate.

#### Acceptance Criteria

1. THE Collections_Table SHALL store the following fields per Collection: `id` (UUID), `vendor_id` (foreign key to `vendors.id`), `user_id` (foreign key to `auth.users.id`), `title`, `description`, `image_urls` (array), `price_min` (numeric), `price_max` (numeric), `categories` (array), `created_at` (timestamp), `updated_at` (timestamp).
2. THE Collections_Table SHALL enforce a constraint that `price_min` is less than or equal to `price_max`.
3. WHEN a Collection is updated, THE Collections_Table SHALL automatically set `updated_at` to the current timestamp.
4. THE Collections_Table SHALL enforce Row Level Security (RLS) such that: any user can read all Collections, only the owning Vendor can insert, update, or delete their own Collections.
5. FOR ALL valid Collection objects, serializing then deserializing the Collection record SHALL produce an equivalent object (round-trip property).

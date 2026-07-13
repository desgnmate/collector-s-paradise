# Architecture — Collector's Paradise

This document describes the system architecture, directory layout, routing, and
data flow of the Collector's Paradise website. For the backend data model see
[DATABASE.md](DATABASE.md); for Server Actions and email see
[BACKEND.md](BACKEND.md); for the admin panel see
[ADMIN_PANEL.md](ADMIN_PANEL.md).

---

## 🏗️ Core Architecture

The application is a **full-stack Next.js 16 (App Router)** app backed by
**Supabase** (Postgres + Auth + Storage) and deployed to **Vercel** using its
native Next.js integration.

```
┌──────────────────────────────────────────────────────────────┐
│                         Vercel                               │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  middleware.ts                                          │  │
│  │  • Auth gates /admin & /admin-login                     │  │
│  │  • Injects security headers (CSP, HSTS, …)              │  │
│  └────────────────────────────────────────────────────────┘  │
│                          ▼                                    │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Next.js App Router                                     │  │
│  │  • Server Components (RSC)  • Server Actions            │  │
│  │  • Route handlers (sitemap, robots, manifest, icon)     │  │
│  └────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────┘
                          │
        ┌─────────────────┼─────────────────┐
        ▼                 ▼                 ▼
   ┌─────────┐     ┌─────────────┐   ┌────────────┐
   │ Supabase│     │  Supabase   │   │  Resend    │
   │ Postgres│     │  Auth+Storage│   │  (email)   │
   └─────────┘     └─────────────┘   └────────────┘
```

### Tech stack details

- **Framework:** Next.js 16 (App Router) · React 19
- **Runtime:** Vercel's native Next.js runtime; middleware currently declares the experimental edge runtime
- **Data/auth/storage:** Supabase via `@supabase/ssr` (cookie-based, SSR + browser clients)
- **Styling:** Vanilla CSS with a centralised design-token system in `app/globals.css`
- **Animation:** native CSS transitions + Framer Motion; smooth scrolling via Lenis
- **Validation:** Zod (in Server Actions)
- **Type safety:** TypeScript (strict)

---

## 📁 Directory Structure

```text
collectors-paradise-web/
├── app/
│   ├── about/               # /about
│   ├── events/              # /events, /events/[id]
│   ├── vendors/             # /vendors, /vendors/apply
│   ├── sponsorship/         # /sponsorship
│   ├── sponsors/apply/      # /sponsors/apply
│   ├── volunteers/          # /volunteers, /volunteers/apply
│   ├── privacy/ terms/      # legal pages
│   ├── admin-login/         # admin login page + client
│   ├── admin/               # protected admin panel (page.tsx stubs → router)
│   │   ├── vendors/ sponsors/ volunteers/ events/ about/
│   ├── actions/             # Server Actions (see BACKEND.md)
│   ├── globals.css          # design tokens + global/component styles
│   ├── layout.tsx           # root layout: fonts, metadata, JSON-LD, SmoothScroll
│   ├── page.tsx             # landing page composition
│   ├── loading.tsx          # route-level loading UI
│   ├── not-found.tsx        # 404
│   ├── sitemap.ts           # dynamic sitemap (events from Supabase)
│   ├── robots.ts            # robots.txt (AI crawler allowlist)
│   └── manifest.ts          # PWA web manifest
├── components/              # UI components (sections, forms, admin, structured data)
│   ├── about/ events/ auth/ # section-specific sub-components
├── contexts/                # client providers for the admin SPA shell
│   ├── AdminRouterContext.tsx
│   └── AdminDataContext.tsx
├── hooks/                   # useScrollReveal, …
├── lib/
│   ├── email.ts             # Resend email helpers
│   └── supabase/
│       ├── client.ts        # browser Supabase client
│       ├── server.ts        # SSR Supabase client (cookies)
│       ├── schema.sql       # base schema (events, vendors, bookings, …)
│       └── *.sql            # incremental migrations
├── data/                    # static data (venue map)
├── public/                  # fonts/, images/, videos/
├── middleware.ts            # auth gating + security headers
└── next.config.ts           # caching, image, headers config
```

---

## 🧭 Routing

All routes use the App Router (filesystem-based).

### Public routes

| Route | Rendered by | Notes |
|-------|-------------|-------|
| `/` | `app/page.tsx` | Landing page (server component) |
| `/about` | `app/about/page.tsx` | |
| `/events` | `app/events/page.tsx` | Lists upcoming & past events; `revalidate = 3600` |
| `/events/[id]` | `app/events/[id]/page.tsx` | Event detail + `generateMetadata`; `revalidate = 3600` |
| `/vendors` | `app/vendors/page.tsx` | Approved vendors from Supabase; `revalidate = 3600` |
| `/vendors/apply` | `app/vendors/apply/page.tsx` + `VendorApplicationForm` | Logo upload |
| `/sponsorship` | `app/sponsorship/page.tsx` | |
| `/sponsors/apply` | `app/sponsors/apply/page.tsx` | |
| `/volunteers` | `app/volunteers/page.tsx` | |
| `/volunteers/apply` | `app/volunteers/apply/page.tsx` | |
| `/privacy`, `/terms` | respective `page.tsx` | |

### Auth & admin routes

| Route | Rendered by | Notes |
|-------|-------------|-------|
| `/admin-login` | `app/admin-login/page.tsx` → `AdminLoginClient` | `robots: noindex` |
| `/admin` | `app/admin/layout.tsx` + client SPA shell | Protected; `robots: noindex` |
| `/admin/vendors` `/admin/sponsors` `/admin/volunteers` `/admin/events` `/admin/about` | client `AdminContentRouter` | These `page.tsx` files return `null` — content is rendered client-side (see [ADMIN_PANEL.md](ADMIN_PANEL.md)) |

### Special files

| File | Purpose |
|------|---------|
| `app/sitemap.ts` | Dynamic `sitemap.xml`; merges static pages with events from Supabase (`revalidate = 3600`) |
| `app/robots.ts` | `robots.txt` with an allowlist for AI crawlers |
| `app/manifest.ts` | PWA web app manifest |
| `app/icon.png` | Favicon / PWA icon |
| `middleware.ts` | Auth gating for `/admin*` + global security headers |

---

## 🏠 Landing Page Composition

The homepage (`app/page.tsx`) streams the data-dependent `Highlights` section
so the rest of the page renders without waiting on Supabase:

```tsx
<Navbar />
<Hero />
<About />
<Experience />
<Suspense fallback={<HighlightsSkeleton />}>
  <Highlights />          {/* server component, queries Supabase */}
</Suspense>
<Brands />
<VendorShowcase />
<Footer />
```

| Component | Responsibility |
|-----------|----------------|
| `Navbar` | Sticky nav with a Pokéball dropdown menu |
| `Hero` | Video background hero with card animation |
| `About` | Mission / overview |
| `Experience` | "What you'll experience" |
| `Highlights` | Curated card/event highlights (server component) |
| `Brands` | Sponsors & partners |
| `VendorShowcase` | Featured vendors + apply CTA |
| `Footer` | Sitemap, contact, legal links |
| `ChatWidget` | Floating support widget |
| `SmoothScroll` | Lenis wrapper mounted in the root layout |

---

## 🔄 Data Flow

### Public pages

```
Server Component  ──►  Server Action (read)  ──►  Supabase Postgres
   (RSC)                  getEvents / getApprovedVendors / …
```

- Pages that read events/vendors export `revalidate = 3600` (ISR, 1 hour).
- Read actions select only the columns they need to minimise egress.

### Public form submissions

```
Client Form  ──(useActionState)──►  Server Action (write)
                                        ├── Zod validate
                                        ├── dedupe check (unique email/name)
                                        ├── Supabase insert (status: 'pending')
                                        ├── optional storage upload (logo/cover)
                                        ├── send email (fire-and-forget)
                                        └── revalidatePath(...)
```

### Admin panel

The admin panel is a **client-side SPA shell** inside a protected server layout:

```
middleware.ts (auth gate + admin_users check)
        ▼
app/admin/layout.tsx
  └─ <AdminRouterProvider>      contexts/AdminRouterContext.tsx
       └─ <AdminDataProvider>   contexts/AdminDataContext.tsx  (preloads + caches)
            └─ <AdminContentRouter>   switches view on currentRoute
                 ├── DashboardContent
                 ├── VendorsContent / SponsorsContent / VolunteersContent
                 ├── EventsContent
                 └── AboutContent
```

- **Navigation** is client-side (`router.push(route, { scroll: false })`) — no
  full page reloads between admin tabs.
- **Data** is preloaded once into React context on mount and refetched after
  mutations. See [ADMIN_PANEL.md](ADMIN_PANEL.md) for the caching model and
  its caveats.

### Authentication

```
/admin-login  ──adminLogin (Server Action)──►  supabase.auth.signInWithPassword
                                                  └─ verify row in admin_users
                                                       ├─ ok   → redirect /admin
                                                       └─ fail → sign out + message
```

Route protection is layered:

1. **Middleware** (`middleware.ts`) — redirects unauthenticated or non-admin
   users away from `/admin*` (and bounces already-logged-in admins away from
   `/admin-login`). This is the primary gate.
2. **`requireAdmin()`** (in `app/actions/events.ts`) — event mutation actions
   re-verify the session + `admin_users` server-side.
3. **`adminLogin`** — checks the `admin_users` row before redirecting.

> ⚠️ **Known gap:** the vendor/sponsor/volunteer mutation actions rely on the
> middleware gate alone (no per-action `requireAdmin`), unlike event actions.
> Documented in [ADMIN_PANEL.md](ADMIN_PANEL.md).

---

## ⚡ Performance & Caching

Configured in `next.config.ts`:

- **`staleTimes`** — client navigations cached briefly (`dynamic: 60s`,
  `static: 300s`) so back/forward and re-visits feel instant.
- **`optimizePackageImports`** — tree-shakes `lucide-react` and `framer-motion`.
- **Asset cache headers** — `_next/static/*` is `immutable` for 1 year;
  `/images/*` and `/videos/*` for 1 day.
- **Images** — currently configured with `images.unoptimized: true`, with
  AVIF/WebP formats and explicit device/image sizes.
- **Compression** on; source maps off in production; `poweredByHeader` off.
- **ISR** — events & vendors pages use `revalidate = 3600`.
- **Admin client cache** — see [BACKEND.md](BACKEND.md) § "Admin data caching".

---

## 🔒 Security (summary)

Enforced in `middleware.ts` (see [SEO_SECURITY.md](SEO_SECURITY.md) for detail):

- **CSP** — strict `default-src 'self'`; script/style/img/font connect-src
  locked to self + Supabase + Google Fonts.
- **HSTS** — `max-age=63072000; includeSubDomains; preload` in production.
- **X-Frame-Options: DENY**, **X-Content-Type-Options: nosniff**,
  **Referrer-Policy**, **Permissions-Policy** (camera/mic/geo disabled).
- **Route protection** — `/admin*` and `/admin-login` auth-gated; everything
  else is public and fast-pathed (no `getUser()` round-trip).

---

[← Back to README](../README.md)

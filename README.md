# Collector's Paradise — Pokémon TCG & Collectibles Events

> Melbourne's premier trading card event. Where collectors meet, trade, and connect.

Collector's Paradise is a modern, full-stack web platform for a Melbourne-based
trading card and collectibles event (Pokémon TCG, Yu-Gi-Oh!, One Piece, Magic:
The Gathering, sports cards, and more). The public site showcases the event,
vendors, and upcoming/past events, while a password-protected **admin panel**
lets organisers review vendor, sponsor, and volunteer applications and manage
events.

- **Live site:** <https://collectorsparadise.au>
- **Designed by:** [DesgnMate](https://desgnmate.com)

---

## 🚀 Key Features

- **Immersive landing page** — video hero, smooth momentum scrolling (Lenis), and scroll-reveal animations.
- **Events** — upcoming & past event listings with detail pages, ticket/venue info, and structured data for search engines.
- **Vendor directory** — approved vendors pulled live from the database.
- **Public application forms** — vendors, sponsors, and volunteers can apply; submissions are validated (Zod) and stored in Supabase.
- **Admin panel** — review and approve / reject / waitlist applications, create and edit events, with optimistic client-side caching.
- **Transactional email** — automated applicant notifications (Resend).
- **SEO & security** — dynamic sitemap & robots, JSON-LD structured data, strict CSP, HSTS, and route protection.
- **Vercel deployment** — deployed as a standard Next.js application.

---

## 🛠️ Technology Stack

| Layer | Technology |
|-------|-----------|
| Framework | [Next.js 16](https://nextjs.org/) (App Router) |
| UI | [React 19](https://react.dev/), [Framer Motion](https://www.framer.com/motion/), [lucide-react](https://lucide.dev/) |
| Styling | Vanilla CSS with a centralised design-token system (`app/globals.css`) |
| Smooth scroll | [Lenis](https://github.com/darkroomengineering/lenis) |
| Backend / data | [Supabase](https://supabase.com/) (Postgres, Auth, Storage) via `@supabase/ssr` |
| Validation | [Zod](https://zod.dev/) |
| Email | [Resend](https://resend.com/) |
| Image zoom | [react-zoom-pan-pinch](https://github.com/BetterTyped/react-zoom-pan-pinch) |
| Language | [TypeScript](https://www.typescriptlang.org/) |
| Deployment | [Vercel](https://vercel.com/) |

---

## 📦 Getting Started

### Prerequisites

- **Node.js 20+**
- **npm**
- A **Supabase** project (URL + anon key). See [docs/DATABASE.md](docs/DATABASE.md) for schema setup.

### Installation

```bash
# 1. Clone the repository
git clone <repository-url>
cd collectors-paradise-web

# 2. Install dependencies
npm install

# 3. Configure environment variables
cp .env.local.example .env.local
#   then edit .env.local with your Supabase URL + anon key
#   (see .env.local.example for the full list)

# 4. Run the development server
npm run dev
```

Open <http://localhost:3000> to view the site.

> **Note:** `npm run dev` raises Node's memory limit (`--max-old-space-size=8192`) because the build is memory-hungry.

### Environment variables

Copy `.env.local.example` → `.env.local` and fill in the values. See
[docs/DATABASE.md](docs/DATABASE.md) and [docs/BACKEND.md](docs/BACKEND.md) for
what each controls.

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anon (public) key |
| `RESEND_API_KEY` | ✉️ optional | Enables transactional email. If unset, emails are skipped. |
| `RESEND_FROM_EMAIL` | ✉️ optional | Bare sender address for outgoing email (for example, `hello@collectorsparadise.au`; the app adds the display name) |
| `RESEND_WEBHOOK_SECRET` | ✉️ optional | Verifies Resend delivery events at `/api/webhooks/resend` |
| `ADMIN_EMAIL` | ✉️ optional | Inbox that receives new-application notifications |
| `NEXT_PUBLIC_APP_URL` | ✉️ optional | Public site URL (used in email links) |
| `SUPABASE_SERVICE_ROLE_KEY` | 🔐 server only | Required by protected admin actions and legacy image routes; never expose to the client |

> **Never commit `.env.local`.** The service-role key in particular bypasses
> RLS — keep it off the client.

Vendor invitation delivery tracking is enabled when a Resend webhook points to
`https://<your-domain>/api/webhooks/resend` and subscribes to delivery, bounce,
complaint, and suppression events. Sending and retry tracking still work when
the webhook is not configured.

---

## 📁 Project Structure

```text
collectors-paradise-web/
├── app/                 # Next.js App Router
│   ├── (public pages)   #   /, /about, /events, /vendors, /sponsorship, ...
│   ├── admin-login/     #   Admin login
│   ├── admin/           #   Protected admin panel (vendors/sponsors/volunteers/events)
│   ├── actions/         #   Server Actions (vendors, sponsors, volunteers, events, auth, dashboard)
│   ├── globals.css      #   Design tokens + global styles
│   ├── layout.tsx       #   Root layout, fonts, metadata, JSON-LD
│   ├── sitemap.ts       #   Dynamic sitemap (events from Supabase)
│   ├── robots.ts        #   Robots.txt (incl. AI crawler allowlist)
│   └── manifest.ts      #   PWA web manifest
├── components/          # React components (sections, forms, admin UI, structured data)
├── contexts/            # Client providers (admin router + admin data cache)
├── hooks/               # Custom hooks (e.g. useScrollReveal)
├── lib/
│   ├── email.ts         #   Resend email helpers
│   └── supabase/        #   Supabase clients + SQL migrations/schema
├── data/                # Static data (e.g. venue map)
├── public/              # Static assets (fonts, images, videos)
├── proxy.ts             # Auth gating + security headers
├── docs/                # ← This documentation
└── next.config.ts       # Next.js config (caching, image, headers)
```

---

## 🧭 Site Map (routes)

| Route | Description |
|-------|-------------|
| `/` | Landing page (Hero → About → Experience → Highlights → Brands → Vendors → Footer) |
| `/about` | About the event |
| `/events` | Upcoming & past events |
| `/events/[id]` | Event detail (tickets, venue, gallery) |
| `/vendors` | Approved vendor directory |
| `/vendors/apply` | Vendor application form |
| `/sponsorship` | Sponsorship info |
| `/sponsors/apply` | Sponsor application form |
| `/volunteers` | Volunteer info |
| `/volunteers/apply` | Volunteer application form |
| `/privacy`, `/terms` | Legal pages |
| `/admin-login` | Admin login (redirects to `/admin` on success) |
| `/admin/**` | Protected admin panel |

---

## 🚢 Deployment

The site deploys to **Vercel** using its native Next.js integration. See
[docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for the full guide.

```bash
npm run build      # verify the production build locally
npm run start      # run the production build locally
```

Production deployments are created automatically from the connected Git
repository in Vercel. Preview deployments are created for branches and pull
requests.

---

## 📚 Documentation

Full documentation lives in [`docs/`](docs/):

| Document | What it covers |
|----------|----------------|
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | System architecture, directory layout, route table, data flow |
| [docs/DATABASE.md](docs/DATABASE.md) | Supabase setup, tables, RLS, storage buckets, migrations, creating an admin |
| [docs/BACKEND.md](docs/BACKEND.md) | Server Actions reference, email, admin data caching |
| [docs/ADMIN_PANEL.md](docs/ADMIN_PANEL.md) | Admin panel architecture **and** an owner's how-to guide |
| [docs/SEO_SECURITY.md](docs/SEO_SECURITY.md) | Metadata, sitemap/robots, JSON-LD, security headers, route protection |
| [docs/DESIGN_SYSTEM.md](docs/DESIGN_SYSTEM.md) | Design tokens (color, type, spacing), UI conventions |
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | Vercel build and deployment |

---

## 🤝 Using the admin panel

The admin panel is at `/admin` and is gated behind Supabase Auth + an
`admin_users` table membership. For a plain-language guide to approving vendors,
managing events, and what each screen does, see
[docs/ADMIN_PANEL.md](docs/ADMIN_PANEL.md).

---

© 2026 Collector's Paradise. Designed with passion by [DesgnMate](https://desgnmate.com).

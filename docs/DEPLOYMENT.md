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

Vercel creates production deployments from the production branch and preview
deployments from other branches and pull requests.

## Environment variables

Configure the required Supabase variables for Production, Preview, and
Development as appropriate. Keep `SUPABASE_SERVICE_ROLE_KEY` server-only and do
not expose it with a `NEXT_PUBLIC_` prefix.

## Runtime behavior

- Server Components, Server Actions, dynamic routes, and Route Handlers run
  through Vercel's native Next.js runtime.
- Static assets in `public/` and generated `/_next/static` assets are served by
  Vercel's CDN.
- No `.open-next` output, Wrangler configuration, or Cloudflare compatibility
  flags are needed.

---

[Back to README](../README.md)

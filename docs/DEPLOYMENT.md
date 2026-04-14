# Deployment Guide — Collector's Paradise

This project is optimized for deployment on **Cloudflare Pages** using **@opennextjs/cloudflare**. This allows Next.js to run on Cloudflare's edge network with high performance and global availability.

## 🛠️ Build Process

The project uses OpenNext to bridge the gap between Next.js and Cloudflare Workers.

### 1. Build the Application
This command generates the `.open-next` directory containing the Cloudflare-compatible worker and assets.

```bash
npm run build
```

*Note: The `build` script in `package.json` runs `next build` which is picked up by the OpenNext build process if configured.*

## 🔬 Local Preview

To test the Cloudflare-specific build locally before deploying:

```bash
npx wrangler pages dev .open-next/assets
```

## 🚀 Deployment

### Manual Deployment via Wrangler

You can deploy the build folder directly to Cloudflare Pages:

```bash
npx wrangler pages deploy .open-next/assets
```

### Continuous Integration (CI/CD)

For automated deployments, link your GitHub repository to Cloudflare Pages:

1. **Build Command**: `npx @opennextjs/cloudflare -b` (or your npm build script if it handles this).
2. **Build Output Directory**: `.open-next/assets`
3. **Compatibility Flag**: Ensure `nodejs_compat` is enabled in the Cloudflare Dashboard.

## ⚙️ Configuration Files

- `wrangler.json`: Defines the Cloudflare project name, compatibility dates, and asset bindings.
- `open-next.config.ts`: Configuration for the OpenNext adapter (e.g., R2 caching).

## ⚠️ Important Considerations

- **Server Actions**: Fully supported on Cloudflare via OpenNext.
- **Dynamic Routes**: Ensure Cloudflare compatibility flags are set if using Node.js specific APIs.
- **Edge Runtime**: While this project uses the standard Next.js build, OpenNext transpiles it to run on the Edge.

---

[Back to README](../README.md)

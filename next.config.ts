import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
    // Cache client-side navigations for 5 minutes. Combined with
    // Next.js's built-in Link prefetch, this means the back/forward
    // buttons and re-visits to pages feel instant.
    staleTimes: {
      dynamic: 60,
      static: 300,
    },
    // Tree-shake unused exports from heavy libraries
    optimizePackageImports: ['lucide-react', 'framer-motion'],
  },
  images: {
    unoptimized: true,
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  compress: true,
  // Don't ship source maps to clients in production (smaller bundles
  // = faster navigation transitions)
  productionBrowserSourceMaps: false,
  // Reduce server response time for navigation requests
  poweredByHeader: false,
  // Cache static assets for improved repeat-visit performance
  async headers() {
    // Next.js manages its hashed /_next/static assets itself. Applying an
    // immutable header during development causes browsers to keep stale CSS
    // and JavaScript after edits.
    if (process.env.NODE_ENV !== 'production') return [];

    return [
      {
        source: '/images/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
      {
        source: '/videos/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=86400' },
        ],
      },
    ];
  },
};

export default nextConfig;

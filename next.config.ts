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
};

export default nextConfig;


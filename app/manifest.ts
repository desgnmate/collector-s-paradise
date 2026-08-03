import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Collector's Paradise",
    short_name: 'CP Events',
    description:
      "Australia’s Collectibles Market. Buy, sell and trade your favourite TCGs, discover rare finds, and connect with collectors",
    start_url: '/',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#F3EFE6',
    theme_color: '#5C8FC9',
    lang: 'en-AU',
    dir: 'ltr',
    scope: '/',
    categories: ['events', 'lifestyle', 'shopping', 'social'],
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  };
}

import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Collector's Paradise",
    short_name: 'CP Events',
    description:
      "Melbourne's premier Pokémon trading card event. Buy, sell, trade rare cards and connect with the collector community.",
    start_url: '/',
    display: 'standalone',
    background_color: '#F3EFE6',
    theme_color: '#2E2E2E',
    icons: [
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  };
}

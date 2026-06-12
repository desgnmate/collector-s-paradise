import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Collector's Paradise Melbourne",
    short_name: 'CP Events',
    description:
      "Melbourne's premier Pokémon TCG and trading card event. Buy, sell, trade rare cards and connect with the Australian collector community.",
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

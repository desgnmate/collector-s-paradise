import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Collector's Paradise Melbourne",
    short_name: 'CP Events',
    description:
      "Australia’s Community Collectibles Market! Pokemon, One Piece, Sports Cards, TCG, Games, Art, Accessories and more! Buy, Sell, Trade with hundreds of vendors!",
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

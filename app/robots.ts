import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/profile/', '/login', '/signup'],
      },
    ],
    sitemap: 'https://collectorsparadise.com.au/sitemap.xml',
  };
}

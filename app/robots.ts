import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: ['/', '/api/events/'],
      disallow: ['/admin/', '/admin-login', '/login', '/signup', '/api/'],
    },
    sitemap: 'https://www.collectorsparadise.au/sitemap.xml',
  };
}

import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/admin-login', '/login', '/signup', '/api/'],
      },
      // Explicitly allow common AI crawlers so the site can be cited
      // by ChatGPT, Perplexity, Claude, Gemini, etc. when users ask
      // about Pokémon TCG events in Melbourne.
      { userAgent: 'GPTBot', allow: '/', disallow: ['/admin/', '/admin-login'] },
      { userAgent: 'PerplexityBot', allow: '/', disallow: ['/admin/', '/admin-login'] },
      { userAgent: 'ClaudeBot', allow: '/', disallow: ['/admin/', '/admin-login'] },
      { userAgent: 'anthropic-ai', allow: '/', disallow: ['/admin/', '/admin-login'] },
      { userAgent: 'Google-Extended', allow: '/', disallow: ['/admin/', '/admin-login'] },
      { userAgent: 'CCBot', allow: '/', disallow: ['/admin/', '/admin-login'] },
      { userAgent: 'Applebot-Extended', allow: '/', disallow: ['/admin/', '/admin-login'] },
    ],
    sitemap: 'https://collectorsparadise.au/sitemap.xml',
    host: 'https://collectorsparadise.au',
  };
}

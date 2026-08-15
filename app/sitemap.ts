import type { MetadataRoute } from 'next';
import { getEvents } from '@/app/actions/events';
import { SITE_URL } from '@/lib/site';

// Event data uses the same tagged one-hour cache as the public event pages,
// avoiding a separate database read for every crawler request.
export const revalidate = 3600;

/**
 * Resolve a usable absolute image URL for a sitemap entry.
 *
 * Rejects:
 *  - data: URIs (invalid in sitemaps — would render as e.g.
 *    `https://site.com.audata:image/png;base64,...` which is not a URL)
 *  - empty / missing values
 *  - relative paths that don't start with `/`
 *
 * Returns `null` for any invalid value so the caller can omit the
 * `images` field entirely instead of publishing a broken URL.
 */
function resolveSitemapImage(url: string | null | undefined): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Reject any inline / data URI — these break image sitemaps.
  if (trimmed.startsWith('data:')) return null;
  // Only absolute http(s) URLs are valid in a sitemap image entry.
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  if (trimmed.startsWith('/')) return new URL(trimmed, SITE_URL).toString();
  return null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = SITE_URL;
  const ogImage = `${baseUrl}/og-image.jpg`;
  const logoImage = `${baseUrl}/images/logo.png`;

  // Static pages — use a fixed date to avoid false freshness signals.
  const staticLastMod = new Date('2025-06-14');
  const newContentLastMod = new Date('2026-08-10');
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: staticLastMod,
      changeFrequency: 'weekly',
      priority: 1,
      images: [ogImage],
    },
    {
      url: `${baseUrl}/about`,
      lastModified: staticLastMod,
      changeFrequency: 'monthly',
      priority: 0.8,
      images: [logoImage],
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
      images: [ogImage],
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: staticLastMod,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vendors`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vendors/apply`,
      lastModified: staticLastMod,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/sponsorship`,
      lastModified: staticLastMod,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/sponsors/apply`,
      lastModified: staticLastMod,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/volunteers`,
      lastModified: staticLastMod,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/volunteers/apply`,
      lastModified: staticLastMod,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: staticLastMod,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: staticLastMod,
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/locations/melbourne`,
      lastModified: newContentLastMod,
      changeFrequency: 'weekly',
      priority: 0.8,
      images: [`${baseUrl}/images/buy-sell-trade.jpeg`],
    },
    {
      url: `${baseUrl}/locations/gold-coast`,
      lastModified: newContentLastMod,
      changeFrequency: 'weekly',
      priority: 0.8,
      images: [`${baseUrl}/images/event-experience.jpg`],
    },
    {
      url: `${baseUrl}/locations/canberra`,
      lastModified: newContentLastMod,
      changeFrequency: 'weekly',
      priority: 0.8,
      images: [`${baseUrl}/images/3rd-section-new.jpg`],
    },
    {
      url: `${baseUrl}/guides/first-trading-card-show`,
      lastModified: newContentLastMod,
      changeFrequency: 'monthly',
      priority: 0.75,
      images: [`${baseUrl}/images/meet-fans.png`],
    },
    {
      url: `${baseUrl}/vendors/booth-information`,
      lastModified: newContentLastMod,
      changeFrequency: 'weekly',
      priority: 0.7,
      images: [`${baseUrl}/images/team-vendors-1.png`],
    },
    {
      url: `${baseUrl}/accessibility`,
      lastModified: newContentLastMod,
      changeFrequency: 'yearly',
      priority: 0.5,
    },
  ];

  // Dynamic event pages — skip any event whose cover image is invalid
  // (e.g. stored as a data URI) so we never publish a malformed entry.
  let eventPages: MetadataRoute.Sitemap = [];
  try {
    const events = await getEvents();

    if (events.length > 0) {
      eventPages = events
        .map((event) => {
          const imageUrl = event.cover_image_url?.startsWith('data:')
            ? `${baseUrl}/api/events/${event.id}/cover`
            : resolveSitemapImage(event.cover_image_url) ?? ogImage;
          return {
            url: `${baseUrl}/events/${event.id}`,
            lastModified: new Date(event.updated_at),
            changeFrequency: 'weekly' as const,
            priority: 0.7,
            images: [imageUrl],
          };
        })
        // Final safety net: drop anything that still has a bad URL.
        .filter((entry) => Array.isArray(entry.images) && entry.images.length > 0);
    }
  } catch (error) {
    // Fail silently — static pages still get indexed
    console.error('Sitemap: failed to fetch events', error);
  }

  return [...staticPages, ...eventPages];
}

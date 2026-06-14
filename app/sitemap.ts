import type { MetadataRoute } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Sitemap must be dynamic because the Supabase server client reads
// cookies. Cache the rendered output for 1 hour to avoid hitting
// Supabase on every crawler request.
export const revalidate = 3600;
export const dynamic = 'force-dynamic';

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
function resolveSitemapImage(url: string | null | undefined, fallback: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Reject any inline / data URI — these break image sitemaps.
  if (trimmed.startsWith('data:')) return null;
  // Only absolute http(s) URLs are valid in a sitemap image entry.
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return null;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://collectorsparadise.au';
  const ogImage = `${baseUrl}/og-image.png`;
  const logoImage = `${baseUrl}/images/logo.png`;

  // Static pages — use a fixed date to avoid false freshness signals.
  const staticLastMod = new Date('2025-06-14');
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: staticLastMod,
      changeFrequency: 'weekly',
      priority: 1,
      ...(resolveSitemapImage(ogImage, '') ? { images: [ogImage] } : {}),
    },
    {
      url: `${baseUrl}/about`,
      lastModified: staticLastMod,
      changeFrequency: 'monthly',
      priority: 0.8,
      ...(resolveSitemapImage(logoImage, '') ? { images: [logoImage] } : {}),
    },
    {
      url: `${baseUrl}/events`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
      ...(resolveSitemapImage(ogImage, '') ? { images: [ogImage] } : {}),
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
  ];

  // Dynamic event pages — skip any event whose cover image is invalid
  // (e.g. stored as a data URI) so we never publish a malformed entry.
  let eventPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data: events } = await supabase
      .from('events')
      .select('id, title, updated_at, cover_image_url')
      .in('status', ['upcoming', 'active', 'completed'])
      .order('event_date', { ascending: false });

    if (events) {
      eventPages = events
        .map((event) => {
          const imageUrl = resolveSitemapImage(event.cover_image_url, ogImage) ?? ogImage;
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

import type { MetadataRoute } from 'next';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Sitemap must be dynamic because the Supabase server client reads
// cookies. Cache the rendered output for 1 hour to avoid hitting
// Supabase on every crawler request.
export const revalidate = 3600;
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://collectorsparadise.com.au';
  const ogImage = `${baseUrl}/og-image.png`;
  const logoImage = `${baseUrl}/images/logo.png`;

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
      images: [ogImage],
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
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
      url: `${baseUrl}/vendors`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/vendors/apply`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/sponsorship`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/volunteers`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
  ];

  // Dynamic event pages
  let eventPages: MetadataRoute.Sitemap = [];
  try {
    const supabase = await createSupabaseServerClient();
    const { data: events } = await supabase
      .from('events')
      .select('id, title, updated_at, cover_image_url')
      .in('status', ['upcoming', 'active', 'completed'])
      .order('event_date', { ascending: false });

    if (events) {
      eventPages = events.map((event) => {
        const imageUrl = event.cover_image_url
          ? event.cover_image_url.startsWith('http')
            ? event.cover_image_url
            : `${baseUrl}${event.cover_image_url}`
          : ogImage;
        return {
          url: `${baseUrl}/events/${event.id}`,
          lastModified: new Date(event.updated_at),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
          images: [imageUrl],
        };
      });
    }
  } catch (error) {
    // Fail silently — static pages still get indexed
    console.error('Sitemap: failed to fetch events', error);
  }

  return [...staticPages, ...eventPages];
}

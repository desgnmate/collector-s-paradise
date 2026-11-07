import { SITE_NAME } from '@/lib/site';

/**
 * Next.js replaces (does not merge) a parent segment's `openGraph` object as
 * soon as a page defines its own. Spread these defaults into every page-level
 * `openGraph` so og:site_name, og:locale and og:type are never dropped.
 *
 * Twitter cards are intentionally left to the root layout (`card` only): when
 * a page sets no explicit `twitter.title`, Next.js fills twitter:title,
 * twitter:description and twitter:image from that page's Open Graph values.
 */
export const OPEN_GRAPH_DEFAULTS = {
  siteName: SITE_NAME,
  locale: 'en_AU',
  type: 'website',
} as const;

export const DEFAULT_OG_IMAGE = {
  url: '/og-image.jpg',
  width: 1200,
  height: 630,
  alt: "Collector's Paradise - Australian Pokémon TCG and trading card events",
};

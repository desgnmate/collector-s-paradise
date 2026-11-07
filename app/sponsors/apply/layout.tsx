import type { Metadata } from 'next';
import { OPEN_GRAPH_DEFAULTS } from '@/lib/seo/metadata';

export const metadata: Metadata = {
  title: "Apply for Sponsorship | Collector's Paradise",
  description:
    'Apply to sponsor Collector\'s Paradise trading card events across Australia. Choose from Platinum, Gold, Silver, and custom partnership packages.',
  keywords: [
    'sponsorship application Australia',
    'Pokemon TCG event sponsorship',
    'partner with trading card events',
    'card show sponsorship Australia',
  ],
  openGraph: {
    ...OPEN_GRAPH_DEFAULTS,
    title: "Apply for Sponsorship | Collector's Paradise",
    description:
      'Partner with Collector\'s Paradise trading card events. Platinum, Gold, Silver, and custom packages available.',
    url: 'https://www.collectorsparadise.au/sponsors/apply',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: "Sponsor Collector's Paradise trading card events",
    }],
  },
  alternates: {
    canonical: 'https://www.collectorsparadise.au/sponsors/apply',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SponsorsApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

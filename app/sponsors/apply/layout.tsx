import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply for Sponsorship | Partner with Pokémon TCG Events Melbourne',
  description:
    'Apply to become a sponsor at Collector\'s Paradise Melbourne. Reach 2,000+ Australian collectors per event with Platinum, Gold, Silver, and Custom sponsorship packages.',
  keywords: [
    'sponsorship application Melbourne',
    'Pokemon TCG event sponsorship',
    'partner with trading card events',
    'card show sponsorship Victoria',
  ],
  openGraph: {
    title: "Apply for Sponsorship | Collector's Paradise Melbourne",
    description:
      'Partner with Melbourne\'s biggest trading card event series. Platinum, Gold, Silver, and custom packages available.',
    url: 'https://collectorsparadise.au/sponsors/apply',
  },
  alternates: {
    canonical: 'https://collectorsparadise.au/sponsors/apply',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function SponsorsApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

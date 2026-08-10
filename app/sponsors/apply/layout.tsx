import type { Metadata } from 'next';

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
    title: "Apply for Sponsorship | Collector's Paradise",
    description:
      'Partner with Collector\'s Paradise trading card events. Platinum, Gold, Silver, and custom packages available.',
    url: 'https://www.collectorsparadise.au/sponsors/apply',
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

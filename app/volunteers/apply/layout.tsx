import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Apply as Volunteer | Collector's Paradise",
  description:
    'Volunteer at Collector\'s Paradise trading card events across Australia. Help with setup, registration, floor guiding, and breakdown.',
  keywords: [
    'volunteer application Australia',
    'event volunteer Victoria',
    'Pokemon TCG volunteer Australia',
    'community event volunteer Australia',
  ],
  openGraph: {
    title: "Apply as Volunteer | Collector's Paradise",
    description:
      'Join our volunteer team at Collector\'s Paradise trading card events. Help with setup, registration, floor guides, and breakdown.',
    url: 'https://www.collectorsparadise.au/volunteers/apply',
    images: [{
      url: '/og-image.jpg',
      width: 1200,
      height: 630,
      alt: "Volunteer at Collector's Paradise trading card events",
    }],
  },
  alternates: {
    canonical: 'https://www.collectorsparadise.au/volunteers/apply',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function VolunteersApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

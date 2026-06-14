import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Apply as Volunteer | Help at Pokémon TCG Events Melbourne',
  description:
    'Volunteer at Collector\'s Paradise trading card events in Melbourne. Help with event setup, registration, floor guiding, and breakdown. Meet the community and gain event experience.',
  keywords: [
    'volunteer application Melbourne',
    'event volunteer Victoria',
    'Pokemon TCG volunteer Australia',
    'community event volunteer Melbourne',
  ],
  openGraph: {
    title: "Apply as Volunteer | Collector's Paradise Melbourne",
    description:
      'Join our volunteer team at Melbourne\'s biggest trading card events. Help with setup, registration, floor guides, and breakdown.',
    url: 'https://collectorsparadise.au/volunteers/apply',
  },
  alternates: {
    canonical: 'https://collectorsparadise.au/volunteers/apply',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function VolunteersApplyLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

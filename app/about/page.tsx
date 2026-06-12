import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AboutHero from '@/components/about/AboutHero';
import StackingCards from '@/components/about/StackingCards';

export const metadata: Metadata = {
  title: 'About Us | Melbourne Pokémon & Trading Card Event Organisers',
  description:
    "Learn about Collector's Paradise — Melbourne's leading Pokémon TCG and trading card event organisers. Our story, mission, and the Australian collector community we serve.",
  keywords: [
    'about Collectors Paradise',
    'Melbourne trading card event organisers',
    'Pokémon TCG community Australia',
    'collector events Victoria',
  ],
  openGraph: {
    title: "About Collector's Paradise | Melbourne Trading Card Events",
    description:
      "Melbourne's leading trading card and Pokémon TCG event organisers. Meet the team behind Australia's most passionate collector events.",
  },
  alternates: {
    canonical: 'https://collectorsparadise.com.au/about',
  },
};

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="about-page-wrapper">
        <AboutHero />
        <StackingCards />
      </main>
      <Footer />
    </>
  );
}
import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AboutHero from '@/components/about/AboutHero';
import StackingCards from '@/components/about/StackingCards';
import GymBadges from '@/components/about/GymBadges';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    "Learn about Collector's Paradise — Melbourne's premier Pokémon trading card event. Discover our story, mission, and what makes our collector community special.",
  openGraph: {
    title: "About Us | Collector's Paradise",
    description:
      "Learn about Collector's Paradise — Melbourne's premier Pokémon trading card event.",
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
        <GymBadges />
      </main>
      <Footer />
    </>
  );
}
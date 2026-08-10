import React from 'react';
import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AboutHero from '@/components/about/AboutHero';
import StackingCards from '@/components/about/StackingCards';

export const metadata: Metadata = {
  title: "About Collector's Paradise | Australian Trading Card Events",
  description:
    "Learn about Collector's Paradise, an Australian Pokémon TCG and trading card event organiser building welcoming collector communities across the country.",
  keywords: [
    'about Collectors Paradise',
    'Australian trading card event organisers',
    'Pokémon TCG community Australia',
    'collector events Victoria',
  ],
  openGraph: {
    title: "About Collector's Paradise | Australian Trading Card Events",
    description:
      "Meet the team behind Collector's Paradise trading card events and the collector community we are building across Australia.",
    url: "https://www.collectorsparadise.au/about",
  },
  alternates: {
    canonical: 'https://www.collectorsparadise.au/about',
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
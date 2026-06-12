import type { Metadata } from "next";
import { Suspense } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Highlights from "@/components/Highlights";
import HighlightsSkeleton from "@/components/HighlightsSkeleton";
import Brands from "@/components/Brands";
import VendorShowcase from "@/components/VendorShowcase";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Collector's Paradise | Pokémon TCG & Trading Card Events in Melbourne",
  description:
    "Melbourne's biggest Pokémon TCG, Yu-Gi-Oh!, One Piece and sports card event. Buy, sell, trade rare cards with hundreds of vendors. Tickets available now — held regularly in Melbourne, Victoria, Australia.",
  alternates: {
    canonical: "https://collectorsparadise.au",
  },
  openGraph: {
    title: "Collector's Paradise | Melbourne's Premier Pokémon TCG Event",
    description:
      "Where Melbourne collectors meet, trade & connect. Buy tickets to the next trading card event in Victoria, Australia.",
    url: "https://collectorsparadise.au",
  },
};

export default function Home() {
  return (
    <main className="homepage">
      <Navbar />
      <Hero />
      <About />
      <Experience />
      {/* Stream Highlights from the server so the rest of the page
          (Hero/About/Experience/Brands) renders without waiting for
          the Supabase event query to finish. */}
      <Suspense fallback={<HighlightsSkeleton />}>
        <Highlights />
      </Suspense>
      <Brands />
      <VendorShowcase />
      <Footer />
    </main>
  );
}

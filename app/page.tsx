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

const homepageDescription =
  "Australia’s Collectibles Market. Buy, sell and trade your favourite TCGs, discover rare finds, and connect with collectors";

export const metadata: Metadata = {
  title: "Australia's TCG & Trading Card Events | Collector's Paradise",
  description: homepageDescription,
  alternates: {
    canonical: "https://collectorsparadise.au",
  },
  openGraph: {
    title: "Australia's TCG & Trading Card Events | Collector's Paradise",
    description: homepageDescription,
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

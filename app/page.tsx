import type { Metadata } from "next";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Highlights from "@/components/Highlights";
import Brands from "@/components/Brands";
import VendorShowcase from "@/components/VendorShowcase";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "Collector's Paradise | Pokémon TCG & Trading Card Events in Melbourne",
  description:
    "Melbourne's biggest Pokémon TCG, Yu-Gi-Oh!, One Piece and sports card event. Buy, sell, trade rare cards with hundreds of vendors. Tickets available now — held regularly in Melbourne, Victoria, Australia.",
  alternates: {
    canonical: "https://collectorsparadise.com.au",
  },
  openGraph: {
    title: "Collector's Paradise | Melbourne's Premier Pokémon TCG Event",
    description:
      "Where Melbourne collectors meet, trade & connect. Buy tickets to the next trading card event in Victoria, Australia.",
    url: "https://collectorsparadise.com.au",
  },
};

export default function Home() {
  return (
    <main className="homepage">
      <Navbar />
      <Hero />
      <About />
      <Experience />
      <Highlights />
      <Brands />
      <VendorShowcase />
      <Footer />
    </main>
  );
}

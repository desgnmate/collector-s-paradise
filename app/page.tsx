import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import About from "@/components/About";
import Experience from "@/components/Experience";
import Highlights from "@/components/Highlights";
import Brands from "@/components/Brands";
import VendorShowcase from "@/components/VendorShowcase";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <main>
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

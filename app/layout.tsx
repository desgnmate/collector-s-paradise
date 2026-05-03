import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import { OrganizationSchema } from "@/components/StructuredData";

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-montserrat",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-inter",
  display: "swap",
});

const baloo = localFont({
  src: "../public/fonts/Baloo-Regular.ttf",
  variable: "--font-baloo",
  display: "swap",
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#5C8FC9',
};

export const metadata: Metadata = {
  metadataBase: new URL("https://collectorsparadise.com.au"),
  title: {
    default: "Collector's Paradise | Pokémon Trading Card Events in Melbourne",
    template: "%s | Collector's Paradise",
  },
  description:
    "Melbourne's premier Pokémon trading card event. Buy, sell, trade rare cards. Meet vendors, discover collections, and connect with the collector community.",
  keywords: [
    "Pokemon cards",
    "trading cards",
    "Melbourne events",
    "card collecting",
    "TCG",
    "Pokemon TCG",
    "card trading",
    "rare cards",
    "collector events",
    "Pokemon Melbourne",
    "card show Melbourne",
  ],
  openGraph: {
    title: "Collector's Paradise | Pokémon Trading Card Events",
    description:
      "Where collectors meet, trade & connect. Join Melbourne's most exciting trading card event.",
    type: "website",
    siteName: "Collector's Paradise",
    locale: "en_AU",
    url: "https://collectorsparadise.com.au",
    images: [{ url: '/og-image.png', width: 1200, height: 630, alt: "Collector's Paradise - Pokemon TCG Events" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Collector's Paradise | Pokémon Trading Card Events",
    description:
      "Where collectors meet, trade & connect. Join Melbourne's most exciting trading card event.",
    images: ['/og-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  alternates: {
    canonical: "https://collectorsparadise.com.au",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${montserrat.variable} ${inter.variable} ${baloo.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <OrganizationSchema />
        <SmoothScroll>
          {children}
        </SmoothScroll>
      </body>
    </html>
  );
}

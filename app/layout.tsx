import type { Metadata } from "next";
import { Montserrat, Inter } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import ClientRuntime from "@/components/ClientRuntime";
import {
  OrganizationSchema,
  LocalBusinessSchema,
  EventSeriesSchema,
} from "@/components/StructuredData";

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

const siteDescription =
  "Australia’s Community Collectibles Market! Pokemon, One Piece, Sports Cards, TCG, Games, Art, Accessories and more! Buy, Sell, Trade with hundreds of vendors!";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#5C8FC9',
};

export const metadata: Metadata = {
  metadataBase: new URL("https://collectorsparadise.au"),
  title: {
    default: "Collector's Paradise | Pokémon Trading Card Events in Melbourne, Australia",
    template: "%s | Collector's Paradise",
  },
  description: siteDescription,
  keywords: [
    "Pokemon cards Melbourne",
    "Pokemon TCG Melbourne",
    "trading card events Melbourne",
    "card show Melbourne",
    "trading card events Australia",
    "Pokemon cards Victoria",
    "Yu-Gi-Oh Melbourne",
    "One Piece TCG Australia",
    "Magic the Gathering Melbourne",
    "sports cards Melbourne",
    "graded cards PSA CGC",
    "rare Pokemon cards Australia",
    "card vendor Melbourne",
    "collector community Australia",
    "TCG tournament Melbourne",
    "Pokemon card show",
    "trading card vendor application",
    "Melbourne hobby store events",
    "Australian TCG events",
  ],
  authors: [{ name: "Collector's Paradise" }],
  creator: "Collector's Paradise",
  publisher: "Collector's Paradise",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  category: "Events",
  classification: "Trading Card & Collectibles Events",
  openGraph: {
    title: "Collector's Paradise | Pokémon Trading Card Events in Melbourne",
    type: "website",
    siteName: "Collector's Paradise",
    locale: "en_AU",
    url: "https://collectorsparadise.au",
    countryName: "Australia",
    description: siteDescription,
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: "Collector's Paradise - Pokémon Trading Card Events in Melbourne, Australia",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Collector's Paradise | Pokémon Trading Card Events in Melbourne",
    description: siteDescription,
    images: ['/og-image.jpg'],
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
    canonical: "https://collectorsparadise.au",
  },
  verification: {
    google: "googleee7ef25e2b145100",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-AU" dir="ltr" className={`${montserrat.variable} ${inter.variable} ${baloo.variable}`}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" crossOrigin="anonymous" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <OrganizationSchema />
        <LocalBusinessSchema />
        <EventSeriesSchema />
        <ClientRuntime>
          {children}
        </ClientRuntime>
      </body>
    </html>
  );
}

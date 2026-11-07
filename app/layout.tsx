import type { Metadata } from "next";
import { Montserrat, Inter, Poppins } from "next/font/google";
import "./globals.css";
import ClientRuntime from "@/components/ClientRuntime";
import { OrganizationSchema } from "@/components/StructuredData";
import { SITE_URL } from "@/lib/site";
import { DEFAULT_OG_IMAGE, OPEN_GRAPH_DEFAULTS } from "@/lib/seo/metadata";

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

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["600", "700", "800", "900"],
  variable: "--font-poppins",
  display: "swap",
});

const siteDescription =
  "Australia’s Collectibles Market. Buy, sell and trade your favourite TCGs, discover rare finds, and connect with collectors";

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  viewportFit: 'cover',
  themeColor: '#5C8FC9',
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Australia's TCG & Trading Card Events | Collector's Paradise",
    template: "%s",
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
    ...OPEN_GRAPH_DEFAULTS,
    title: "Australia's TCG & Trading Card Events | Collector's Paradise",
    url: SITE_URL,
    countryName: "Australia",
    description: siteDescription,
    images: [DEFAULT_OG_IMAGE],
  },
  // Only the card type is set here. Pages inherit twitter:title/description/
  // image from their own Open Graph values; an explicit title here would make
  // every page share the homepage's Twitter/X card.
  twitter: {
    card: "summary_large_image",
  },
  // Indexable by default. Index/follow are deliberately not set site-wide so
  // they never conflict with the `noindex` Next.js adds to 404 responses or
  // that individual pages opt into.
  robots: {
    "max-video-preview": -1,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
  // No site-wide canonical: an inherited canonical would point every page that
  // forgets to set its own (404s, noindex pages) at the homepage. Each
  // indexable page declares its own canonical URL.
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
    <html lang="en-AU" dir="ltr" className={`${montserrat.variable} ${inter.variable} ${poppins.variable}`}>
      <body>
        <OrganizationSchema />
        <ClientRuntime>
          {children}
        </ClientRuntime>
      </body>
    </html>
  );
}

import type { Metadata } from "next";
import "./globals.css";
import ChatWidget from "@/components/ChatWidget";

export const metadata: Metadata = {
  title: "Collector's Paradise | Pokémon Trading Card Events in Melbourne",
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
  ],
  openGraph: {
    title: "Collector's Paradise | Pokémon Trading Card Events",
    description:
      "Where collectors meet, trade & connect. Join Melbourne's most exciting trading card event.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <ChatWidget />
      </body>
    </html>
  );
}

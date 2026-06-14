import React from 'react';

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
}

/**
 * Renders LocalBusiness JSON-LD for a venue hosting recurring events in
 * Melbourne. Helps Google surface the site for "near me" / Melbourne
 * searches and feeds business data to AI assistants.
 */
export function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': ['LocalBusiness', 'EventVenue'],
    '@id': 'https://collectorsparadise.au/#localbusiness',
    name: "Collector's Paradise",
    alternateName: "Collector's Paradise Melbourne",
    description:
      "Melbourne's premier Pokémon trading card and collectibles event. Buy, sell, trade rare cards, meet vendors, and connect with the collector community at our live events.",
    url: 'https://collectorsparadise.au',
    logo: 'https://collectorsparadise.au/images/logo.png',
    image: 'https://collectorsparadise.au/og-image.png',
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Melbourne',
      addressRegion: 'VIC',
      postalCode: '3000',
      addressCountry: 'AU',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: -37.8136,
      longitude: 144.9631,
    },
    areaServed: [
      { '@type': 'City', name: 'Melbourne' },
      { '@type': 'State', name: 'Victoria' },
      { '@type': 'Country', name: 'Australia' },
    ],
    sameAs: [
      'https://www.instagram.com/collectorsparadisemelbourne',
      'https://www.facebook.com/collectorsparadisemelbourne',
      'https://twitter.com/collectorsparadise',
    ],
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Renders an FAQPage schema for common collector questions. Frequently
 * cited verbatim by Google AI Overviews, Perplexity, and ChatGPT when
 * answering "what is collector's paradise" / "when is the next event".
 */
export function FAQSchema() {
  const faqs = [
    {
      q: 'What is Collector\'s Paradise?',
      a: "Collector's Paradise is Melbourne's premier trading card and collectibles event series. We host live Pokémon TCG, Yu-Gi-Oh!, One Piece, Magic: The Gathering, and sports card events where collectors buy, sell, trade, and connect.",
    },
    {
      q: 'Where is the next Collector\'s Paradise event in Melbourne?',
      a: "Our events are held at venues across metropolitan Melbourne, Victoria. Check the Events page for the next scheduled date, venue address, and ticket availability.",
    },
    {
      q: 'How do I buy tickets to a Collector\'s Paradise event?',
      a: 'Tickets are available on our Events page. Select an upcoming event, choose your pass type, and complete secure checkout. Tickets are delivered to your email instantly.',
    },
    {
      q: 'How do I become a vendor at Collector\'s Paradise?',
      a: 'Apply through the Vendors page. We accept applications from traders of Pokémon TCG, Yu-Gi-Oh!, One Piece TCG, sports cards, graded cards, vintage collectibles, and accessories. Approved vendors receive a booth assignment and access to our buyer community.',
    },
    {
      q: 'What kinds of cards and collectibles can I buy and sell?',
      a: 'Pokémon trading cards (vintage and modern), Yu-Gi-Oh!, Magic: The Gathering, One Piece TCG, Dragon Ball Super, sports cards, graded cards, sealed product, accessories, and vintage or retro collectibles.',
    },
    {
      q: 'Does Collector\'s Paradise run events outside Melbourne?',
      a: 'Our flagship series is based in Melbourne, Victoria, Australia. We partner with regional collectors and vendors across Victoria for satellite events announced on the Events page.',
    },
  ];
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: f.a,
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * EventSeries schema — describes the recurring event series so that
 * Google can show upcoming instances in event-rich results.
 */
export function EventSeriesSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'EventSeries',
    name: "Collector's Paradise Melbourne Trading Card Events",
    description:
      "Recurring Pokémon TCG and trading card collector events in Melbourne, Australia. Featuring buy/sell/trade floors, tournaments, giveaways, and vendor halls.",
    url: 'https://collectorsparadise.au/events',
    organizer: {
      '@type': 'Organization',
      name: "Collector's Paradise",
      url: 'https://collectorsparadise.au',
    },
    location: {
      '@type': 'Place',
      name: 'Melbourne',
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Melbourne',
        addressRegion: 'VIC',
        addressCountry: 'AU',
      },
    },
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    eventStatus: 'https://schema.org/EventScheduled',
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

/**
 * Renders Organization + WebSite JSON-LD structured data.
 * Place in the root layout for site-wide presence.
 */
export function OrganizationSchema({
  name = "Collector's Paradise",
  url = 'https://collectorsparadise.au',
  logo = 'https://collectorsparadise.au/images/logo.png',
  description = "Melbourne's premier Pokémon trading card event. Buy, sell, trade rare cards and connect with the collector community.",
}: OrganizationSchemaProps) {
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Melbourne',
      addressCountry: 'AU',
    },
    contactPoint: {
      '@type': 'ContactPoint',
      email: 'hello@collectorsparadise.au',
      contactType: 'customer service',
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name,
    url,
    description,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
    </>
  );
}

interface EventSchemaProps {
  name: string;
  description: string;
  startDate: string; // ISO format e.g. "2026-05-12T09:00:00"
  endDate: string;
  venue: string;
  venueAddress?: string;
  ticketPrice?: number;
  ticketUrl?: string;
  imageUrl?: string;
  status?: 'upcoming' | 'completed' | 'cancelled';
}

/**
 * Renders Event JSON-LD structured data for a single event.
 * Place on individual event pages or in event listings.
 */
export function EventSchema({
  name,
  description,
  startDate,
  endDate,
  venue,
  venueAddress,
  ticketPrice,
  ticketUrl = 'https://collectorsparadise.au/events',
  imageUrl,
  status = 'upcoming',
}: EventSchemaProps) {
  const eventStatusMap: Record<string, string> = {
    upcoming: 'https://schema.org/EventScheduled',
    active: 'https://schema.org/EventScheduled',
    completed: 'https://schema.org/EventPassed',
    cancelled: 'https://schema.org/EventCancelled',
  };

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    startDate,
    endDate,
    eventStatus: eventStatusMap[status] || 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: venue,
      address: {
        '@type': 'PostalAddress',
        streetAddress: venueAddress || venue,
        addressLocality: 'Melbourne',
        addressCountry: 'AU',
      },
    },
    organizer: {
      '@type': 'Organization',
      name: "Collector's Paradise",
      url: 'https://collectorsparadise.au',
    },
  };

  if (imageUrl) {
    schema.image = imageUrl.startsWith('/')
      ? `https://collectorsparadise.au${imageUrl}`
      : imageUrl;
  }

  if (ticketPrice !== undefined) {
    schema.offers = {
      '@type': 'Offer',
      url: ticketUrl,
      price: ticketPrice,
      priceCurrency: 'AUD',
      availability: 'https://schema.org/InStock',
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

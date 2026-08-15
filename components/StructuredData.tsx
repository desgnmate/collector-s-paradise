import React from 'react';
import { absoluteUrl, CONTACT_EMAIL, SITE_NAME, SITE_URL, SOCIAL_LINKS } from '@/lib/site';

const siteDescription =
  "Australia’s Collectibles Market. Buy, sell and trade your favourite TCGs, discover rare finds, and connect with collectors";

const serializeJsonLd = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c');

const presentingOrganization = {
  '@type': 'Organization',
  '@id': `${SITE_URL}/#organization`,
  name: SITE_NAME,
  url: SITE_URL,
};

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
}

/**
 * Renders an FAQPage schema for common collector questions. Frequently
 * cited verbatim by Google AI Overviews, Perplexity, and ChatGPT when
 * answering "what is collector's paradise" / "when is the next event".
 */

/**
 * Shared FAQ data used by both FAQSchema (JSON-LD) and the /faq page.
 * Keeping them in one place guarantees the visible content and structured
 * data can never drift apart.
 */
export const FAQ_DATA = [
  {
    q: 'What is Collector\'s Paradise?',
    a: "Collector's Paradise is an Australian trading card and collectibles event series. We host live Pokémon TCG, Yu-Gi-Oh!, One Piece, Magic: The Gathering, and sports card events where collectors buy, sell, trade, and connect.",
  },
  {
    q: 'Where is the next Collector\'s Paradise event?',
    a: 'Event locations vary. Check the Events page for the next scheduled date, venue address, and ticket availability.',
  },
  {
    q: 'How do I buy tickets to a Collector\'s Paradise event?',
    a: 'Open an upcoming event from the Events page and follow its published booking link. Checkout, confirmation, and ticket delivery are handled by the ticketing provider shown for that event.',
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
    a: 'Yes. Collector\'s Paradise hosts events across Australia. Check the Events page for upcoming dates, locations, venue addresses, and ticket availability.'
  },
];

export function FAQSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ_DATA.map((f) => ({
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
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
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
    '@id': `${SITE_URL}/events#series`,
    name: "Collector's Paradise Australian Trading Card Events",
    description: siteDescription,
    url: absoluteUrl('/events'),
    organizer: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    performer: presentingOrganization,
    areaServed: { '@type': 'Country', name: 'Australia' },
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    inLanguage: 'en-AU',
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}

/**
 * Renders Organization + WebSite JSON-LD structured data.
 * Place in the root layout for site-wide presence.
 */
export function OrganizationSchema({
  name = SITE_NAME,
  url = SITE_URL,
  logo = absoluteUrl('/images/logo.png'),
  description = siteDescription,
}: OrganizationSchemaProps) {
  const orgSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name,
    alternateName: "Collector's Paradise Australia",
    url,
    logo: {
      '@type': 'ImageObject',
      url: logo,
    },
    image: absoluteUrl('/og-image.jpg'),
    description,
    areaServed: { '@type': 'Country', name: 'Australia' },
    sameAs: Object.values(SOCIAL_LINKS),
    contactPoint: {
      '@type': 'ContactPoint',
      email: CONTACT_EMAIL,
      contactType: 'customer service',
      availableLanguage: 'English',
      areaServed: 'AU',
    },
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name,
    url,
    description,
    inLanguage: 'en-AU',
    publisher: { '@id': `${SITE_URL}/#organization` },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(orgSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(websiteSchema) }}
      />
    </>
  );
}

interface EventSchemaProps {
  name: string;
  description: string;
  startDate: string; // ISO format e.g. "2026-05-12T09:00:00"
  endDate?: string;
  venue: string;
  venueAddress?: string;
  addressLocality?: string;    // e.g. "Melbourne", "Nerang"
  addressRegion?: string;      // e.g. "VIC", "QLD"
  postalCode?: string;         // e.g. "3000", "4211"
  ticketPrice?: number;
  ticketUrl?: string;
  offerValidFrom?: string;
  eventUrl?: string;
  imageUrl?: string;
  status?: 'upcoming' | 'active' | 'completed' | 'cancelled';
  isSoldOut?: boolean;
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
  addressLocality,
  addressRegion,
  postalCode,
  ticketPrice,
  ticketUrl,
  offerValidFrom,
  eventUrl,
  imageUrl,
  status = 'upcoming',
  isSoldOut = false,
}: EventSchemaProps) {
  const eventStatusMap: Partial<Record<NonNullable<EventSchemaProps['status']>, string>> = {
    upcoming: 'https://schema.org/EventScheduled',
    active: 'https://schema.org/EventScheduled',
    cancelled: 'https://schema.org/EventCancelled',
  };
  // Build location: Place name always, address only when we have a real
  // street address. Omitting address means Google falls back to the Place
  // name / venue for geocoding.
  const location: Record<string, unknown> = {
    '@type': 'Place',
    name: venue,
  };
  if (venueAddress || addressLocality || addressRegion || postalCode) {
    const address: Record<string, string> = {
      '@type': 'PostalAddress',
      addressCountry: 'AU',
    };
    if (venueAddress) address.streetAddress = venueAddress;
    if (addressLocality) address.addressLocality = addressLocality;
    if (addressRegion) address.addressRegion = addressRegion;
    if (postalCode) address.postalCode = postalCode;
    location.address = address;
  }

  const schema: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name,
    description,
    startDate,
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    inLanguage: 'en-AU',
    location,
    organizer: {
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: SITE_URL,
    },
    performer: presentingOrganization,
  };

  // An invalid same-day end time is worse than omitting this optional field.
  // Keep the source data visible on the event page, but do not publish a
  // chronologically impossible interval to search engines.
  if (endDate && endDate > startDate) schema.endDate = endDate;

  if (eventUrl) schema.url = eventUrl;
  if (eventStatusMap[status]) schema.eventStatus = eventStatusMap[status];

  if (imageUrl) {
    schema.image = imageUrl.startsWith('/') ? absoluteUrl(imageUrl) : imageUrl;
  }

  if (ticketPrice !== undefined && ticketUrl && status !== 'completed' && status !== 'cancelled') {
    const offer: Record<string, unknown> = {
      '@type': 'Offer',
      url: ticketUrl,
      price: ticketPrice,
      priceCurrency: 'AUD',
      availability: isSoldOut ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
    };

    if (offerValidFrom) {
      const timestamp = Date.parse(offerValidFrom);
      if (!Number.isNaN(timestamp)) offer.validFrom = new Date(timestamp).toISOString();
    }

    schema.offers = offer;
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(schema) }}
    />
  );
}

import React from 'react';

interface OrganizationSchemaProps {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
}

/**
 * Renders Organization + WebSite JSON-LD structured data.
 * Place in the root layout for site-wide presence.
 */
export function OrganizationSchema({
  name = "Collector's Paradise",
  url = 'https://collectorsparadise.com.au',
  logo = 'https://collectorsparadise.com.au/images/logo.png',
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
      email: 'hello@collectorsparadise.com.au',
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
  ticketUrl = 'https://collectorsparadise.com.au/events',
  imageUrl,
  status = 'upcoming',
}: EventSchemaProps) {
  const eventStatusMap: Record<string, string> = {
    upcoming: 'https://schema.org/EventScheduled',
    completed: 'https://schema.org/EventScheduled',
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
      url: 'https://collectorsparadise.com.au',
    },
  };

  if (imageUrl) {
    schema.image = imageUrl.startsWith('/')
      ? `https://collectorsparadise.com.au${imageUrl}`
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

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventCard from '@/components/events/EventCard';
import { EventSchema } from '@/components/StructuredData';

import { getEventById, getEvents } from '@/app/actions/events';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { OPEN_GRAPH_DEFAULTS } from '@/lib/seo/metadata';
import { getEventMarketDate } from '@/lib/event-date';
import { getEventSchemaDates, parseAustralianEventAddress } from '@/lib/event-location';
import { absoluteUrl } from '@/lib/site';
import { getEventCoverImage, type EventCoverInput } from '@/lib/events/cover';
import { buildDayTimeline, findClockMinutes, lowestTicketPrice, parseEventDescription, splitLead } from '@/lib/events/description';
import Breadcrumbs from '@/components/seo/Breadcrumbs';
export const revalidate = 3600;

function buildEventMetaDescription(
  event: Pick<EventCoverInput, 'title' | 'venue'> & { description?: string | null },
  dateStr: string,
  locationLabel: string,
) {
  const lead = `${event.title} is a trading card event in ${locationLabel}${event.venue ? ` at ${event.venue}` : ''} on ${dateStr}.`;
  const details = event.description?.trim();
  const action = 'Check event details for tickets, vendors, trading and visitor information.';
  const description = [lead, details, action].filter(Boolean).join(' ');

  // Keep snippets focused while preserving complete words for search previews.
  if (description.length <= 160) return description;
  const shortened = description.slice(0, 157).replace(/\s+\S*$/, '');
  return `${shortened}…`;
}

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await getEventById(id);

  if (!event) {
    return {
      title: "Event Not Found | Collector's Paradise",
      robots: { index: false, follow: true },
    };
  }

  const dateStr = new Date(event.event_date + 'T00:00:00').toLocaleDateString('en-AU', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const { locality, region } = parseAustralianEventAddress(event.venue_address);
  const locationLabel = locality || 'Australia';
  const eventDescription = buildEventMetaDescription(event, dateStr, locationLabel);
  const eventCoverImage = getEventCoverImage(event);
  const eventImage = eventCoverImage.startsWith('/')
    ? absoluteUrl(eventCoverImage)
    : eventCoverImage;
  const isLocationCover = eventCoverImage.startsWith('/images/event-covers/');

  return {
    title: `${event.title} — ${dateStr} | ${locationLabel} Trading Card Event`,
    description: eventDescription,
    keywords: [
      event.title,
      `${event.title} ${locality || 'Australia'}`,
      'Pokemon TCG event',
      'trading card event Australia',
      `${event.venue} event`,
    ],
    openGraph: {
      ...OPEN_GRAPH_DEFAULTS,
      title: `${event.title} | ${locationLabel} Trading Card Event`,
      description: eventDescription,
      url: absoluteUrl(`/events/${id}`),
      ...(eventImage ? {
        images: [{
          url: eventImage,
          width: isLocationCover ? 1600 : 1200,
          height: isLocationCover ? 1200 : 630,
          alt: event.title,
        }],
      } : {}),
    },
    twitter: {
      card: 'summary_large_image',
      title: `${event.title} — ${dateStr}`,
      description: eventDescription,
      ...(eventImage ? {
        images: [eventImage],
      } : {}),
    },
    alternates: {
      canonical: absoluteUrl(`/events/${id}`),
    },
    other: {
      ...(region ? { 'geo.region': `AU-${region}` } : {}),
      ...(locality ? { 'geo.placename': locality } : {}),
    },
  };
}

export default async function EventDetailPage({ params }: Props) {
  const { id } = await params;
  const event = await getEventById(id);
  const allEvents = await getEvents();
  const otherEvents = allEvents.filter((e) => e.id !== id).slice(0, 3);

  if (!event) {
    notFound();
  }

  const { streetAddress, locality, region, postcode } = parseAustralianEventAddress(event.venue_address);
  const locationLabel = locality || 'Australia';
  const eventCoverImage = getEventCoverImage(event);

  const formatTime = (time: string) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  const clockToMinutes = (time: string) => {
    const [h, m] = time.split(':');
    return parseInt(h) * 60 + parseInt(m || '0');
  };

  const dateObj = new Date(event.event_date + 'T00:00:00');
  const day = dateObj.getDate();
  const month = dateObj.toLocaleDateString('en-AU', { month: 'short' }).toUpperCase();
  const weekday = dateObj.toLocaleDateString('en-AU', { weekday: 'short' }).toUpperCase();

  const isSoldOut = (event.capacity - event.tickets_sold) <= 0;
  const ticketsRemaining = event.capacity - event.tickets_sold;
  const today = getEventMarketDate();
  const effectiveStatus = event.event_date < today && event.status !== 'cancelled' ? 'completed' : event.status;
  const schemaDates = getEventSchemaDates(event.event_date, event.start_time, event.end_time);
  const statusLabels = {
    upcoming: 'Upcoming event',
    active: 'Happening now',
    completed: 'Past event',
    cancelled: 'Cancelled',
  } as const;

  // Organisers write long free-text descriptions; show them as scannable parts.
  const details = parseEventDescription(event.description);
  const { lead: summary, rest: summaryRest } = splitLead(
    details.summary || `${event.title.trim()} — trading card event in ${locationLabel}.`,
  );
  const paidTiers = details.tickets.filter((tier) => tier.price !== null && tier.price > 0);
  const fromPrice = lowestTicketPrice(details.tickets) ?? (event.ticket_price > 0 ? event.ticket_price : null);
  const priceText = fromPrice === null ? null : `$${Number.isInteger(fromPrice) ? fromPrice : fromPrice.toFixed(2)}`;
  const pricePrefix = paidTiers.length > 1 ? 'From ' : '';
  const timeText = schemaDates.hasValidTimeRange ? `${formatTime(event.start_time)} – ${formatTime(event.end_time)}` : 'Timing to be confirmed';
  const shortDate = dateObj.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' });
  const directionsUrl = event.venue_address
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.venue_address)}`
    : null;
  const canBook = Boolean(event.booking_link) && effectiveStatus !== 'completed' && effectiveStatus !== 'cancelled';
  const isOver = effectiveStatus === 'completed' || effectiveStatus === 'cancelled';

  // A timed highlight ("Giveaway Buffet at 3:00 PM") is marked on the day timeline.
  const highlight = details.highlights[0] ?? null;
  const highlightMinutes = findClockMinutes(highlight?.title) ?? findClockMinutes(highlight?.detail);
  const highlightTime = highlightMinutes === null ? null : formatTime(`${Math.floor(highlightMinutes / 60)}:${String(highlightMinutes % 60).padStart(2, '0')}`);
  const highlightName = !highlight ? null
    : /giveaway buffet/i.test(highlight.title) ? 'Giveaway Buffet'
    : /giveaway/i.test(highlight.title) ? 'Giveaway'
    : /raffle/i.test(highlight.title) ? 'Raffle'
    : /prize/i.test(highlight.title) ? 'Prizes'
    : 'Highlight';
  const timeline = buildDayTimeline(details.tickets, {
    dayStart: schemaDates.hasValidTimeRange ? clockToMinutes(event.start_time) : null,
    dayEnd: schemaDates.hasValidTimeRange ? clockToMinutes(event.end_time) : null,
    marker: highlightName ? { label: `${highlightTime} · ${highlightName}`, minutes: highlightMinutes } : null,
  });
  const ticketNote = details.notes[0] ?? null;

  const aboutParagraphs = [summaryRest, ...details.about].filter((paragraph): paragraph is string => Boolean(paragraph));
  const [firstAbout, ...moreAbout] = aboutParagraphs;
  const hasAbout = Boolean(firstAbout) || details.interests.length > 0;

  const arrow = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
    </svg>
  );
  const externalIcon = (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
  const limitedTag = <span className="edp-limited">Limited</span>;

  return (
    <main>
      <Navbar />

      <EventSchema
        name={event.title}
        description={event.description?.trim() || `${event.title.trim()} — trading card event in ${locationLabel}.`}
        startDate={schemaDates.startDate}
        endDate={schemaDates.endDate}
        venue={event.venue || 'Event Venue'}
        venueAddress={streetAddress}
        addressLocality={locality}
        addressRegion={region}
        postalCode={postcode}
        ticketPrice={event.ticket_price ?? undefined}
        ticketUrl={event.booking_link || undefined}
        offerValidFrom={event.created_at}
        eventUrl={absoluteUrl(`/events/${event.id}`)}
        imageUrl={eventCoverImage}
        status={effectiveStatus}
        isSoldOut={isSoldOut}
      />

      <section className="edp-main">
        <div className="container">
          <Breadcrumbs
            className="edp-breadcrumbs"
            items={[{ label: 'Home', href: '/' }, { label: 'Events', href: '/events' }, { label: event.title }]}
          />
          <Link href="/events" className="edp-back-link-light" prefetch>
            <span aria-hidden="true">←</span>
            All events
          </Link>

          <div className="edp-hero-grid">
            <div className="edp-hero-copy">
              <div className="edp-hero-chips">
                <span className={`edp-status-pill edp-status-pill--${effectiveStatus}`}>
                  {statusLabels[effectiveStatus]}
                </span>
                {locality && <span className="edp-place-chip">{locality}</span>}
              </div>
              <h1 className="edp-title">{event.title}</h1>
              <p className="edp-summary">{summary}</p>
            </div>

            <div className="edp-cover">
                <Image
                  src={eventCoverImage}
                  alt={event.title}
                  width={1600}
                  height={1200}
                  priority
                  style={{ objectFit: 'cover' }}
                />
                <div className="edp-date-badge">
                  <span className="edp-date-month">{month}</span>
                  <span className="edp-date-day">{day}</span>
                  <span className="edp-date-weekday">{weekday}</span>
                </div>
            </div>
          </div>

          <section className={`edp-essentials ${isOver ? 'is-over' : ''}`} aria-label="Event essentials">
            <div className="edp-essential">
              <span className="edp-essential-label">When</span>
              <strong>{shortDate} · {timeText}</strong>
            </div>
            <div className="edp-essential">
              <span className="edp-essential-label">Where</span>
              <strong>
                {event.venue || 'Venue TBA'}
                {directionsUrl && (
                  <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="edp-essential-link">Directions</a>
                )}
              </strong>
            </div>
            <div className="edp-essential">
              <span className="edp-essential-label">Tickets</span>
              <strong>{priceText ? `${pricePrefix}${priceText}` : 'Pricing soon'}</strong>
              {!isOver && !isSoldOut && ticketsRemaining > 0 && ticketsRemaining <= 20 && (
                <small>Only {ticketsRemaining} left</small>
              )}
            </div>
            {canBook ? (
              <a href={event.booking_link!} target="_blank" rel="noopener noreferrer" className="edp-essentials-cta">
                Get tickets
                {arrow}
              </a>
            ) : isOver ? (
              <Link href="/events" className="edp-essentials-cta">
                {effectiveStatus === 'cancelled' ? 'Event cancelled · See events' : 'See upcoming events'}
                {arrow}
              </Link>
            ) : (
              <span className="edp-essentials-cta is-disabled">Tickets coming soon</span>
            )}
          </section>

          {details.tickets.length > 0 && (
            <section className="edp-day" id="tickets" aria-labelledby="edp-day-title">
              <div className="edp-day-head">
                <div>
                  <span className="edp-kicker">{timeline ? 'The day at a glance' : 'Pick your entry'}</span>
                  <h2 className="edp-day-title" id="edp-day-title">{timeline ? 'When do you want in?' : 'Tickets'}</h2>
                </div>
                {ticketNote && <p className="edp-day-note">{ticketNote}</p>}
              </div>

              {timeline ? (
                <>
                  <div className="edp-timeline">
                    <div className="edp-timeline-row edp-timeline-marker-row" aria-hidden="true">
                      <span />
                      <div className="edp-timeline-track">
                        {timeline.marker && (
                          <span
                            className={`edp-timeline-flag ${timeline.marker.offset > 65 ? 'is-end' : timeline.marker.offset < 35 ? 'is-start' : ''}`}
                            style={{ left: `${timeline.marker.offset}%` }}
                          >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 12 20 22 4 22 4 12" /><rect x="2" y="7" width="20" height="5" /><line x1="12" y1="22" x2="12" y2="7" /></svg>
                            {timeline.marker.label}
                          </span>
                        )}
                      </div>
                      <span />
                    </div>
                    <div className="edp-timeline-row edp-timeline-axis" aria-hidden="true">
                      <span />
                      <div className="edp-timeline-track">
                        {timeline.hours.map((hour, index) => (
                          <span
                            key={hour.offset}
                            className={index === 0 ? 'is-first' : index === timeline.hours.length - 1 ? 'is-last' : ''}
                            style={{ left: `${hour.offset}%` }}
                          >
                            {hour.label}
                          </span>
                        ))}
                      </div>
                      <span className="edp-timeline-price-head">Price</span>
                    </div>
                    <ul className="edp-timeline-lanes">
                      {timeline.lanes.map((lane, index) => (
                        <li key={lane.tier.name} className={`edp-timeline-row edp-timeline-lane is-tone-${index % 3}`}>
                          <div className="edp-lane-name">
                            <strong>{lane.tier.name}</strong>
                            {lane.tier.limited && limitedTag}
                            {lane.tier.note && <small title={lane.tier.note}>{lane.tier.note}</small>}
                          </div>
                          <div
                            className="edp-timeline-track edp-timeline-grid"
                            style={{ backgroundSize: `${100 / Math.max(1, timeline.hours.length - 1)}% 100%` }}
                          >
                            <span className="edp-lane-bar" style={{ left: `${lane.offset}%`, width: `${lane.width}%` }}>
                              {lane.tier.entry}
                            </span>
                            {timeline.marker && <span className="edp-lane-marker" aria-hidden="true" style={{ left: `${timeline.marker.offset}%` }} />}
                          </div>
                          <span className="edp-lane-price">{lane.tier.priceLabel}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {timeline.untimed.length > 0 && (
                    <ul className="edp-untimed">
                      {timeline.untimed.map((tier) => (
                        <li key={tier.name}>
                          <span>
                            {tier.name}
                            {tier.note && <small>{tier.note}</small>}
                          </span>
                          <strong>{tier.priceLabel}</strong>
                        </li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <ul className="edp-ticket-list">
                  {details.tickets.map((tier) => (
                    <li key={tier.name}>
                      <div className="edp-lane-name">
                        <strong>{tier.name}</strong>
                        {tier.limited && limitedTag}
                        {tier.note && <small title={tier.note}>{tier.note}</small>}
                      </div>
                      {tier.entry && <span className="edp-ticket-entry"><span>Entry</span>{tier.entry}</span>}
                      <span className="edp-lane-price">{tier.priceLabel}</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <div className="edp-cards">
            {highlight && (
              <section className="edp-card edp-card--highlight" aria-label="Event highlight">
                <span className="edp-kicker">{highlightTime ? `At ${highlightTime}` : "Don't miss"}</span>
                <p className="edp-card-title">{highlight.title}</p>
                {highlight.detail && <p>{highlight.detail}</p>}
              </section>
            )}

            <section className="edp-card" aria-labelledby="edp-venue-title">
              <span className="edp-kicker">Venue</span>
              <p className="edp-card-title" id="edp-venue-title">{event.venue || 'Venue TBA'}</p>
              <p>{event.venue_address || 'Address to be announced'}</p>
              {directionsUrl && (
                <a href={directionsUrl} target="_blank" rel="noopener noreferrer" className="edp-card-button">
                  Get directions
                  {externalIcon}
                </a>
              )}
            </section>

            {hasAbout && (
              <section className="edp-card" aria-labelledby="edp-about-title">
                <span className="edp-kicker" id="edp-about-title">About</span>
                {details.interests.length > 0 && (
                  <ul className="edp-interest-chips" aria-label="What's on">
                    {details.interests.map((interest) => <li key={interest}>{interest}</li>)}
                  </ul>
                )}
                {firstAbout && <p className="edp-about-lead">{firstAbout}</p>}
                {moreAbout.length > 0 && (
                  <details className="edp-read-more">
                    <summary>Read full description</summary>
                    {moreAbout.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
                  </details>
                )}
              </section>
            )}
          </div>
        </div>
      </section>

      {canBook && (
        <div className="edp-mobile-ticket-bar">
          <div>
            <span>{priceText ? `${pricePrefix}${priceText}` : 'Tickets'}</span>
            <small>{shortDate} · {event.venue || locationLabel}</small>
          </div>
          <a href={event.booking_link!} target="_blank" rel="noopener noreferrer">
            Get tickets
          </a>
        </div>
      )}

      {otherEvents.length > 0 && (
        <section className="browse-other-events">
          <div className="container">
            <div className="browse-other-events-header">
              <span className="eyebrow-badge">KEEP EXPLORING</span>
              <h2 className="browse-other-events-title">Browse Other Events</h2>
            </div>
            <div className="browse-other-events-grid">
              {otherEvents.map((otherEvent) => (
                <EventCard key={otherEvent.id} event={otherEvent} variant="upcoming" />
              ))}
            </div>
          </div>
        </section>
      )}

      <Footer />
    </main>
  );
}

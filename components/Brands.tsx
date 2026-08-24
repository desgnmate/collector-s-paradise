'use client';

import React from 'react';

const reviews = [
  {
    title: 'Packed Every Time',
    quote:
      'Collector\'s Paradise events always bring serious foot traffic. We sold out half our singles table by midday. It was the best Melbourne show we\'ve done this year.',
    author: 'Marcus T.',
    role: 'TCG Vendor, Melbourne',
    rating: 5,
  },
  {
    title: 'Seamless Event Day',
    quote:
      'From load-in to pack-down everything ran smoothly. Clear booth layout, helpful organisers, and collectors who actually know what they\'re looking for.',
    author: 'Priya S.',
    role: 'Sports Cards Vendor',
    rating: 5,
  },
  {
    title: 'Trade Floor Energy',
    quote:
      'The vibe at these events is unreal. Kids, veterans, and traders all in one room. We came for the sales and stayed for the community. We have already booked our next booth.',
    author: 'Liam C.',
    role: 'Pokémon & One Piece Vendor',
    rating: 5,
  },
];

const marqueeGroups = 5;

type Review = (typeof reviews)[number];

function Stars({ count }: { count: number }) {
  return (
    <div className="review-stars" aria-label={`${count} out of 5 stars`}>
      {Array.from({ length: count }).map((_, i) => (
        <svg
          key={i}
          className="review-star"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden="true"
        >
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </div>
  );
}

function ReviewCard({ review, duplicate = false }: { review: Review; duplicate?: boolean }) {
  return (
    <article className="review-card" tabIndex={duplicate ? -1 : 0}>
      <Stars count={review.rating} />
      <h3 className="review-card-title">{review.title}</h3>
      <p className="review-card-quote">&ldquo;{review.quote}&rdquo;</p>
      <div className="review-card-author">
        <span className="review-card-name">{review.author}</span>
        <span className="review-card-role">{review.role}</span>
      </div>
    </article>
  );
}

const Brands = () => {
  return (
    <section id="brands" className="brands-section">
      <div className="brands-header" data-aos="fade-up">
        <h2 id="vendor-reviews-title" className="section-title">
          WHAT VENDORS <br className="brands-mobile-break" /> ARE SAYING
        </h2>
        <p className="section-subtitle">
          Hear from the vendors who make every event unforgettable.
        </p>
      </div>

      <div
        className="reviews-marquee"
        role="region"
        aria-labelledby="vendor-reviews-title"
        aria-live="off"
      >
        <div className="reviews-track">
          {Array.from({ length: marqueeGroups }, (_, groupIndex) => {
            const duplicate = groupIndex > 0;

            return (
              <div
                key={`review-group-${groupIndex}`}
                className="reviews-group"
                aria-hidden={duplicate || undefined}
              >
                {reviews.map((review) => (
                  <ReviewCard
                    key={`${groupIndex}-${review.title}`}
                    review={review}
                    duplicate={duplicate}
                  />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Brands;

import React from 'react';
import Link from 'next/link';

const reviews = [
  {
    title: 'Packed every time',
    quote: 'Collector’s Paradise events always bring serious foot traffic. We sold out half our singles table by midday. It was the best Melbourne show we’ve done this year.',
    author: 'Marcus T.',
    initials: 'MT',
    role: 'TCG vendor · Melbourne',
  },
  {
    title: 'Seamless event day',
    quote: 'From load-in to pack-down everything ran smoothly. Clear booth layout, helpful organisers, and collectors who actually know what they’re looking for.',
    author: 'Priya S.',
    initials: 'PS',
    role: 'Sports cards vendor',
  },
  {
    title: 'Trade floor energy',
    quote: 'The vibe at these events is unreal. Kids, veterans, and traders all in one room. We came for the sales and stayed for the community. We have already booked our next booth.',
    author: 'Liam C.',
    initials: 'LC',
    role: 'Pokémon & One Piece vendor',
  },
];

function Stars() {
  return (
    <span className="vendor-review-stars" role="img" aria-label="5 out of 5 stars">
      {Array.from({ length: 5 }, (_, index) => (
        <svg key={index} width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
        </svg>
      ))}
    </span>
  );
}

const Brands = () => {
  return (
    <section id="brands" className="vendor-reviews" aria-labelledby="vendor-reviews-title">
      <div className="vendor-reviews-inner">
        <div className="vendor-reviews-head" data-aos="fade-up">
          <div>
            <span className="vendor-reviews-kicker">From behind the table</span>
            <h2 id="vendor-reviews-title" className="vendor-reviews-title">What vendors<br />are saying</h2>
          </div>
          <div className="vendor-reviews-aside">
            <p className="vendor-reviews-subtitle">Hear from the vendors who make every event unforgettable.</p>
            <div className="vendor-reviews-actions">
              <Link href="/vendors/apply" className="vendor-reviews-cta" prefetch>
                Get a table
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
                </svg>
              </Link>
              <Link href="/vendors/booth-information" className="vendor-reviews-link">Booth information</Link>
            </div>
          </div>
        </div>

        <div className="vendor-reviews-grid">
          {reviews.map((review, index) => (
            <figure key={review.author} className="vendor-review" data-aos="fade-up" data-aos-delay={index * 100}>
              <div className="vendor-review-top">
                <Stars />
                <svg className="vendor-review-mark" width="30" height="24" viewBox="0 0 56 44" aria-hidden="true">
                  <path d="M0 44V25C0 10 8 2 22 0l3 6c-8 3-12 8-12 15h10v23zm31 0V25C31 10 39 2 53 0l3 6c-8 3-12 8-12 15h10v23z" />
                </svg>
              </div>
              <h3 className="vendor-review-title">{review.title}</h3>
              <blockquote>&ldquo;{review.quote}&rdquo;</blockquote>
              <figcaption>
                <span className="vendor-review-avatar" aria-hidden="true">{review.initials}</span>
                <span>
                  <span className="vendor-review-name">{review.author}</span>
                  <span className="vendor-review-role">{review.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Brands;

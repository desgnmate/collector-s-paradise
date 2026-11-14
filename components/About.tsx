import React from 'react';
import Link from 'next/link';

const aboutFeatures = [
  {
    number: '01',
    title: 'Buy, sell & trade',
    description: 'Discover grails, complete your sets and make fair deals face-to-face with collectors and trusted vendors.',
    accent: 'yellow',
    href: '/guides/first-trading-card-show',
    cta: 'Read the first-show guide',
  },
  {
    number: '02',
    title: 'Win collector prizes',
    description: 'Join live giveaways and walk away with sealed products, special releases and surprise collector rewards.',
    accent: 'blue',
    href: '/events',
    cta: 'Explore live events',
  },
  {
    number: '03',
    title: 'Connect & collaborate',
    description: 'Meet the people behind your local collecting community and turn shared interests into lasting connections.',
    accent: 'red',
    href: '/about',
    cta: 'Meet the community',
  },
];

const About = () => {
  return (
    <section id="about" className="about">
      <div className="container">
        
        <div className="about-header" data-aos="fade-up">
          <span className="eyebrow-badge">ABOUT THE EVENT</span>
          <h2 className="section-title">WHAT IS COLLECTOR&apos;S<br/>PARADISE?</h2>
          <p className="section-subtitle">
            Australia&apos;s live trading card experience — built for the thrill of the find and the people you meet along the way.
          </p>
        </div>

        <div className="about-feature-grid">
          {aboutFeatures.map((feature, index) => (
            <Link
              href={feature.href}
              className={`about-feature-card about-feature-card--${feature.accent}`}
              data-aos="fade-up"
              data-aos-delay={(index + 1) * 100}
              key={feature.title}
            >
              <div className="about-feature-topline">
                <span className="about-feature-number">{feature.number}</span>
                <svg className="about-feature-spark" width="20" height="20" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M12 2l2.4 7.6L22 12l-7.6 2.4L12 22l-2.4-7.6L2 12l7.6-2.4z" />
                </svg>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <span className="about-feature-link">
                {feature.cta}
                <svg className="about-feature-arrow" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="4" y1="12" x2="20" y2="12" /><polyline points="14 6 20 12 14 18" />
                </svg>
              </span>
            </Link>
          ))}
        </div>

      </div>
    </section>
  );
};

export default About;

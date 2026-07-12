import React from 'react';

const aboutFeatures = [
  {
    number: '01',
    title: 'Buy, sell & trade',
    description: 'Discover grails, complete your sets and make fair deals face-to-face with collectors and trusted vendors.',
    accent: 'yellow',
  },
  {
    number: '02',
    title: 'Win collector prizes',
    description: 'Join live giveaways and walk away with sealed products, special releases and surprise collector rewards.',
    accent: 'blue',
  },
  {
    number: '03',
    title: 'Connect & collaborate',
    description: 'Meet the people behind Melbourne’s collecting community and turn shared interests into lasting connections.',
    accent: 'red',
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
            Melbourne&apos;s live trading card experience — built for the thrill of the find and the people you meet along the way.
          </p>
        </div>

        <div className="about-feature-grid">
          {aboutFeatures.map((feature, index) => (
            <article
              className={`about-feature-card about-feature-card--${feature.accent}`}
              data-aos="fade-up"
              data-aos-delay={(index + 1) * 100}
              key={feature.title}
            >
              <div className="about-feature-topline">
                <span className="about-feature-number">{feature.number}</span>
                <span className="about-feature-mark" aria-hidden="true">✦</span>
              </div>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </article>
          ))}
        </div>

      </div>
    </section>
  );
};

export default About;

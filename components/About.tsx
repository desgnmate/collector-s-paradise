import React from 'react';

const About = () => {
  return (
    <section id="about" className="about">
      <div className="container">
        
        <div className="about-header" data-aos="fade-up">
          <span className="eyebrow-badge">ABOUT THE EVENT</span>
          <h2 className="section-title">WHAT IS COLLECTOR&apos;S<br/>PARADISE?</h2>
          <p className="section-subtitle">
            A live trading card event bringing collectors together…
          </p>
        </div>

        <div className="about-pills-container">
          <button className="about-pill" data-aos="fade-up" data-aos-delay="100">
            <span className="about-pill-text">BUY / SELL / TRADE</span>
            <div className="about-pill-icon">
              <svg viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </button>
          
          <button className="about-pill" data-aos="fade-up" data-aos-delay="200">
            <span className="about-pill-text">GUEST SIGNINGS</span>
            <div className="about-pill-icon">
              <svg viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </button>
          
          <button className="about-pill" data-aos="fade-up" data-aos-delay="300">
            <span className="about-pill-text">PSA CARD EVALUATIONS</span>
            <div className="about-pill-icon">
              <svg viewBox="0 0 24 24">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </div>
          </button>
        </div>

      </div>
    </section>
  );
};

export default About;

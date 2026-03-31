'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => setMenuOpen(!menuOpen);

  const scrollTo = (id: string) => {
    setMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-inner">
        {/* Left: MENU pill button */}
        <button
          className={`navbar-menu-pill ${menuOpen ? 'active' : ''}`}
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
          <span>MENU</span>
        </button>

        {/* Center: Logo */}
        <a href="#" className="navbar-logo-link" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <Image
            src="/images/logo.png"
            alt="Collector's Paradise"
            width={180}
            height={55}
            className="navbar-logo"
            priority
          />
        </a>

        {/* Right: JOIN US pill button */}
        <a
          href="#join"
          className="navbar-join-pill"
          onClick={(e) => { e.preventDefault(); scrollTo('join'); }}
        >
          JOIN US
        </a>

        {/* Mobile dropdown menu */}
        <div className={`navbar-dropdown ${menuOpen ? 'open' : ''}`}>
          <div className="navbar-dropdown-inner">
            <a href="#about" onClick={(e) => { e.preventDefault(); scrollTo('about'); }}>
              <span className="menu-item-text">About</span>
            </a>
            <a href="#experience" onClick={(e) => { e.preventDefault(); scrollTo('experience'); }}>
              <span className="menu-item-text">Experience</span>
            </a>
            <a href="#vendors" onClick={(e) => { e.preventDefault(); scrollTo('vendors'); }}>
              <span className="menu-item-text">Vendors</span>
            </a>
            <a href="#join" onClick={(e) => { e.preventDefault(); scrollTo('join'); }}>
              <span className="menu-item-text">Tickets</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}

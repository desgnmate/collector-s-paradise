'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHomePage = pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      setLoginDropdownOpen(false);
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (!target.closest('.navbar-login-wrapper') && !target.closest('.navbar-menu-icon') && !target.closest('.navbar-dropdown')) {
        setLoginDropdownOpen(false);
        setMenuOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    if (!menuOpen) setLoginDropdownOpen(false);
  };

  /**
   * Handles navigation to homepage sections.
   * If already on homepage, scrolls smoothly to the section.
   * If on another page, navigates to /#section (browser handles the hash scroll).
   */
  const handleSectionLink = (e: React.MouseEvent, sectionId: string) => {
    setMenuOpen(false);

    if (isHomePage) {
      e.preventDefault();
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
    // If NOT on homepage, let the default <a href="/#section"> behavior navigate there
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
      <div className="navbar-inner">
        {/* Left: Logo */}
        <Link href="/" className="navbar-logo-link">
          <Image
            src="/images/logo.png"
            alt="Collector's Paradise"
            width={180}
            height={55}
            className="navbar-logo"
            priority
          />
        </Link>

        {/* Right: Actions Group */}
        <div className="navbar-actions">
          {/* LOGIN / SIGN-UP Dropdown */}
          <div className="navbar-login-wrapper">
            <button 
              className="navbar-join-pill"
              onClick={() => {
                setLoginDropdownOpen(!loginDropdownOpen);
                if (!loginDropdownOpen) setMenuOpen(false);
              }}
            >
              LOGIN / SIGN-UP
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: '6px', transition: 'transform 0.2s', transform: loginDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </button>
            <div className={`navbar-login-dropdown ${loginDropdownOpen ? 'open' : ''}`}>
              <div className="navbar-login-dropdown-inner">
                <Link href="/vendors/apply" className="login-dropdown-item" onClick={() => setLoginDropdownOpen(false)}>
                  <span className="login-item-title">Login/Signup as Vendor</span>
                  <span className="login-item-desc">Secure a booth & sell your collection</span>
                </Link>
                <Link href="/events" className="login-dropdown-item" onClick={() => setLoginDropdownOpen(false)}>
                  <span className="login-item-title">Login/Signup as Buyer</span>
                  <span className="login-item-desc">Get tickets & track your orders</span>
                </Link>
              </div>
            </div>
          </div>

          {/* Hamburger Menu (Icon only) */}
          <button
            className={`navbar-menu-icon ${menuOpen ? 'active' : ''}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="6" x2="21" y2="6" />
              <line x1="3" y1="12" x2="21" y2="12" />
              <line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>
        </div>

        {/* Mobile dropdown menu */}
        <div className={`navbar-dropdown ${menuOpen ? 'open' : ''}`}>
          <div className="navbar-dropdown-inner">
            <a href="/#about" onClick={(e) => handleSectionLink(e, 'about')}>
              <span className="menu-item-text">About</span>
            </a>
            <a href="/#experience" onClick={(e) => handleSectionLink(e, 'experience')}>
              <span className="menu-item-text">Experience</span>
            </a>
            <Link href="/events" onClick={() => setMenuOpen(false)}>
              <span className="menu-item-text">Events</span>
            </Link>
            <Link href="/vendors" onClick={() => setMenuOpen(false)}>
              <span className="menu-item-text">Vendors</span>
            </Link>
            <Link href="/events" onClick={() => setMenuOpen(false)}>
              <span className="menu-item-text">Tickets</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

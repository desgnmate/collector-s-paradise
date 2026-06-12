'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { signOut } from '@/app/actions/auth';
import logo from '@/public/images/logo.png';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSolid, setIsSolid] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [initials, setInitials] = useState('');
  
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    // Use onAuthStateChange exclusively — avoids racing getUser() against
    // the auth state listener which both try to acquire the navigator lock.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u?.user_metadata?.full_name) {
        setInitials(getInitials(u.user_metadata.full_name));
      } else if (u?.email) {
        setInitials(u.email.charAt(0).toUpperCase());
      } else {
        setInitials('');
      }
    });

    const handleScroll = () => {
      const scrollPos = window.scrollY;
      
      const isTop = scrollPos <= 80;
      
      setScrolled(scrollPos > 50);
      setIsSolid(!isTop);
      
      
      setProfileDropdownOpen(false);
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (
        !target.closest('.navbar-menu-icon') && 
        !target.closest('.navbar-dropdown') &&
        !target.closest('.navbar-profile-wrapper')
      ) {
        
        setMenuOpen(false);
        setProfileDropdownOpen(false);
      }
    };

    let rafId: number | null = null;
    const throttledScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        handleScroll();
        rafId = null;
      });
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    document.addEventListener('click', handleClickOutside);
    handleScroll(); // Initialize on mount

    // Close the fullscreen mobile menu on ESC and lock body scroll
    // while it's open so the page underneath doesn't scroll.
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', handleKey);

    return () => {
      window.removeEventListener('scroll', throttledScroll);
      document.removeEventListener('click', handleClickOutside);
      window.removeEventListener('keydown', handleKey);
      if (rafId !== null) cancelAnimationFrame(rafId);
      subscription.unsubscribe();
    };
  }, [supabase, pathname]);

  // Lock body scroll while the fullscreen mobile menu is open.
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (menuOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [menuOpen]);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
    if (!menuOpen) {
      
      setProfileDropdownOpen(false);
    }
  };

  /**
   * Handles navigation to homepage sections.
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
  };

  /**
   * Logo = Home button. When already on the homepage, scroll to the top
   * instead of relying on Next.js to re-render the route (which is a no-op
   * and the user perceives the click as "broken" or "delayed").
   */
  const handleLogoClick = (e: React.MouseEvent) => {
    setMenuOpen(false);
    setProfileDropdownOpen(false);

    if (isHomePage) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''} ${isSolid ? 'navbar-solid' : ''}`}>
      <div className="navbar-inner">
        {/* Left: Logo (acts as Home button — scrolls to top when on home) */}
        <Link href="/" className="navbar-logo-link" onClick={handleLogoClick} prefetch>
          <Image src={logo} alt="Collector's Paradise — Melbourne Pokémon TCG & Trading Card Events" height={55} priority className="navbar-logo" style={{ width: 'auto' }} />
        </Link>

        {/* Right: Actions Group */}
        <div className="navbar-actions">
          {user ? (
            /* AUTHENTICATED: Profile Icon Dropdown */
            <div className="navbar-profile-wrapper" style={{ position: 'relative' }}>
              <button 
                className="navbar-profile-btn"
                onClick={() => {
                  setProfileDropdownOpen(!profileDropdownOpen);
                  if (!profileDropdownOpen) setMenuOpen(false);
                }}
              >
                {initials}
              </button>
              
              <div className={`navbar-login-dropdown ${profileDropdownOpen ? 'open' : ''}`}>
                <div className="navbar-login-dropdown-inner">
                  <div className="login-dropdown-header" style={{ borderBottom: '2px solid var(--color-dark)', padding: '1.25rem 2rem', background: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <span className="login-item-title" style={{ fontSize: '0.8rem', color: '#666', marginBottom: '0' }}>Logged in as</span>
                    <span className="login-item-desc" style={{ fontWeight: 700, color: 'var(--color-dark)', fontSize: '0.9rem' }}>{user.email}</span>
                  </div>
                  <Link href="/events" className="login-dropdown-item" onClick={() => setProfileDropdownOpen(false)} prefetch>
                    <span className="login-item-title">My Tickets</span>
                    <span className="login-item-desc">Track orders & passes</span>
                  </Link>
                  <form action={signOut} className="login-dropdown-item" style={{ padding: 0 }}>
                    <button 
                      type="submit" 
                      className="login-dropdown-item" 
                      style={{ 
                        width: '100%', 
                        textAlign: 'left', 
                        border: 'none', 
                        background: 'none', 
                        cursor: 'pointer',
                        color: 'var(--color-red)'
                      }}
                    >
                      <span className="login-item-title" style={{ color: 'inherit' }}>Logout</span>
                    </button>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            /* GUEST: APPLY AS VENDOR — hidden on mobile (≤900px) because
               the fullscreen menu has its own CTA inside the overlay. */
            <Link href="/vendors/apply" className="navbar-join-pill navbar-join-pill-desktop" prefetch>
              APPLY AS VENDOR
            </Link>
          )}

          {/* Hamburger Menu (Icon only) */}
          <div className="navbar-menu-wrapper" style={{ position: 'relative' }}>
            <button
              className={`navbar-menu-icon ${menuOpen ? 'active' : ''}`}
              onClick={toggleMenu}
              aria-label="Toggle menu"
              aria-expanded={menuOpen}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Fullscreen mobile menu — large stacked links, easy to tap.
          On desktop this is hidden and the small dropdown above is used. */}
      <div
        className={`mobile-menu-overlay ${menuOpen ? 'open' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label="Site navigation"
      >
        <button
          className="mobile-menu-close"
          onClick={() => setMenuOpen(false)}
          aria-label="Close menu"
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <nav className="mobile-menu-nav">
          <Link href="/" className="mobile-menu-link" onClick={handleLogoClick} prefetch>
            <span className="mobile-menu-link-text">Home</span>
          </Link>
          <Link href="/about" className="mobile-menu-link" onClick={() => setMenuOpen(false)} prefetch>
            <span className="mobile-menu-link-text">About</span>
          </Link>
          <Link href="/events" className="mobile-menu-link" onClick={() => setMenuOpen(false)} prefetch>
            <span className="mobile-menu-link-text">Events</span>
          </Link>
          <Link href="/vendors" className="mobile-menu-link" onClick={() => setMenuOpen(false)} prefetch>
            <span className="mobile-menu-link-text">Vendors</span>
          </Link>
          <Link href="/sponsorship" className="mobile-menu-link" onClick={() => setMenuOpen(false)} prefetch>
            <span className="mobile-menu-link-text">Sponsorship</span>
          </Link>
          <Link href="/volunteers" className="mobile-menu-link" onClick={() => setMenuOpen(false)} prefetch>
            <span className="mobile-menu-link-text">Volunteers</span>
          </Link>
        </nav>

        {/* Apply as vendor CTA — mirrors the desktop navbar pill */}
        <Link
          href="/vendors/apply"
          className="mobile-menu-cta"
          onClick={() => setMenuOpen(false)}
          prefetch
        >
          APPLY AS VENDOR
        </Link>

        {/* Contact / address block — supports local SEO NAP */}
        <div className="mobile-menu-footer">
          <a href="mailto:hello@collectorsparadise.com.au" className="mobile-menu-email">
            hello@collectorsparadise.com.au
          </a>
          <p className="mobile-menu-address">
            Melbourne, Victoria, Australia
          </p>
        </div>
      </div>
    </nav>
  );
}

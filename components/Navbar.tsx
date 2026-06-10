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
    
    return () => {
      window.removeEventListener('scroll', throttledScroll);
      document.removeEventListener('click', handleClickOutside);
      if (rafId !== null) cancelAnimationFrame(rafId);
      subscription.unsubscribe();
    };
  }, [supabase, pathname]);

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

  return (
    <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''} ${isSolid ? 'navbar-solid' : ''}`}>
      <div className="navbar-inner">
        {/* Left: Logo */}
        <Link href="/" className="navbar-logo-link">
          <Image src={logo} alt="Collector's Paradise" height={55} priority className="navbar-logo" style={{ width: 'auto' }} />
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
                  <Link href="/events" className="login-dropdown-item" onClick={() => setProfileDropdownOpen(false)}>
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
            /* GUEST: APPLY AS VENDOR (direct link, no dropdown) */
            <Link href="/vendors/apply" className="navbar-join-pill">
              APPLY AS VENDOR
            </Link>
          )}

          {/* Hamburger Menu (Icon only) */}
          <div className="navbar-menu-wrapper" style={{ position: 'relative' }}>
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

            {/* Dropdown menu (Positioned below MENU button) */}
            <div className={`navbar-dropdown ${menuOpen ? 'open' : ''}`}>
              <div className="navbar-dropdown-inner">
                <Link href="/about" onClick={() => setMenuOpen(false)}>
                  <span className="menu-item-text">About</span>
                </Link>
                <Link href="/events" onClick={() => setMenuOpen(false)}>
                  <span className="menu-item-text">Events</span>
                </Link>
                <Link href="/vendors" onClick={() => setMenuOpen(false)}>
                  <span className="menu-item-text">Vendors</span>
                </Link>
                <Link href="/sponsorship" onClick={() => setMenuOpen(false)}>
                  <span className="menu-item-text">Sponsorship</span>
                </Link>
                <Link href="/volunteers" onClick={() => setMenuOpen(false)}>
                  <span className="menu-item-text">Volunteers</span>
                </Link>
            </div>
        </div>
      </div>
      </div>
    </div>
  </nav>
  );
}

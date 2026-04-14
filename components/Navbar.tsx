'use client';

import { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import type { User } from '@supabase/supabase-js';
import { signOut } from '@/app/actions/auth';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [loginDropdownOpen, setLoginDropdownOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSolid, setIsSolid] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [initials, setInitials] = useState('');
  
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      if (user?.user_metadata?.full_name) {
        setInitials(getInitials(user.user_metadata.full_name));
      } else if (user?.email) {
        setInitials(user.email.charAt(0).toUpperCase());
      }
    };

    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user?.user_metadata?.full_name) {
        setInitials(getInitials(session.user.user_metadata.full_name));
      } else if (session?.user?.email) {
        setInitials(session.user.email.charAt(0).toUpperCase());
      }
    });

    const handleScroll = () => {
      const scrollPos = window.scrollY;
      const windowHeight = window.innerHeight;
      const totalHeight = document.documentElement.scrollHeight;
      
      // Transparent in the first 100px (Hero) or last 500px (Footer)
      const isTop = scrollPos <= 80;
      const isBottom = scrollPos + windowHeight >= totalHeight - 500;
      
      setScrolled(scrollPos > 50);
      setIsSolid(!isTop && !isBottom);
      
      setLoginDropdownOpen(false);
      setProfileDropdownOpen(false);
    };
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Element;
      if (
        !target.closest('.navbar-login-wrapper') && 
        !target.closest('.navbar-menu-icon') && 
        !target.closest('.navbar-dropdown') &&
        !target.closest('.navbar-profile-wrapper')
      ) {
        setLoginDropdownOpen(false);
        setMenuOpen(false);
        setProfileDropdownOpen(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    document.addEventListener('click', handleClickOutside);
    handleScroll(); // Initialize on mount
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('click', handleClickOutside);
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
      setLoginDropdownOpen(false);
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
                  <Link href="/profile" className="login-dropdown-item" onClick={() => setProfileDropdownOpen(false)}>
                    <span className="login-item-title">My Profile</span>
                    <span className="login-item-desc">Personal info & security</span>
                  </Link>
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
            /* GUEST: LOGIN / SIGN-UP Dropdown */
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
                  <Link href="/login" className="login-dropdown-item" onClick={() => setLoginDropdownOpen(false)}>
                    <span className="login-item-title">Login to Account</span>
                    <span className="login-item-desc">Access your collector portal</span>
                  </Link>
                  <Link href="/signup" className="login-dropdown-item" onClick={() => setLoginDropdownOpen(false)}>
                    <span className="login-item-title">Sign Up as Buyer</span>
                    <span className="login-item-desc">Get tickets & track your orders</span>
                  </Link>
                  <Link href="/vendors/apply" className="login-dropdown-item" onClick={() => setLoginDropdownOpen(false)}>
                    <span className="login-item-title">Apply as Vendor</span>
                    <span className="login-item-desc">Secure a booth & sell your collection</span>
                  </Link>
                </div>
              </div>
            </div>
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
      </div>
    </div>
  </nav>
  );
}

'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { signOut } from '@/app/actions/auth';
import logo from '@/public/images/logo.png';
import overlayStyles from './NavbarOverlay.module.css';

const NAVIGATION_EMAIL = 'collectorsinparadise@gmail.com';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isSolid, setIsSolid] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [initials, setInitials] = useState('');
  
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const navGroups = [
    {
      label: 'Explore',
      items: [
        { href: '/', label: 'Home' },
        { href: '/events', label: 'Events' },
        { href: '/guides/first-trading-card-show', label: 'Visit Guide' },
        { href: '/faq', label: 'FAQ' },
      ],
    },
    {
      label: 'Community',
      items: [
        { href: '/about', label: 'About' },
        { href: '/vendors', label: 'Vendors' },
        { href: '/sponsorship', label: 'Sponsorship' },
        { href: '/volunteers', label: 'Volunteers' },
      ],
    },
  ];

  const isActiveRoute = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  useEffect(() => {
    let cancelled = false;
    let authSubscription: { unsubscribe: () => void } | null = null;
    let authIdleHandle: number | null = null;

    const startAuthListener = async () => {
      const { createSupabaseBrowserClient } = await import('@/lib/supabase/client');
      if (cancelled) return;

      const supabase = createSupabaseBrowserClient();
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
      authSubscription = subscription;
    };

    // Authentication controls are preserved, but Supabase is no longer part
    // of the navigation-critical bundle and hydration task.
    if (typeof window.requestIdleCallback === 'function') {
      authIdleHandle = window.requestIdleCallback(() => void startAuthListener(), { timeout: 1000 });
    } else {
      authIdleHandle = window.setTimeout(() => void startAuthListener(), 300);
    }

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
        !target.closest('[data-nav-overlay]') &&
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
      cancelled = true;
      if (authIdleHandle !== null) {
        if (typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(authIdleHandle);
        } else {
          window.clearTimeout(authIdleHandle);
        }
      }
      window.removeEventListener('scroll', throttledScroll);
      document.removeEventListener('click', handleClickOutside);
      if (rafId !== null) cancelAnimationFrame(rafId);
      authSubscription?.unsubscribe();
    };
  }, [pathname]);

  // Lock the page, move focus into the overlay, and keep keyboard focus
  // inside it until the navigation is closed.
  useEffect(() => {
    if (!menuOpen || typeof document === 'undefined') return;

    const previousOverflow = document.body.style.overflow;
    const previouslyFocused = document.activeElement as HTMLElement | null;
    const menuButton = menuButtonRef.current;
    const focusFrame = window.requestAnimationFrame(() => closeButtonRef.current?.focus());
    document.body.style.overflow = 'hidden';

    const handleOverlayKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false);
        return;
      }

      if (event.key !== 'Tab' || !overlayRef.current) return;

      const focusable = Array.from(
        overlayRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )
      );
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleOverlayKey);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.removeEventListener('keydown', handleOverlayKey);
      document.body.style.overflow = previousOverflow;
      if (menuButton?.isConnected) {
        menuButton.focus();
      } else if (previouslyFocused?.isConnected) {
        previouslyFocused.focus();
      }
    };
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
    setMenuOpen(current => !current);
    if (!menuOpen) {
      
      setProfileDropdownOpen(false);
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
    <nav
      className={`navbar ${scrolled ? 'navbar-scrolled' : ''} ${isSolid ? 'navbar-solid' : ''}`}
      data-menu-open={menuOpen ? 'true' : undefined}
    >
      <div className="navbar-inner">
        {/* Left: Logo (acts as Home button — scrolls to top when on home) */}
        <Link href="/" className="navbar-logo-link" onClick={handleLogoClick} prefetch>
          <Image src={logo} alt="Collector's Paradise - Australian trading card and collectibles events" height={55} priority className="navbar-logo" style={{ width: 'auto' }} />
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

          {/* The menu icon opens the same navigation overlay at every breakpoint. */}
          <div className="navbar-menu-wrapper">
            <button
              ref={menuButtonRef}
              className={`navbar-menu-icon ${menuOpen ? 'active' : ''}`}
              onClick={toggleMenu}
              aria-label="Open navigation menu"
              aria-expanded={menuOpen}
              aria-controls="site-navigation-overlay"
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

      {menuOpen && (
        <div
          ref={overlayRef}
          id="site-navigation-overlay"
          className={overlayStyles.overlay}
          data-nav-overlay
          role="dialog"
          aria-modal="true"
          aria-label="Site navigation"
        >
          <div className={overlayStyles.shell}>
            <div className={overlayStyles.header}>
              <Link href="/" className={overlayStyles.logoLink} onClick={handleLogoClick} prefetch>
                <Image
                  src={logo}
                  alt="Collector's Paradise"
                  height={55}
                  className={overlayStyles.logo}
                  style={{ width: 'auto' }}
                />
              </Link>

              <button
                ref={closeButtonRef}
                className={overlayStyles.close}
                onClick={() => setMenuOpen(false)}
                aria-label="Close navigation menu"
              >
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.25" strokeLinecap="round">
                  <line x1="5" y1="5" x2="19" y2="19" />
                  <line x1="19" y1="5" x2="5" y2="19" />
                </svg>
              </button>
            </div>

            <div className={overlayStyles.content}>
              <div className={overlayStyles.links} aria-label="Primary navigation">
                {navGroups.map((group) => (
                  <div className={overlayStyles.linkGroup} key={group.label}>
                    <p className={overlayStyles.groupLabel}>{group.label}</p>
                    <div className={overlayStyles.groupLinks}>
                      {group.items.map((item) => {
                        const active = isActiveRoute(item.href);
                        return (
                          <Link
                            href={item.href}
                            className={`${overlayStyles.link} ${active ? overlayStyles.active : ''}`}
                            aria-current={active ? 'page' : undefined}
                            onClick={item.href === '/' ? handleLogoClick : () => setMenuOpen(false)}
                            prefetch
                            key={item.href}
                          >
                            <span>{item.label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className={overlayStyles.footer}>
                <Link
                  href="/vendors/apply"
                  className={overlayStyles.cta}
                  onClick={() => setMenuOpen(false)}
                  prefetch
                >
                  Apply as vendor
                </Link>

                <div className={overlayStyles.contact}>
                  <a href={`mailto:${NAVIGATION_EMAIL}`}>{NAVIGATION_EMAIL}</a>
                  <p>Based in Melbourne, serving event communities across Australia</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

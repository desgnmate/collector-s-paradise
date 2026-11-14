'use client';

import { useEffect, useSyncExternalStore } from 'react';

const THEME_ATTRIBUTE = 'data-admin-theme';

function subscribeToTheme(onChange: () => void) {
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: [THEME_ATTRIBUTE] });
  return () => observer.disconnect();
}

function setTheme(dark: boolean) {
  if (dark) document.documentElement.setAttribute(THEME_ATTRIBUTE, 'dark');
  else document.documentElement.removeAttribute(THEME_ATTRIBUTE);
}

/** Admin light/dark theme, stored per browser. The <html> attribute is the source of truth. */
export function useAdminTheme() {
  const isDark = useSyncExternalStore(
    subscribeToTheme,
    () => document.documentElement.getAttribute(THEME_ATTRIBUTE) === 'dark',
    () => false,
  );

  useEffect(() => {
    try { setTheme(localStorage.getItem('admin-theme') === 'dark'); } catch { /* storage unavailable */ }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setTheme(next);
    try { localStorage.setItem('admin-theme', next ? 'dark' : 'light'); } catch { /* storage unavailable */ }
  };

  return { isDark, toggle };
}

export default function AdminThemeToggle() {
  const { isDark, toggle } = useAdminTheme();

  return (
    <button
      type="button"
      className="admin-theme-toggle"
      onClick={toggle}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      {isDark ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
      )}
      {isDark ? 'Light Mode' : 'Dark Mode'}
    </button>
  );
}

'use client';

import Link from 'next/link';
import { useEffect, useId, useRef, useState } from 'react';
import { adminSignOut } from '@/app/actions/auth';
import { useAdminTheme } from '@/components/AdminThemeToggle';
import { useAdminData } from '@/contexts/AdminDataContext';

function formatSyncTime(timestamp: number) {
  return new Date(timestamp).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' });
}

/**
 * Sidebar footer: one sync status line with the only refresh button in the
 * admin, and one account menu holding theme, back-to-site and log out.
 */
export default function AdminAccountMenu() {
  const { refreshData, refreshing, error, configurationError, lastFetchedAt } = useAdminData();
  const { isDark, toggle } = useAdminTheme();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    rootRef.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    const onPointer = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointer);
    return () => document.removeEventListener('pointerdown', onPointer);
  }, [open]);

  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    const items = Array.from(rootRef.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') || []);
    const index = items.indexOf(document.activeElement as HTMLElement);
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); buttonRef.current?.focus(); }
    else if (event.key === 'ArrowDown') { event.preventDefault(); items[(index + 1) % items.length]?.focus(); }
    else if (event.key === 'ArrowUp') { event.preventDefault(); items[(index - 1 + items.length) % items.length]?.focus(); }
    else if (event.key === 'Tab') setOpen(false);
  };

  const status = configurationError
    ? 'Server configuration required'
    : refreshing
      ? 'Syncing…'
      : error
        ? 'Some data could not sync'
        : lastFetchedAt
          ? `Synced ${formatSyncTime(lastFetchedAt)}`
          : 'Not synced yet';

  return (
    <div className="admin-account">
      <div className="admin-sync-row">
        <span className={`admin-sync-status ${error || configurationError ? 'is-error' : ''}`} role="status">{status}</span>
        <button
          type="button"
          className="admin-icon-button is-small"
          aria-label="Refresh all data"
          title="Refresh all data"
          onClick={() => void refreshData()}
          disabled={refreshing || Boolean(configurationError)}
        >
          <svg className={refreshing ? 'is-spinning' : ''} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M21 12a9 9 0 1 1-2.64-6.36" /><polyline points="21 3 21 9 15 9" />
          </svg>
        </button>
      </div>

      <div className="admin-menu admin-account-menu" ref={rootRef}>
        <button
          ref={buttonRef}
          type="button"
          className="admin-account-button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="admin-account-avatar" aria-hidden="true">A</span>
          <span className="admin-account-copy"><strong>Admin</strong><small>Theme · Site · Log out</small></span>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="18 15 12 9 6 15" /></svg>
        </button>
        {open && (
          <div id={menuId} role="menu" aria-label="Account" className="admin-menu-popover is-up" onKeyDown={onMenuKeyDown}>
            <button type="button" role="menuitem" className="admin-menu-item" onClick={() => { toggle(); setOpen(false); }}>
              {isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            </button>
            <Link href="/" role="menuitem" className="admin-menu-item">Back to site</Link>
            <div className="admin-menu-separator" role="separator" />
            <form action={adminSignOut}>
              <button type="submit" role="menuitem" className="admin-menu-item">Log out</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

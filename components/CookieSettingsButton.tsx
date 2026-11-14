'use client';

import { openCookieSettings } from '@/lib/consent';

/** Reopens the cookie settings panel; for the footer and the privacy page. */
export default function CookieSettingsButton({ className, children = 'Cookie settings' }: { className?: string; children?: React.ReactNode }) {
  return (
    <button type="button" className={className} onClick={openCookieSettings}>
      {children}
    </button>
  );
}

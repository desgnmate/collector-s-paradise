'use client';

import type { ComponentProps } from 'react';
import Link, { useLinkStatus } from 'next/link';

type VendorNavigationLinkProps = ComponentProps<typeof Link> & {
  closeMenu?: boolean;
  disabled?: boolean;
  scrollTarget?: string;
};

function PendingIndicator() {
  const { pending } = useLinkStatus();

  return (
    <span className={`vendor-nav-status ${pending ? 'is-pending' : ''}`} aria-live="polite">
      <span className="vendor-nav-spinner" aria-hidden="true" />
      <span className="sr-only">{pending ? 'Loading vendors' : ''}</span>
    </span>
  );
}

export default function VendorNavigationLink({
  children,
  closeMenu = false,
  disabled = false,
  scrollTarget,
  onClick,
  ...props
}: VendorNavigationLinkProps) {
  return (
    <Link
      {...props}
      scroll={false}
      aria-disabled={disabled || props['aria-disabled']}
      tabIndex={disabled ? -1 : props.tabIndex}
      onClick={(event) => {
        if (disabled) {
          event.preventDefault();
          return;
        }
        if (closeMenu) event.currentTarget.closest('details')?.removeAttribute('open');
        if (scrollTarget) {
          document.querySelector(scrollTarget)?.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
            block: 'start',
          });
        }
        onClick?.(event);
      }}
    >
      {children}
      <PendingIndicator />
    </Link>
  );
}

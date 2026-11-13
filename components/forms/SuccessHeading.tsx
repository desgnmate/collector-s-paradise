'use client';

import { useEffect, useRef } from 'react';

/**
 * Heading for a form's success view. It takes focus when it appears, so
 * keyboard and screen-reader users land on the confirmation rather than at
 * the top of the page.
 */
export default function SuccessHeading({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return (
    <h2 ref={ref} tabIndex={-1} className="vendor-success-title" style={{ outline: 'none' }}>
      {children}
    </h2>
  );
}

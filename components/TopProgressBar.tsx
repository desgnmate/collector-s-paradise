'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Thin animated bar at the top of the viewport that shows whenever
 * a route navigation is in flight. Reads Next.js's pending state via
 * the pathname — whenever the pathname changes, the bar briefly
 * animates to 90% to show progress, then snaps to 100% on completion.
 */
export default function TopProgressBar() {
  const pathname = usePathname();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show the bar when the pathname changes
    setVisible(true);
    setProgress(15);

    // Tick the bar to indicate progress
    const tickInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return 90;
        // Slow down as we approach 90% to give a realistic "still loading" feel
        const increment = p < 50 ? 8 : p < 75 ? 4 : 2;
        return Math.min(90, p + increment);
      });
    }, 120);

    // Complete the bar after a short delay (allows the new page to render)
    const completeTimer = setTimeout(() => {
      setProgress(100);
      setTimeout(() => {
        setVisible(false);
        setProgress(0);
      }, 250);
    }, 500);

    return () => {
      clearInterval(tickInterval);
      clearTimeout(completeTimer);
    };
  }, [pathname]);

  if (!visible) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: 'transparent',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
      aria-hidden="true"
    >
      <div
        style={{
          height: '100%',
          width: `${progress}%`,
          background: 'linear-gradient(90deg, #F4C542 0%, #D94B4B 100%)',
          boxShadow: '0 0 8px rgba(244, 197, 66, 0.6)',
          transition: 'width 0.15s ease-out',
          willChange: 'width',
        }}
      />
    </div>
  );
}

'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Secret admin access component.
 * Wraps the footer logo and detects a secret click pattern:
 * - Click the logo 5 times rapidly (within 2 seconds) to access admin login.
 * - Visual feedback: subtle yellow glow on each click, gone after timeout.
 */
export function AdminSecretAccess({ children }: { children: React.ReactNode }) {
  const [clickCount, setClickCount] = useState(0);
  const [isGlowing, setIsGlowing] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const glowTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = useCallback(() => {
    setClickCount(prev => {
      const next = prev + 1;

      // Flash the logo yellow on each click
      setIsGlowing(true);
      if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
      glowTimerRef.current = setTimeout(() => setIsGlowing(false), 300);

      if (next >= 5) {
        // Secret activated! Navigate to admin login
        window.location.href = '/admin-login';
        setClickCount(0);
        return 0;
      }

      // Reset count after 2 seconds of inactivity
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setClickCount(0), 2000);

      return next;
    });
  }, []);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (glowTimerRef.current) clearTimeout(glowTimerRef.current);
    };
  }, []);

  return (
    <div
      onClick={handleClick}
      style={{
        cursor: 'pointer',
        transition: 'filter 0.2s ease',
        filter: isGlowing
          ? 'drop-shadow(0 0 8px var(--color-yellow, #F4C542))'
          : 'none',
        position: 'relative',
      }}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          handleClick();
        }
      }}
      aria-label="Collector's Paradise"
    >
      {children}
      {/* Subtle click counter (invisible to normal users) */}
      {clickCount > 0 && clickCount < 5 && (
        <span
          style={{
            position: 'absolute',
            bottom: '-8px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '0.6rem',
            color: 'var(--color-yellow, #F4C542)',
            opacity: 0.3,
            pointerEvents: 'none',
            userSelect: 'none',
          }}
        >
          {clickCount}/5
        </span>
      )}
    </div>
  );
}

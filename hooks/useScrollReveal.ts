'use client';

import { useEffect } from 'react';

/**
 * Scroll-reveal for [data-aos] elements.
 *
 * IMPORTANT: Must not mutate the DOM until after React has finished
 * hydrating. SmoothScroll lives in the root layout and mounts before
 * nested page segments finish hydrating; adding `aos-animate` early
 * causes hydration className mismatches.
 */
export function useScrollReveal(pathname?: string | null) {
  useEffect(() => {
    let cancelled = false;
    let observer: IntersectionObserver | null = null;
    const timeouts = new Set<ReturnType<typeof setTimeout>>();

    const animate = (el: HTMLElement) => {
      if (cancelled || el.classList.contains('aos-animate')) return;
      const delay = parseInt(el.dataset.aosDelay || '0', 10);
      const id = setTimeout(() => {
        timeouts.delete(id);
        if (!cancelled) el.classList.add('aos-animate');
      }, delay);
      timeouts.add(id);
    };

    const setup = () => {
      if (cancelled) return;

      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              animate(entry.target as HTMLElement);
              observer?.unobserve(entry.target);
            }
          });
        },
        { threshold: 0, rootMargin: '0px 0px 50px 0px' }
      );

      document.querySelectorAll<HTMLElement>('[data-aos]').forEach((el) => {
        // Elements restored from a previous client paint may already be animated
        if (el.classList.contains('aos-animate')) return;
        observer?.observe(el);
      });
    };

    // Defer past layout + nested segment hydration (streaming RSC).
    // Double rAF waits for paint; idle/timeout covers remaining hydration.
    let idleHandle: number | null = null;
    let timeoutHandle: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          if (cancelled) return;
          if (typeof window.requestIdleCallback === 'function') {
            idleHandle = window.requestIdleCallback(
              () => {
                if (!cancelled) setup();
              },
              { timeout: 1200 }
            );
          } else {
            timeoutHandle = setTimeout(() => {
              if (!cancelled) setup();
            }, 250);
          }
        });
      });
    };

    schedule();

    return () => {
      cancelled = true;
      if (idleHandle !== null && typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleHandle);
      }
      if (timeoutHandle !== null) clearTimeout(timeoutHandle);
      timeouts.forEach((id) => clearTimeout(id));
      timeouts.clear();
      observer?.disconnect();
      observer = null;
    };
  }, [pathname]);
}

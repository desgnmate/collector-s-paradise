'use client';

import { useEffect } from 'react';

/**
 * Observes all elements with [data-aos] and adds the `.aos-animate` class
 * when they enter the viewport. Supports data-aos-delay (ms).
 */
export function useScrollReveal() {
  useEffect(() => {
    const elements = document.querySelectorAll<HTMLElement>('[data-aos]');

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const el = entry.target as HTMLElement;
            const delay = parseInt(el.dataset.aosDelay || '0', 10);
            setTimeout(() => {
              el.classList.add('aos-animate');
            }, delay);
            observer.unobserve(el); // animate once
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -40px 0px' }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);
}

'use client';

import { useEffect } from 'react';

export function useScrollReveal() {
  useEffect(() => {
    const animate = (el: HTMLElement) => {
      const delay = parseInt(el.dataset.aosDelay || '0', 10);
      setTimeout(() => el.classList.add('aos-animate'), delay);
    };

    // Immediately reveal anything already in view on mount
    const revealVisible = () => {
      document.querySelectorAll<HTMLElement>('[data-aos]:not(.aos-animate)').forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight + 50) {
          animate(el);
        }
      });
    };

    // Observer for elements that scroll into view later
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            animate(entry.target as HTMLElement);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0, rootMargin: '0px 0px 0px 0px' }
    );

    const observe = () => {
      revealVisible();
      document.querySelectorAll<HTMLElement>('[data-aos]:not(.aos-animate)').forEach((el) => {
        observer.observe(el);
      });
    };

    // Run after a short delay to let the page render
    const t = setTimeout(observe, 100);

    // Also re-run on scroll for any missed elements
    window.addEventListener('scroll', revealVisible, { passive: true });

    return () => {
      clearTimeout(t);
      observer.disconnect();
      window.removeEventListener('scroll', revealVisible);
    };
  }, []);
}

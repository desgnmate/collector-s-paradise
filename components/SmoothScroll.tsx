'use client';

import { useEffect, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useScrollReveal } from '@/hooks/useScrollReveal';

const ChatWidget = dynamic(() => import('@/components/ChatWidget'), {
  ssr: false,
});

interface SmoothScrollProps {
  children: ReactNode;
}

export default function SmoothScroll({ children }: SmoothScrollProps) {
  useScrollReveal();
  const pathname = usePathname();

  // Reset scroll to top on every route change. Lenis intercepts wheel
  // events, so calling window.scrollTo here would be undone by the next
  // Lenis frame; we tell Lenis to stop and snap to 0 instead.
  useEffect(() => {
    const lenis = (window as any).__lenis;
    if (lenis) {
      lenis.stop();
      lenis.scrollTo(0, { immediate: true });
      requestAnimationFrame(() => lenis.start());
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  // As soon as the user clicks any internal link, kill any in-flight
  // Lenis animation and snap to the top so the new page doesn't render
  // mid-scroll. Without this, Next.js client navigation can hand off
  // with the old page's scroll position still attached.
  useEffect(() => {
    const onLinkClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
      if (anchor.target && anchor.target !== '_self') return;
      if (anchor.hasAttribute('download')) return;
      const lenis = (window as any).__lenis;
      if (lenis) {
        lenis.stop();
        lenis.scrollTo(0, { immediate: true });
      } else {
        window.scrollTo(0, 0);
      }
    };
    document.addEventListener('click', onLinkClick, { capture: true });
    return () => document.removeEventListener('click', onLinkClick, { capture: true } as any);
  }, []);

  // Hide ChatWidget (Pokeball) on admin pages
  const isAdminRoute = pathname?.startsWith('/admin') || pathname === '/admin-login';

  useEffect(() => {
    if (isAdminRoute) return;

    // Dynamically import Lenis only on client to avoid SSR hydration issues
    let lenisInstance: any;
    let rafId: number;

    const initLenis = async () => {
      const Lenis = (await import('lenis')).default;

      lenisInstance = new Lenis({
        // Short duration + snappy easing keeps scroll responsive
        // without the "laggy" feel of 0.9s+ cubic easing.
        duration: 0.45,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        // Multipliers closer to 1 keep wheel/touch responsive on
        // both trackpads and mobile swipes.
        wheelMultiplier: 1.4,
        touchMultiplier: 1.8,
        infinite: false,
        // syncTouch false lets touch devices use native momentum so
        // swiping the page no longer races the animation frame.
        syncTouch: false,
      });

      (window as any).__lenis = lenisInstance;

      function raf(time: number) {
        lenisInstance.raf(time);
        rafId = requestAnimationFrame(raf);
      }

      rafId = requestAnimationFrame(raf);
    };

    initLenis();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenisInstance) {
        lenisInstance.destroy();
        (window as any).__lenis = undefined;
      }
    };
  }, [isAdminRoute]);

  return (
    <>
      {children}
      {!isAdminRoute && <ChatWidget />}
    </>
  );
}

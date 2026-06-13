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

  // Scroll the new page to the top INSTANTLY as soon as the route
  // changes. `force: true` interrupts any in-flight Lenis animation
  // and `immediate: true` skips the smooth easing — gives the
  // appearance of an instant page transition.
  useEffect(() => {
    const lenis = (window as any).__lenis;
    if (lenis) {
      lenis.stop();
      lenis.scrollTo(0, { immediate: true, force: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  // As soon as the user clicks any internal link, instantly:
  //   1. Snap to the top (so the new page never reveals mid-scroll
  //      leftover from the previous page)
  //   2. Lock Lenis from re-scrolling while the next page is loading
  //   3. Unlock once the new page has rendered
  useEffect(() => {
    let unlocked = true;

    const unlock = () => {
      if (unlocked) return;
      unlocked = true;
      const lenis = (window as any).__lenis;
      if (lenis) lenis.start();
    };

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

      unlocked = false;
      const lenis = (window as any).__lenis;
      if (lenis) {
        lenis.stop();
        lenis.scrollTo(0, { immediate: true, force: true });
      } else {
        window.scrollTo(0, 0);
      }
      // Unlock shortly after — gives Next.js time to mount the new
      // route and re-attach scroll listeners.
      setTimeout(unlock, 800);
    };

    document.addEventListener('click', onLinkClick, { capture: true });
    return () => document.removeEventListener('click', onLinkClick, { capture: true } as any);
  }, []);

  // Hide ChatWidget (Pokeball) on admin pages and on the vendor
  // application form — the floating button overlaps the form fields
  // and "Submit" CTA on small screens.
  const isAdminRoute = pathname?.startsWith('/admin') || pathname === '/admin-login';
  const isVendorApply = pathname === '/vendors/apply';
  // Legal pages don't need a sales chat widget — the floating
  // Pokeball + open chat panel can overlap the long text and make
  // it unreadable on small screens.
  const isLegalPage = pathname === '/terms' || pathname === '/privacy';
  const hideChatWidget = isAdminRoute || isVendorApply || isLegalPage;

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
        duration: 0.4,
        easing: (t: number) => 1 - Math.pow(1 - t, 4),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        // Multipliers closer to 1 keep wheel/touch responsive
        // on both trackpads and mobile swipes.
        wheelMultiplier: 1.3,
        touchMultiplier: 1.6,
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
      {!hideChatWidget && <ChatWidget />}
    </>
  );
}

'use client';

import { useEffect, useState, type ComponentType, type ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { useScrollReveal } from '@/hooks/useScrollReveal';
import type Lenis from 'lenis';

declare global {
  interface Window {
    __lenis?: Lenis;
  }
}

interface ClientRuntimeProps {
  children: ReactNode;
}

export default function ClientRuntime({ children }: ClientRuntimeProps) {
  const pathname = usePathname();
  const [ChatWidgetComponent, setChatWidgetComponent] = useState<ComponentType | null>(null);
  // Pass pathname so reveals re-bind after client navigations, and so
  // setup is deferred until after each route's hydration settles.
  useScrollReveal(pathname);

  // Scroll the new page to the top INSTANTLY as soon as the route
  // changes. `force: true` interrupts any in-flight Lenis animation
  // and `immediate: true` skips the smooth easing — gives the
  // appearance of an instant page transition.
  useEffect(() => {
    const lenis = window.__lenis;
    if (lenis) {
      lenis.stop();
      lenis.scrollTo(0, { immediate: true, force: true });
      const resumeFrame = window.requestAnimationFrame(() => {
        lenis.start();
      });

      return () => {
        window.cancelAnimationFrame(resumeFrame);
      };
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  // Hide ChatWidget (Pokeball) on admin pages and on the vendor
  // application form — the floating button overlaps the form fields
  // and "Submit" CTA on small screens.
  const isAdminRoute = pathname?.startsWith('/admin') || pathname === '/admin-login';
  const isVendorApply = pathname === '/vendors/apply';
  const isReportsPage = pathname === '/reports';
  // Legal pages don't need a sales chat widget — the floating
  // Pokeball + open chat panel can overlap the long text and make
  // it unreadable on small screens.
  const isLegalPage = pathname === '/terms' || pathname === '/privacy';
  const hideChatWidget = isAdminRoute || isVendorApply || isReportsPage || isLegalPage;

  // The support widget is useful, but it is not part of the critical route
  // transition. Load its chunk only after the new page has settled.
  useEffect(() => {
    if (hideChatWidget) {
      setChatWidgetComponent(null);
      return;
    }

    let cancelled = false;
    let idleHandle: number | null = null;
    const reveal = async () => {
      const { default: ChatWidget } = await import('@/components/ChatWidget');
      if (!cancelled) setChatWidgetComponent(() => ChatWidget);
    };

    if (typeof window.requestIdleCallback === 'function') {
      idleHandle = window.requestIdleCallback(reveal, { timeout: 1500 });
    } else {
      idleHandle = window.setTimeout(reveal, 700);
    }

    return () => {
      cancelled = true;
      if (idleHandle === null) return;
      if (typeof window.cancelIdleCallback === 'function') {
        window.cancelIdleCallback(idleHandle);
      } else {
        window.clearTimeout(idleHandle);
      }
    };
  }, [hideChatWidget]);

  useEffect(() => {
    if (isAdminRoute) return;

    // Dynamically import Lenis only on client to avoid SSR hydration issues
    let lenisInstance: Lenis | null = null;
    let rafId: number;

    let cancelled = false;
    let idleHandle: number | null = null;

    const initLenis = async () => {
      const Lenis = (await import('lenis')).default;

      if (cancelled) return;

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

      window.__lenis = lenisInstance;
      const activeLenis = lenisInstance;

      function raf(time: number) {
        activeLenis.raf(time);
        rafId = requestAnimationFrame(raf);
      }

      rafId = requestAnimationFrame(raf);
    };

    // Native scrolling works immediately. Enhance it with Lenis only when the
    // browser is idle so navigation and hydration stay responsive.
    if (typeof window.requestIdleCallback === 'function') {
      idleHandle = window.requestIdleCallback(() => void initLenis(), { timeout: 1200 });
    } else {
      idleHandle = window.setTimeout(() => void initLenis(), 400);
    }

    return () => {
      cancelled = true;
      if (idleHandle !== null) {
        if (typeof window.cancelIdleCallback === 'function') {
          window.cancelIdleCallback(idleHandle);
        } else {
          window.clearTimeout(idleHandle);
        }
      }
      if (rafId) cancelAnimationFrame(rafId);
      if (lenisInstance) {
        lenisInstance.destroy();
        window.__lenis = undefined;
      }
    };
  }, [isAdminRoute]);

  return (
    <>
      {children}
      {!hideChatWidget && ChatWidgetComponent && <ChatWidgetComponent />}
    </>
  );
}

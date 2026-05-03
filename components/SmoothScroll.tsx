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

  // Scroll to top on every route change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  useEffect(() => {
    // Dynamically import Lenis only on client to avoid SSR hydration issues
    let lenisInstance: any;
    let rafId: number;

    const initLenis = async () => {
      const Lenis = (await import('lenis')).default;
      
      lenisInstance = new Lenis({
        duration: 1.2,
        easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false,
        syncTouch: true,
      });

      function raf(time: number) {
        lenisInstance.raf(time);
        rafId = requestAnimationFrame(raf);
      }

      rafId = requestAnimationFrame(raf);
    };

    initLenis();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (lenisInstance) lenisInstance.destroy();
    };
  }, []);

  // Hide ChatWidget (Pokeball) on admin pages
  const isAdminRoute = pathname?.startsWith('/admin') || pathname === '/admin-login';

  return (
    <>
      {children}
      {!isAdminRoute && <ChatWidget />}
    </>
  );
}

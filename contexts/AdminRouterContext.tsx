'use client';

import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export type AdminRoute = '/admin' | '/admin/events' | '/admin/vendors' | '/admin/about';

interface AdminRouterContext {
  currentRoute: AdminRoute;
  navigate: (route: AdminRoute) => void;
  isLoading: boolean;
}

const AdminRouterContext = createContext<AdminRouterContext | null>(null);

export function AdminRouterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [currentRoute, setCurrentRoute] = useState<AdminRoute>(
    (pathname as AdminRoute) || '/admin'
  );
  const [isLoading, setIsLoading] = useState(false);

  // Sync with browser navigation (back/forward buttons)
  useEffect(() => {
    const validRoutes: AdminRoute[] = ['/admin', '/admin/events', '/admin/vendors', '/admin/about'];
    if (validRoutes.includes(pathname as AdminRoute)) {
      setCurrentRoute(pathname as AdminRoute);
    }
  }, [pathname]);

  const navigate = useCallback((route: AdminRoute) => {
    setIsLoading(true);
    // Update URL without triggering full page reload
    router.push(route, { scroll: false });
    setCurrentRoute(route);
    // Small delay to simulate loading (remove if instant preferred)
    setTimeout(() => setIsLoading(false), 100);
  }, [router]);

  return (
    <AdminRouterContext.Provider value={{ currentRoute, navigate, isLoading }}>
      {children}
    </AdminRouterContext.Provider>
  );
}

export function useAdminRouter() {
  const context = useContext(AdminRouterContext);
  if (!context) {
    throw new Error('useAdminRouter must be used within AdminRouterProvider');
  }
  return context;
}

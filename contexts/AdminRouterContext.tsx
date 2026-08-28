'use client';

import { createContext, useContext, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export type AdminRoute = '/admin' | '/admin/events' | '/admin/vendors' | '/admin/volunteers' | '/admin/sponsors' | '/admin/reports' | '/admin/about';

interface AdminRouterContext {
  currentRoute: AdminRoute;
  navigate: (route: AdminRoute) => void;
  isLoading: boolean;
}

const validRoutes: AdminRoute[] = [
  '/admin',
  '/admin/events',
  '/admin/vendors',
  '/admin/volunteers',
  '/admin/sponsors',
  '/admin/reports',
  '/admin/about',
];

const AdminRouterContext = createContext<AdminRouterContext | null>(null);

export function AdminRouterProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const currentRoute = validRoutes.includes(pathname as AdminRoute)
    ? pathname as AdminRoute
    : '/admin';

  const navigate = useCallback((route: AdminRoute) => {
    if (route === currentRoute) return;
    window.history.pushState(null, '', route);
  }, [currentRoute]);

  return (
    <AdminRouterContext.Provider value={{ currentRoute, navigate, isLoading: false }}>
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

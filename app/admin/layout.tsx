import type { Metadata } from 'next';
import Link from 'next/link';
import { adminSignOut } from '@/app/actions/auth';
import { AdminSidebarNav } from '@/components/AdminSidebarNav';
import { AdminRouterProvider } from '@/contexts/AdminRouterContext';
import { AdminDataProvider } from '@/contexts/AdminDataContext';
import AdminContentRouter from '@/components/AdminContentRouter';
import AdminHeader from '@/components/AdminHeader';

export const metadata: Metadata = {
  title: "Admin Panel | Collector's Paradise",
  robots: { index: false, follow: false },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AdminRouterProvider>
      <AdminDataProvider>
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <div className="admin-sidebar-header">
              <h2 className="admin-sidebar-logo">CP Admin</h2>
            </div>
            <AdminSidebarNav />
            <div className="admin-sidebar-footer">
              <Link href="/" className="admin-nav-link admin-back-link">
                ← Back to Site
              </Link>
              <form action={adminSignOut} className="admin-logout-form" style={{ marginTop: '4px' }}>
                <button type="submit" className="admin-logout-btn">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Logout
                </button>
              </form>
            </div>
          </aside>

          <div className="admin-content">
            <AdminHeader />
            <AdminContentRouter />
          </div>
        </div>
      </AdminDataProvider>
    </AdminRouterProvider>
  );
}

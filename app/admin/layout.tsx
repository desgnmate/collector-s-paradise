import type { Metadata } from 'next';
import Image from 'next/image';
import { AdminSidebarNav } from '@/components/AdminSidebarNav';
import { AdminRouterProvider } from '@/contexts/AdminRouterContext';
import { AdminDataProvider } from '@/contexts/AdminDataContext';
import AdminContentRouter from '@/components/AdminContentRouter';
import AdminAccountMenu from '@/components/AdminAccountMenu';
import { RegistrationQueueProvider } from '@/contexts/RegistrationQueueContext';
import AdminConfigurationNotice from '@/components/AdminConfigurationNotice';
import { loadAdminDataSnapshot } from '@/lib/admin/data';
import logo from '@/public/images/logo.png';

export const metadata: Metadata = {
  title: "Admin Panel | Collector's Paradise",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children: _children,
}: {
  children: React.ReactNode;
}) {
  void _children;
  const initialData = await loadAdminDataSnapshot();

  return (
    <AdminRouterProvider>
      <AdminDataProvider initialData={initialData}>
        <RegistrationQueueProvider>
        <div className="admin-layout">
          <aside className="admin-sidebar">
            <div className="admin-sidebar-header">
              <h2 className="admin-sidebar-logo">
                <Image src={logo} alt="Collector's Paradise" height={32} style={{ width: 'auto' }} />
                <span>Admin Studio</span>
              </h2>
            </div>
            <AdminSidebarNav />
            <div className="admin-sidebar-footer">
              <AdminAccountMenu />
            </div>
          </aside>

          <div className="admin-content">
            {initialData.configurationError ? (
              <AdminConfigurationNotice />
            ) : (
              <AdminContentRouter />
            )}
          </div>
        </div>
        </RegistrationQueueProvider>
      </AdminDataProvider>
    </AdminRouterProvider>
  );
}

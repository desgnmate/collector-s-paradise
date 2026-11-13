'use client';

import AdminVendorsClient from '@/app/admin/vendors/AdminVendorsClient';

// The registration review queue lives inside Vendor Management as its own tab.
export default function VendorsContent() {
  return <AdminVendorsClient />;
}

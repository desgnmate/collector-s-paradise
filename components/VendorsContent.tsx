'use client';

import AdminVendorsClient from '@/app/admin/vendors/AdminVendorsClient';
import VendorRegistrationQueue from '@/components/VendorRegistrationQueue';

export default function VendorsContent() {
  return <><VendorRegistrationQueue /><AdminVendorsClient /></>;
}

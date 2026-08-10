'use server';

import {
  ADMIN_DATA_SECTIONS,
  loadAdminDataSnapshot,
  type AdminDataSection,
  type AdminDataSnapshot,
} from '@/lib/admin/data';

export async function syncAdminData(
  requestedSections: AdminDataSection[] = [...ADMIN_DATA_SECTIONS],
): Promise<AdminDataSnapshot> {
  const sections = requestedSections.filter((section): section is AdminDataSection => (
    ADMIN_DATA_SECTIONS.includes(section)
  ));

  return loadAdminDataSnapshot(sections.length > 0 ? sections : ADMIN_DATA_SECTIONS);
}

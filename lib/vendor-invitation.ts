export type VendorInvitationEventSetup = {
  vendor_payment_link: string | null;
  vendor_contact_email: string | null;
  vendor_response_deadline: string | null;
};

export function getVendorInvitationReadinessIssues(
  event: VendorInvitationEventSetup | null | undefined,
  approvedVendorFee: number | null,
): string[] {
  if (!event) return ['Event details are unavailable.'];

  const issues: string[] = [];
  if (!event.vendor_contact_email) issues.push('Add a working vendor contact email.');
  if (!event.vendor_response_deadline) issues.push('Add a vendor confirmation deadline.');
  if (
    approvedVendorFee !== null &&
    Number.isFinite(approvedVendorFee) &&
    approvedVendorFee > 0 &&
    !event.vendor_payment_link
  ) {
    issues.push('Add a payment or confirmation link for the vendor fee.');
  }

  return issues;
}

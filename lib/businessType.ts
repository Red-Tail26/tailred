// Which business types use the "equipment I own" tracker instead of the
// resale inventory tracker (sourced/listed/sold with COGS vs. sale
// price). Reselling, food sales, and product brands still have a real
// per-item cost/sale-price cycle, so they keep the inventory tracker.
// Unset or unlisted types (including "Other") default to inventory —
// the original, more broadly-applicable behavior.
export const SERVICE_BUSINESS_TYPES = [
  "Repair",
  "Moving",
  "Cleaning",
  "Power washing",
  "Mobile detailing",
  "Personal training",
  "Fitness / wellness coaching",
  "Massage therapy",
  "Tutoring",
  "Delivery",
];

export function isServiceBusiness(businessType: string | null) {
  return !!businessType && SERVICE_BUSINESS_TYPES.includes(businessType);
}

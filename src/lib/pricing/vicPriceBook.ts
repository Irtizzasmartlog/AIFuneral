/**
 * Single source of truth: AU/VIC-style funeral line items.
 * Prices in cents. Use for package building and quote display.
 */

export type PriceUnit = "flat" | "per_km" | "per_hour" | "per_guest" | "per_day" | "per_50";

export type PriceBookItem = {
  code: string;
  name: string;
  description: string;
  unit: PriceUnit;
  basePriceCents: number;
  category: "service" | "merchandise" | "cashAdvance";
  minCents?: number;
  maxCents?: number;
};

export const VIC_PRICE_BOOK: PriceBookItem[] = [
  // Professional / service
  { code: "PROF_SERVICE_FEE", name: "Professional service fee", description: "Funeral director and staff", unit: "flat", basePriceCents: 2_950_00, category: "service" },
  { code: "TRANSFER_25KM", name: "Transfer of deceased (within 25km)", description: "First 25km included", unit: "flat", basePriceCents: 495_00, category: "service" },
  { code: "TRANSFER_PER_KM", name: "Transfer (per km beyond 25km)", description: "Additional distance", unit: "per_km", basePriceCents: 3_50, category: "service" },
  { code: "MORTUARY_PER_DAY", name: "Mortuary care (per day)", description: "Care and preparation", unit: "per_day", basePriceCents: 85_00, category: "service" },
  { code: "CHAPEL_PER_HOUR", name: "Viewing / chapel hire (per hour)", description: "Chapel or viewing room", unit: "per_hour", basePriceCents: 120_00, category: "service" },
  { code: "CELEBRANT", name: "Celebrant / officiant", description: "Service officiant", unit: "flat", basePriceCents: 450_00, category: "service" },
  { code: "HEARSE", name: "Hearse", description: "Funeral vehicle", unit: "flat", basePriceCents: 495_00, category: "service" },
  { code: "FAMILY_CAR", name: "Family car / limo", description: "One vehicle", unit: "flat", basePriceCents: 350_00, category: "service" },
  { code: "ORDER_SERVICE_PER_50", name: "Printed service sheets (per 50)", description: "Order of service", unit: "per_50", basePriceCents: 45_00, category: "service" },
  // Disbursements (third-party)
  { code: "CREMATION_FEE", name: "Cremation fee (third-party)", description: "Crematorium fee", unit: "flat", basePriceCents: 1_100_00, category: "cashAdvance" },
  { code: "BURIAL_FEE", name: "Burial fees (cemetery dependent)", description: "Estimated; varies by cemetery", unit: "flat", basePriceCents: 2_500_00, category: "cashAdvance" },
  { code: "DEATH_CERT_PROCESSING", name: "Death certificate processing", description: "Registry and copies", unit: "flat", basePriceCents: 85_00, category: "cashAdvance" },
  // Merchandise
  { code: "COFFIN_BASIC", name: "Coffin (basic)", description: "Veneer / particleboard", unit: "flat", basePriceCents: 695_00, category: "merchandise" },
  { code: "COFFIN_STANDARD", name: "Coffin (standard)", description: "20-gauge steel", unit: "flat", basePriceCents: 1_495_00, category: "merchandise" },
  { code: "COFFIN_PREMIUM", name: "Coffin (premium)", description: "Solid timber or premium", unit: "flat", basePriceCents: 3_500_00, category: "merchandise" },
  { code: "URN_STANDARD", name: "Urn (standard)", description: "Cremation urn", unit: "flat", basePriceCents: 295_00, category: "merchandise" },
  { code: "URN_PREMIUM", name: "Urn (premium)", description: "Premium urn", unit: "flat", basePriceCents: 595_00, category: "merchandise" },
  { code: "FLOWERS_BASIC", name: "Flowers (basic tribute)", description: "Single tribute", unit: "flat", basePriceCents: 195_00, category: "merchandise" },
  { code: "FLOWERS_PREMIUM", name: "Flowers (premium)", description: "Larger tribute or casket spray", unit: "flat", basePriceCents: 450_00, category: "merchandise" },
  { code: "CATERING_PER_GUEST", name: "Catering (per guest)", description: "Wake / refreshments", unit: "per_guest", basePriceCents: 18_50, category: "merchandise" },
];

const PRICE_BOOK_MAP = new Map(VIC_PRICE_BOOK.map((i) => [i.code, i]));

export function getPriceBookItem(code: string): PriceBookItem | undefined {
  return PRICE_BOOK_MAP.get(code);
}

export function computeLineTotal(item: PriceBookItem, qty: number, extraKm?: number): number {
  let total = 0;
  switch (item.unit) {
    case "flat":
      total = item.basePriceCents * qty;
      break;
    case "per_km":
      total = item.basePriceCents * (extraKm ?? 0);
      break;
    case "per_hour":
    case "per_day":
    case "per_guest":
      total = item.basePriceCents * qty;
      break;
    case "per_50":
      total = item.basePriceCents * Math.ceil(qty / 50);
      break;
    default:
      total = item.basePriceCents * qty;
  }
  if (item.minCents != null && total < item.minCents) total = item.minCents;
  if (item.maxCents != null && total > item.maxCents) total = item.maxCents;
  return Math.round(total);
}

export function formatAud(cents: number): string {
  return new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0 }).format(cents / 100);
}

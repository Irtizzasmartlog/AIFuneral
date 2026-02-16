/**
 * Build packages from price book using intake (guests, service type, budget, etc.).
 * Totals come from catalogue items + quantities; no hardcoded totals.
 */

import type { CaseInput, PricingConstraints } from "@/agents/types";
import type { QuoteLineItemInput } from "@/agents/types";
import type { PackageOutput } from "@/agents/types";
import { getPriceBookItem, computeLineTotal, formatAud } from "./vicPriceBook";

type LineEntry = { code: string; qty: number; extraKm?: number };

function buildLineDescription(
  name: string,
  qty: number,
  unitPriceCents: number,
  subtotalCents: number
): string {
  const qtyDisplay = qty === 1 ? "1" : `${qty}`;
  const unitStr = formatAud(unitPriceCents);
  const subStr = formatAud(subtotalCents);
  return `${name} — ${qtyDisplay} x ${unitStr} = ${subStr}`;
}

function essentialItems(caseInput: CaseInput, constraints?: PricingConstraints): LineEntry[] {
  const serviceType = (caseInput.serviceType ?? "").toLowerCase();
  const isCremation = serviceType.includes("cremation");
  const guests = constraints?.attendeeCount ?? caseInput.expectedAttendeesMax ?? 50;
  const transferKm = 0;

  const items: LineEntry[] = [
    { code: "PROF_SERVICE_FEE", qty: 1 },
    { code: "TRANSFER_25KM", qty: 1 },
    { code: "MORTUARY_PER_DAY", qty: 2 },
  ];
  if (isCremation) {
    items.push({ code: "CREMATION_FEE", qty: 1 });
    items.push({ code: "COFFIN_BASIC", qty: 1 });
    items.push({ code: "URN_STANDARD", qty: 1 });
  } else {
    items.push({ code: "BURIAL_FEE", qty: 1 });
    items.push({ code: "COFFIN_BASIC", qty: 1 });
  }
  items.push({ code: "DEATH_CERT_PROCESSING", qty: 1 });
  items.push({ code: "CHAPEL_PER_HOUR", qty: 2 });
  items.push({ code: "CELEBRANT", qty: 1 });
  items.push({ code: "ORDER_SERVICE_PER_50", qty: Math.max(50, guests) });
  return items;
}

function standardItems(caseInput: CaseInput, constraints?: PricingConstraints): LineEntry[] {
  const base = essentialItems(caseInput, constraints).filter(
    (e) => e.code !== "COFFIN_BASIC" && e.code !== "CHAPEL_PER_HOUR"
  );
  const serviceType = (caseInput.serviceType ?? "").toLowerCase();
  const isCremation = serviceType.includes("cremation");
  const flowers = constraints?.flowers ?? false;
  const guests = constraints?.attendeeCount ?? caseInput.expectedAttendeesMax ?? 50;

  const extra: LineEntry[] = [
    { code: "HEARSE", qty: 1 },
    { code: "CHAPEL_PER_HOUR", qty: 4 },
    { code: "COFFIN_STANDARD", qty: 1 },
  ];
  if (flowers) extra.push({ code: "FLOWERS_BASIC", qty: 1 });
  extra.push({ code: "CATERING_PER_GUEST", qty: guests });

  return [...base, ...extra];
}

function premiumItems(caseInput: CaseInput, constraints?: PricingConstraints): LineEntry[] {
  const base = standardItems(caseInput, constraints).filter(
    (e) =>
      e.code !== "COFFIN_STANDARD" &&
      e.code !== "URN_STANDARD" &&
      e.code !== "CHAPEL_PER_HOUR" &&
      e.code !== "FLOWERS_BASIC"
  );
  const serviceType = (caseInput.serviceType ?? "").toLowerCase();
  const isCremation = serviceType.includes("cremation");
  const guests = constraints?.attendeeCount ?? caseInput.expectedAttendeesMax ?? 50;

  const extra: LineEntry[] = [
    { code: "FAMILY_CAR", qty: 1 },
    { code: "CHAPEL_PER_HOUR", qty: 6 },
    { code: "FLOWERS_PREMIUM", qty: 1 },
    { code: "COFFIN_PREMIUM", qty: 1 },
    { code: "CATERING_PER_GUEST", qty: guests },
  ];
  if (isCremation) extra.push({ code: "URN_PREMIUM", qty: 1 });

  return [...base, ...extra];
}

function itemsToLineItems(entries: LineEntry[], extraKm: number = 0): QuoteLineItemInput[] {
  const lines: QuoteLineItemInput[] = [];
  for (const e of entries) {
    const item = getPriceBookItem(e.code);
    if (!item) continue;
    const subtotalCents = computeLineTotal(item, e.qty, e.extraKm ?? (item.unit === "per_km" ? extraKm : undefined));
    if (subtotalCents <= 0) continue;
    const unitPriceCents = item.basePriceCents;
    const displayQty =
      item.unit === "per_50" ? Math.ceil(e.qty / 50) : item.unit === "per_km" && extraKm > 0 ? extraKm : e.qty;
    const desc = buildLineDescription(item.name, displayQty, unitPriceCents, subtotalCents);
    lines.push({ description: desc, amountCents: subtotalCents, category: item.category });
  }
  return lines;
}

function lineItemsToInclusions(lines: QuoteLineItemInput[]): string[] {
  const byCategory = { service: [] as string[], merchandise: [] as string[], cashAdvance: [] as string[] };
  for (const l of lines) {
    const name = l.description.split(" — ")[0] ?? l.description;
    byCategory[l.category].push(name);
  }
  const inclusions: string[] = [];
  if (byCategory.service.length) inclusions.push(...byCategory.service.slice(0, 6));
  if (byCategory.merchandise.length) inclusions.push(...byCategory.merchandise.slice(0, 4));
  if (byCategory.cashAdvance.length) inclusions.push("Third-party fees (as listed)");
  return inclusions;
}

export function buildPackagesFromPriceBook(
  caseInput: CaseInput,
  constraints?: PricingConstraints
): PackageOutput[] {
  const guests = constraints?.attendeeCount ?? caseInput.expectedAttendeesMax ?? 50;
  const extraKm = Math.max(0, 0);
  const isEstimated = caseInput.expectedAttendeesMax == null || caseInput.budgetMin == null;

  const tiers: { tier: "Essential" | "Standard" | "Premium"; name: string; description: string; items: () => LineEntry[]; recommended: boolean; sortOrder: number }[] = [
    {
      tier: "Essential",
      name: "Essential",
      description: "Essential professional services and disbursements.",
      items: () => essentialItems(caseInput, constraints),
      recommended: false,
      sortOrder: 0,
    },
    {
      tier: "Standard",
      name: "Standard",
      description: "Traditional service with visitation, standard coffin and catering.",
      items: () => standardItems(caseInput, constraints),
      recommended: true,
      sortOrder: 1,
    },
    {
      tier: "Premium",
      name: "Premium",
      description: "Full commemorative suite with premium coffin and family transport.",
      items: () => premiumItems(caseInput, constraints),
      recommended: false,
      sortOrder: 2,
    },
  ];

  const packages: PackageOutput[] = tiers.map((t) => {
    const entries = t.items();
    const lineItems = itemsToLineItems(entries, extraKm);
    const subtotalCents = lineItems.reduce((sum, l) => sum + l.amountCents, 0);
    const disbursementsCents = lineItems.filter((l) => l.category === "cashAdvance").reduce((sum, l) => sum + l.amountCents, 0);
    const totalCents = subtotalCents;

    return {
      tier: t.tier,
      name: t.name,
      description: t.description + (isEstimated ? " (Estimated)" : ""),
      totalCents,
      inclusions: lineItemsToInclusions(lineItems),
      assumptions: {
        attendeeCount: guests,
        estimated: isEstimated,
      },
      lineItems,
      isRecommended: t.recommended,
      sortOrder: t.sortOrder,
    };
  });

  return packages;
}

import type { CaseInput, PricingInvoiceOutput, PricingConstraints } from "./types";

export function runPricingInvoiceAgent(
  caseData: CaseInput,
  constraints?: PricingConstraints
): PricingInvoiceOutput {
  const budgetMin = caseData.budgetMin ?? 250000;
  const budgetMax = caseData.budgetMax ?? 1500000;
  const mid = Math.round((budgetMin + budgetMax) / 2);
  const attendeeCount = constraints?.attendeeCount ?? caseData.expectedAttendeesMax ?? 50;
  const flowers = constraints?.flowers ?? false;

  const essentialTotal = Math.max(budgetMin, Math.min(mid - 200000, 450000));
  const standardTotal = Math.max(essentialTotal + 150000, Math.min(mid, 750000));
  const premiumTotal = Math.max(standardTotal + 200000, Math.min(budgetMax, 1000000));

  const packages: PricingInvoiceOutput["packages"] = [
    {
      tier: "Essential",
      name: "Essential Tier",
      description: "Essential professional services",
      totalCents: essentialTotal,
      inclusions: [
        "Professional services of staff",
        "Transfer of remains (25mi)",
      ],
      assumptions: { attendeeCount, venueTier: constraints?.venueTier ?? "standard" },
      lineItems: [
        { description: "Professional services", amountCents: Math.round(essentialTotal * 0.55), category: "service" },
        { description: "Transfer", amountCents: Math.round(essentialTotal * 0.45), category: "service" },
      ],
      isRecommended: false,
      sortOrder: 0,
    },
    {
      tier: "Standard",
      name: "Standard Tier",
      description: "Traditional with visitation",
      totalCents: standardTotal,
      inclusions: [
        "Includes all Essential services",
        "Full public visitation (1 day)",
        "20-gauge steel casket included",
        ...(flowers ? ["AI Suggested Floral Tribute"] : []),
      ],
      assumptions: { attendeeCount, venueTier: constraints?.venueTier ?? "standard", flowers },
      lineItems: [
        { description: "Service Fee", amountCents: Math.round(standardTotal * 0.35), category: "service" },
        { description: "Embalming & Prep", amountCents: Math.round(standardTotal * 0.2), category: "service" },
        { description: "Casket", amountCents: Math.round(standardTotal * 0.35), category: "merchandise" },
        ...(flowers
          ? [{ description: "Floral tribute", amountCents: Math.round(standardTotal * 0.1), category: "merchandise" as const }]
          : []),
      ],
      isRecommended: true,
      sortOrder: 1,
    },
    {
      tier: "Premium",
      name: "Premium Tier",
      description: "Full commemorative suite",
      totalCents: premiumTotal,
      inclusions: [
        "Includes all Standard services",
        "Limousine & lead car escort",
        "Solid hardwood casket choice",
        "Premium memorial stationery",
      ],
      assumptions: { attendeeCount, venueTier: constraints?.venueTier ?? "premium" },
      lineItems: [
        { description: "Professional services", amountCents: Math.round(premiumTotal * 0.35), category: "service" },
        { description: "Premium casket", amountCents: Math.round(premiumTotal * 0.45), category: "merchandise" },
        { description: "Transport & escort", amountCents: Math.round(premiumTotal * 0.2), category: "service" },
      ],
      isRecommended: false,
      sortOrder: 2,
    },
  ];

  const confidenceIndicator =
    caseData.budgetMin != null && caseData.budgetMax != null ? "high" : caseData.budgetPreference ? "medium" : "low";

  return { packages, confidenceIndicator };
}

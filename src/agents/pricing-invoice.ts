import type { CaseInput, PricingInvoiceOutput, PricingConstraints } from "./types";
import { buildPackagesFromPriceBook } from "@/lib/pricing/buildPackages";

export function runPricingInvoiceAgent(
  caseData: CaseInput,
  constraints?: PricingConstraints
): PricingInvoiceOutput {
  const packages = buildPackagesFromPriceBook(caseData, constraints);
  const confidenceIndicator =
    caseData.budgetMin != null && caseData.budgetMax != null
      ? "high"
      : caseData.budgetPreference
        ? "medium"
        : "low";
  return { packages, confidenceIndicator };
}

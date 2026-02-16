"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { runOrchestrator } from "@/orchestrator/run";
import { buildQuotePdf } from "@/lib/pdf/quote";
import type { PricingConstraints } from "@/agents/types";

const QUOTE_DISCLAIMER =
  "Director review required. This is not legal advice. All figures are estimates and subject to change.";

export async function setRecommendedPackage(caseId: string, packageId: string) {
  await prisma.package.updateMany({
    where: { caseId },
    data: { isRecommended: false },
  });
  await prisma.package.update({
    where: { id: packageId },
    data: { isRecommended: true },
  });
  await prisma.case.update({
    where: { id: caseId },
    data: { recommendedPackageId: packageId },
  });
  revalidatePath(`/cases/${caseId}/packages`);
  revalidatePath(`/cases/${caseId}/invoice`);
}

export async function regeneratePackages(caseId: string, constraints?: PricingConstraints) {
  await runOrchestrator(caseId, constraints);
  revalidatePath(`/cases/${caseId}/packages`);
}

export async function getQuotePdfBuffer(caseId: string): Promise<Uint8Array> {
  const caseRecord = await prisma.case.findUniqueOrThrow({
    where: { id: caseId },
    include: {
      packages: {
        orderBy: { sortOrder: "asc" },
        include: { quoteLineItems: true },
      },
      organization: true,
    },
  });

  const packages = caseRecord.packages.map((p) => ({
    name: p.name,
    tier: p.tier,
    totalCents: p.totalCents,
    lineItems: p.quoteLineItems.map((l) => ({
      description: l.description,
      amountCents: l.amountCents,
      category: l.category,
    })),
    assumptions: typeof p.assumptions === "string" ? p.assumptions : JSON.stringify(p.assumptions ?? {}),
  }));

  return buildQuotePdf({
    caseNumber: caseRecord.caseNumber,
    deceasedName: caseRecord.deceasedFullName,
    organizationName: caseRecord.organization.name,
    packages,
    disclaimer: QUOTE_DISCLAIMER,
  });
}

export async function proceedToEmail(caseId: string) {
  revalidatePath(`/cases/${caseId}/email`);
  redirect(`/cases/${caseId}/email`);
}

export type SelectVenuePayload = {
  name: string;
  address: string;
  category: string;
  mapsUrl: string;
};

export async function selectVenue(caseId: string, venue: SelectVenuePayload) {
  await prisma.case.update({
    where: { id: caseId },
    data: {
      selectedVenueName: venue.name || null,
      selectedVenueAddress: venue.address || null,
      selectedVenueCategory: venue.category || null,
      selectedVenueMapsUrl: venue.mapsUrl || null,
    },
  });
  revalidatePath(`/cases/${caseId}/packages`);
  revalidatePath(`/cases/${caseId}/intake`);
}

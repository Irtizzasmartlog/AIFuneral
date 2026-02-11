"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { runOrchestrator } from "@/orchestrator/run";
import type { PricingConstraints } from "@/agents/types";
import type { IntakeFormValues } from "@/lib/validations/intake";
import type { IntakeResultJSON, CasePatch, IntakePackage } from "@/lib/chat/types";

function parseDate(s: string | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

export async function updateCaseFromIntake(caseId: string, data: IntakeFormValues) {
  const addOns = data.addOns
    ? JSON.stringify(data.addOns)
    : undefined;
  await prisma.case.update({
    where: { id: caseId },
    data: {
      deceasedFullName: data.deceasedFullName || null,
      deceasedDob: parseDate(data.deceasedDob) ?? undefined,
      deceasedDod: parseDate(data.deceasedDod) ?? undefined,
      deceasedPreferredName: data.deceasedPreferredName || null,
      deceasedGender: data.deceasedGender || null,
      nextOfKinName: data.nextOfKinName || null,
      nextOfKinRelationship: data.nextOfKinRelationship || null,
      nextOfKinPhone: data.nextOfKinPhone || null,
      nextOfKinEmail: data.nextOfKinEmail || null,
      serviceType: data.serviceType ?? null,
      serviceStyle: data.serviceStyle ?? null,
      venuePreference: data.venuePreference || null,
      expectedAttendeesMin: data.expectedAttendeesMin ?? null,
      expectedAttendeesMax: data.expectedAttendeesMax ?? null,
      budgetMin: data.budgetMin != null ? data.budgetMin * 100 : null,
      budgetMax: data.budgetMax != null ? data.budgetMax * 100 : null,
      budgetPreference: data.budgetPreference ?? null,
      suburb: data.suburb || null,
      state: data.state || null,
      preferredServiceDate: parseDate(data.preferredServiceDate) ?? undefined,
      dateFlexibility: data.dateFlexibility ?? null,
      culturalFaithRequirements: data.culturalFaithRequirements || null,
      notes: data.notes || null,
      internalNotes: data.internalNotes || null,
      urgency: data.urgency || null,
      addOns: addOns ?? undefined,
    },
  });
  revalidatePath(`/cases/${caseId}/intake`);
  revalidatePath("/");
  return { success: true };
}

export async function generatePackages(caseId: string, constraints?: PricingConstraints) {
  await runOrchestrator(caseId, constraints);
  revalidatePath(`/cases/${caseId}/packages`);
  revalidatePath(`/cases/${caseId}/intake`);
  revalidatePath("/");
  redirect(`/cases/${caseId}/packages`);
}

function parseDateFromPatch(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function casePatchToUpdateData(patch: CasePatch): Record<string, unknown> {
  return {
    deceasedFullName: patch.deceasedFullName ?? undefined,
    deceasedDob: parseDateFromPatch(patch.deceasedDob as string) ?? undefined,
    deceasedDod: parseDateFromPatch(patch.deceasedDod as string) ?? undefined,
    deceasedPreferredName: patch.deceasedPreferredName ?? undefined,
    deceasedGender: patch.deceasedGender ?? undefined,
    nextOfKinName: patch.nextOfKinName ?? undefined,
    nextOfKinRelationship: patch.nextOfKinRelationship ?? undefined,
    nextOfKinPhone: patch.nextOfKinPhone ?? undefined,
    nextOfKinEmail: patch.nextOfKinEmail ?? undefined,
    serviceType: patch.serviceType ?? undefined,
    serviceStyle: patch.serviceStyle ?? undefined,
    venuePreference: patch.venuePreference ?? undefined,
    expectedAttendeesMin: patch.expectedAttendeesMin ?? undefined,
    expectedAttendeesMax: patch.expectedAttendeesMax ?? undefined,
    budgetMin: typeof patch.budgetMin === "number" ? patch.budgetMin * 100 : undefined,
    budgetMax: typeof patch.budgetMax === "number" ? patch.budgetMax * 100 : undefined,
    budgetPreference: patch.budgetPreference ?? undefined,
    suburb: patch.suburb ?? undefined,
    state: patch.state ?? undefined,
    preferredServiceDate: parseDateFromPatch(patch.preferredServiceDate as string) ?? undefined,
    dateFlexibility: patch.dateFlexibility ?? undefined,
    culturalFaithRequirements: patch.culturalFaithRequirements ?? undefined,
    notes: patch.notes ?? undefined,
    internalNotes: patch.internalNotes ?? undefined,
    urgency: patch.urgency ?? undefined,
    addOns: typeof patch.addOns === "string" ? patch.addOns : undefined,
  };
}

export async function applyIntakeToCase(caseId: string, parsed: IntakeResultJSON) {
  const patchData = casePatchToUpdateData(parsed.case_patch);
  const updatePayload: Record<string, unknown> = { ...patchData };
  if (parsed.assumptions?.length || parsed.compliance_checklist?.length) {
    updatePayload.internalNotes = JSON.stringify({
      intakeAssumptions: parsed.assumptions ?? [],
      complianceChecklist: parsed.compliance_checklist ?? [],
    });
  }

  await prisma.$transaction(async (tx) => {
    await tx.case.update({
      where: { id: caseId },
      data: updatePayload as any,
    });

    if (parsed.mode === "GENERATED" && parsed.packages?.length) {
      await tx.package.deleteMany({ where: { caseId } });
      for (const pkg of parsed.packages as IntakePackage[]) {
        const created = await tx.package.create({
          data: {
            caseId,
            tier: pkg.tier,
            name: pkg.name,
            description: pkg.description,
            totalCents: pkg.totalCents,
            inclusions: JSON.stringify(pkg.inclusions),
            assumptions: JSON.stringify(pkg.assumptions),
            isRecommended: pkg.isRecommended,
            sortOrder: pkg.sortOrder,
          },
        });
        for (const line of pkg.lineItems) {
          await tx.quoteLineItem.create({
            data: {
              packageId: created.id,
              description: line.description,
              amountCents: line.amountCents,
              category: line.category,
            },
          });
        }
      }
      await tx.case.update({
        where: { id: caseId },
        data: { status: "Quoted" },
      });
    }
  });

  revalidatePath(`/cases/${caseId}/intake`);
  revalidatePath(`/cases/${caseId}/packages`);
  revalidatePath("/");
  return { success: true };
}

export async function getIntakeChatMessages(caseId: string): Promise<{ role: string; content: string }[]> {
  const messages = await prisma.caseChatMessage.findMany({
    where: { caseId },
    orderBy: { createdAt: "asc" },
  });
  return messages.map((m) => ({ role: m.role, content: m.content }));
}

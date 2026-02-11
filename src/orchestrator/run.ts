import { prisma } from "@/lib/prisma";
import { runFamilyConcentrationAgent } from "@/agents/family-concentration";
import { runSchedulingLogisticsAgent } from "@/agents/scheduling-logistics";
import { runDocumentationComplianceAgent } from "@/agents/documentation-compliance";
import { runPricingInvoiceAgent } from "@/agents/pricing-invoice";
import type { CaseInput, PricingConstraints } from "@/agents/types";

export type OrchestratorResult = {
  familyPreferences: ReturnType<typeof runFamilyConcentrationAgent>;
  tasks: ReturnType<typeof runSchedulingLogisticsAgent>["tasks"];
  documentChecklist: ReturnType<typeof runDocumentationComplianceAgent>["documentChecklist"];
  packages: ReturnType<typeof runPricingInvoiceAgent>["packages"];
};

export async function runOrchestrator(
  caseId: string,
  constraints?: PricingConstraints
): Promise<OrchestratorResult> {
  const caseRecord = await prisma.case.findUniqueOrThrow({
    where: { id: caseId },
  });

  const caseInput: CaseInput = {
    id: caseRecord.id,
    deceasedFullName: caseRecord.deceasedFullName,
    deceasedDob: caseRecord.deceasedDob,
    deceasedDod: caseRecord.deceasedDod,
    deceasedPreferredName: caseRecord.deceasedPreferredName,
    deceasedGender: caseRecord.deceasedGender,
    nextOfKinName: caseRecord.nextOfKinName,
    nextOfKinRelationship: caseRecord.nextOfKinRelationship,
    nextOfKinPhone: caseRecord.nextOfKinPhone,
    nextOfKinEmail: caseRecord.nextOfKinEmail,
    serviceType: caseRecord.serviceType,
    serviceStyle: caseRecord.serviceStyle,
    venuePreference: caseRecord.venuePreference,
    expectedAttendeesMin: caseRecord.expectedAttendeesMin,
    expectedAttendeesMax: caseRecord.expectedAttendeesMax,
    budgetMin: caseRecord.budgetMin,
    budgetMax: caseRecord.budgetMax,
    budgetPreference: caseRecord.budgetPreference,
    suburb: caseRecord.suburb,
    state: caseRecord.state,
    preferredServiceDate: caseRecord.preferredServiceDate,
    dateFlexibility: caseRecord.dateFlexibility,
    culturalFaithRequirements: caseRecord.culturalFaithRequirements,
    notes: caseRecord.notes,
    internalNotes: caseRecord.internalNotes,
    urgency: caseRecord.urgency,
    addOns: caseRecord.addOns,
  };

  const familyResult = runFamilyConcentrationAgent(caseInput);
  await prisma.agentRun.create({
    data: {
      caseId,
      agentName: "FamilyConcentration",
      inputSnapshot: JSON.stringify({ caseId: caseInput.id }),
      outputSnapshot: JSON.stringify(familyResult),
    },
  });

  const schedulingResult = runSchedulingLogisticsAgent(caseInput);
  await prisma.agentRun.create({
    data: {
      caseId,
      agentName: "SchedulingLogistics",
      inputSnapshot: JSON.stringify({ caseId: caseInput.id }),
      outputSnapshot: JSON.stringify(schedulingResult),
    },
  });

  const complianceResult = runDocumentationComplianceAgent(caseInput);
  await prisma.agentRun.create({
    data: {
      caseId,
      agentName: "DocumentationCompliance",
      inputSnapshot: JSON.stringify({ caseId: caseInput.id }),
      outputSnapshot: JSON.stringify(complianceResult),
    },
  });

  const pricingResult = runPricingInvoiceAgent(caseInput, constraints);
  await prisma.agentRun.create({
    data: {
      caseId,
      agentName: "PricingInvoice",
      inputSnapshot: JSON.stringify({ caseId: caseInput.id, constraints }),
      outputSnapshot: JSON.stringify(pricingResult),
    },
  });

  await prisma.$transaction(async (tx) => {
    await tx.package.deleteMany({ where: { caseId } });
    await tx.task.deleteMany({ where: { caseId } });

    for (const pkg of pricingResult.packages) {
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

    for (const task of schedulingResult.tasks) {
      await tx.task.create({
        data: {
          caseId,
          title: task.title,
          dueDate: task.dueDate ? new Date(task.dueDate) : null,
          category: task.category,
          source: "agent",
        },
      });
    }
  });

  await prisma.case.update({
    where: { id: caseId },
    data: { status: "Quoted" },
  });

  return {
    familyPreferences: familyResult,
    tasks: schedulingResult.tasks,
    documentChecklist: complianceResult.documentChecklist,
    packages: pricingResult.packages,
  };
}

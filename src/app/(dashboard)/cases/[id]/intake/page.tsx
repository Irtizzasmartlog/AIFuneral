import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Stepper, type StepKey } from "@/components/Stepper";
import { IntakeChatClient } from "./IntakeChatClient";
import { getIntakeChatMessages } from "@/app/actions/case";
import type { CasePatch } from "@/lib/chat/types";

function caseToPatch(c: {
  deceasedFullName: string | null;
  deceasedDob: Date | null;
  deceasedDod: Date | null;
  deceasedPreferredName: string | null;
  nextOfKinName: string | null;
  nextOfKinRelationship: string | null;
  nextOfKinPhone: string | null;
  nextOfKinEmail: string | null;
  serviceType: string | null;
  serviceStyle: string | null;
  venuePreference: string | null;
  expectedAttendeesMin: number | null;
  expectedAttendeesMax: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetPreference: string | null;
  suburb: string | null;
  state: string | null;
  preferredServiceDate: Date | null;
  dateFlexibility: string | null;
  culturalFaithRequirements: string | null;
  notes: string | null;
  addOns: string | null;
  urgency: string | null;
}): CasePatch {
  const toIso = (d: Date | null) => (d ? d.toISOString().slice(0, 10) : null);
  return {
    deceasedFullName: c.deceasedFullName ?? undefined,
    deceasedDob: toIso(c.deceasedDob),
    deceasedDod: toIso(c.deceasedDod),
    deceasedPreferredName: c.deceasedPreferredName ?? undefined,
    nextOfKinName: c.nextOfKinName ?? undefined,
    nextOfKinRelationship: c.nextOfKinRelationship ?? undefined,
    nextOfKinPhone: c.nextOfKinPhone ?? undefined,
    nextOfKinEmail: c.nextOfKinEmail ?? undefined,
    serviceType: c.serviceType ?? undefined,
    serviceStyle: c.serviceStyle ?? undefined,
    venuePreference: c.venuePreference ?? undefined,
    expectedAttendeesMin: c.expectedAttendeesMin ?? undefined,
    expectedAttendeesMax: c.expectedAttendeesMax ?? undefined,
    budgetMin: c.budgetMin != null ? c.budgetMin / 100 : undefined,
    budgetMax: c.budgetMax != null ? c.budgetMax / 100 : undefined,
    budgetPreference: c.budgetPreference ?? undefined,
    suburb: c.suburb ?? undefined,
    state: c.state ?? undefined,
    preferredServiceDate: toIso(c.preferredServiceDate),
    dateFlexibility: c.dateFlexibility ?? undefined,
    culturalFaithRequirements: c.culturalFaithRequirements ?? undefined,
    notes: c.notes ?? undefined,
    addOns: c.addOns ?? undefined,
    urgency: c.urgency ?? undefined,
  };
}

export default async function IntakePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseRecord = await prisma.case.findUnique({
    where: { id },
    include: { intakeState: true },
  });
  if (!caseRecord) notFound();

  const initialMessages = await getIntakeChatMessages(id);
  let initialCaseData: CasePatch | null = null;
  if (caseRecord.intakeState?.collectedJson) {
    try {
      initialCaseData = JSON.parse(caseRecord.intakeState.collectedJson) as CasePatch;
    } catch {
      initialCaseData = caseToPatch(caseRecord);
    }
  } else {
    initialCaseData = caseToPatch(caseRecord);
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              New Case Intake
            </h1>
            <p className="text-sm text-slate-500">
              Step 1: Chat intake (one question at a time)
            </p>
          </div>
        </div>
        <div className="mb-8">
          <Stepper currentStep={"intake" as StepKey} caseId={id} />
        </div>
      </div>
      <IntakeChatClient
        caseId={id}
        caseNumber={caseRecord.caseNumber}
        initialMessages={initialMessages}
        initialCaseData={initialCaseData}
      />
    </div>
  );
}

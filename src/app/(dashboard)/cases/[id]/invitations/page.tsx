import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Stepper, type StepKey } from "@/components/Stepper";
import { InvitationWizard } from "./InvitationWizard";
import { InvitationsLockedCard } from "./InvitationsLockedCard";

export default async function InvitationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseRecord = await prisma.case.findUnique({
    where: { id },
    include: {
      invitationInstances: { include: { template: true, guests: true } },
    },
  });

  if (!caseRecord) notFound();

  let addOns: { invitations?: boolean } = {};
  try {
    addOns = caseRecord.addOns ? JSON.parse(caseRecord.addOns) : {};
  } catch (_) {}

  const invitationsEnabled = addOns.invitations === true;
  const templates = await prisma.invitationTemplate.findMany({ take: 6 });
  const instance = caseRecord.invitationInstances[0] ?? null;

  if (!invitationsEnabled) {
    return (
      <div className="max-w-6xl mx-auto px-8 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invitations & Add-ons</h1>
          <p className="text-sm text-slate-500">Step 4: Invitation designer</p>
        </div>
        <div className="mb-6">
          <Stepper currentStep={"invitations" as StepKey} caseId={id} />
        </div>
        <InvitationsLockedCard caseId={id} />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Invitations & Add-ons</h1>
        <p className="text-sm text-slate-500">Step 4: Configure digital and print invitations</p>
      </div>
      <div className="mb-6">
        <Stepper currentStep={"invitations" as StepKey} caseId={id} />
      </div>
      <InvitationWizard
        caseId={id}
        caseData={{
          deceasedFullName: caseRecord.deceasedFullName,
          preferredServiceDate: caseRecord.preferredServiceDate,
          venuePreference: caseRecord.venuePreference,
          suburb: caseRecord.suburb,
          state: caseRecord.state,
        }}
        templates={templates}
        instance={instance}
      />
    </div>
  );
}

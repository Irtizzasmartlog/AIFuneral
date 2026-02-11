import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Stepper, type StepKey } from "@/components/Stepper";
import { EmailComposer } from "./EmailComposer";
import { Button } from "@/components/ui/button";
import { Gavel, ArrowRight } from "lucide-react";

export default async function EmailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseRecord = await prisma.case.findUnique({
    where: { id },
    include: {
      packages: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!caseRecord) notFound();

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Email & Client Approval</h1>
          <p className="text-sm text-slate-500">Step 3: Send quote to client for approval</p>
        </div>
        <Button variant="outline" asChild>
          <Link href={`/cases/${id}/invitations`} className="flex items-center gap-2">
            Next: Invitations
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <div className="mb-6">
        <Stepper currentStep={"email" as StepKey} caseId={id} />
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-lg px-6 py-3 flex items-center gap-3 mb-6">
        <Gavel className="h-5 w-5 text-amber-600 shrink-0" />
        <p className="text-sm font-medium text-amber-800">
          <span className="font-bold">Compliance Notice:</span> All legal documents must be reviewed and verified for compliance before sending to the family. Digital signatures are legally binding in this jurisdiction.
        </p>
      </div>

      <EmailComposer
        caseId={id}
        caseNumber={caseRecord.caseNumber}
        deceasedName={caseRecord.deceasedFullName}
        nextOfKinEmail={caseRecord.nextOfKinEmail}
        packages={caseRecord.packages}
      />
    </div>
  );
}

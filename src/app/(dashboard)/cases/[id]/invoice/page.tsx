import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Stepper, type StepKey } from "@/components/Stepper";
import { InvoiceSummary } from "@/components/case/InvoiceSummary";
import { BookingChecklist } from "@/components/case/BookingChecklist";
import { ActivityLog } from "@/components/case/ActivityLog";
import { getOrCreateInvoice } from "@/app/actions/invoice";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default async function InvoicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseRecord = await prisma.case.findUnique({
    where: { id },
    include: {
      tasks: { orderBy: { dueDate: "asc" } },
      agentRuns: { orderBy: { createdAt: "desc" }, take: 10 },
      emailLogs: { orderBy: { sentAt: "desc" }, take: 5 },
      changeRequests: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });

  if (!caseRecord) notFound();

  const invoice = await getOrCreateInvoice(id);

  const activityItems = [
    ...caseRecord.agentRuns.map((r) => ({
      id: r.id,
      type: "agent" as const,
      message: `${r.agentName} completed.`,
      createdAt: r.createdAt,
      meta: r.agentName,
    })),
    ...caseRecord.emailLogs.map((e) => ({
      id: e.id,
      type: "email" as const,
      message: `Email sent to ${e.to}: ${e.subject}`,
      createdAt: e.sentAt,
    })),
    ...caseRecord.changeRequests.map((c) => ({
      id: c.id,
      type: "user" as const,
      message: `Change request received: ${c.message.slice(0, 80)}...`,
      createdAt: c.createdAt,
    })),
  ];

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              {caseRecord.deceasedFullName ?? "Case"}
            </h1>
            <p className="text-sm text-slate-500">
              Case ID: {caseRecord.caseNumber} | Last updated {caseRecord.updatedAt.toLocaleDateString("en-AU")}
            </p>
          </div>
          <Button asChild>
            <Link href={`/cases/${id}/invoice`} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Invoice & booking
            </Link>
          </Button>
        </div>
      </div>
      <div className="mb-6">
        <Stepper currentStep={"invoice" as StepKey} caseId={id} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <InvoiceSummary caseId={id} invoice={invoice} />
          <Card>
            <CardHeader className="p-4 border-b border-slate-100">
              <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider flex items-center gap-2">
                Booking timeline
              </h3>
            </CardHeader>
            <CardContent className="p-6">
              <div className="flex justify-between text-sm text-slate-600">
                <span>Intake</span>
                <span>Packages</span>
                <span>Email</span>
                <span>Invoice</span>
              </div>
              <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{
                    width: caseRecord.status === "Completed" ? "100%" : caseRecord.status === "Booked" ? "90%" : "70%",
                  }}
                />
              </div>
            </CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <BookingChecklist caseId={id} tasks={caseRecord.tasks} />
          <ActivityLog items={activityItems} />
        </div>
      </div>
    </div>
  );
}

import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Stepper, type StepKey } from "@/components/Stepper";
import { PackageCards } from "@/components/case/PackageCards";
import { PackagesPageClient } from "./PackagesPageClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Sparkles, Send, FileDown } from "lucide-react";

export default async function PackagesPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseRecord = await prisma.case.findUnique({
    where: { id },
    include: {
      packages: {
        orderBy: { sortOrder: "asc" },
        include: { quoteLineItems: true },
      },
      agentRuns: {
        where: { agentName: "FamilyConcentration" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!caseRecord) notFound();

  const familyRun = caseRecord.agentRuns[0];
  let personalizationSummary = "Based on the family's intake interview, preferences have been applied to tailor the packages below.";
  if (familyRun?.outputSnapshot) {
    try {
      const out = JSON.parse(familyRun.outputSnapshot);
      if (out.toneGuidance) {
        personalizationSummary = `Based on the family's intake: ${out.toneGuidance} ${(out.preferences ?? []).slice(0, 2).join(". ")}`;
      }
    } catch (_) {}
  }

  const selectedPackageId = caseRecord.recommendedPackageId ?? caseRecord.packages.find((p) => p.isRecommended)?.id ?? null;
  const selectedPackage = caseRecord.packages.find((p) => p.id === selectedPackageId);

  return (
    <div className="flex-1 flex overflow-hidden">
      <main className="flex-1 overflow-y-auto custom-scrollbar p-8 flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Packages & Quote</h1>
            <p className="text-sm text-slate-500">Step 2: Review AI-generated packages</p>
          </div>
          <Stepper currentStep={"packages" as StepKey} caseId={id} />
        </div>

        {caseRecord.packages.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-slate-500 mb-4">No packages yet. Generate packages from the Intake step.</p>
              <Button asChild>
                <Link href={`/cases/${id}/intake`}>Go to Intake</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <section className="relative overflow-hidden bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border border-primary/20 rounded-2xl p-6 flex items-start gap-6">
              <div className="bg-primary/20 p-3 rounded-xl">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <div className="max-w-3xl flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold text-primary uppercase tracking-widest">AI Intelligence Report</span>
                  <span className="h-1 w-1 bg-primary rounded-full" />
                  <span className="text-[10px] font-medium text-slate-500 uppercase">Case ID: {caseRecord.caseNumber}</span>
                </div>
                <h2 className="text-xl font-semibold mb-2">Package Personalization Summary</h2>
                <p className="text-slate-600 leading-relaxed text-sm italic">{personalizationSummary}</p>
              </div>
              <PackagesPageClient caseId={id} />
            </section>

            <PackageCards
              caseId={id}
              packages={caseRecord.packages}
              selectedPackageId={selectedPackageId}
            />
          </>
        )}
      </main>

      {caseRecord.packages.length > 0 && (
        <aside className="w-80 bg-white border-l border-slate-200 flex flex-col shrink-0">
          <div className="p-6 border-b border-slate-200">
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Case Snapshot</h2>
            <div className="flex items-center gap-4 mb-8">
              <div className="w-14 h-14 rounded-full border-2 border-primary/20 bg-slate-100 flex items-center justify-center text-slate-600 font-bold text-lg">
                {(caseRecord.deceasedFullName ?? "?").slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-base font-bold leading-none mb-1">{caseRecord.deceasedFullName ?? "N/A"}</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  DOB: {caseRecord.deceasedDob ? new Date(caseRecord.deceasedDob).toLocaleDateString("en-AU") : "N/A"}
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Primary Contact</p>
                <p className="text-sm font-semibold">{caseRecord.nextOfKinName ?? "N/A"}</p>
                <p className="text-xs text-slate-500">{caseRecord.nextOfKinPhone ?? caseRecord.nextOfKinEmail ?? ""}</p>
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Service Location</p>
                <p className="text-sm font-semibold">{caseRecord.venuePreference ?? "TBD"}</p>
                <p className="text-xs text-slate-500">{caseRecord.suburb}, {caseRecord.state}</p>
              </div>
            </div>
          </div>
          <div className="p-6 flex-1 bg-slate-50/50">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-4">Quote Summary</p>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Selected Tier</span>
                <span className="font-bold">{selectedPackage?.name ?? "None"}</span>
              </div>
              {selectedPackage && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-500">Estimated Total</span>
                    <span className="font-semibold text-slate-700">
                      {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(selectedPackage.totalCents / 100)}
                    </span>
                  </div>
                  <div className="pt-4 mt-4 border-t border-slate-200 flex justify-between items-end">
                    <span className="text-xs font-bold text-slate-400 uppercase">Total</span>
                    <span className="text-2xl font-black text-primary">
                      {new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(selectedPackage.totalCents / 100)}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
          <div className="p-6 border-t border-slate-200 bg-white flex flex-col gap-3">
            <Button asChild className="w-full">
              <Link href={`/cases/${id}/email`} className="flex items-center justify-center gap-2">
                <Send className="h-4 w-4" />
                Proceed to Email
              </Link>
            </Button>
            <div className="grid grid-cols-2 gap-3">
              <Button variant="outline" asChild className="flex items-center justify-center gap-2">
                <a href={`/api/cases/${id}/quote-pdf`} download={`quote-${caseRecord.caseNumber}.pdf`}>
                  <FileDown className="h-4 w-4" />
                  Download Quote
                </a>
              </Button>
              <PackagesPageClient caseId={id} showModify />
            </div>
          </div>
        </aside>
      )}
    </div>
  );
}

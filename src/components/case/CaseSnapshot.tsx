"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Church, Globe, BarChart3 } from "lucide-react";

type CaseSnapshotProps = {
  caseNumber: string;
  subjectName: string | null;
  status: string;
  completionPercent: number;
  serviceType: string | null;
  serviceStyle: string | null;
  culturalFaith: string | null;
  estimatedTotalCents: number | null;
  aiSuggestion: string | null;
};

export function CaseSnapshot({
  caseNumber,
  subjectName,
  status,
  completionPercent,
  serviceType,
  serviceStyle,
  culturalFaith,
  estimatedTotalCents,
  aiSuggestion,
}: CaseSnapshotProps) {
  const estimatedTotal =
    estimatedTotalCents != null
      ? new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(
          estimatedTotalCents / 100
        )
      : null;

  return (
    <div className="w-80 flex-shrink-0 sticky top-0">
      <Card className="overflow-hidden">
        <CardHeader className="p-4 bg-slate-50 border-b border-slate-200 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-widest">
              Case Snapshot
            </h3>
          </div>
          <Badge variant={status === "Draft" ? "warning" : "secondary"}>
            {status === "Draft" ? "In Progress" : status}
          </Badge>
        </CardHeader>
        <CardContent className="p-5 space-y-6">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              Subject
            </p>
            <p className="text-sm font-semibold text-slate-900">
              {subjectName || "Not set"}
            </p>
            <p className="text-[11px] text-slate-500">Case ID: {caseNumber}</p>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500">Form Completion</span>
              <span className="font-bold">{completionPercent}%</span>
            </div>
            <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${Math.min(100, completionPercent)}%` }}
              />
            </div>
          </div>
          <div className="space-y-4">
            {serviceType && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                  <Church className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Service
                  </p>
                  <p className="text-xs font-medium text-slate-700 capitalize">
                    {serviceType} {serviceStyle ? `(${serviceStyle})` : ""}
                  </p>
                </div>
              </div>
            )}
            {(culturalFaith || serviceStyle) && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                  <Globe className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Affiliation
                  </p>
                  <p className="text-xs font-medium text-slate-700">
                    {culturalFaith || serviceStyle || "Not specified"}
                  </p>
                </div>
              </div>
            )}
          </div>
          {estimatedTotal && (
            <div className="pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold text-slate-900">Estimated Total</span>
                <span className="text-lg font-bold text-slate-900">{estimatedTotal}</span>
              </div>
              {aiSuggestion && (
                <div className="p-3 bg-blue-50 rounded-lg flex items-start gap-3">
                  <span className="text-primary text-sm mt-0.5">&#9733;</span>
                  <p className="text-[10px] text-primary/80 leading-relaxed">
                    {aiSuggestion}
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <div className="mt-4 p-4 border border-dashed border-slate-300 rounded-xl text-center">
        <button
          type="button"
          onClick={() => window.print()}
          className="text-xs font-semibold text-slate-500 hover:text-primary transition-colors flex items-center justify-center gap-2 w-full"
        >
          <BarChart3 className="h-4 w-4" />
          Print Intake Summary
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Check, ChevronDown, ChevronUp } from "lucide-react";
import { setRecommendedPackage } from "@/app/actions/packages";

type PackageWithLines = {
  id: string;
  tier: string;
  name: string;
  description: string | null;
  totalCents: number;
  inclusions: string | null;
  isRecommended: boolean;
  quoteLineItems: { description: string; amountCents: number; category: string }[];
};

export function PackageCards({
  caseId,
  packages,
  selectedPackageId,
}: {
  caseId: string;
  packages: PackageWithLines[];
  selectedPackageId: string | null;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(
    packages.find((p) => p.isRecommended)?.id ?? packages[0]?.id ?? null
  );
  const [updating, setUpdating] = useState<string | null>(null);

  const formatAud = (cents: number) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD", minimumFractionDigits: 0 }).format(
      cents / 100
    );

  async function handleSelect(packageId: string) {
    setUpdating(packageId);
    try {
      await setRecommendedPackage(caseId, packageId);
      setExpandedId(packageId);
    } finally {
      setUpdating(null);
    }
  }

  const currentSelected = selectedPackageId ?? packages.find((p) => p.isRecommended)?.id ?? packages[0]?.id;

  return (
    <RadioGroup
      value={currentSelected ?? ""}
      onValueChange={handleSelect}
      className="grid grid-cols-1 xl:grid-cols-3 gap-6"
    >
      {packages.map((pkg) => {
        const inclusions: string[] = pkg.inclusions ? JSON.parse(pkg.inclusions) : [];
        const isRecommended = pkg.isRecommended;
        const isExpanded = expandedId === pkg.id;
        const isSelected = currentSelected === pkg.id;

        return (
          <Card
            key={pkg.id}
            className={`flex flex-col ${
              isSelected ? "border-2 border-primary ring-4 ring-primary/5 shadow-xl" : "border border-slate-200"
            }`}
          >
            {isRecommended && (
              <div className="bg-primary text-white text-[10px] font-black px-4 py-1 rounded-full uppercase tracking-widest w-fit mx-auto -mt-3 relative z-10">
                Recommended
              </div>
            )}
            <CardHeader className="pb-2">
              <h3 className="text-xl font-bold">{pkg.name}</h3>
              <p className="text-sm text-slate-500">{pkg.description ?? ""}</p>
              <div className="flex items-baseline gap-1 mt-2">
                <span className={isSelected ? "text-4xl font-black text-primary" : "text-3xl font-bold text-slate-900"}>
                  {formatAud(pkg.totalCents)}
                </span>
                <span className="text-xs text-slate-400 font-medium">EST. TOTAL</span>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-1">
              <div className="py-4 border-y border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {isSelected ? "Selected Option" : "Select Package"}
                </span>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value={pkg.id} id={pkg.id} disabled={updating !== null} />
                  <Label htmlFor={pkg.id} className="cursor-pointer text-xs font-bold">
                    {isSelected ? "Selected" : "Select"}
                  </Label>
                </div>
              </div>
              <ul className="space-y-3 my-6 flex-1">
                {inclusions.map((inc, i) => (
                  <li key={i} className="flex items-start gap-3 text-sm">
                    <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                    <span>{inc}</span>
                  </li>
                ))}
              </ul>
              <Button
                variant="outline"
                className="w-full justify-between"
                onClick={() => setExpandedId(isExpanded ? null : pkg.id)}
              >
                <span>{isExpanded ? "HIDE BREAKDOWN" : "VIEW BREAKDOWN"}</span>
                {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
              {isExpanded && (
                <div className="mt-4 space-y-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Professional fees
                    </p>
                    {pkg.quoteLineItems
                      .filter((l) => l.category === "service" || l.category === "merchandise")
                      .map((line, i) => (
                        <div key={i} className="flex justify-between text-[11px] font-medium">
                          <span className="text-slate-600">{line.description}</span>
                          <span className="shrink-0 ml-2">{formatAud(line.amountCents)}</span>
                        </div>
                      ))}
                  </div>
                  <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-100 space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 mb-2">
                      Disbursements (third-party)
                    </p>
                    {pkg.quoteLineItems
                      .filter((l) => l.category === "cashAdvance")
                      .map((line, i) => (
                        <div key={i} className="flex justify-between text-[11px] font-medium">
                          <span className="text-slate-600">{line.description}</span>
                          <span className="shrink-0 ml-2">{formatAud(line.amountCents)}</span>
                        </div>
                      ))}
                  </div>
                  <div className="flex justify-between text-[11px] font-bold border-t border-primary/10 pt-2 text-primary">
                    <span>Total</span>
                    <span>{formatAud(pkg.totalCents)}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 italic">
                    Prices are estimates. Third-party fees vary by cemetery/crematorium. Final quote requires director confirmation.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </RadioGroup>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { recordClientApproval } from "@/app/actions/email";

type PackageItem = { id: string; name: string; tier: string; totalCents: number };

export function ApproveClient({
  token,
  deceasedName,
  packages,
}: {
  token: string;
  deceasedName: string;
  packages: PackageItem[];
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatAud = (cents: number) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);

  async function handleSubmit() {
    if (!selectedId) {
      setError("Please select a package");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await recordClientApproval(token, selectedId);
      if ("error" in result) {
        setError(result.error ?? null);
        return;
      }
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Thank you</h1>
        <p className="text-slate-600">
          Your selection has been recorded. Your funeral director will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg w-full">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
          FF
        </div>
        <span className="font-bold text-lg text-slate-900">FuneralFlow AI</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Review arrangements</h1>
      <p className="text-slate-500 mb-6">
        Please choose a service package for {deceasedName}.
      </p>
      <div className="space-y-4 mb-8">
        {packages.map((pkg) => (
          <Card
            key={pkg.id}
            className={`cursor-pointer transition-all ${
              selectedId === pkg.id ? "border-2 border-primary ring-2 ring-primary/20" : "border border-slate-200"
            }`}
            onClick={() => setSelectedId(pkg.id)}
          >
            <CardHeader className="pb-2">
              <h3 className="font-bold text-slate-800">{pkg.name}</h3>
              <p className="text-2xl font-bold text-primary">{formatAud(pkg.totalCents)}</p>
            </CardHeader>
          </Card>
        ))}
      </div>
      {error && <p className="text-sm text-destructive mb-4">{error}</p>}
      <Button onClick={handleSubmit} disabled={loading || !selectedId} className="w-full">
        {loading ? "Submitting..." : "Confirm selection"}
      </Button>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export function GeneratePackagesButton({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cases/${caseId}/packages/generate`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Failed to generate packages");
        return;
      }
      toast.success(data.count ? `${data.count} packages generated` : "Packages generated");
      router.refresh();
    } catch (e) {
      console.error("[GeneratePackagesButton]", e);
      toast.error("Failed to generate packages");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button onClick={handleGenerate} disabled={loading}>
      {loading ? "Generating..." : "Generate packages"}
    </Button>
  );
}

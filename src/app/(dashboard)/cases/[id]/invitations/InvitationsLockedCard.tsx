"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Lock } from "lucide-react";
import { toggleCaseInvitationsAddOn } from "@/app/actions/invitations";
import { toast } from "sonner";

export function InvitationsLockedCard({ caseId }: { caseId: string }) {
  const router = useRouter();
  const [enabling, setEnabling] = useState(false);

  async function handleEnableAddOn() {
    setEnabling(true);
    try {
      await toggleCaseInvitationsAddOn(caseId);
      toast.success("Invitations add-on enabled");
      router.refresh();
    } catch (e) {
      toast.error("Failed to enable add-on");
      console.error(e);
    } finally {
      setEnabling(false);
    }
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="py-16 px-8 text-center">
        <div className="w-24 h-24 bg-slate-100 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-slate-200">
          <Lock className="h-12 w-12 text-slate-400" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Invitation Designer locked</h2>
        <p className="text-slate-500 mb-10 leading-relaxed">
          Enable the <strong>Invitations</strong> add-on to use the designer and create digital or print invitations for this case.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button onClick={handleEnableAddOn} disabled={enabling} className="flex items-center justify-center gap-2">
            {enabling ? "Enabling..." : "Enable invitations add-on"}
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/cases/${caseId}/intake`}>Return to Intake</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

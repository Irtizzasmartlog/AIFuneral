"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { regeneratePackages } from "@/app/actions/packages";
import { Pencil } from "lucide-react";

type PackagesPageClientProps = {
  caseId: string;
  showModify?: boolean;
};

export function PackagesPageClient({ caseId, showModify }: PackagesPageClientProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attendeeCount, setAttendeeCount] = useState(50);
  const [venueTier, setVenueTier] = useState("standard");
  const [flowers, setFlowers] = useState(true);

  async function handleRegenerate() {
    setLoading(true);
    try {
      await regeneratePackages(caseId, {
        attendeeCount,
        venueTier,
        flowers,
      });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  if (showModify) {
    return (
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="flex items-center justify-center gap-2 w-full">
            <Pencil className="h-4 w-4" />
            Modify
          </Button>
        </SheetTrigger>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Edit assumptions</SheetTitle>
          </SheetHeader>
          <div className="space-y-6 py-6">
            <div className="space-y-2">
              <Label>Attendee count</Label>
              <Input
                type="number"
                min={1}
                value={attendeeCount}
                onChange={(e) => setAttendeeCount(Number(e.target.value))}
              />
            </div>
            <div className="space-y-2">
              <Label>Venue tier</Label>
              <select
                className="w-full h-9 rounded-lg border border-input px-4 text-sm"
                value={venueTier}
                onChange={(e) => setVenueTier(e.target.value)}
              >
                <option value="standard">Standard</option>
                <option value="premium">Premium</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <Label>Include floral tribute</Label>
              <Switch checked={flowers} onCheckedChange={setFlowers} />
            </div>
            <Button onClick={handleRegenerate} disabled={loading} className="w-full">
              {loading ? "Regenerating..." : "Regenerate packages"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="text-primary font-bold text-xs">
          Re-regenerate
        </Button>
      </SheetTrigger>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>Regenerate packages</SheetTitle>
        </SheetHeader>
        <div className="space-y-6 py-6">
          <div className="space-y-2">
            <Label>Attendee count</Label>
            <Input
              type="number"
              min={1}
              value={attendeeCount}
              onChange={(e) => setAttendeeCount(Number(e.target.value))}
            />
          </div>
          <div className="space-y-2">
            <Label>Venue tier</Label>
            <select
              className="w-full h-9 rounded-lg border border-input px-4 text-sm"
              value={venueTier}
              onChange={(e) => setVenueTier(e.target.value)}
            >
              <option value="standard">Standard</option>
              <option value="premium">Premium</option>
            </select>
          </div>
          <div className="flex items-center justify-between">
            <Label>Include floral tribute</Label>
            <Switch checked={flowers} onCheckedChange={setFlowers} />
          </div>
          <Button onClick={handleRegenerate} disabled={loading} className="w-full">
            {loading ? "Regenerating..." : "Regenerate packages"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { User, Church, DollarSign, Globe, PlusCircle } from "lucide-react";
import { intakeFormSchema, type IntakeFormValues } from "@/lib/validations/intake";
import { AU_STATES } from "@/lib/validations/intake";

type CaseData = {
  deceasedFullName: string | null;
  deceasedDob: Date | null;
  deceasedDod: Date | null;
  deceasedPreferredName: string | null;
  deceasedGender: string | null;
  nextOfKinName: string | null;
  nextOfKinRelationship: string | null;
  nextOfKinPhone: string | null;
  nextOfKinEmail: string | null;
  serviceType: string | null;
  serviceStyle: string | null;
  venuePreference: string | null;
  expectedAttendeesMin: number | null;
  expectedAttendeesMax: number | null;
  budgetMin: number | null;
  budgetMax: number | null;
  budgetPreference: string | null;
  suburb: string | null;
  state: string | null;
  preferredServiceDate: Date | null;
  dateFlexibility: string | null;
  culturalFaithRequirements: string | null;
  notes: string | null;
  internalNotes: string | null;
  urgency: string | null;
  addOns: string | null;
};

function toDateStr(d: Date | null): string {
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function defaultValues(c: CaseData): IntakeFormValues {
  let addOns: IntakeFormValues["addOns"];
  try {
    addOns = c.addOns ? JSON.parse(c.addOns) : undefined;
  } catch {
    addOns = undefined;
  }
  return {
    deceasedFullName: c.deceasedFullName ?? "",
    deceasedDob: c.deceasedDob ? toDateStr(c.deceasedDob) : "",
    deceasedDod: c.deceasedDod ? toDateStr(c.deceasedDod) : "",
    deceasedPreferredName: c.deceasedPreferredName ?? "",
    deceasedGender: c.deceasedGender ?? "",
    nextOfKinName: c.nextOfKinName ?? "",
    nextOfKinRelationship: c.nextOfKinRelationship ?? "",
    nextOfKinPhone: c.nextOfKinPhone ?? "",
    nextOfKinEmail: c.nextOfKinEmail ?? "",
    serviceType: (c.serviceType as "burial" | "cremation") ?? undefined,
    serviceStyle: (c.serviceStyle as "religious" | "non-religious" | "celebration") ?? undefined,
    venuePreference: c.venuePreference ?? "",
    expectedAttendeesMin: c.expectedAttendeesMin ?? undefined,
    expectedAttendeesMax: c.expectedAttendeesMax ?? undefined,
    budgetMin: c.budgetMin != null ? c.budgetMin / 100 : undefined,
    budgetMax: c.budgetMax != null ? c.budgetMax / 100 : undefined,
    budgetPreference: (c.budgetPreference as "minimal" | "balanced" | "premium") ?? undefined,
    suburb: c.suburb ?? "",
    state: c.state ?? "",
    preferredServiceDate: c.preferredServiceDate ? toDateStr(c.preferredServiceDate) : "",
    dateFlexibility: (c.dateFlexibility as "fixed" | "+/-2 days" | "flexible") ?? undefined,
    culturalFaithRequirements: c.culturalFaithRequirements ?? "",
    notes: c.notes ?? "",
    internalNotes: c.internalNotes ?? "",
    urgency: c.urgency ?? "",
    addOns,
  };
}

export function IntakeForm({
  caseData,
  onSaveDraft,
  onGeneratePackages,
  isGenerating,
}: {
  caseData: CaseData;
  onSaveDraft: (data: IntakeFormValues) => Promise<void>;
  onGeneratePackages: () => Promise<void>;
  isGenerating: boolean;
}) {
  const form = useForm<IntakeFormValues>({
    resolver: zodResolver(intakeFormSchema),
    defaultValues: defaultValues(caseData),
  });

  const handleSaveDraft = form.handleSubmit(async (data) => {
    await onSaveDraft(data);
  });

  const handleGenerate = form.handleSubmit(async () => {
    await onSaveDraft(form.getValues());
    await onGeneratePackages();
  });

  return (
    <form className="space-y-4 pb-24">
      <Accordion type="multiple" defaultValue={["deceased", "service", "budget", "cultural", "addons"]} className="space-y-4">
        <AccordionItem value="deceased" className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <AccordionTrigger className="px-5 py-5 hover:no-underline [&[data-state=open]>svg]:rotate-180">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-primary flex items-center justify-center">
                <User className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-slate-900">Deceased Details</h2>
                <p className="text-xs text-slate-400">Identify the client and primary contact</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5 col-span-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                  Full Legal Name
                </Label>
                <Input {...form.register("deceasedFullName")} placeholder="e.g. Robert Michael Smith" />
                {form.formState.errors.deceasedFullName && (
                  <p className="text-xs text-destructive">{form.formState.errors.deceasedFullName.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date of Birth</Label>
                <Input type="date" {...form.register("deceasedDob")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date of Passing</Label>
                <Input type="date" {...form.register("deceasedDod")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Preferred Name (optional)</Label>
                <Input {...form.register("deceasedPreferredName")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Gender</Label>
                <Select
                  value={form.watch("deceasedGender")}
                  onValueChange={(v) => form.setValue("deceasedGender", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Non-binary">Non-binary</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Next of Kin Name</Label>
                <Input {...form.register("nextOfKinName")} placeholder="Full name" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Relationship</Label>
                <Input {...form.register("nextOfKinRelationship")} placeholder="e.g. Spouse, Daughter" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Phone</Label>
                <Input {...form.register("nextOfKinPhone")} placeholder="+61 ..." />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Email</Label>
                <Input type="email" {...form.register("nextOfKinEmail")} placeholder="email@example.com" />
                {form.formState.errors.nextOfKinEmail && (
                  <p className="text-xs text-destructive">{form.formState.errors.nextOfKinEmail.message}</p>
                )}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="service" className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <AccordionTrigger className="px-5 py-5 hover:no-underline">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Church className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-slate-900">Service Selection</h2>
                <p className="text-xs text-slate-400">Select core service methodology</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Service Type</Label>
                <Select
                  value={form.watch("serviceType")}
                  onValueChange={(v) => form.setValue("serviceType", v as "burial" | "cremation")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="burial">Burial</SelectItem>
                    <SelectItem value="cremation">Cremation</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Service Style</Label>
                <Select
                  value={form.watch("serviceStyle")}
                  onValueChange={(v) => form.setValue("serviceStyle", v as "religious" | "non-religious" | "celebration")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="religious">Religious</SelectItem>
                    <SelectItem value="non-religious">Non-religious</SelectItem>
                    <SelectItem value="celebration">Celebration</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Venue Preference</Label>
                <Select
                  value={form.watch("venuePreference")}
                  onValueChange={(v) => form.setValue("venuePreference", v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="chapel">Chapel</SelectItem>
                    <SelectItem value="church">Church</SelectItem>
                    <SelectItem value="graveside">Graveside</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expected Attendees (min)</Label>
                <Input type="number" min={0} {...form.register("expectedAttendeesMin")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Expected Attendees (max)</Label>
                <Input type="number" min={0} {...form.register("expectedAttendeesMax")} />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="budget" className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <AccordionTrigger className="px-5 py-5 hover:no-underline">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <DollarSign className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-slate-900">Budget & Location</h2>
                <p className="text-xs text-slate-400">Financial boundaries and venue preferences</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Budget Min (AUD)</Label>
                <Input type="number" min={0} {...form.register("budgetMin")} placeholder="2500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Budget Max (AUD)</Label>
                <Input type="number" min={0} {...form.register("budgetMax")} placeholder="15000" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Budget Preference</Label>
                <Select
                  value={form.watch("budgetPreference")}
                  onValueChange={(v) => form.setValue("budgetPreference", v as "minimal" | "balanced" | "premium")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Suburb / City</Label>
                <Input {...form.register("suburb")} placeholder="e.g. Sydney" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">State (AU)</Label>
                <Select value={form.watch("state")} onValueChange={(v) => form.setValue("state", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    {AU_STATES.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Preferred Service Date</Label>
                <Input type="date" {...form.register("preferredServiceDate")} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Date Flexibility</Label>
                <Select
                  value={form.watch("dateFlexibility")}
                  onValueChange={(v) => form.setValue("dateFlexibility", v as "fixed" | "+/-2 days" | "flexible")}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed</SelectItem>
                    <SelectItem value="+/-2 days">+/- 2 days</SelectItem>
                    <SelectItem value="flexible">Flexible</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="cultural" className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <AccordionTrigger className="px-5 py-5 hover:no-underline">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <Globe className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-slate-900">Cultural & Religious</h2>
                <p className="text-xs text-slate-400">Specific observances and requirements</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Cultural / Faith Requirements</Label>
                <Input {...form.register("culturalFaithRequirements")} placeholder="e.g. Christian Tradition" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Urgency</Label>
                <Select value={form.watch("urgency")} onValueChange={(v) => form.setValue("urgency", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="within 24h">Within 24h</SelectItem>
                    <SelectItem value="within 48h">Within 48h</SelectItem>
                    <SelectItem value="standard">Standard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Notes (family preferences)</Label>
                <Textarea {...form.register("notes")} rows={3} placeholder="Any family preferences or notes..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Internal Notes</Label>
                <Textarea {...form.register("internalNotes")} rows={2} placeholder="Internal only" />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="addons" className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
          <AccordionTrigger className="px-5 py-5 hover:no-underline">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <PlusCircle className="h-5 w-5" />
              </div>
              <div className="text-left">
                <h2 className="font-bold text-slate-900">Ancillary Services</h2>
                <p className="text-xs text-slate-400">Add-on options and extras</p>
              </div>
            </div>
          </AccordionTrigger>
          <AccordionContent className="px-6 pb-6">
            <div className="flex flex-wrap gap-4">
              {[
                { key: "invitations", label: "Invitations" },
                { key: "livestream", label: "Livestream" },
                { key: "flowers", label: "Flowers" },
                { key: "printedSheets", label: "Printed sheets" },
                { key: "slideshow", label: "Slideshow" },
                { key: "catering", label: "Catering" },
                { key: "memorialPage", label: "Memorial page" },
              ].map(({ key, label }) => {
                const addOnsKey = key as keyof NonNullable<IntakeFormValues["addOns"]>;
                return (
                  <div key={key} className="flex items-center gap-2">
                    <Checkbox
                      id={key}
                      checked={!!(form.watch("addOns")?.[addOnsKey])}
                      onCheckedChange={(checked) => {
                        const prev = form.getValues("addOns") ?? {};
                        form.setValue("addOns", { ...prev, [addOnsKey]: !!checked });
                      }}
                    />
                    <Label htmlFor={key} className="text-sm font-normal cursor-pointer">
                      {label}
                    </Label>
                  </div>
                );
              })}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <div className="flex gap-3 justify-end">
        <Button type="button" variant="outline" onClick={() => form.reset(defaultValues(caseData))}>
          Reset
        </Button>
        <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={form.formState.isSubmitting}>
          Save Draft
        </Button>
        <Button type="button" onClick={handleGenerate} disabled={isGenerating || form.formState.isSubmitting}>
          {isGenerating ? "Generating..." : "Generate packages"}
        </Button>
      </div>
    </form>
  );
}

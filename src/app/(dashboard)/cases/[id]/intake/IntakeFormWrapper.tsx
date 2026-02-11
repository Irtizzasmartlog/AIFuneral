"use client";

import { useState } from "react";
import { toast } from "sonner";
import { IntakeForm } from "@/components/case/IntakeForm";
import { updateCaseFromIntake, generatePackages } from "@/app/actions/case";
import type { IntakeFormValues } from "@/lib/validations/intake";

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

export function IntakeFormWrapper({
  caseId,
  caseData,
}: {
  caseId: string;
  caseData: CaseData;
}) {
  const [isGenerating, setIsGenerating] = useState(false);

  async function handleSaveDraft(data: IntakeFormValues) {
    try {
      await updateCaseFromIntake(caseId, data);
      toast.success("Draft saved");
    } catch (e) {
      toast.error("Failed to save draft");
      console.error(e);
    }
  }

  async function handleGeneratePackages() {
    setIsGenerating(true);
    try {
      await generatePackages(caseId);
    } catch (e) {
      toast.error("Failed to generate packages");
      console.error(e);
      setIsGenerating(false);
    }
  }

  return (
    <IntakeForm
      caseData={caseData}
      onSaveDraft={handleSaveDraft}
      onGeneratePackages={handleGeneratePackages}
      isGenerating={isGenerating}
    />
  );
}

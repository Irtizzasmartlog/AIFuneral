import type { CaseInput, FamilyConcentrationOutput } from "./types";

export function runFamilyConcentrationAgent(caseData: CaseInput): FamilyConcentrationOutput {
  const notes = [caseData.notes, caseData.internalNotes].filter(Boolean).join(" ");
  const style = caseData.serviceStyle ?? "non-religious";
  const pref = caseData.budgetPreference ?? "balanced";

  const preferences: string[] = [];
  if (style === "religious") preferences.push("Traditional or religious observance");
  if (style === "celebration") preferences.push("Celebration of life tone");
  if (pref === "premium") preferences.push("Premium quality and inclusions");
  if (pref === "minimal") preferences.push("Minimal, essential-only approach");
  if (notes.toLowerCase().includes("floral") || notes.toLowerCase().includes("flower")) {
    preferences.push("Floral tributes");
  }
  if (notes.toLowerCase().includes("traditional")) preferences.push("Traditional values");
  if (preferences.length === 0) preferences.push("Balanced service and value");

  const constraints: string[] = [];
  if (caseData.culturalFaithRequirements) {
    constraints.push(`Cultural/faith: ${caseData.culturalFaithRequirements}`);
  }
  if (caseData.urgency) constraints.push(`Urgency: ${caseData.urgency}`);
  if (caseData.dateFlexibility === "fixed") constraints.push("Fixed service date");

  const toneGuidance =
    style === "religious"
      ? "Respectful, traditional, and considerate of faith practices."
      : style === "celebration"
        ? "Warm, celebratory, and personal."
        : "Professional, calm, and supportive.";

  return { preferences, constraints, toneGuidance };
}

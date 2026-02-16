/**
 * Single source of truth for intake: one-question-at-a-time.
 * Section 1: Mandatory / Legal (1–12). Section 2: Preferences (13–20).
 */

export type FieldKey =
  | "fullLegalNameOfDeceased"
  | "dateOfBirth"
  | "sexOrGender"
  | "dateOfDeath"
  | "placeOfDeath"
  | "causeOfDeathCertified"
  | "occupation"
  | "residentialAddress"
  | "maritalStatusAndSpouse"
  | "nextOfKinContactDetails"
  | "mccdStatus"
  | "plannedDateOfDisposal"
  | "religionOrCulturalPreferences"
  | "preferredVenueLocation"
  | "numberOfGuestsExpected"
  | "budget"
  | "serviceType"
  | "preferredDateAndTime"
  | "obituaryMemorialOptions"
  | "additionalPreferences";

export type IntakeField = {
  key: FieldKey;
  label: string;
  prompt: string;
  required: boolean;
};

export const INTAKE_FIELDS: IntakeField[] = [
  // Section 1: Mandatory / Legal
  {
    key: "fullLegalNameOfDeceased",
    label: "Full legal name of deceased",
    prompt: "Full legal name of the deceased?",
    required: true,
  },
  {
    key: "dateOfBirth",
    label: "Date of birth",
    prompt: "Date of birth? (DD/MM/YYYY)",
    required: true,
  },
  {
    key: "sexOrGender",
    label: "Sex / gender",
    prompt: "Sex or gender as recorded in medical documentation?",
    required: true,
  },
  {
    key: "dateOfDeath",
    label: "Date of death",
    prompt: "Date of death? (DD/MM/YYYY)",
    required: true,
  },
  {
    key: "placeOfDeath",
    label: "Place of death",
    prompt: "Place of death? (Hospital / Home / Other)",
    required: true,
  },
  {
    key: "causeOfDeathCertified",
    label: "Cause of death certified",
    prompt: "Cause of death certified by MCCD? (Yes / No)",
    required: true,
  },
  {
    key: "occupation",
    label: "Occupation",
    prompt: "Occupation? (optional – type 'skip' to leave blank)",
    required: false,
  },
  {
    key: "residentialAddress",
    label: "Residential address",
    prompt: "Residential address of the deceased?",
    required: true,
  },
  {
    key: "maritalStatusAndSpouse",
    label: "Marital status",
    prompt: "Marital status? (Single / Married / Widowed / Other). If married or widowed, include spouse name.",
    required: true,
  },
  {
    key: "nextOfKinContactDetails",
    label: "Next of kin contact",
    prompt: "Next of kin contact details: name, relationship, phone, and email.",
    required: true,
  },
  {
    key: "mccdStatus",
    label: "MCCD status",
    prompt: "Medical Certificate of Cause of Death status? (Received / Pending / Not required)",
    required: true,
  },
  {
    key: "plannedDateOfDisposal",
    label: "Planned date of disposal",
    prompt: "Planned date of disposal? (DD/MM/YYYY)",
    required: true,
  },
  // Section 2: Preferences
  {
    key: "religionOrCulturalPreferences",
    label: "Religion / cultural",
    prompt: "Religion or cultural preferences for the service?",
    required: true,
  },
  {
    key: "preferredVenueLocation",
    label: "Preferred venue",
    prompt: "Preferred venue or location for the service?",
    required: true,
  },
  {
    key: "numberOfGuestsExpected",
    label: "Number of guests",
    prompt: "Number of guests expected?",
    required: true,
  },
  {
    key: "budget",
    label: "Budget",
    prompt: "Budget? (low / medium / high or a numeric amount in AUD)",
    required: true,
  },
  {
    key: "serviceType",
    label: "Service type",
    prompt: "Service type? (Burial / Cremation / Memorial Only / Other)",
    required: true,
  },
  {
    key: "preferredDateAndTime",
    label: "Preferred date & time",
    prompt: "Preferred date and time for the service? (DD/MM/YYYY and time)",
    required: true,
  },
  {
    key: "obituaryMemorialOptions",
    label: "Obituary / memorial",
    prompt: "Obituary or memorial options? (Print / Online / None)",
    required: true,
  },
  {
    key: "additionalPreferences",
    label: "Additional preferences",
    prompt: "Additional preferences? (e.g. music, readings, eulogies, flowers, transport)",
    required: true,
  },
];

export function getFirstFieldKey(): FieldKey {
  return INTAKE_FIELDS[0]!.key;
}

export function getNextMissingKey(
  answers: Partial<Record<FieldKey, string | undefined>>,
  afterKey: FieldKey | null
): FieldKey | null {
  const startIndex = afterKey
    ? INTAKE_FIELDS.findIndex((f) => f.key === afterKey) + 1
    : 0;
  for (let i = startIndex; i < INTAKE_FIELDS.length; i++) {
    const field = INTAKE_FIELDS[i]!;
    const value = answers[field.key];
    const empty = value === undefined || value === null || String(value).trim() === "";
    if (field.required && empty) return field.key;
    if (!field.required && value === undefined) return field.key;
  }
  return null;
}

export function getQuestionForKey(key: FieldKey): string {
  const field = INTAKE_FIELDS.find((f) => f.key === key);
  return field?.prompt ?? "Next question.";
}

export function answersToCasePatch(
  answers: Partial<Record<FieldKey, string | undefined>>
): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const f of INTAKE_FIELDS) {
    const v = answers[f.key];
    if (v !== undefined && v !== null && String(v).trim() !== "") patch[f.key] = v.trim();
  }
  return patch;
}

/** Map intake answers to legacy CasePatch shape for UI (e.g. snapshot). */
export function answersToLegacyCasePatch(
  answers: Partial<Record<FieldKey, string | undefined>>
): Record<string, unknown> {
  return {
    deceasedFullName: answers.fullLegalNameOfDeceased ?? undefined,
    deceasedDob: answers.dateOfBirth ?? undefined,
    deceasedGender: answers.sexOrGender ?? undefined,
    deceasedDod: answers.dateOfDeath ?? undefined,
    venuePreference: answers.preferredVenueLocation ?? undefined,
    nextOfKinName: answers.nextOfKinContactDetails ?? undefined,
    nextOfKinEmail: answers.nextOfKinContactDetails ?? undefined,
    suburb: answers.residentialAddress ?? undefined,
    serviceType: answers.serviceType ?? undefined,
    expectedAttendeesMax: answers.numberOfGuestsExpected ? parseInt(answers.numberOfGuestsExpected, 10) : undefined,
    preferredServiceDate: answers.preferredDateAndTime ?? answers.plannedDateOfDisposal ?? undefined,
    culturalFaithRequirements: answers.religionOrCulturalPreferences ?? undefined,
    notes: answers.additionalPreferences ?? undefined,
  };
}

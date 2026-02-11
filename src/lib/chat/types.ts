/**
 * Types for chat intake API and UI.
 * case_patch fields match Prisma Case; dates are ISO strings.
 */

export type IntakeMode = "COLLECTING" | "GENERATED";

export type CasePatch = {
  deceasedFullName?: string | null;
  deceasedDob?: string | null;
  deceasedDod?: string | null;
  deceasedPreferredName?: string | null;
  deceasedGender?: string | null;
  nextOfKinName?: string | null;
  nextOfKinRelationship?: string | null;
  nextOfKinPhone?: string | null;
  nextOfKinEmail?: string | null;
  serviceType?: string | null;
  serviceStyle?: string | null;
  venuePreference?: string | null;
  expectedAttendeesMin?: number | null;
  expectedAttendeesMax?: number | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  budgetPreference?: string | null;
  suburb?: string | null;
  state?: string | null;
  preferredServiceDate?: string | null;
  dateFlexibility?: string | null;
  culturalFaithRequirements?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  addOns?: string | null;
  urgency?: string | null;
};

export type IntakePackageLineItem = {
  description: string;
  amountCents: number;
  category: "service" | "merchandise" | "cashAdvance";
};

export type IntakePackage = {
  tier: "Essential" | "Standard" | "Premium";
  name: string;
  description: string;
  totalCents: number;
  inclusions: string[];
  assumptions: Record<string, unknown>;
  lineItems: IntakePackageLineItem[];
  isRecommended: boolean;
  sortOrder: number;
};

export type AddOnItem = {
  name: string;
  price_range: string;
  note?: string;
};

export type IntakeResultJSON = {
  mode: IntakeMode;
  next_question: string | null;
  case_patch: CasePatch;
  packages?: IntakePackage[];
  assumptions: string[];
  compliance_checklist: string[];
  add_ons: AddOnItem[];
  notes?: string;
};

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export const JSON_DELIMITER = "===JSON===";

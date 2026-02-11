export type CaseInput = {
  id: string;
  deceasedFullName?: string | null;
  deceasedDob?: Date | null;
  deceasedDod?: Date | null;
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
  preferredServiceDate?: Date | null;
  dateFlexibility?: string | null;
  culturalFaithRequirements?: string | null;
  notes?: string | null;
  internalNotes?: string | null;
  urgency?: string | null;
  addOns?: string | null;
};

export type FamilyConcentrationOutput = {
  preferences: string[];
  constraints: string[];
  toneGuidance: string;
};

export type SchedulingTask = {
  title: string;
  dueDate: string | null;
  category: "venue" | "logistics" | "compliance" | "other";
};

export type SchedulingLogisticsOutput = {
  tasks: SchedulingTask[];
};

export type DocumentChecklistItem = {
  name: string;
  linkPlaceholder: string;
  directorReviewRequired: boolean;
};

export type DocumentationComplianceOutput = {
  documentChecklist: DocumentChecklistItem[];
  disclaimer: string;
};

export type QuoteLineItemInput = {
  description: string;
  amountCents: number;
  category: "service" | "merchandise" | "cashAdvance";
};

export type PackageOutput = {
  tier: "Essential" | "Standard" | "Premium";
  name: string;
  description: string;
  totalCents: number;
  inclusions: string[];
  assumptions: Record<string, unknown>;
  lineItems: QuoteLineItemInput[];
  isRecommended: boolean;
  sortOrder: number;
};

export type PricingInvoiceOutput = {
  packages: PackageOutput[];
  confidenceIndicator: "low" | "medium" | "high";
};

export type PricingConstraints = {
  attendeeCount?: number;
  venueTier?: string;
  transportCount?: number;
  flowers?: boolean;
};

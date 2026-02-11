import { z } from "zod";

const addOnsSchema = z.object({
  invitations: z.boolean().optional(),
  livestream: z.boolean().optional(),
  flowers: z.boolean().optional(),
  printedSheets: z.boolean().optional(),
  slideshow: z.boolean().optional(),
  catering: z.boolean().optional(),
  memorialPage: z.boolean().optional(),
});

export const intakeFormSchema = z.object({
  deceasedFullName: z.string().min(1, "Required").optional().or(z.literal("")),
  deceasedDob: z.string().optional(),
  deceasedDod: z.string().optional(),
  deceasedPreferredName: z.string().optional(),
  deceasedGender: z.string().optional(),
  nextOfKinName: z.string().optional(),
  nextOfKinRelationship: z.string().optional(),
  nextOfKinPhone: z.string().optional(),
  nextOfKinEmail: z.string().email("Invalid email").optional().or(z.literal("")),
  serviceType: z.enum(["burial", "cremation"]).optional(),
  serviceStyle: z.enum(["religious", "non-religious", "celebration"]).optional(),
  venuePreference: z.string().optional(),
  expectedAttendeesMin: z.coerce.number().min(0).optional(),
  expectedAttendeesMax: z.coerce.number().min(0).optional(),
  budgetMin: z.coerce.number().min(0).optional(),
  budgetMax: z.coerce.number().min(0).optional(),
  budgetPreference: z.enum(["minimal", "balanced", "premium"]).optional(),
  suburb: z.string().optional(),
  state: z.string().optional(),
  preferredServiceDate: z.string().optional(),
  dateFlexibility: z.enum(["fixed", "+/-2 days", "flexible"]).optional(),
  culturalFaithRequirements: z.string().optional(),
  notes: z.string().optional(),
  internalNotes: z.string().optional(),
  urgency: z.string().optional(),
  addOns: addOnsSchema.optional(),
});

export type IntakeFormValues = z.infer<typeof intakeFormSchema>;

export const AU_STATES = [
  "NSW",
  "VIC",
  "QLD",
  "WA",
  "SA",
  "TAS",
  "ACT",
  "NT",
] as const;

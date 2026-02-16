import { z } from "zod";

const intakeLineItemSchema = z.object({
  description: z.string(),
  amountCents: z.number(),
  category: z.enum(["service", "merchandise", "cashAdvance"]),
});

const intakePackageSchema = z.object({
  tier: z.enum(["Essential", "Standard", "Premium"]),
  name: z.string(),
  description: z.string(),
  totalCents: z.number(),
  inclusions: z.array(z.string()),
  assumptions: z.record(z.unknown()),
  lineItems: z.array(intakeLineItemSchema),
  isRecommended: z.boolean(),
  sortOrder: z.number(),
});

const addOnItemSchema = z.object({
  name: z.string(),
  price_range: z.string(),
  note: z.string().optional(),
});

const casePatchSchema = z.record(z.unknown()).optional().default({});

export const intakeResultSchema = z.object({
  mode: z.enum(["COLLECTING", "GENERATED"]),
  next_question: z.string().nullable(),
  case_patch: casePatchSchema,
  packages: z.array(intakePackageSchema).optional(),
  assumptions: z.array(z.string()).default([]),
  compliance_checklist: z.array(z.string()).default([]),
  add_ons: z.array(addOnItemSchema).default([]),
  notes: z.string().optional(),
});

export type IntakeResultValidated = z.infer<typeof intakeResultSchema>;

export function parseAndValidateIntakeResult(input: string | object): IntakeResultValidated | null {
  try {
    const parsed = typeof input === "string" ? JSON.parse(input) : input;
    const result = intakeResultSchema.safeParse(parsed);
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

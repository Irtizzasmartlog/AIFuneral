import { runPricingInvoiceAgent } from "@/agents/pricing-invoice";
import { runDocumentationComplianceAgent } from "@/agents/documentation-compliance";
import type { CaseInput } from "@/agents/types";
import type {
  IntakeResultJSON,
  CasePatch,
  IntakePackage,
  AddOnItem,
  ChatMessage,
} from "./types";
import { JSON_DELIMITER } from "./types";

const REQUIRED_KEYS: (keyof CasePatch)[] = [
  "deceasedFullName",
  "nextOfKinName",
  "nextOfKinEmail",
  "serviceType",
  "budgetMin",
  "budgetMax",
  "suburb",
  "state",
];

type QuestionStep = {
  key: keyof CasePatch;
  question: string;
  required: boolean;
};

const QUESTION_ORDER: QuestionStep[] = [
  { key: "deceasedFullName", question: "What is the full legal name of the deceased?", required: true },
  { key: "deceasedDob", question: "Date of birth? (DD/MM/YYYY or skip)", required: false },
  { key: "deceasedDod", question: "Date of passing? (DD/MM/YYYY)", required: false },
  { key: "deceasedPreferredName", question: "Preferred name for public use? (optional; say 'same' to use legal name)", required: false },
  { key: "nextOfKinName", question: "Full name of the primary decision-maker (next of kin)?", required: true },
  { key: "nextOfKinRelationship", question: "Their relationship to the deceased?", required: false },
  { key: "nextOfKinPhone", question: "Best phone number for the primary contact?", required: false },
  { key: "nextOfKinEmail", question: "Email address for the primary contact?", required: true },
  { key: "serviceType", question: "Service type: burial or cremation?", required: true },
  { key: "serviceStyle", question: "Service style: religious, non-religious, or celebration?", required: false },
  { key: "venuePreference", question: "Venue preference: chapel, church, graveside, mosque, or other?", required: false },
  { key: "expectedAttendeesMax", question: "Rough expected number of attendees? (e.g. 50)", required: false },
  { key: "budgetMin", question: "Budget minimum in AUD? (e.g. 5000)", required: true },
  { key: "budgetMax", question: "Budget maximum in AUD? (e.g. 15000)", required: true },
  { key: "budgetPreference", question: "Budget preference: minimal, balanced, or premium?", required: false },
  { key: "suburb", question: "Suburb or city for the service?", required: true },
  { key: "state", question: "State? (NSW, VIC, QLD, WA, SA, TAS, ACT, NT)", required: true },
  { key: "preferredServiceDate", question: "Preferred service date? (DD/MM/YYYY or skip)", required: false },
  { key: "dateFlexibility", question: "Date flexibility: fixed, +/- 2 days, or flexible?", required: false },
  { key: "culturalFaithRequirements", question: "Any cultural or religious requirements? (e.g. Islamic burial, Catholic rite)", required: false },
  { key: "urgency", question: "Urgency: within 24h, within 48h, within 72h, or standard?", required: false },
  { key: "addOns", question: "Add-ons needed? List any: invitations, livestream, flowers, printed sheets, slideshow, catering, memorial page (or 'none')", required: false },
  { key: "notes", question: "Any other notes or special requests? (or 'no')", required: false },
];

function parseDateInput(s: string): string | null {
  const t = s.trim().toLowerCase();
  if (!t || t === "skip" || t === "n/a" || t === "no") return null;
  const match = t.match(/(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})/);
  if (match) {
    const [, d, m, y] = match;
    const year = y.length === 2 ? 2000 + parseInt(y, 10) : parseInt(y, 10);
    return `${year}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return t;
}

function parseNumber(s: string): number | null {
  const n = parseInt(s.replace(/[^0-9]/g, ""), 10);
  return isNaN(n) ? null : n;
}

function parseBudgetAUD(s: string): number | null {
  const n = parseNumber(s);
  if (n == null) return null;
  return n;
}

function parseServiceType(s: string): string | null {
  const t = s.trim().toLowerCase();
  if (t.includes("burial") || t === "burial") return "burial";
  if (t.includes("cremation") || t === "cremation") return "cremation";
  return null;
}

function parseAddOns(s: string): string {
  const t = s.trim().toLowerCase();
  if (!t || t === "none" || t === "no") return "{}";
  const addOns: Record<string, boolean> = {};
  const list = ["invitations", "livestream", "flowers", "printedSheets", "slideshow", "catering", "memorialPage"];
  const labels = ["invitations", "livestream", "flowers", "printed sheets", "slideshow", "catering", "memorial page"];
  list.forEach((key, i) => {
    if (t.includes(labels[i]) || t.includes(key)) addOns[key] = true;
  });
  return JSON.stringify(addOns);
}

function parseState(s: string): string | null {
  const u = s.trim().toUpperCase().slice(0, 3);
  const states = ["NSW", "VIC", "QLD", "WA", "SA", "TAS", "ACT", "NT"];
  return states.find((st) => st.startsWith(u) || u.startsWith(st)) ?? null;
}

function parseSingleValue(
  key: keyof CasePatch,
  raw: string
): string | number | null {
  const s = raw.trim();
  if (key === "deceasedDob" || key === "deceasedDod" || key === "preferredServiceDate") {
    return parseDateInput(s);
  }
  if (key === "budgetMin" || key === "budgetMax") {
    const n = parseBudgetAUD(s);
    return n != null ? n : null;
  }
  if (key === "expectedAttendeesMax") {
    const n = parseNumber(s);
    return n != null ? n : null;
  }
  if (key === "serviceType") return parseServiceType(s);
  if (key === "state") return parseState(s);
  if (key === "addOns") return parseAddOns(s);
  if (key === "deceasedPreferredName" && (s.toLowerCase() === "same" || !s)) return null;
  if (!s || s.toLowerCase() === "skip" || s.toLowerCase() === "n/a") return null;
  return s;
}

function getNextQuestionKey(collected: CasePatch): keyof CasePatch | null {
  for (const step of QUESTION_ORDER) {
    const v = collected[step.key];
    if (v === undefined || v === null || v === "") return step.key;
  }
  return null;
}

function hasRequired(collected: CasePatch): boolean {
  for (const k of REQUIRED_KEYS) {
    const v = collected[k];
    if (v === undefined || v === null || v === "") return false;
  }
  return true;
}

function casePatchToCaseInput(caseId: string, patch: CasePatch): CaseInput {
  const parseDt = (s: string | null | undefined): Date | null => {
    if (!s) return null;
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };
  let addOns: string | null = null;
  if (patch.addOns && typeof patch.addOns === "string") addOns = patch.addOns;
  const budgetMin = typeof patch.budgetMin === "number" ? patch.budgetMin : null;
  const budgetMax = typeof patch.budgetMax === "number" ? patch.budgetMax : null;
  return {
    id: caseId,
    deceasedFullName: patch.deceasedFullName ?? null,
    deceasedDob: parseDt(patch.deceasedDob as string) ?? null,
    deceasedDod: parseDt(patch.deceasedDod as string) ?? null,
    deceasedPreferredName: patch.deceasedPreferredName ?? null,
    deceasedGender: patch.deceasedGender ?? null,
    nextOfKinName: patch.nextOfKinName ?? null,
    nextOfKinRelationship: patch.nextOfKinRelationship ?? null,
    nextOfKinPhone: patch.nextOfKinPhone ?? null,
    nextOfKinEmail: patch.nextOfKinEmail ?? null,
    serviceType: patch.serviceType ?? null,
    serviceStyle: patch.serviceStyle ?? null,
    venuePreference: patch.venuePreference ?? null,
    expectedAttendeesMin: patch.expectedAttendeesMin ?? null,
    expectedAttendeesMax: patch.expectedAttendeesMax ?? null,
    budgetMin: budgetMin != null ? budgetMin * 100 : null,
    budgetMax: budgetMax != null ? budgetMax * 100 : null,
    budgetPreference: patch.budgetPreference ?? null,
    suburb: patch.suburb ?? null,
    state: patch.state ?? null,
    preferredServiceDate: parseDt(patch.preferredServiceDate as string) ?? null,
    dateFlexibility: patch.dateFlexibility ?? null,
    culturalFaithRequirements: patch.culturalFaithRequirements ?? null,
    notes: patch.notes ?? null,
    internalNotes: patch.internalNotes ?? null,
    urgency: patch.urgency ?? null,
    addOns,
  };
}

function buildComplianceChecklist(): string[] {
  const result = runDocumentationComplianceAgent({ id: "" });
  return result.documentChecklist.map(
    (item) => `${item.name} ${item.directorReviewRequired ? "(Director review required)" : ""}`
  );
}

function buildAddOnsList(patch: CasePatch): AddOnItem[] {
  const items: AddOnItem[] = [
    { name: "Invitations", price_range: "$200 to $600", note: "Design and print" },
    { name: "Livestream", price_range: "$400 to $800", note: "Streaming service" },
    { name: "Flowers", price_range: "$300 to $1,200", note: "Tributes and arrangements" },
    { name: "Printed sheets", price_range: "$150 to $400" },
    { name: "Slideshow", price_range: "$150 to $400" },
    { name: "Catering", price_range: "By quote", note: "External" },
    { name: "Memorial page", price_range: "$150 to $400" },
  ];
  return items;
}

function packagesToIntakePackages(
  packages: ReturnType<typeof runPricingInvoiceAgent>["packages"]
): IntakePackage[] {
  return packages.map((p) => ({
    tier: p.tier,
    name: p.name,
    description: p.description,
    totalCents: p.totalCents,
    inclusions: p.inclusions,
    assumptions: p.assumptions,
    lineItems: p.lineItems,
    isRecommended: p.isRecommended,
    sortOrder: p.sortOrder,
  }));
}

export type MockEngineState = {
  mode: "COLLECTING" | "GENERATED";
  collected: CasePatch;
  lastQuestionKey: keyof CasePatch | null;
};

export function getInitialCollected(): CasePatch {
  return {};
}

export function runMockIntake(
  caseId: string,
  messages: ChatMessage[],
  initialState: MockEngineState | null
): { assistantText: string; parsed: IntakeResultJSON; newState: MockEngineState } {
  const firstQuestionKey = QUESTION_ORDER[0]!.key;
  let collected: CasePatch = initialState?.collected ?? getInitialCollected();
  let mode: "COLLECTING" | "GENERATED" = initialState?.mode ?? "COLLECTING";
  let lastQuestionKey: keyof CasePatch | null =
    initialState?.lastQuestionKey ?? (messages.some((m) => m.role === "user") ? firstQuestionKey : firstQuestionKey);

  const lastUser = messages.filter((m) => m.role === "user").pop();
  const userText = lastUser?.content?.trim() ?? "";

  if (mode === "GENERATED") {
    return runTailoring(caseId, userText, initialState!, messages);
  }

  if (!userText && !initialState) {
    const step = QUESTION_ORDER[0]!;
    const compliance_checklist = buildComplianceChecklist();
    const add_ons = buildAddOnsList(collected);
    const parsed: IntakeResultJSON = {
      mode: "COLLECTING",
      next_question: step.question,
      case_patch: collected,
      assumptions: [],
      compliance_checklist,
      add_ons,
    };
    return {
      assistantText: step.question,
      parsed,
      newState: { mode: "COLLECTING", collected, lastQuestionKey: step.key },
    };
  }

  if (lastQuestionKey) {
    const value = parseSingleValue(lastQuestionKey, userText);
    if (value !== null && value !== undefined) {
      if (lastQuestionKey === "budgetMin" || lastQuestionKey === "budgetMax") {
        collected = { ...collected, [lastQuestionKey]: value as number };
      } else if (lastQuestionKey === "expectedAttendeesMax") {
        collected = { ...collected, expectedAttendeesMax: value as number };
      } else {
        collected = { ...collected, [lastQuestionKey]: value };
      }
    }
  }

  const nextKey = getNextQuestionKey(collected);
  lastQuestionKey = nextKey;

  if (hasRequired(collected)) {
    const caseInput = casePatchToCaseInput(caseId, collected);
    const budgetMinCents = caseInput.budgetMin ?? 250000;
    const budgetMaxCents = caseInput.budgetMax ?? 1500000;
    const flowers = typeof collected.addOns === "string" && collected.addOns.includes("flowers");
    const pricingResult = runPricingInvoiceAgent(caseInput, {
      attendeeCount: caseInput.expectedAttendeesMax ?? 50,
      flowers,
    });
    const packages = packagesToIntakePackages(pricingResult.packages);
    const assumptions = [
      "Budget and location based on your stated preferences.",
      "Package tiers aligned with Australian funeral market norms.",
      "Director review required before sending to family.",
    ];
    const compliance_checklist = buildComplianceChecklist();
    const add_ons = buildAddOnsList(collected);
    const assistantText =
      "I have enough information to generate three packages for you. Here are your Essential, Standard, and Premium options. You can say things like \"make it cheaper\" or \"add livestream\" to tailor further, or click Apply to Case and Proceed to Packages when ready.";
    const parsed: IntakeResultJSON = {
      mode: "GENERATED",
      next_question: null,
      case_patch: collected,
      packages,
      assumptions,
      compliance_checklist,
      add_ons,
      notes: "Packages generated. Director review required.",
    };
    return {
      assistantText,
      parsed,
      newState: { mode: "GENERATED", collected, lastQuestionKey: null },
    };
  }

  if (nextKey) {
    const step = QUESTION_ORDER.find((q) => q.key === nextKey)!;
    const compliance_checklist = buildComplianceChecklist();
    const add_ons = buildAddOnsList(collected);
    const parsed: IntakeResultJSON = {
      mode: "COLLECTING",
      next_question: step.question,
      case_patch: collected,
      assumptions: [],
      compliance_checklist,
      add_ons,
    };
    return {
      assistantText: step.question,
      parsed,
      newState: { mode: "COLLECTING", collected, lastQuestionKey: nextKey },
    };
  }

  const compliance_checklist = buildComplianceChecklist();
  const add_ons = buildAddOnsList(collected);
  const parsed: IntakeResultJSON = {
    mode: "COLLECTING",
    next_question: "Is there anything else you would like to add?",
    case_patch: collected,
    assumptions: [],
    compliance_checklist,
    add_ons,
  };
  return {
    assistantText: "Is there anything else you would like to add?",
    parsed,
    newState: { mode: "COLLECTING", collected, lastQuestionKey: null },
  };
}

function runTailoring(
  caseId: string,
  userText: string,
  state: MockEngineState,
  _messages: ChatMessage[]
): { assistantText: string; parsed: IntakeResultJSON; newState: MockEngineState } {
  const collected = { ...state.collected };
  const t = userText.trim().toLowerCase();
  let flowers = typeof collected.addOns === "string" && collected.addOns.includes("flowers");
  let budgetMinDollars = typeof collected.budgetMin === "number" ? collected.budgetMin : 2500;
  let budgetMaxDollars = typeof collected.budgetMax === "number" ? collected.budgetMax : 15000;

  if (t.includes("cheaper") || t.includes("lower budget") || t.includes("reduce")) {
    budgetMaxDollars = Math.round(budgetMaxDollars * 0.85);
    budgetMinDollars = Math.round(budgetMinDollars * 0.9);
    collected.budgetMin = budgetMinDollars;
    collected.budgetMax = budgetMaxDollars;
  }
  if (t.includes("livestream")) {
    collected.addOns = JSON.stringify(
      Object.assign(
        {},
        typeof collected.addOns === "string" ? JSON.parse(collected.addOns || "{}") : {},
        { livestream: true }
      )
    );
  }
  if (t.includes("flower") || t.includes("floral")) {
    flowers = true;
    collected.addOns = JSON.stringify(
      Object.assign(
        {},
        typeof collected.addOns === "string" ? JSON.parse(collected.addOns || "{}") : {},
        { flowers: true }
      )
    );
  }

  const caseInput = casePatchToCaseInput(caseId, {
    ...collected,
    budgetMin: budgetMinDollars,
    budgetMax: budgetMaxDollars,
  });
  const pricingResult = runPricingInvoiceAgent(caseInput, {
    attendeeCount: caseInput.expectedAttendeesMax ?? 50,
    flowers,
  });
  const packages = packagesToIntakePackages(pricingResult.packages);
  const assumptions = [
    "Tailoring applied per your request.",
    "Director review required before sending to family.",
  ];
  const compliance_checklist = buildComplianceChecklist();
  const add_ons = buildAddOnsList(collected);
  const assistantText =
    "I have updated the packages based on your request. Review the revised options below. You can ask for further changes or click Apply to Case and Proceed to Packages when ready.";
  const parsed: IntakeResultJSON = {
    mode: "GENERATED",
    next_question: null,
    case_patch: collected,
    packages,
    assumptions,
    compliance_checklist,
    add_ons,
    notes: "Tailored packages. Director review required.",
  };
  return {
    assistantText,
    parsed,
    newState: { mode: "GENERATED", collected, lastQuestionKey: null },
  };
}

export function formatAssistantResponse(assistantText: string, parsed: IntakeResultJSON): string {
  return `${assistantText}\n\n${JSON_DELIMITER}\n${JSON.stringify(parsed)}`;
}

export function parseAssistantResponse(content?: string | null): { text: string; parsed: IntakeResultJSON | null } {
  const safe = typeof content === "string" ? content : "";
  const idx = safe.indexOf(JSON_DELIMITER);
  if (idx === -1) return { text: safe.trim(), parsed: null };
  const text = safe.slice(0, idx).trim();
  const jsonStr = safe.slice(idx + JSON_DELIMITER.length).trim();
  try {
    const parsed = JSON.parse(jsonStr) as IntakeResultJSON;
    return { text, parsed };
  } catch {
    return { text: safe.trim(), parsed: null };
  }
}

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  runMockIntake,
  formatAssistantResponse,
  parseAssistantResponse,
  type MockEngineState,
} from "@/lib/chat/mock-intake-engine";
import type { ChatMessage, IntakeResultJSON, CasePatch } from "@/lib/chat/types";
import { JSON_DELIMITER } from "@/lib/chat/types";

const INTAKE_SYSTEM_PROMPT = `You are FuneralFlow AI, an internal chat-based intake assistant for Australian funeral directors. You ask one question at a time, collect structured intake data, then generate three packages (Essential, Standard, Premium) and a quote. After that you support "tailoring mode" where the director can type free-text adjustments (e.g. "make it cheaper", "add livestream").

Rules:
- Australian context only. Use AU locations, AUD, and local norms.
- No em-dashes in user-facing text. Use plain language.
- Do not give legal advice. Document and compliance items are checklist only with "Director review required".
- You must end every response with a final delimiter line: "===JSON===" followed by a single line of strict JSON (no trailing commas). The JSON must include: mode ("COLLECTING" | "GENERATED"), next_question (string | null), case_patch (object with intake fields), packages (array when mode is GENERATED), assumptions (string[]), compliance_checklist (string[]), add_ons (array of { name, price_range, note? }), notes (optional string).
- When COLLECTING: ask one question at a time; fill case_patch with any fields you have parsed from the conversation.
- When you have enough to generate (deceased name, next of kin name and email, service type, budget range, suburb, state): set mode to GENERATED, include three packages with tier, name, description, totalCents, inclusions, assumptions, lineItems, isRecommended, sortOrder.
- In tailoring mode: interpret change requests and return updated packages and case_patch.`;

function parseDate(s: string | null | undefined): Date | null {
  if (!s) return null;
  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
}

function mergeCasePatch(_caseId: string, patch: CasePatch): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (patch.deceasedFullName !== undefined) data.deceasedFullName = patch.deceasedFullName || null;
  if (patch.deceasedDob !== undefined) data.deceasedDob = parseDate(patch.deceasedDob as string);
  if (patch.deceasedDod !== undefined) data.deceasedDod = parseDate(patch.deceasedDod as string);
  if (patch.deceasedPreferredName !== undefined) data.deceasedPreferredName = patch.deceasedPreferredName || null;
  if (patch.deceasedGender !== undefined) data.deceasedGender = patch.deceasedGender || null;
  if (patch.nextOfKinName !== undefined) data.nextOfKinName = patch.nextOfKinName || null;
  if (patch.nextOfKinRelationship !== undefined) data.nextOfKinRelationship = patch.nextOfKinRelationship || null;
  if (patch.nextOfKinPhone !== undefined) data.nextOfKinPhone = patch.nextOfKinPhone || null;
  if (patch.nextOfKinEmail !== undefined) data.nextOfKinEmail = patch.nextOfKinEmail || null;
  if (patch.serviceType !== undefined) data.serviceType = patch.serviceType || null;
  if (patch.serviceStyle !== undefined) data.serviceStyle = patch.serviceStyle || null;
  if (patch.venuePreference !== undefined) data.venuePreference = patch.venuePreference || null;
  if (patch.expectedAttendeesMin !== undefined) data.expectedAttendeesMin = patch.expectedAttendeesMin ?? null;
  if (patch.expectedAttendeesMax !== undefined) data.expectedAttendeesMax = patch.expectedAttendeesMax ?? null;
  if (patch.budgetMin !== undefined) data.budgetMin = typeof patch.budgetMin === "number" ? patch.budgetMin * 100 : null;
  if (patch.budgetMax !== undefined) data.budgetMax = typeof patch.budgetMax === "number" ? patch.budgetMax * 100 : null;
  if (patch.budgetPreference !== undefined) data.budgetPreference = patch.budgetPreference || null;
  if (patch.suburb !== undefined) data.suburb = patch.suburb || null;
  if (patch.state !== undefined) data.state = patch.state || null;
  if (patch.preferredServiceDate !== undefined) data.preferredServiceDate = parseDate(patch.preferredServiceDate as string);
  if (patch.dateFlexibility !== undefined) data.dateFlexibility = patch.dateFlexibility || null;
  if (patch.culturalFaithRequirements !== undefined) data.culturalFaithRequirements = patch.culturalFaithRequirements || null;
  if (patch.notes !== undefined) data.notes = patch.notes || null;
  if (patch.internalNotes !== undefined) data.internalNotes = patch.internalNotes || null;
  if (patch.urgency !== undefined) data.urgency = patch.urgency || null;
  if (patch.addOns !== undefined) data.addOns = typeof patch.addOns === "string" ? patch.addOns : null;
  return data;
}

export async function POST(request: Request) {
  const session = (await getServerSession(authOptions as any)) as { user?: { id?: string; organizationId?: string } } | null;
  if (!session?.user?.organizationId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { caseId: string; messages: ChatMessage[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const { caseId, messages } = body;
  if (!caseId || !Array.isArray(messages)) {
    return NextResponse.json({ error: "caseId and messages required" }, { status: 400 });
  }

  const caseRecord = await prisma.case.findFirst({
    where: { id: caseId, organizationId: session.user.organizationId },
    include: { intakeState: true },
  });
  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const useOpenAI = !!process.env.OPENAI_API_KEY;
  let assistantMessage: string;
  let parsed: IntakeResultJSON;

  if (useOpenAI) {
    try {
      const OpenAI = (await import("openai")).default;
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const conversation = messages.map((m) => ({
        role: m.role as "user" | "assistant" | "system",
        content: m.content,
      }));
      const systemMessage = { role: "system" as const, content: INTAKE_SYSTEM_PROMPT };
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [systemMessage, ...conversation],
        max_tokens: 2000,
      });
      const raw = response.choices[0]?.message?.content ?? "";
      const result = parseAssistantResponse(raw);
      assistantMessage = raw;
      parsed = result.parsed ?? {
        mode: "COLLECTING",
        next_question: result.text || "Could you tell me more?",
        case_patch: {},
        assumptions: [],
        compliance_checklist: [],
        add_ons: [],
      };
      if (!result.parsed && raw.includes(JSON_DELIMITER)) {
        try {
          const jsonStr = raw.slice(raw.indexOf(JSON_DELIMITER) + JSON_DELIMITER.length).trim();
          parsed = JSON.parse(jsonStr) as IntakeResultJSON;
        } catch {
          // keep default parsed
        }
      }
    } catch (err) {
      console.error("OpenAI error:", err);
      return NextResponse.json({ error: "AI service error" }, { status: 500 });
    }
    const lastUser = messages.filter((m) => m.role === "user").pop();
    await prisma.$transaction(async (tx) => {
      if (lastUser) {
        await tx.caseChatMessage.create({
          data: { caseId, role: "user", content: lastUser.content },
        });
      }
      await tx.caseChatMessage.create({
        data: { caseId, role: "assistant", content: assistantMessage },
      });
      await tx.caseIntakeState.upsert({
        where: { caseId },
        create: {
          caseId,
          mode: parsed.mode,
          collectedJson: JSON.stringify(parsed.case_patch),
          lastQuestionKey: null,
        },
        update: {
          mode: parsed.mode,
          collectedJson: JSON.stringify(parsed.case_patch),
          lastQuestionKey: null,
        },
      });
      const patchData = mergeCasePatch(caseId, parsed.case_patch);
      if (Object.keys(patchData).length > 0) {
        await tx.case.update({
          where: { id: caseId },
          data: patchData as any,
        });
      }
    });
  } else {
    const state: MockEngineState | null = caseRecord.intakeState
      ? {
          mode: caseRecord.intakeState.mode as "COLLECTING" | "GENERATED",
          collected: (() => {
            try {
              return JSON.parse(caseRecord.intakeState.collectedJson) as CasePatch;
            } catch {
              return {};
            }
          })(),
          lastQuestionKey: caseRecord.intakeState.lastQuestionKey as keyof CasePatch | null,
        }
      : null;

    const { assistantText, parsed: parsedResult, newState } = runMockIntake(caseId, messages, state);
    assistantMessage = formatAssistantResponse(assistantText, parsedResult);
    parsed = parsedResult;

    await prisma.$transaction(async (tx) => {
      const lastUser = messages.filter((m) => m.role === "user").pop();
      if (lastUser) {
        await tx.caseChatMessage.create({
          data: { caseId, role: "user", content: lastUser.content },
        });
      }
      await tx.caseChatMessage.create({
        data: { caseId, role: "assistant", content: assistantMessage },
      });
      await tx.caseIntakeState.upsert({
        where: { caseId },
        create: {
          caseId,
          mode: newState.mode,
          collectedJson: JSON.stringify(newState.collected),
          lastQuestionKey: newState.lastQuestionKey,
        },
        update: {
          mode: newState.mode,
          collectedJson: JSON.stringify(newState.collected),
          lastQuestionKey: newState.lastQuestionKey,
        },
      });
      const patchData = mergeCasePatch(caseId, parsed.case_patch);
      if (Object.keys(patchData).length > 0) {
        await tx.case.update({
          where: { id: caseId },
          data: patchData as any,
        });
      }
    });
  }

  return NextResponse.json({
    assistantMessage,
    parsed,
  });
}

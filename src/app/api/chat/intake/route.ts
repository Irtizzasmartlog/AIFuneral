export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { FieldKey } from "@/lib/chat/intake-schema";
import {
  getFirstFieldKey,
  getNextMissingKey,
  getQuestionForKey,
  answersToCasePatch,
  answersToLegacyCasePatch,
  INTAKE_FIELDS,
} from "@/lib/chat/intake-schema";

type ChatMsg = { role: "user" | "assistant"; content: string };

const CLARIFY = "Please provide a value.";

function intakeResponse(assistantMessage: string, parsed: object | null) {
  return NextResponse.json({
    role: "assistant",
    content: assistantMessage,
    assistantMessage,
    parsed,
  });
}

function parseState(collectedJson: string | null, lastQuestionKey: string | null): {
  answers: Partial<Record<FieldKey, string>>;
  currentKey: FieldKey | null;
} {
  let answers: Partial<Record<FieldKey, string>> = {};
  if (collectedJson) {
    try {
      const parsed = JSON.parse(collectedJson) as Record<string, unknown>;
      for (const f of INTAKE_FIELDS) {
        const v = parsed[f.key];
        if (v !== undefined && v !== null) answers[f.key] = String(v).trim();
      }
    } catch {
      // ignore
    }
  }
  const currentKey =
    lastQuestionKey && INTAKE_FIELDS.some((f) => f.key === lastQuestionKey)
      ? (lastQuestionKey as FieldKey)
      : null;
  return { answers, currentKey };
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { caseId?: string; messages?: ChatMsg[] };
    const caseId = typeof body?.caseId === "string" ? body.caseId.trim() : "";
    const messages: ChatMsg[] = Array.isArray(body?.messages) ? body.messages : [];

    if (!caseId) {
      return intakeResponse("Case ID is required.", null);
    }

    const stateRow = await prisma.caseIntakeState.findUnique({
      where: { caseId },
    });

    const { answers, currentKey } = parseState(
      stateRow?.collectedJson ?? null,
      stateRow?.lastQuestionKey ?? null
    );

    // First load or resume: no user message yet → ask current (or first) question
    const lastUser = messages.filter((m) => m.role === "user").pop();
    const userText = lastUser?.content?.trim() ?? "";

    if (messages.length === 0 || !lastUser) {
      const keyToAsk: FieldKey = currentKey ?? getFirstFieldKey();
      const question = getQuestionForKey(keyToAsk);
      await prisma.caseIntakeState.upsert({
        where: { caseId },
        create: {
          caseId,
          mode: "COLLECTING",
          collectedJson: "{}",
          lastQuestionKey: keyToAsk,
        },
        update: {
          lastQuestionKey: keyToAsk,
          updatedAt: new Date(),
        },
      });
      const casePatch = answersToLegacyCasePatch(answers);
      return intakeResponse(question, { mode: "COLLECTING", next_question: question, case_patch: casePatch });
    }

    // User sent a message: save as answer for currentKey, then ask next
    const keyJustFilled = currentKey ?? getFirstFieldKey();
    const isOptional = INTAKE_FIELDS.find((f) => f.key === keyJustFilled)?.required === false;

    if (!isOptional && userText === "") {
      const sameQuestion = getQuestionForKey(keyJustFilled);
      return intakeResponse(`${sameQuestion} ${CLARIFY}`, { mode: "COLLECTING", next_question: sameQuestion, case_patch: answersToLegacyCasePatch(answers) });
    }

    const newAnswers = { ...answers };
    if (isOptional && (userText === "" || userText.toLowerCase() === "skip")) {
      newAnswers[keyJustFilled] = ""; // mark as skipped so we don't ask again
    } else {
      newAnswers[keyJustFilled] = userText;
    }

    const nextKey = getNextMissingKey(newAnswers, keyJustFilled);
    const nextQuestion = nextKey ? getQuestionForKey(nextKey) : null;

    await prisma.caseIntakeState.upsert({
      where: { caseId },
      create: {
        caseId,
        mode: nextKey ? "COLLECTING" : "GENERATED",
        collectedJson: JSON.stringify(newAnswers),
        lastQuestionKey: nextKey ?? undefined,
      },
      update: {
        mode: nextKey ? "COLLECTING" : "GENERATED",
        collectedJson: JSON.stringify(newAnswers),
        lastQuestionKey: nextKey ?? undefined,
        updatedAt: new Date(),
      },
    });

    const casePatch = answersToLegacyCasePatch(newAnswers);
    if (!nextKey) {
      return intakeResponse(
        "Intake complete. You can apply to case and proceed to packages.",
        { mode: "GENERATED", next_question: null, case_patch: casePatch }
      );
    }

    return intakeResponse(nextQuestion ?? "", { mode: "COLLECTING", next_question: nextQuestion, case_patch: casePatch });
  } catch (err) {
    console.error("[intake] error:", err);
    return intakeResponse("An error occurred. Please try again.", null);
  }
}

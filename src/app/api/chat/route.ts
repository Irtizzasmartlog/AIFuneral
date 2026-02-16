export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

type ChatMsg = { role: "user" | "assistant"; content: string };

const RETRY_DELAY_MS = 2000;
const MAX_RETRIES = 3;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return msg.includes("429") || msg.toLowerCase().includes("too many requests");
}

async function withRetry<T>(
  fn: () => Promise<T>,
  retries: number = MAX_RETRIES
): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < retries && isRateLimitError(err)) {
        await sleep(RETRY_DELAY_MS);
        continue;
      }
      throw lastError;
    }
  }
  throw lastError;
}

function toGeminiText(messages: ChatMsg[]): string {
  return messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join("\n");
}

function successResponse(content: string) {
  return NextResponse.json({
    role: "assistant",
    content: content || "",
  });
}

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as { messages?: ChatMsg[] };

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return successResponse("Please provide at least one message.");
    }

    const apiKey = process.env.GEMINI_API_KEY;
    const raw = (process.env.GEMINI_MODEL || "gemini-2.5-flash").trim();
    // remove accidental "GEMINI_MODEL=" prefix if someone pasted the whole line
    const cleaned = raw.replace(/^GEMINI_MODEL=/, "");
    // remove accidental "models/" prefix if provided
    const modelName = cleaned.replace(/^models\//, "");

    if (!apiKey) {
      return successResponse("API key is not configured. Please set GEMINI_API_KEY.");
    }

    console.log("Using Gemini model:", modelName);

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: modelName });
    const prompt = toGeminiText(messages);

    const text = await withRetry(async () => {
      const result = await model.generateContent(prompt);
      const out = result?.response?.text?.() ?? "";
      return out;
    });

    const content = text ?? "";
    console.log("[chat] model:", modelName, "| returned content length:", content.length);
    return successResponse(content);
  } catch (err) {
    console.error("[chat] Gemini error:", err);
    return successResponse("An error occurred. Please try again.");
  }
}

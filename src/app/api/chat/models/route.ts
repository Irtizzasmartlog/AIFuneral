export const runtime = "nodejs";

import { NextResponse } from "next/server";

const SUGGESTED_MODELS = [
  "gemini-1.5-pro",
  "gemini-1.5-flash",
  "gemini-1.5-flash-8b",
  "gemini-1.0-pro",
];

const STATIC_HINT =
  "Set GEMINI_MODEL in .env. Suggested: gemini-1.5-pro, gemini-1.5-flash. API key must be from Google AI Studio; enable Generative Language API for the project.";

export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({
      models: [],
      suggestion: SUGGESTED_MODELS,
      hint: "GEMINI_API_KEY is not set. Add it to .env from Google AI Studio. " + STATIC_HINT,
    });
  }

  try {
    const url = new URL("https://generativelanguage.googleapis.com/v1beta/models");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("pageSize", "50");

    const res = await fetch(url.toString(), { cache: "no-store" });
    const data = (await res.json()) as { models?: { name?: string; displayName?: string }[]; error?: { message?: string } };

    if (!res.ok) {
      const message = data?.error?.message ?? res.statusText ?? String(res.status);
      console.error("[models] List models failed:", message);
      return NextResponse.json({
        models: [],
        suggestion: SUGGESTED_MODELS,
        hint: STATIC_HINT + " List failed: " + message,
      });
    }

    const models = (data.models ?? []).map((m) => m.name ?? m.displayName ?? "").filter(Boolean);
    return NextResponse.json({
      models,
      suggestion: SUGGESTED_MODELS,
      hint: models.length === 0 ? STATIC_HINT : undefined,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[models] Error:", message);
    return NextResponse.json({
      models: [],
      suggestion: SUGGESTED_MODELS,
      hint: STATIC_HINT + " " + message,
    });
  }
}

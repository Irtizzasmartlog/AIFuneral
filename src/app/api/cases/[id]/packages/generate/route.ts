import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runOrchestrator } from "@/orchestrator/run";

/**
 * POST /api/cases/[id]/packages/generate
 * Generates packages for the case from intake data (orchestrator + pricing agent) and saves to DB.
 */
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = (await getServerSession(authOptions as any)) as {
    user?: { organizationId?: string };
  } | null;
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orgId = session.user.organizationId ?? "";
  if (!orgId) {
    return NextResponse.json({ error: "Forbidden: no organization" }, { status: 403 });
  }

  const { id: caseId } = await params;
  if (!caseId?.trim()) {
    return NextResponse.json({ error: "Missing case id" }, { status: 400 });
  }

  const caseRecord = await prisma.case.findFirst({
    where: { id: caseId.trim(), organizationId: orgId },
  });
  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  try {
    console.log("[packages/generate] generating for case:", caseId);
    const result = await runOrchestrator(caseId.trim());
    const count = result.packages.length;
    console.log("[packages/generate] saved packages count:", count);
    return NextResponse.json({ ok: true, count });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[packages/generate] error:", message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

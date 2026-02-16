import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * DELETE /api/cases/[id]/delete
 * Deletes a case and all related data (cascade). Only cases in the current user's org can be deleted.
 */
export async function DELETE(
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

  const { id } = await params;
  if (!id?.trim()) {
    return NextResponse.json({ error: "Missing case id" }, { status: 400 });
  }

  try {
    // Only delete if the case belongs to the user's organization (same org as logged-in user)
    const deleted = await prisma.case.deleteMany({
      where: {
        id: id.trim(),
        organizationId: orgId,
      },
    });

    if (deleted.count === 0) {
      return NextResponse.json(
        { error: "Case not found or you do not have permission to delete it" },
        { status: 404 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[delete case]", message);
    return NextResponse.json(
      { error: "Failed to delete case", detail: message },
      { status: 500 }
    );
  }
}

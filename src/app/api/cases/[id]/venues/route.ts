import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getLocationQuery, extractLocationQuery } from "@/lib/venues/location-query";
import { getNearbyVenues, isVenueLookupEnabled } from "@/lib/venues/geocode-and-places";
import type { VenueCategory } from "@/lib/venues/types";

const VALID_TYPES: VenueCategory[] = ["cemetery", "mosque", "crematorium", "chapel", "memorial"];

/**
 * GET /api/cases/[id]/venues?type=cemetery|mosque|crematorium|chapel|memorial&radiusKm=10
 * Returns nearby venues for the case's location. Server-side so API key is not exposed.
 */
export async function GET(
  request: Request,
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
    include: {
      intakeState: true,
    },
  });
  if (!caseRecord) {
    return NextResponse.json({ error: "Case not found" }, { status: 404 });
  }

  const { searchParams } = new URL(request.url);
  const typeParam = searchParams.get("type") ?? "cemetery";
  const type = VALID_TYPES.includes(typeParam as VenueCategory) ? (typeParam as VenueCategory) : "cemetery";
  const radiusKm = Math.min(50, Math.max(1, Number(searchParams.get("radiusKm")) || 10));

  if (!isVenueLookupEnabled()) {
    return NextResponse.json({
      venues: [],
      disabled: true,
      message: "Venue lookup is disabled (missing maps API key).",
    });
  }

  const locationQuery = getLocationQuery(caseRecord, caseRecord.intakeState?.collectedJson ?? null);
  if (!locationQuery) {
    return NextResponse.json({
      venues: [],
      disabled: false,
      message: "No location set. Add Preferred Venue or Suburb/Postcode in Intake.",
    });
  }

  const extractedLocationQuery = extractLocationQuery(locationQuery) || locationQuery;
  const { venues, disabled, error, debugStatus } = await getNearbyVenues(extractedLocationQuery, type, radiusKm);
  const body: Record<string, unknown> = {
    venues,
    disabled,
    error: error ?? null,
    locationQuery: extractedLocationQuery,
    extractedLocationQuery,
  };
  if (process.env.NODE_ENV === "development" && debugStatus) {
    body.debugStatus = debugStatus;
  }
  return NextResponse.json(body);
}

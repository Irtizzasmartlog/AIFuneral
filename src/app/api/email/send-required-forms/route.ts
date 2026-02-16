import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send";
import {
  REQUIRED_FORMS_LIST,
  buildRequiredFormsEmailHtml,
} from "@/lib/email/required-forms";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const caseId = typeof body?.caseId === "string" ? body.caseId.trim() : null;
    if (!caseId) {
      return NextResponse.json(
        { ok: false, error: "Missing or invalid caseId" },
        { status: 400 }
      );
    }

    const caseRecord = await prisma.case.findUnique({
      where: { id: caseId },
      select: {
        id: true,
        caseNumber: true,
        deceasedFullName: true,
        nextOfKinEmail: true,
        nextOfKinName: true,
      },
    });

    if (!caseRecord) {
      return NextResponse.json(
        { ok: false, error: "Case not found" },
        { status: 404 }
      );
    }

    const to = caseRecord.nextOfKinEmail?.trim();
    if (!to) {
      return NextResponse.json(
        { ok: false, error: "No customer email on file for this case" },
        { status: 400 }
      );
    }

    const subject = `Required forms – Case ${caseRecord.caseNumber}`;
    const html = buildRequiredFormsEmailHtml({
      deceasedName: caseRecord.deceasedFullName,
      caseNumber: caseRecord.caseNumber,
      formNames: REQUIRED_FORMS_LIST,
    });

    const result = await sendEmail({ to, subject, html });

    await prisma.emailLog.create({
      data: {
        caseId: caseRecord.id,
        to,
        subject,
        body: html,
        provider: result.provider,
        externalId: result.externalId ?? undefined,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[send-required-forms]", message);
    return NextResponse.json(
      { ok: false, error: message },
      { status: 500 }
    );
  }
}

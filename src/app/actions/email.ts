"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email/send";

const TOKEN_EXIRY_DAYS = 14;

export async function createApprovalTokenAndSend(params: {
  caseId: string;
  to: string;
  subject: string;
  bodyHtml: string;
  baseUrl: string;
}) {
  const { caseId, to, subject, bodyHtml, baseUrl } = params;
  const token = nanoid(32);
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + TOKEN_EXIRY_DAYS);

  await prisma.approvalToken.create({
    data: {
      caseId,
      token,
      email: to,
      expiresAt,
    },
  });

  const approveUrl = `${baseUrl}/public/approve/${token}`;
  const requestChangesUrl = `${baseUrl}/public/request-changes/${token}`;

  const fullHtml = bodyHtml
    .replace(/\{\{approve_url\}\}/g, approveUrl)
    .replace(/\{\{request_changes_url\}\}/g, requestChangesUrl);

  const result = await sendEmail({ to, subject, html: fullHtml });

  await prisma.emailLog.create({
    data: {
      caseId,
      to,
      subject,
      body: fullHtml,
      provider: result.provider,
      externalId: result.externalId ?? undefined,
    },
  });

  await prisma.case.update({
    where: { id: caseId },
    data: { status: "Sent" },
  });

  revalidatePath(`/cases/${caseId}/email`);
  revalidatePath("/");
  return { success: true, token };
}

export async function recordClientApproval(token: string, packageId: string) {
  const record = await prisma.approvalToken.findUnique({
    where: { token },
    include: { case: true },
  });
  if (!record || record.usedAt || new Date() > record.expiresAt) {
    return { error: "Invalid or expired link" };
  }

  await prisma.$transaction([
    prisma.approvalToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    }),
    prisma.case.update({
      where: { id: record.caseId },
      data: { status: "Approved", recommendedPackageId: packageId },
    }),
  ]);

  revalidatePath(`/cases/${record.caseId}/email`);
  revalidatePath(`/cases/${record.caseId}/invoice`);
  return { success: true };
}

export async function recordChangeRequest(token: string, message: string) {
  const record = await prisma.approvalToken.findUnique({
    where: { token },
  });
  if (!record || record.usedAt || new Date() > record.expiresAt) {
    return { error: "Invalid or expired link" };
  }

  await prisma.changeRequest.create({
    data: {
      caseId: record.caseId,
      tokenId: record.id,
      message,
    },
  });

  revalidatePath(`/cases/${record.caseId}/email`);
  return { success: true };
}

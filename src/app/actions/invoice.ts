"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { buildInvoicePdf } from "@/lib/pdf/invoice";

export async function getOrCreateInvoice(caseId: string) {
  let invoice = await prisma.invoice.findFirst({
    where: { caseId },
    orderBy: { createdAt: "desc" },
  });

  if (!invoice) {
    const caseRecord = await prisma.case.findUniqueOrThrow({
      where: { id: caseId },
      include: {
        packages: { include: { quoteLineItems: true } },
      },
    });
    const recommendedId = caseRecord.recommendedPackageId;
    const pkg = recommendedId
      ? caseRecord.packages.find((p) => p.id === recommendedId) ?? caseRecord.packages[0]
      : caseRecord.packages[0];
    const lineItems = pkg
      ? pkg.quoteLineItems.map((l) => ({ description: l.description, amountCents: l.amountCents }))
      : [];
    const totalCents = lineItems.reduce((s, l) => s + l.amountCents, 0);
    const count = await prisma.invoice.count();
    const invoiceNumber = `INV-${String(count + 1).padStart(4, "0")}`;

    invoice = await prisma.invoice.create({
      data: {
        caseId,
        invoiceNumber,
        status: "Draft",
        totalCents,
        lineItems: JSON.stringify(lineItems),
      },
    });
  }

  revalidatePath(`/cases/${caseId}/invoice`);
  return invoice;
}

export async function getInvoicePdfBuffer(caseId: string): Promise<Uint8Array> {
  const invoice = await getOrCreateInvoice(caseId);
  const caseRecord = await prisma.case.findUniqueOrThrow({
    where: { id: caseId },
    include: { organization: true },
  });

  let lineItems: { description: string; amountCents: number }[] = [];
  try {
    lineItems = typeof invoice.lineItems === "string" ? JSON.parse(invoice.lineItems ?? "[]") : [];
  } catch (_) {}

  return buildInvoicePdf({
    invoiceNumber: invoice.invoiceNumber ?? "DRAFT",
    caseNumber: caseRecord.caseNumber,
    deceasedName: caseRecord.deceasedFullName,
    clientName: caseRecord.nextOfKinName,
    clientEmail: caseRecord.nextOfKinEmail,
    organizationName: caseRecord.organization.name,
    lineItems,
    totalCents: invoice.totalCents,
    status: invoice.status,
    date: invoice.createdAt.toISOString().slice(0, 10),
  });
}

export async function sendInvoice(caseId: string) {
  await prisma.invoice.updateMany({
    where: { caseId },
    data: { status: "Sent", sentAt: new Date() },
  });
  revalidatePath(`/cases/${caseId}/invoice`);
}

export async function markInvoicePaid(caseId: string) {
  await prisma.invoice.updateMany({
    where: { caseId },
    data: { status: "Paid", paidAt: new Date() },
  });
  await prisma.case.update({
    where: { id: caseId },
    data: { status: "Booked" },
  });
  revalidatePath(`/cases/${caseId}/invoice`);
  revalidatePath("/");
}

export async function updateTaskCompleted(taskId: string, completed: boolean) {
  await prisma.task.update({
    where: { id: taskId },
    data: { completedAt: completed ? new Date() : null },
  });
  revalidatePath("/");
}

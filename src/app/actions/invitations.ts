"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

export async function toggleCaseInvitationsAddOn(caseId: string) {
  const caseRecord = await prisma.case.findUnique({
    where: { id: caseId },
    select: { addOns: true },
  });
  if (!caseRecord) throw new Error("Case not found");
  let addOns: Record<string, boolean> = {};
  try {
    addOns = caseRecord.addOns ? JSON.parse(caseRecord.addOns) : {};
  } catch (_) {}
  addOns.invitations = true;
  await prisma.case.update({
    where: { id: caseId },
    data: { addOns: JSON.stringify(addOns) },
  });
  revalidatePath(`/cases/${caseId}/invitations`);
  revalidatePath(`/cases/${caseId}/intake`);
  revalidatePath("/");
  return { success: true };
}

export async function upsertInvitationInstance(params: {
  caseId: string;
  templateId: string;
  serviceName?: string;
  serviceDate?: Date;
  serviceTime?: string;
  locationName?: string;
  locationAddress?: string;
  includeQrCode?: boolean;
  includeMapLink?: boolean;
  designSnapshot?: string;
  instanceId?: string;
}) {
  const {
    caseId,
    templateId,
    serviceName,
    serviceDate,
    serviceTime,
    locationName,
    locationAddress,
    includeQrCode,
    includeMapLink,
    designSnapshot,
    instanceId,
  } = params;

  if (instanceId) {
    const updated = await prisma.invitationInstance.update({
      where: { id: instanceId },
      data: {
        serviceName: serviceName ?? undefined,
        serviceDate: serviceDate ?? undefined,
        serviceTime: serviceTime ?? undefined,
        locationName: locationName ?? undefined,
        locationAddress: locationAddress ?? undefined,
        includeQrCode: includeQrCode ?? false,
        includeMapLink: includeMapLink ?? false,
        designSnapshot: designSnapshot ?? undefined,
      },
    });
    revalidatePath(`/cases/${caseId}/invitations`);
    return updated;
  }

  const created = await prisma.invitationInstance.create({
    data: {
      caseId,
      templateId,
      serviceName: serviceName ?? undefined,
      serviceDate: serviceDate ?? undefined,
      serviceTime: serviceTime ?? undefined,
      locationName: locationName ?? undefined,
      locationAddress: locationAddress ?? undefined,
      includeQrCode: includeQrCode ?? false,
      includeMapLink: includeMapLink ?? false,
      designSnapshot: designSnapshot ?? undefined,
    },
  });
  revalidatePath(`/cases/${caseId}/invitations`);
  return created;
}

export async function addInvitationGuest(params: {
  invitationInstanceId: string;
  name: string;
  email?: string;
}) {
  const guest = await prisma.invitationGuest.create({
    data: params,
  });
  revalidatePath("/");
  return guest;
}

export async function removeInvitationGuest(guestId: string) {
  await prisma.invitationGuest.delete({ where: { id: guestId } });
  revalidatePath("/");
}

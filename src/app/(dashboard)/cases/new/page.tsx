import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function NewCasePage() {
  const session = (await getServerSession(authOptions as any)) as {
    user?: { id?: string; organizationId?: string };
  } | null;
  if (!session?.user) redirect("/login");

  const orgId = session.user.organizationId;
  if (!orgId) redirect("/");

  const year = new Date().getFullYear();

  const created = await prisma.case.create({
    data: {
      status: "Draft",
      organizationId: orgId,
      createdById: session.user.id,
    },
  });

  const caseNumber = `FF-${year}-${String(created.id).padStart(5, "0")}`;

  await prisma.case.update({
    where: { id: created.id },
    data: { caseNumber },
  });

  redirect(`/cases/${created.id}/intake`);
}

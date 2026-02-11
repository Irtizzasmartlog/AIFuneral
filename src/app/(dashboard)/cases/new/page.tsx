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
  const count = await prisma.case.count({ where: { organizationId: orgId } });
  const caseNumber = `FF-${year}-${String(count + 1).padStart(5, "0")}`;

  const newCase = await prisma.case.create({
    data: {
      caseNumber,
      status: "Draft",
      organizationId: orgId,
      createdById: session.user.id,
    },
  });

  redirect(`/cases/${newCase.id}/intake`);
}

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { Sidebar } from "@/components/layout/Sidebar";
import { TopBar } from "@/components/layout/TopBar";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = (await getServerSession(authOptions as any)) as {
    user?: { id?: string; organizationId?: string; name?: string };
  } | null;
  if (!session?.user) redirect("/login");

  let casesList: { id: string; caseNumber: string; status: string }[] = [];
  const orgId = session.user.organizationId;
  if (orgId) {
    casesList = await prisma.case.findMany({
      where: { organizationId: orgId },
      select: { id: true, caseNumber: true, status: true },
      orderBy: { updatedAt: "desc" },
      take: 50,
    });
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <TopBar casesList={casesList} />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}

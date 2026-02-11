import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { ApproveClient } from "./ApproveClient";

export default async function ApprovePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const record = await prisma.approvalToken.findUnique({
    where: { token },
    include: {
      case: {
        include: {
          packages: { orderBy: { sortOrder: "asc" }, include: { quoteLineItems: true } },
        },
      },
    },
  });

  if (!record) notFound();
  if (record.usedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Link already used</h1>
          <p className="text-slate-600">This approval link has already been used. If you need to make changes, please contact your funeral director.</p>
        </div>
      </div>
    );
  }
  if (new Date() > record.expiresAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Link expired</h1>
          <p className="text-slate-600">This approval link has expired. Please contact your funeral director for a new link.</p>
        </div>
      </div>
    );
  }

  const deceasedName = record.case.deceasedFullName ?? "your loved one";
  const packages = record.case.packages.map((p) => ({
    id: p.id,
    name: p.name,
    tier: p.tier,
    totalCents: p.totalCents,
  }));

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <ApproveClient
        token={token}
        deceasedName={deceasedName}
        packages={packages}
      />
    </div>
  );
}

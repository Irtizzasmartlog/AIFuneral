import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RequestChangesClient } from "./RequestChangesClient";

export default async function RequestChangesPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const record = await prisma.approvalToken.findUnique({
    where: { token },
    include: { case: true },
  });

  if (!record) notFound();
  if (record.usedAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Link already used</h1>
          <p className="text-slate-600">This link has already been used. Please contact your funeral director if you need to make further changes.</p>
        </div>
      </div>
    );
  }
  if (new Date() > record.expiresAt) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
          <h1 className="text-xl font-bold text-slate-900 mb-2">Link expired</h1>
          <p className="text-slate-600">This link has expired. Please contact your funeral director for a new link.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <RequestChangesClient token={token} />
    </div>
  );
}

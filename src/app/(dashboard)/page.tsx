import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteCaseButton } from "@/components/case/DeleteCaseButton";
import { Plus } from "lucide-react";

export default async function DashboardPage() {
  const session = (await getServerSession(authOptions as any)) as {
    user?: { organizationId?: string };
  } | null;
  const orgId = session?.user?.organizationId ?? "";

  const cases = await prisma.case.findMany({
    where: { organizationId: orgId },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div className="max-w-6xl mx-auto px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dashboard</h1>
          <p className="text-sm text-slate-500">Manage your cases</p>
        </div>
        <Button asChild>
          <Link href="/cases/new" className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create new case
          </Link>
        </Button>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Active Cases</CardTitle>
          <CardDescription>All cases for your organization</CardDescription>
        </CardHeader>
        <CardContent>
          {cases.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <p className="mb-4">No cases yet.</p>
              <Button asChild>
                <Link href="/cases/new">Create your first case</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Case number</TableHead>
                  <TableHead>Deceased</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cases.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.caseNumber}</TableCell>
                    <TableCell>{c.deceasedFullName ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={c.status === "Draft" ? "secondary" : "default"}>
                        {c.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{c.nextOfKinName ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/cases/${c.id}/intake`}
                          className="text-primary text-sm font-medium hover:underline"
                        >
                          Open
                        </Link>
                        <DeleteCaseButton caseId={c.id} caseNumber={c.caseNumber} />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

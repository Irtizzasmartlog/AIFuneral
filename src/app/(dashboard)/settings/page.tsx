import { getServerSession } from "next-auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { authOptions } from "@/lib/auth";

export default async function SettingsPage() {
  const session = (await getServerSession(authOptions as any)) as {
    user?: { name?: string; email?: string; organizationName?: string };
  } | null;
  const user = session?.user;
  const orgName = user?.organizationName;

  return (
    <div className="max-w-2xl mx-auto px-8 py-8">
      <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-8">Settings</h1>
      <Card>
        <CardHeader>
          <CardTitle>Organization</CardTitle>
          <CardDescription>Your organization and profile</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Organization</p>
            <p className="text-sm font-medium">{orgName ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Email</p>
            <p className="text-sm font-medium">{user?.email ?? "N/A"}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Name</p>
            <p className="text-sm font-medium">{user?.name ?? "N/A"}</p>
          </div>
        </CardContent>
      </Card>
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Compliance</CardTitle>
          <CardDescription>Legal and compliance notices</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600">
            This tool is for internal use by funeral directors. All legal documents must be reviewed and verified for compliance before use. This is not legal advice. Director review required.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

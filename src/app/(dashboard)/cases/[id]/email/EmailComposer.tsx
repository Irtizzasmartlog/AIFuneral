"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { createApprovalTokenAndSend } from "@/app/actions/email";
import { toast } from "sonner";
import { Send, FileText } from "lucide-react";
import { REQUIRED_FORMS_LIST } from "@/lib/email/required-forms";

type PackageItem = {
  id: string;
  name: string;
  tier: string;
  totalCents: number;
};

export function EmailComposer({
  caseId,
  caseNumber,
  deceasedName,
  nextOfKinEmail,
  packages,
}: {
  caseId: string;
  caseNumber: string;
  deceasedName: string | null;
  nextOfKinEmail: string | null;
  packages: PackageItem[];
}) {
  const router = useRouter();
  const [to, setTo] = useState(nextOfKinEmail ?? "");
  const [cc, setCc] = useState("");
  const [subject, setSubject] = useState(`Arrangement Details for ${deceasedName ?? "Loved One"}`);
  const [body, setBody] = useState(
    `Dear {{Family_Contact_Name}},

It was an honor speaking with you today. We have prepared the preliminary arrangement details for {{Deceased_Name}} for your review.

Please review the proposed packages below and select the option that best honors your loved one's memory. Once selected, you can sign the digital authorization form.

We understand this is a difficult time. Please do not hesitate to reach out if you have any questions about the options presented.

Sincerely,
{{Funeral_Director_Name}}`
  );
  const [sending, setSending] = useState(false);
  const [requiredFormsOpen, setRequiredFormsOpen] = useState(false);
  const [sendingRequiredForms, setSendingRequiredForms] = useState(false);

  const bodyWithVars = body
    .replace(/\{\{Family_Contact_Name\}\}/g, "Family Contact")
    .replace(/\{\{Deceased_Name\}\}/g, deceasedName ?? "your loved one")
    .replace(/\{\{Funeral_Director_Name\}\}/g, "Funeral Director");

  const baseUrl = typeof window !== "undefined" ? window.location.origin : process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  async function handleSend() {
    if (!to.trim()) {
      toast.error("Please enter recipient email");
      return;
    }
    setSending(true);
    try {
      await createApprovalTokenAndSend({
        caseId,
        to: to.trim(),
        subject,
        bodyHtml: bodyWithVars + getPackageTilesHtml(),
        baseUrl,
      });
      toast.success("Email sent. Client can use the link to approve.");
      router.refresh();
    } catch (e) {
      toast.error("Failed to send email");
      console.error(e);
    } finally {
      setSending(false);
    }
  }

  async function handleSendRequiredForms() {
    const recipient = nextOfKinEmail?.trim();
    if (!recipient) {
      toast.error("No customer email on file for this case");
      return;
    }
    setSendingRequiredForms(true);
    try {
      const res = await fetch("/api/email/send-required-forms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caseId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        toast.error(data.error ?? "Failed to send required forms");
        return;
      }
      toast.success("Required forms sent to " + recipient);
      setRequiredFormsOpen(false);
      router.refresh();
    } catch (e) {
      console.error(e);
      toast.error("Failed to send required forms");
    } finally {
      setSendingRequiredForms(false);
    }
  }

  function getPackageTilesHtml(): string {
    return `
<div style="margin-top: 24px; padding: 16px; border: 1px solid #e2e8f0; border-radius: 12px;">
  <p style="font-weight: 600; margin-bottom: 12px;">Select a package:</p>
  <p style="font-size: 12px; color: #64748b;">Use the link below to review and select your preferred package.</p>
  <p style="margin-top: 12px;"><a href="{{approve_url}}" style="color: #2563eb; font-weight: 600;">Review and select package</a></p>
  <p style="margin-top: 8px;"><a href="{{request_changes_url}}" style="color: #64748b;">Request changes</a></p>
</div>`;
  }

  const formatAud = (cents: number) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-[80px_1fr] items-center gap-2">
              <Label className="text-sm text-slate-500 font-medium">To:</Label>
              <Input value={to} onChange={(e) => setTo(e.target.value)} placeholder="client@email.com" />
            </div>
            <div className="grid grid-cols-[80px_1fr] items-center gap-2">
              <Label className="text-sm text-slate-500 font-medium">CC:</Label>
              <Input value={cc} onChange={(e) => setCc(e.target.value)} placeholder="Optional" />
            </div>
            <div className="grid grid-cols-[80px_1fr] items-center gap-2">
              <Label className="text-sm text-slate-500 font-medium">Subject:</Label>
              <Input value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div className="pt-4">
              <Label className="text-sm text-slate-500 font-medium">Body</Label>
              <Textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={12}
                className="mt-2 font-mono text-sm"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={handleSend} disabled={sending} className="flex items-center gap-2">
                <Send className="h-4 w-4" />
                {sending ? "Sending..." : "Send to client"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setRequiredFormsOpen(true)}
                disabled={sending || !nextOfKinEmail?.trim()}
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                Send Required Forms
              </Button>
            </div>
            <Dialog open={requiredFormsOpen} onOpenChange={setRequiredFormsOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Send Required Forms</DialogTitle>
                  <DialogDescription>
                    Email the customer all necessary documents and forms for this case. They will receive links to the
                    forms. Recipient: <strong>{nextOfKinEmail?.trim() ?? "No email on file"}</strong>
                  </DialogDescription>
                </DialogHeader>
                <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm text-slate-600">
                  <p className="font-medium text-slate-700 mb-2">Documents included:</p>
                  <ul className="list-disc list-inside space-y-1 text-xs">
                    {REQUIRED_FORMS_LIST.map((name) => (
                      <li key={name}>{name}</li>
                    ))}
                  </ul>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setRequiredFormsOpen(false)}
                    disabled={sendingRequiredForms}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSendRequiredForms} disabled={sendingRequiredForms}>
                    {sendingRequiredForms ? "Sending..." : "Send"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
      <div>
        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">Client preview</p>
        <Card className="p-6 bg-slate-50">
          <div className="prose prose-sm max-w-none text-slate-700 whitespace-pre-wrap">{bodyWithVars}</div>
          <div className="mt-6 p-4 border border-slate-200 rounded-xl bg-white">
            <p className="font-semibold text-slate-800 mb-3">Select a package</p>
            <div className="space-y-3">
              {packages.map((pkg) => (
                <div key={pkg.id} className="flex justify-between items-center p-3 border border-slate-100 rounded-lg">
                  <span className="font-medium">{pkg.name}</span>
                  <span className="font-bold text-primary">{formatAud(pkg.totalCents)}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-slate-500 mt-3">Client will receive a link to select a package and request changes.</p>
          </div>
        </Card>
      </div>
    </div>
  );
}

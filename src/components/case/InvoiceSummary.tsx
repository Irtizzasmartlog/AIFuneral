"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { FileDown, Send, CheckCircle } from "lucide-react";
import { sendInvoice, markInvoicePaid } from "@/app/actions/invoice";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

type InvoiceSummaryProps = {
  caseId: string;
  invoice: {
    id: string;
    invoiceNumber: string | null;
    status: string;
    totalCents: number;
    lineItems: string | null;
    sentAt: Date | null;
    paidAt: Date | null;
  };
};

export function InvoiceSummary({ caseId, invoice }: InvoiceSummaryProps) {
  const router = useRouter();
  const [sending, setSending] = useState(false);
  const [marking, setMarking] = useState(false);

  const lineItems: { description: string; amountCents: number }[] = (() => {
    try {
      return typeof invoice.lineItems === "string" ? JSON.parse(invoice.lineItems ?? "[]") : [];
    } catch {
      return [];
    }
  })();

  const formatAud = (cents: number) =>
    new Intl.NumberFormat("en-AU", { style: "currency", currency: "AUD" }).format(cents / 100);

  async function handleSend() {
    setSending(true);
    try {
      await sendInvoice(caseId);
      toast.success("Invoice marked as sent");
      router.refresh();
    } catch (e) {
      toast.error("Failed to send invoice");
    } finally {
      setSending(false);
    }
  }

  async function handleMarkPaid() {
    setMarking(true);
    try {
      await markInvoicePaid(caseId);
      toast.success("Invoice marked as paid");
      router.refresh();
    } catch (e) {
      toast.error("Failed to mark paid");
    } finally {
      setMarking(false);
    }
  }

  return (
    <Card>
      <CardHeader className="p-4 border-b border-slate-100 flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <FileDown className="h-4 w-4 text-slate-400" />
          <h3 className="font-bold text-slate-800 uppercase text-xs tracking-wider">Invoice Summary</h3>
        </div>
        <Badge variant={invoice.status === "Paid" ? "success" : invoice.status === "Sent" ? "default" : "secondary"}>
          {invoice.status}
        </Badge>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {lineItems.map((line, i) => (
            <div key={i} className="flex justify-between items-center py-2 border-b border-slate-50">
              <div>
                <span className="text-sm font-semibold">{line.description}</span>
              </div>
              <span className="font-mono font-medium">{formatAud(line.amountCents)}</span>
            </div>
          ))}
        </div>
        <div className="mt-8 flex items-center justify-between bg-slate-50 p-4 rounded-lg">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase">Total</p>
            <p className="text-3xl font-bold text-slate-900">{formatAud(invoice.totalCents)}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href={`/api/cases/${caseId}/invoice-pdf`} download={`invoice-${invoice.invoiceNumber}.pdf`}>
                <FileDown className="h-4 w-4 mr-1" />
                Generate PDF
              </a>
            </Button>
            {invoice.status === "Draft" && (
              <Button size="sm" onClick={handleSend} disabled={sending}>
                <Send className="h-4 w-4 mr-1" />
                Send invoice
              </Button>
            )}
            {invoice.status !== "Paid" && (
              <Button size="sm" variant="secondary" onClick={handleMarkPaid} disabled={marking}>
                <CheckCircle className="h-4 w-4 mr-1" />
                Mark paid
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

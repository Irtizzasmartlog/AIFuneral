"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { recordChangeRequest } from "@/app/actions/email";

export function RequestChangesClient({ token }: { token: string }) {
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please enter your request");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await recordChangeRequest(token, message.trim());
      if ("error" in result) {
        setError(result.error ?? null);
        return;
      }
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-slate-200 p-8 text-center">
        <h1 className="text-xl font-bold text-slate-900 mb-2">Thank you</h1>
        <p className="text-slate-600">
          Your request has been sent to your funeral director. They will be in touch shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-lg w-full">
      <div className="flex items-center gap-2 mb-6">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-sm">
          FF
        </div>
        <span className="font-bold text-lg text-slate-900">FuneralFlow AI</span>
      </div>
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Request changes</h1>
      <p className="text-slate-500 mb-6">
        Let your funeral director know what you would like to change or discuss.
      </p>
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardContent className="pt-6">
            <Label htmlFor="message" className="text-sm font-medium text-slate-700">
              Your message
            </Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={5}
              className="mt-2"
              placeholder="Describe the changes you would like..."
            />
          </CardContent>
        </Card>
        {error && <p className="text-sm text-destructive mb-4">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Sending..." : "Send request"}
        </Button>
      </form>
    </div>
  );
}

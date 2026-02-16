"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { InvitationPreview } from "./InvitationPreview";
import { Check, Upload } from "lucide-react";

type Template = { id: string; name: string; slug: string; thumbnailUrl: string | null; designConfig?: string | null };
type Instance = {
  id: string;
  templateId: string;
  serviceName: string | null;
  serviceDate: Date | null;
  serviceTime: string | null;
  locationName: string | null;
  locationAddress: string | null;
  includeQrCode: boolean;
  includeMapLink: boolean;
  guests: { id: string; name: string; email: string | null }[];
};

export function InvitationWizard({
  caseId,
  caseData,
  templates,
  instance,
}: {
  caseId: string;
  caseData: {
    deceasedFullName: string | null;
    preferredServiceDate: Date | null;
    venuePreference: string | null;
    suburb: string | null;
    state: string | null;
  };
  templates: Template[];
  instance: Instance | null;
}) {
  const [step, setStep] = useState(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState(
    instance?.templateId ?? templates[0]?.id ?? ""
  );
  const selectedTemplate = templates.find((t) => t.id === selectedTemplateId) ?? templates[0] ?? null;
  const [serviceName, setServiceName] = useState(instance?.serviceName ?? caseData.deceasedFullName ?? "");
  const [serviceDate, setServiceDate] = useState(
    instance?.serviceDate ? new Date(instance.serviceDate).toISOString().slice(0, 10) : (caseData.preferredServiceDate ? new Date(caseData.preferredServiceDate).toISOString().slice(0, 10) : "")
  );
  const [serviceTime, setServiceTime] = useState(instance?.serviceTime ?? "14:00");
  const [locationName, setLocationName] = useState(instance?.locationName ?? caseData.venuePreference ?? "");
  const [locationAddress, setLocationAddress] = useState(
    instance?.locationAddress ?? [caseData.suburb, caseData.state].filter(Boolean).join(", ")
  );
  const [includeQrCode, setIncludeQrCode] = useState(instance?.includeQrCode ?? true);
  const [includeMapLink, setIncludeMapLink] = useState(instance?.includeMapLink ?? false);
  const [guests, setGuests] = useState<{ name: string; email: string }[]>(
    (instance?.guests ?? []).map((g) => ({ name: g.name, email: g.email ?? "" }))
  );
  const [newGuestName, setNewGuestName] = useState("");
  const [newGuestEmail, setNewGuestEmail] = useState("");

  const addGuest = () => {
    if (newGuestName.trim()) {
      setGuests((g) => [...g, { name: newGuestName.trim(), email: newGuestEmail.trim() }]);
      setNewGuestName("");
      setNewGuestEmail("");
    }
  };

  return (
    <div className="flex gap-8">
      <div className="flex-1 space-y-8">
        {step === 1 && (
          <>
            <section>
              <h3 className="text-lg font-bold uppercase tracking-wider text-slate-600 mb-4">1. Select template</h3>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {templates.map((t) => (
                  <Card
                    key={t.id}
                    role="button"
                    tabIndex={0}
                    className={`cursor-pointer transition-all border-2 ${
                      selectedTemplateId === t.id
                        ? "ring-2 ring-primary ring-offset-2 border-primary"
                        : "border-transparent hover:border-slate-200"
                    }`}
                    onClick={() => setSelectedTemplateId(t.id)}
                    onKeyDown={(e) => e.key === "Enter" && setSelectedTemplateId(t.id)}
                  >
                    <CardContent className="p-4">
                      <div className="aspect-[3/4] bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 text-sm">
                        {t.name}
                      </div>
                      <p className="font-semibold text-sm mt-2">{t.name}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
            <Button onClick={() => setStep(2)}>Next: Edit details</Button>
          </>
        )}

        {step === 2 && (
          <>
            <section>
              <h3 className="text-lg font-bold uppercase tracking-wider text-slate-600 mb-4">2. Service details</h3>
              <Card>
                <CardContent className="pt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Full name</Label>
                      <Input value={serviceName} onChange={(e) => setServiceName(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input type="date" value={serviceDate} onChange={(e) => setServiceDate(e.target.value)} />
                    </div>
                    <div className="space-y-2">
                      <Label>Time</Label>
                      <Input type="time" value={serviceTime} onChange={(e) => setServiceTime(e.target.value)} />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Location name</Label>
                    <Input value={locationName} onChange={(e) => setLocationName(e.target.value)} placeholder="e.g. St. Jude's Memorial Chapel" />
                  </div>
                  <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={locationAddress} onChange={(e) => setLocationAddress(e.target.value)} placeholder="Address" />
                  </div>
                </CardContent>
              </Card>
            </section>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(1)}>Back</Button>
              <Button onClick={() => setStep(3)}>Next: Guest list</Button>
            </div>
          </>
        )}

        {step === 3 && (
          <>
            <section>
              <h3 className="text-lg font-bold uppercase tracking-wider text-slate-600 mb-4">3. Enhancements</h3>
              <Card>
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="font-bold">Digital RSVP / QR code</p>
                    <p className="text-xs text-slate-500">Include QR code on invitation</p>
                  </div>
                  <Switch checked={includeQrCode} onCheckedChange={setIncludeQrCode} />
                </CardContent>
              </Card>
              <Card className="mt-4">
                <CardContent className="pt-6 flex items-center justify-between">
                  <div>
                    <p className="font-bold">Map link</p>
                    <p className="text-xs text-slate-500">Include map link to venue</p>
                  </div>
                  <Switch checked={includeMapLink} onCheckedChange={setIncludeMapLink} />
                </CardContent>
              </Card>
            </section>
            <section>
              <h3 className="text-lg font-bold uppercase tracking-wider text-slate-600 mb-4">4. Guest list</h3>
              <Card>
                <CardContent className="pt-6">
                  <div className="flex gap-2 mb-4">
                    <Input
                      placeholder="Guest name"
                      value={newGuestName}
                      onChange={(e) => setNewGuestName(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addGuest())}
                    />
                    <Input
                      placeholder="Email (optional)"
                      value={newGuestEmail}
                      onChange={(e) => setNewGuestEmail(e.target.value)}
                    />
                    <Button type="button" variant="outline" onClick={addGuest}>Add</Button>
                  </div>
                  <p className="text-xs text-slate-500 mb-4">Or upload CSV (template available on request).</p>
                  <ul className="space-y-2">
                    {guests.map((g, i) => (
                      <li key={i} className="flex justify-between items-center py-2 border-b border-slate-100">
                        <span className="text-sm">{g.name} {g.email && `<${g.email}>`}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setGuests((prev) => prev.filter((_, j) => j !== i))}
                        >
                          Remove
                        </Button>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </section>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(2)}>Back</Button>
              <Button onClick={() => setStep(4)}>Next: Export</Button>
            </div>
          </>
        )}

        {step === 4 && (
          <>
            <section>
              <h3 className="text-lg font-bold uppercase tracking-wider text-slate-600 mb-4">5. Export / Send</h3>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-slate-600 mb-4">Save your invitation design and export as PDF or send to guests by email.</p>
                  <div className="flex gap-3">
                    <Button variant="outline">Download PDF</Button>
                    <Button variant="outline">Send proof to family</Button>
                  </div>
                </CardContent>
              </Card>
            </section>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep(3)}>Back</Button>
              <Button>Save and continue</Button>
            </div>
          </>
        )}
      </div>
      <aside className="hidden xl:block w-[360px] shrink-0">
        <InvitationPreview
          template={selectedTemplate}
          serviceName={serviceName}
          serviceDate={serviceDate}
          serviceTime={serviceTime}
          locationName={locationName}
          locationAddress={locationAddress}
        />
      </aside>
    </div>
  );
}

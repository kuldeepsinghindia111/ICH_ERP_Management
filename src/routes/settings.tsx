import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  CalendarRange, Check, Hash, Lock, Plus, RotateCcw, Save,
  Settings as SettingsIcon, Trash2,
} from "lucide-react";

import {
  useStore, formatReceiptDate, DEFAULT_RECEIPT_FORMAT,
  type CollegePaymentInfo, type ReceiptFormat, type Session,
} from "@/lib/store";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Payment Settings — Northfield CMS" },
      { name: "description", content: "Manage college bank / UPI beneficiary details, receipt number format, and academic sessions." },
    ],
  }),
  component: SettingsPage,
});

const FIELDS: { key: keyof CollegePaymentInfo; label: string; mono?: boolean }[] = [
  { key: "collegeName", label: "College name" },
  { key: "accountName", label: "Beneficiary account name" },
  { key: "accountNumber", label: "Account number", mono: true },
  { key: "ifsc", label: "IFSC code", mono: true },
  { key: "bankName", label: "Bank name" },
  { key: "branch", label: "Branch" },
  { key: "upiId", label: "UPI ID", mono: true },
  { key: "upiName", label: "UPI display name" },
  { key: "supportEmail", label: "Support email" },
  { key: "supportPhone", label: "Support phone" },
];

function SettingsPage() {
  const paymentInfo = useStore((s) => s.paymentInfo);
  const updatePaymentInfo = useStore((s) => s.updatePaymentInfo);
  const resetPaymentInfo = useStore((s) => s.resetPaymentInfo);
  const canEdit = useStore((s) => s.can("settings", "edit"));

  const [draft, setDraft] = useState<CollegePaymentInfo>(paymentInfo);
  const dirty = JSON.stringify(draft) !== JSON.stringify(paymentInfo);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Configuration</p>
          <h1 className="font-display text-2xl font-semibold text-foreground">College Payment Settings</h1>
        </div>
        {!canEdit && (
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3.5 w-3.5" /> Read-only
          </Badge>
        )}
      </header>

      {!canEdit && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
          You don't have permission to edit settings. Ask an admin to grant "settings" edit access.
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Beneficiary details</CardTitle>
          <p className="text-xs text-muted-foreground">
            These details appear on the online payment page and every downloaded receipt.
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.key === "collegeName" || f.key === "accountName" ? "sm:col-span-2" : ""}>
              <Label>{f.label}</Label>
              <Input
                className={f.mono ? "font-mono" : ""}
                value={draft[f.key]}
                disabled={!canEdit}
                onChange={(e) => setDraft((d) => ({ ...d, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button
          variant="ghost"
          disabled={!canEdit}
          onClick={() => {
            resetPaymentInfo();
            setDraft(useStore.getState().paymentInfo);
            toast.success("Restored default beneficiary details");
          }}
        >
          <RotateCcw className="mr-1 h-4 w-4" /> Reset to default
        </Button>
        <Button variant="outline" onClick={() => setDraft(paymentInfo)} disabled={!dirty || !canEdit}>
          Discard changes
        </Button>
        <Button
          onClick={() => {
            const missing = FIELDS.find((f) => !String(draft[f.key]).trim());
            if (missing) return toast.error(`${missing.label} is required`);
            const res = updatePaymentInfo(draft);
            if (!res.ok) return toast.error(res.error ?? "Update failed");
            toast.success("Payment settings updated");
          }}
          disabled={!dirty || !canEdit}
        >
          <Save className="mr-1 h-4 w-4" /> Save changes
        </Button>
      </div>

      <ReceiptFormatCard canEdit={canEdit} />
      <SessionsCard canEdit={canEdit} />
    </div>
  );
}

function ReceiptFormatCard({ canEdit }: { canEdit: boolean }) {
  const fmt = useStore((s) => s.receiptFormat);
  const updateReceiptFormat = useStore((s) => s.updateReceiptFormat);
  const resetReceiptFormat = useStore((s) => s.resetReceiptFormat);
  const [draft, setDraft] = useState<ReceiptFormat>(fmt);
  const dirty = JSON.stringify(draft) !== JSON.stringify(fmt);

  const sample = `${draft.prefix}-${formatReceiptDate(draft.datePattern, new Date())}-${String(draft.counterStart).padStart(4, "0")}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <Hash className="h-4 w-4" /> Receipt number format
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Choose the prefix, date pattern and where the per-day counter starts.
          Tokens: <span className="font-mono">YYYY</span>, <span className="font-mono">YY</span>, <span className="font-mono">MM</span>, <span className="font-mono">DD</span>.
        </p>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-3">
        <div>
          <Label>Prefix</Label>
          <Input value={draft.prefix} disabled={!canEdit}
            onChange={(e) => setDraft((d) => ({ ...d, prefix: e.target.value }))} />
        </div>
        <div>
          <Label>Date pattern</Label>
          <Input className="font-mono" value={draft.datePattern} disabled={!canEdit}
            onChange={(e) => setDraft((d) => ({ ...d, datePattern: e.target.value }))} />
        </div>
        <div>
          <Label>Daily counter starts at</Label>
          <Input type="number" min={1} value={draft.counterStart} disabled={!canEdit}
            onChange={(e) => setDraft((d) => ({ ...d, counterStart: Number(e.target.value) }))} />
        </div>
        <div className="sm:col-span-3 rounded-md border border-border bg-muted/40 p-3 text-xs">
          <span className="text-muted-foreground">Sample receipt no. for today: </span>
          <span className="font-mono text-foreground">{sample}</span>
        </div>
        <div className="sm:col-span-3 flex justify-end gap-2">
          <Button variant="ghost" disabled={!canEdit}
            onClick={() => { resetReceiptFormat(); setDraft(DEFAULT_RECEIPT_FORMAT); toast.success("Receipt format reset"); }}>
            <RotateCcw className="mr-1 h-4 w-4" /> Reset
          </Button>
          <Button disabled={!dirty || !canEdit}
            onClick={() => {
              const res = updateReceiptFormat(draft);
              if (!res.ok) return toast.error(res.error ?? "Failed");
              toast.success("Receipt format updated");
            }}>
            <Save className="mr-1 h-4 w-4" /> Save format
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionsCard({ canEdit }: { canEdit: boolean }) {
  const sessions = useStore((s) => s.sessions);
  const activeSessionId = useStore((s) => s.activeSessionId);
  const addSession = useStore((s) => s.addSession);
  const removeSession = useStore((s) => s.removeSession);
  const setActiveSession = useStore((s) => s.setActiveSession);

  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <CalendarRange className="h-4 w-4" /> Academic sessions / years
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Define academic years to filter payments and receipts by session in reports.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <Label>Session name</Label>
            <Input value={name} disabled={!canEdit} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2026-27" />
          </div>
          <div>
            <Label>Start date</Label>
            <Input type="date" value={start} disabled={!canEdit} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <Label>End date</Label>
            <Input type="date" value={end} disabled={!canEdit} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={!canEdit}
              onClick={() => {
                if (!name.trim() || !start || !end) return toast.error("Name, start and end date are required");
                if (start > end) return toast.error("End date must be after start date");
                addSession({ name: name.trim(), startDate: start, endDate: end });
                toast.success("Session added");
                setName(""); setStart(""); setEnd("");
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Add session
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Session</th>
                <th className="px-3 py-2 text-left">Range</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions.map((s: Session) => {
                const isActive = s.id === activeSessionId;
                return (
                  <tr key={s.id}>
                    <td className="px-3 py-2">
                      <span className="font-medium">{s.name}</span>
                      {isActive && <Badge className="ml-2 bg-success text-success-foreground"><Check className="mr-1 h-3 w-3" /> Active</Badge>}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {s.startDate} → {s.endDate}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {!isActive && (
                        <Button size="sm" variant="ghost" disabled={!canEdit}
                          onClick={() => { setActiveSession(s.id); toast.success(`Active session: ${s.name}`); }}>
                          Set active
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" disabled={!canEdit || isActive}
                        onClick={() => {
                          const r = removeSession(s.id);
                          if (!r.ok) toast.error(r.error ?? "Failed");
                          else toast.success("Session removed");
                        }}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

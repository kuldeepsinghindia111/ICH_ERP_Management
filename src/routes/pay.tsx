import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Building2, Copy, ShieldCheck, Search, CreditCard, Landmark,
  Smartphone, CheckCircle2, Download, Globe, Banknote, ArrowLeft,
} from "lucide-react";
import { toast } from "sonner";

import {
  useStore, semesterSummary, inr, nextReceiptNo,
  validatePaymentFields, referenceHint, type PaymentMethod,
} from "@/lib/store";
import { downloadReceiptPdf, generateReceiptPdf } from "@/lib/receipt";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/pay")({
  head: () => ({
    meta: [
      { title: "Make Payment — Northfield College" },
      { name: "description", content: "Collect or make college fee payments online (UPI, card, netbanking) or offline (cash, cheque, DD)." },
    ],
  }),
  component: PayPage,
});

type Mode = "online" | "offline";
type Step = "choose" | "lookup" | "pay" | "done";

function PayPage() {
  const students = useStore((s) => s.students);
  const programs = useStore((s) => s.programs);
  const charges = useStore((s) => s.charges);
  const adjustments = useStore((s) => s.adjustments);
  const payments = useStore((s) => s.payments);
  const addPayment = useStore((s) => s.addPayment);
  const paymentInfo = useStore((s) => s.paymentInfo);
  const receiptFormat = useStore((s) => s.receiptFormat);

  const [mode, setMode] = useState<Mode>("online");
  const [q, setQ] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);
  const [semester, setSemester] = useState<string>("1");
  const [amount, setAmount] = useState("");
  const [payerName, setPayerName] = useState("");
  const [payerPhone, setPayerPhone] = useState("");
  const [note, setNote] = useState("");
  const [reference, setReference] = useState("");
  const [onlineMethod, setOnlineMethod] = useState<"upi" | "card" | "bank">("upi");
  const [offlineMethod, setOfflineMethod] = useState<"cash" | "cheque" | "bank">("cash");
  const [step, setStep] = useState<Step>("choose");
  const [receipt, setReceipt] = useState<{ ref: string; amount: number; method: PaymentMethod; studentName: string; semester: number; paidAt: string } | null>(null);

  const method: PaymentMethod = mode === "online" ? onlineMethod : offlineMethod;

  const student = useMemo(() => students.find((s) => s.id === studentId) ?? null, [students, studentId]);
  const program = student ? programs.find((p) => p.id === student.programId) : null;

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return students
      .filter((s) =>
        s.admissionNo.toLowerCase().includes(t) ||
        s.name.toLowerCase().includes(t) ||
        Object.values(s.rolls).some((r) => r.toLowerCase().includes(t)),
      )
      .slice(0, 6);
  }, [q, students]);

  const sum = useMemo(() => {
    if (!student) return null;
    return semesterSummary(student.id, Number(semester), { charges, adjustments, payments });
  }, [student, semester, charges, adjustments, payments]);

  const pickStudent = (id: string) => {
    const s = students.find((x) => x.id === id);
    if (!s) return;
    setStudentId(id);
    setSemester(String(s.currentSemester));
    const bal = semesterSummary(id, s.currentSemester, { charges, adjustments, payments }).balance;
    setAmount(String(Math.max(bal, 0)));
    setPayerName(s.guardian || s.name);
    setPayerPhone(s.guardianPhone || s.phone || "");
    setReference("");
    setStep("pay");
  };

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  const [touched, setTouched] = useState<{ amount?: boolean; reference?: boolean; payer?: boolean }>({});
  const paidAtISO = new Date().toISOString();

  const offlineErrors = useMemo(
    () => validatePaymentFields(
      { amount: Number(amount), method, reference, paidAt: paidAtISO },
      payments,
    ),
    [amount, method, reference, payments, paidAtISO],
  );

  const submitPayment = () => {
    if (!student) return;
    setTouched({ amount: true, reference: true, payer: true });
    if (!payerName.trim()) return toast.error("Payer name is required");
    const amt = Number(amount);
    // For online, we auto-generate a reference; for offline the user provides one.
    const ref = mode === "online"
      ? nextReceiptNo(paidAtISO, payments, receiptFormat)
      : reference.trim();
    if (mode === "offline" && (offlineErrors.amount || offlineErrors.reference)) {
      return toast.error(offlineErrors.amount ?? offlineErrors.reference ?? "Fix the highlighted fields");
    }
    const res = addPayment({
      studentId: student.id,
      semester: Number(semester),
      amount: amt,
      method,
      reference: ref || undefined,
      note: `${mode === "online" ? "Online" : "Offline"} (${method.toUpperCase()}) by ${payerName}${payerPhone ? ` · ${payerPhone}` : ""}${note ? ` — ${note}` : ""}`,
      paidAt: paidAtISO,
    });
    if (!res.ok) return toast.error(res.error);
    setReceipt({
      ref: res.reference,
      amount: amt, method,
      studentName: student.name, semester: Number(semester),
      paidAt: paidAtISO,
    });
    setStep("done");
  };

  const reset = () => {
    setStep("choose"); setStudentId(null); setQ("");
    setAmount(""); setNote(""); setReference(""); setReceipt(null);
  };
  // Live PDF preview URL for the "done" step.
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  useEffect(() => {
    if (step !== "done" || !receipt || !student) {
      setPreviewUrl((u) => { if (u) URL.revokeObjectURL(u); return null; });
      return;
    }
    const program = programs.find((p) => p.id === student.programId);
    const doc = generateReceiptPdf({
      college: paymentInfo,
      payment: { amount: receipt.amount, method: receipt.method, reference: receipt.ref, paidAt: receipt.paidAt },
      student: { name: student.name, admissionNo: student.admissionNo, rollNo: student.rolls[receipt.semester] },
      program: program ? { name: program.name, code: program.code } : undefined,
      semester: receipt.semester,
    });
    const url = doc.output("bloburl").toString();
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [step, receipt, student, programs, paymentInfo]);

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Fee collection</p>
            <h1 className="font-display text-2xl font-semibold text-foreground">
              {paymentInfo.collegeName} — Make Payment
            </h1>
          </div>
        </div>
        <Badge variant="secondary" className="gap-1"><ShieldCheck className="h-3.5 w-3.5" /> Credits to Principal's a/c</Badge>
      </header>

      {step === "choose" && (
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">How would you like to pay?</CardTitle>
            <p className="text-xs text-muted-foreground">
              Choose the payment channel — you can pay online via UPI, card or netbanking, or record an offline payment (cash, cheque or DD) at the office counter.
            </p>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <ModeCard
              icon={<Globe className="h-6 w-6" />}
              title="Pay Online"
              desc="UPI / QR, debit or credit card, or netbanking / NEFT — direct to the Principal's account."
              onClick={() => { setMode("online"); setStep("lookup"); }}
            />
            <ModeCard
              icon={<Banknote className="h-6 w-6" />}
              title="Pay Offline"
              desc="Cash, cheque or demand draft received at the office. Reference / receipt no. is mandatory."
              onClick={() => { setMode("offline"); setStep("lookup"); }}
            />
          </CardContent>
        </Card>
      )}

      {step === "lookup" && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-display text-lg">Find student record</CardTitle>
                <p className="text-xs text-muted-foreground">
                  {mode === "online" ? "Online payment" : "Offline payment"} — search by admission no., roll no. or name.
                </p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setStep("choose")}>
                <ArrowLeft className="mr-1 h-4 w-4" /> Change mode
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                autoFocus
                placeholder="e.g. ADM-2024-011 or Aarav Sharma"
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            {matches.length > 0 && (
              <div className="divide-y divide-border rounded-md border border-border">
                {matches.map((s) => {
                  const p = programs.find((x) => x.id === s.programId);
                  return (
                    <button
                      key={s.id}
                      onClick={() => pickStudent(s.id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-accent/40"
                    >
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.admissionNo} · {p?.name} · Sem {s.currentSemester}
                        </p>
                      </div>
                      <Button size="sm" variant="outline">Continue</Button>
                    </button>
                  );
                })}
              </div>
            )}
            {q && matches.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No student found. Please check the admission / roll number, or contact the office.
              </p>
            )}
          </CardContent>
        </Card>
      )}

      {step === "pay" && student && sum && (
        <div className="grid gap-6 lg:grid-cols-5">
          <Card className="lg:col-span-3">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-display text-lg">
                    {mode === "online" ? "Online payment" : "Offline payment"}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">
                    {student.name} · {student.admissionNo} · {program?.name}
                  </p>
                </div>
                <Badge variant="outline" className="gap-1">
                  {mode === "online" ? <Globe className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                  {mode === "online" ? "Online" : "Offline"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Semester</Label>
                  <Select
                    value={semester}
                    onValueChange={(v) => {
                      setSemester(v);
                      const s = semesterSummary(student.id, Number(v), { charges, adjustments, payments });
                      setAmount(String(Math.max(s.balance, 0)));
                    }}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Array.from({ length: student.currentSemester }, (_, i) => i + 1).map((n) => (
                        <SelectItem key={n} value={String(n)}>Semester {n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Amount to pay (INR)</Label>
                  <Input
                    type="number" min={1} value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
                    aria-invalid={mode === "offline" && !!(touched.amount && offlineErrors.amount)}
                  />
                  {mode === "offline" && touched.amount && offlineErrors.amount && (
                    <p className="mt-1 text-xs text-destructive">{offlineErrors.amount}</p>
                  )}
                </div>
              </div>

              <div className="rounded-md border border-border bg-muted/40 p-3 text-xs">
                <Row k="Net payable" v={inr(sum.netPayable)} />
                <Row k="Already paid" v={inr(sum.totalPaid)} tone="success" />
                <Row k="Outstanding" v={inr(Math.max(sum.balance, 0))} tone={sum.balance > 0 ? "danger" : "success"} bold />
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <Label>Payer name</Label>
                  <Input
                    value={payerName}
                    onChange={(e) => setPayerName(e.target.value)}
                    onBlur={() => setTouched((t) => ({ ...t, payer: true }))}
                    aria-invalid={!!(touched.payer && !payerName.trim())}
                  />
                  {touched.payer && !payerName.trim() && (
                    <p className="mt-1 text-xs text-destructive">Payer name is required</p>
                  )}
                </div>
                <div>
                  <Label>Payer mobile</Label>
                  <Input value={payerPhone} onChange={(e) => setPayerPhone(e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label>Note (optional)</Label>
                  <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any message for the office" />
                </div>
              </div>


              {mode === "online" ? (
                <div>
                  <Label>Choose an online method</Label>
                  <Tabs value={onlineMethod} onValueChange={(v) => setOnlineMethod(v as typeof onlineMethod)} className="mt-2">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="upi"><Smartphone className="mr-1 h-4 w-4" /> UPI / QR</TabsTrigger>
                      <TabsTrigger value="card"><CreditCard className="mr-1 h-4 w-4" /> Card</TabsTrigger>
                      <TabsTrigger value="bank"><Landmark className="mr-1 h-4 w-4" /> Netbanking / NEFT</TabsTrigger>
                    </TabsList>
                    <TabsContent value="upi" className="pt-3">
                      <p className="text-sm text-muted-foreground">
                        Pay via any UPI app (GPay, PhonePe, Paytm, BHIM) to the college UPI ID below.
                      </p>
                    </TabsContent>
                    <TabsContent value="card" className="pt-3">
                      <p className="text-sm text-muted-foreground">
                        Debit / Credit card payments are processed securely to the principal's account.
                      </p>
                    </TabsContent>
                    <TabsContent value="bank" className="pt-3">
                      <p className="text-sm text-muted-foreground">
                        Transfer through IMPS / NEFT / RTGS using the bank details shown on the right.
                      </p>
                    </TabsContent>
                  </Tabs>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <Label>Offline method</Label>
                    <Select value={offlineMethod} onValueChange={(v) => setOfflineMethod(v as typeof offlineMethod)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="cheque">Cheque / DD</SelectItem>
                        <SelectItem value="bank">Bank deposit slip</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>
                      Reference / receipt no.
                      {offlineMethod !== "cash" && <span className="ml-1 text-destructive">*</span>}
                    </Label>
                    <Input
                      value={reference}
                      onChange={(e) => setReference(e.target.value)}
                      onBlur={() => setTouched((t) => ({ ...t, reference: true }))}
                      placeholder={offlineMethod === "cheque" ? "Cheque / DD number" : offlineMethod === "bank" ? "Deposit slip / txn ID / UTR" : "Optional receipt no. (auto if blank)"}
                      aria-invalid={!!(touched.reference && offlineErrors.reference)}
                    />
                    {touched.reference && offlineErrors.reference ? (
                      <p className="mt-1 text-xs text-destructive">{offlineErrors.reference}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-muted-foreground">
                        {referenceHint(method)} Duplicate references on the same date are blocked.
                      </p>
                    )}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button variant="ghost" onClick={() => { setStep("lookup"); setStudentId(null); }}>
                  ← Change student
                </Button>
                <Button onClick={submitPayment} size="lg">
                  {mode === "online" ? "Pay" : "Record"} {amount ? inr(Number(amount)) : ""}
                </Button>
              </div>

              <p className="text-[11px] text-muted-foreground">
                {mode === "online"
                  ? "Demo portal · this records the transaction against the student's ledger. In production this button launches the selected payment gateway."
                  : "Records an offline payment received at the office against the student's ledger."}
              </p>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2 h-fit">
            <CardHeader>
              <CardTitle className="font-display text-lg">Beneficiary details</CardTitle>
              <p className="text-xs text-muted-foreground">
                Payments credit directly to the Principal's college account.
              </p>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <BankField label="Account name" value={paymentInfo.accountName} onCopy={copy} />
              <BankField label="Account number" value={paymentInfo.accountNumber} onCopy={copy} mono />
              <BankField label="IFSC" value={paymentInfo.ifsc} onCopy={copy} mono />
              <BankField label="Bank" value={paymentInfo.bankName} onCopy={copy} />
              <BankField label="Branch" value={paymentInfo.branch} onCopy={copy} />
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                <p className="text-[11px] uppercase tracking-widest text-primary">UPI</p>
                <div className="mt-1 flex items-center justify-between gap-2">
                  <span className="font-mono text-sm">{paymentInfo.upiId}</span>
                  <Button size="sm" variant="outline" onClick={() => copy(paymentInfo.upiId, "UPI ID")}>
                    <Copy className="mr-1 h-3.5 w-3.5" /> Copy
                  </Button>
                </div>
              </div>
              <p className="pt-2 text-[11px] text-muted-foreground">
                Support: {paymentInfo.supportEmail} · {paymentInfo.supportPhone}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {step === "done" && receipt && (
        <Card>
          <CardContent className="space-y-4 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <div>
              <h2 className="font-display text-2xl font-semibold">Payment recorded</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                A receipt has been generated for your records.
              </p>
            </div>
            <div className="mx-auto max-w-md rounded-md border border-border bg-muted/40 p-4 text-left text-sm">
              <Row k="Student" v={receipt.studentName} />
              <Row k="Semester" v={`Sem ${receipt.semester}`} />
              <Row k="Amount" v={inr(receipt.amount)} bold />
              <Row k="Method" v={receipt.method.toUpperCase()} />
              <Row k="Reference" v={receipt.ref} mono />
              <Row k="Date" v={new Date(receipt.paidAt).toLocaleString()} />
            </div>

            {previewUrl && (
              <div className="mx-auto max-w-2xl overflow-hidden rounded-md border border-border bg-background">
                <div className="border-b border-border bg-muted/40 px-3 py-1.5 text-left text-[11px] uppercase tracking-widest text-muted-foreground">
                  Receipt preview
                </div>
                <iframe title="Receipt preview" src={previewUrl} className="h-[520px] w-full" />
              </div>
            )}

            <div className="flex flex-wrap justify-center gap-2">
              <Button
                onClick={() => {
                  if (!student) return;
                  const program = programs.find((p) => p.id === student.programId);
                  downloadReceiptPdf({
                    college: paymentInfo,
                    payment: {
                      amount: receipt.amount,
                      method: receipt.method,
                      reference: receipt.ref,
                      paidAt: receipt.paidAt,
                    },
                    student: {
                      name: student.name,
                      admissionNo: student.admissionNo,
                      rollNo: student.rolls[receipt.semester],
                    },
                    program: program ? { name: program.name, code: program.code } : undefined,
                    semester: receipt.semester,
                  });
                }}
              >
                <Download className="mr-1 h-4 w-4" /> Download PDF receipt
              </Button>
              <Button variant="outline" onClick={() => window.print()}>Print</Button>
              <Button variant="ghost" onClick={reset}>Make another payment</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ModeCard({
  icon, title, desc, onClick,
}: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group flex flex-col items-start gap-3 rounded-lg border border-border bg-card p-5 text-left transition-colors hover:border-primary hover:bg-accent/30"
    >
      <div className="flex h-11 w-11 items-center justify-center rounded-md bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground">
        {icon}
      </div>
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
      </div>
    </button>
  );
}

function Row({
  k, v, tone, bold, mono,
}: { k: string; v: string; tone?: "success" | "danger"; bold?: boolean; mono?: boolean }) {
  const cls =
    (tone === "success" ? "text-success " : tone === "danger" ? "text-destructive " : "text-foreground ") +
    (bold ? "font-semibold " : "") + (mono ? "font-mono text-xs " : "");
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-muted-foreground">{k}</span>
      <span className={cls}>{v}</span>
    </div>
  );
}

function BankField({
  label, value, onCopy, mono,
}: { label: string; value: string; onCopy: (t: string, l: string) => void; mono?: boolean }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <div className="mt-0.5 flex items-center justify-between gap-2">
        <span className={mono ? "font-mono text-sm" : "text-sm"}>{value}</span>
        <Button size="icon" variant="ghost" onClick={() => onCopy(value, label)} className="h-7 w-7">
          <Copy className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

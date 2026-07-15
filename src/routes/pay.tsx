import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import {
  Building2, Copy, ShieldCheck, Search, CreditCard, Landmark,
  Smartphone, CheckCircle2, Download, Globe, Banknote, ArrowLeft,
  Loader2, Printer
} from "lucide-react";
import { QRCodeCanvas } from "qrcode.react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import {
  useStore, semesterSummary, inr, nextReceiptNo, formatYear,
  validatePaymentFields, referenceHint, type PaymentMethod,
} from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { downloadReceiptPdf, generateReceiptPdf, printReceiptPdf } from "@/lib/receipt";

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
      { title: "Make Payment — Imperial College Hisar" },
      { name: "description", content: "Collect or make college fee payments online (UPI, card, netbanking) or offline (cash, cheque, DD)." },
    ],
  }),
  component: PayPage,
});

type Mode = "online" | "offline";
type Step = "choose" | "lookup" | "pay" | "done";

const METHOD_LABEL: Record<PaymentMethod, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Debit / Credit card",
  bank: "Bank transfer / NEFT",
  cheque: "Cheque / DD",
};

function PayPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const { data: userRole } = useQuery({
    queryKey: ['userRole', user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from('user_roles').select('*').eq('id', user.id).single();
      return data;
    },
    enabled: !!user,
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('programs').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*');
      if (error) throw error;
      return data;
    }
  });

  const [q, setQ] = useState("");
  const [studentId, setStudentId] = useState<string | null>(null);

  // We fetch ledger data ONLY for the selected student to keep it fast, except for payments 
  // where we fetch all to calculate the next receipt number globally.
  const { data: charges = [] } = useQuery({
    queryKey: ['fee_charges', studentId],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_charges').select('*').eq('student_id', studentId);
      if (error) throw error;
      return data.map((d: any) => ({
        id: d.id, studentId: d.student_id, semester: d.semester,
        head: d.head, label: d.label, amount: d.amount, createdAt: d.created_at
      }));
    },
    enabled: !!studentId,
  });
  
  const { data: adjustments = [] } = useQuery({
    queryKey: ['fee_adjustments', studentId],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_adjustments').select('*').eq('student_id', studentId);
      if (error) throw error;
      return data.map((d: any) => ({
        id: d.id, studentId: d.student_id, semester: d.semester,
        type: d.type, label: d.label, amount: d.amount, createdAt: d.created_at
      }));
    },
    enabled: !!studentId,
  });
  
  const { data: payments = [] } = useQuery({
    queryKey: ['fee_payments'], 
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_payments').select('*');
      if (error) throw error;
      return data.map((d: any) => ({
        id: d.id, studentId: d.student_id, semester: d.semester,
        amount: d.amount, method: d.method, reference: d.reference,
        note: d.note, paidAt: d.paid_at, voided: d.voided,
        voidedAt: d.voided_at, voidReason: d.void_reason
      }));
    }
  });

  const paymentInfo = useStore((s) => s.paymentInfo);
  const receiptFormat = useStore((s) => s.receiptFormat);

  const [mode, setMode] = useState<Mode>("online");
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

  const student = useMemo(() => students.find((s: any) => s.id === studentId) ?? null, [students, studentId]);
  const program = student ? programs.find((p: any) => p.id === student.program_id) : null;

  const matches = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return [];
    return students
      .filter((s: any) =>
        (s.admission_no || "").toLowerCase().includes(t) ||
        (s.name || "").toLowerCase().includes(t) ||
        Object.values(s.rolls || {}).some((r: any) => String(r).toLowerCase().includes(t)),
      )
      .slice(0, 6);
  }, [q, students]);

  const sum = useMemo(() => {
    if (!student) return null;
    return semesterSummary(student.id, Number(semester), { charges, adjustments, payments });
  }, [student, semester, charges, adjustments, payments]);

  const pickStudent = (id: string) => {
    const s = students.find((x: any) => x.id === id);
    if (!s) return;
    setStudentId(id);
    setSemester(String(s.current_semester));
    const bal = semesterSummary(id, s.current_semester, { charges, adjustments, payments }).balance;
    setAmount(String(Math.max(bal, 0)));
    setPayerName(s.guardian || s.name);
    setPayerPhone(s.guardian_phone || s.phone || "");
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

  const savePaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('fee_payments').insert([{
        student_id: data.studentId,
        semester: data.semester,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        note: data.note,
        paid_at: data.paidAt,
      }]);
      if (error) throw error;
      
      if (userRole && student) {
        await supabase.from('audit_logs').insert([{
          actor_user_id: userRole.id,
          actor_name: userRole.name,
          actor_code: userRole.user_code,
          actor_role: userRole.role,
          event: 'payment.collected',
          summary: `Collected ₹${data.amount} via ${data.method.toUpperCase()} for ${student.name} (${formatYear(data.semester)})`,
          student_id: data.studentId,
        }]);
      }
    },
    onSuccess: (data, variables) => {
      toast.success("Payment successful!");
      queryClient.invalidateQueries({ queryKey: ['fee_payments'] });
      setReceipt({
        ref: variables.reference,
        amount: variables.amount, method: variables.method,
        studentName: student.name, semester: variables.semester,
        paidAt: variables.paidAt,
      });
      setStep("done");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const submitPayment = () => {
    if (!student) return;
    setTouched({ amount: true, reference: true, payer: true });
    if (!payerName.trim()) return toast.error("Payer name is required");
    const amt = Number(amount);
    
    const txnRef = reference.trim();
    if (mode === "offline" && (offlineErrors.amount || (method !== "cash" && !txnRef))) {
      return toast.error(offlineErrors.amount ?? "Fix the highlighted fields");
    }
    
    const receiptNum = nextReceiptNo(paidAtISO, payments, receiptFormat);
    const txnNotes = [];
    if (mode === "online") txnNotes.push("Online");
    else txnNotes.push("Offline");
    txnNotes.push(`(${method.toUpperCase()}) by ${payerName}`);
    if (payerPhone) txnNotes.push(`· ${payerPhone}`);
    if (txnRef) txnNotes.push(`Txn Ref: ${txnRef}`);
    if (note) txnNotes.push(`— ${note}`);
    
    savePaymentMutation.mutate({
      studentId: student.id,
      semester: Number(semester),
      amount: amt,
      method,
      reference: receiptNum,
      note: txnNotes.join(" "),
      paidAt: paidAtISO,
    });
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
    const program = programs.find((p: any) => p.id === student.program_id);
    const doc = generateReceiptPdf({
      college: paymentInfo,
      payment: { amount: receipt.amount, method: receipt.method, reference: receipt.ref, paidAt: receipt.paidAt },
      student: { name: student.name, admissionNo: student.admission_no, rollNo: (student.rolls && student.rolls[receipt.semester]) || "" },
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
            {loadingStudents ? (
               <div className="py-4 text-center text-sm text-muted-foreground">Loading...</div>
            ) : matches.length > 0 && (
              <div className="divide-y divide-border rounded-md border border-border">
                {matches.map((s: any) => {
                  const p = programs.find((x: any) => x.id === s.program_id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => pickStudent(s.id)}
                      className="flex w-full items-center justify-between px-4 py-3 text-left text-sm hover:bg-accent/40"
                    >
                      <div>
                        <p className="font-medium">{s.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {s.admission_no} · {p?.name} · {formatYear(s.current_semester)}
                        </p>
                      </div>
                      <span className="text-xs text-primary font-medium">Select &rarr;</span>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {step === "pay" && student && sum && (
        <div className="grid gap-6 md:grid-cols-5">
          <div className="space-y-6 md:col-span-3">
            <Card>
              <CardHeader className="pb-3 border-b">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-display text-lg">Payment details</CardTitle>
                  <Button variant="ghost" size="sm" onClick={reset}>
                    <ArrowLeft className="mr-1 h-4 w-4" /> Switch student
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="grid gap-6 p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Student</Label>
                    <p className="mt-1 font-medium">{student.name}</p>
                    <p className="text-sm text-muted-foreground">{student.admission_no}</p>
                  </div>
                  <div>
                    <Label className="text-xs uppercase tracking-widest text-muted-foreground">Year</Label>
                    <Select value={semester} onValueChange={(v) => { setSemester(v); }}>
                      <SelectTrigger className="w-28 font-medium"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {Array.from({ length: student.current_semester }, (_, i) => i + 1).map(n => (
                          <SelectItem key={n} value={String(n)}>{formatYear(n)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className={touched.amount && (!amount || Number(amount) <= 0) ? "text-destructive" : ""}>Paying Amount (₹)</Label>
                    <Input
                      className={`mt-1 font-mono text-lg ${touched.amount && (!amount || Number(amount) <= 0) ? "border-destructive focus-visible:ring-destructive" : ""}`}
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => { setAmount(e.target.value); setTouched({ ...touched, amount: true }); }}
                    />
                    <p className="mt-1 text-xs text-muted-foreground">
                      Current outstanding: <strong>{inr(sum.balance)}</strong>
                    </p>
                  </div>
                  {mode === "offline" && (
                    <div>
                      <Label className={touched.reference && offlineErrors.reference ? "text-destructive" : ""}>Reference / Cheque No.</Label>
                      <Input
                        className={`mt-1 ${touched.reference && offlineErrors.reference ? "border-destructive focus-visible:ring-destructive" : ""}`}
                        placeholder={referenceHint(method)}
                        value={reference}
                        onChange={(e) => { setReference(e.target.value); setTouched({ ...touched, reference: true }); }}
                      />
                      {touched.reference && offlineErrors.reference ? (
                        <p className="mt-1 text-xs text-destructive">{offlineErrors.reference}</p>
                      ) : (
                        <p className="mt-1 text-xs text-muted-foreground">Mandatory for cash, cheque or DD.</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label className={touched.payer && !payerName.trim() ? "text-destructive" : ""}>Payer Name</Label>
                    <Input
                      className={`mt-1 ${touched.payer && !payerName.trim() ? "border-destructive" : ""}`}
                      placeholder="e.g. Ramesh Kumar"
                      value={payerName}
                      onChange={(e) => { setPayerName(e.target.value); setTouched({ ...touched, payer: true }); }}
                    />
                  </div>
                  <div>
                    <Label>Payer Phone (Optional)</Label>
                    <Input
                      className="mt-1"
                      placeholder="e.g. 9876543210"
                      value={payerPhone}
                      onChange={(e) => setPayerPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div>
                  <Label>Additional Note (Optional)</Label>
                  <Textarea
                    className="mt-1 h-16 resize-none"
                    placeholder="E.g. Paid in cash at counter 2..."
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-2">
            <Card className="sticky top-6">
              <CardHeader className="bg-muted/50 pb-4">
                <CardTitle className="font-display text-lg">Checkout</CardTitle>
                <p className="text-xs text-muted-foreground">Amount: <strong className="text-foreground">{inr(Number(amount) || 0)}</strong></p>
              </CardHeader>
              <CardContent className="p-0">
                {mode === "online" ? (
                  <Tabs value={onlineMethod} onValueChange={(v) => setOnlineMethod(v as any)} className="w-full">
                    <TabsList className="w-full rounded-none border-b border-border bg-transparent p-0">
                      <TabsTrigger value="upi" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">UPI</TabsTrigger>
                      <TabsTrigger value="card" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Card</TabsTrigger>
                      <TabsTrigger value="bank" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Netbanking</TabsTrigger>
                    </TabsList>
                    <div className="p-5 text-center">
                      {onlineMethod === "upi" && (
                        <div className="space-y-4">
                          <div className="mx-auto flex w-fit items-center justify-center rounded-lg border-2 border-dashed border-border bg-white p-2">
                            <QRCodeCanvas 
                              value={`upi://pay?pa=${paymentInfo.upiId}&pn=${encodeURIComponent(paymentInfo.accountName)}&am=${amount || 0}&cu=INR`}
                              size={150}
                              level="H"
                            />
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <span className="font-mono text-sm">{paymentInfo.upiId}</span>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => copy(paymentInfo.upiId, "UPI ID")}>
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                      {onlineMethod === "card" && (
                        <div className="space-y-4">
                          <CreditCard className="mx-auto h-12 w-12 text-muted-foreground/50" />
                          <p className="text-sm text-muted-foreground">In a real app, a secure card input or payment gateway iframe (like Razorpay or Stripe) would appear here.</p>
                        </div>
                      )}
                      {onlineMethod === "bank" && (
                        <div className="space-y-4 text-left">
                          <Landmark className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between border-b border-border pb-1">
                              <span className="text-muted-foreground">Account</span>
                              <span className="font-medium">{paymentInfo.accountNumber}</span>
                            </div>
                            <div className="flex justify-between border-b border-border pb-1">
                              <span className="text-muted-foreground">IFSC</span>
                              <span className="font-medium">{paymentInfo.ifsc}</span>
                            </div>
                            <div className="flex justify-between pb-1">
                              <span className="text-muted-foreground">Name</span>
                              <span className="font-medium">{paymentInfo.accountName}</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Tabs>
                ) : (
                  <Tabs value={offlineMethod} onValueChange={(v) => setOfflineMethod(v as any)} className="w-full">
                    <TabsList className="w-full rounded-none border-b border-border bg-transparent p-0">
                      <TabsTrigger value="cash" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Cash</TabsTrigger>
                      <TabsTrigger value="cheque" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">Cheque/DD</TabsTrigger>
                      <TabsTrigger value="bank" className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none">NEFT/RTGS</TabsTrigger>
                    </TabsList>
                    <div className="p-5 text-center">
                      <p className="text-sm text-muted-foreground">
                        Ensure you have physically collected the {offlineMethod} and provided a valid reference number before confirming.
                      </p>
                    </div>
                  </Tabs>
                )}
                
                <div className="border-t border-border p-5">
                  <Button className="w-full" size="lg" onClick={submitPayment} disabled={savePaymentMutation.isPending || !amount || Number(amount) <= 0}>
                    {savePaymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Confirm & Generate Receipt
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {step === "done" && receipt && (
        <Card className="mx-auto max-w-xl text-center">
          <CardContent className="flex flex-col items-center py-12">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-success/20 text-success">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h2 className="font-display text-2xl font-semibold">Payment Successful!</h2>
            <p className="mt-2 text-muted-foreground">
              {inr(receipt.amount)} collected via {METHOD_LABEL[receipt.method]}.
            </p>
            
            <div className="mt-8 w-full max-w-sm space-y-3 rounded-md bg-muted/40 p-4 text-left text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Receipt No.</span>
                <span className="font-medium font-mono">{receipt.ref}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Student</span>
                <span className="font-medium">{receipt.studentName}</span>
              </div>
              <div className="flex justify-between pb-1">
                <span className="text-muted-foreground">Year</span>
                <span className="font-medium">{formatYear(receipt.semester)}</span>
              </div>
            </div>

            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button onClick={() => window.open(previewUrl || "", "_blank")} variant="default">
                <Download className="mr-2 h-4 w-4" /> Download PDF Receipt
              </Button>
              <Button 
                variant="outline" 
                onClick={() => {
                  if (!receipt || !student) return;
                  const program = programs.find((p: any) => p.id === student.program_id);
                  printReceiptPdf({
                    college: paymentInfo,
                    payment: { amount: receipt.amount, method: receipt.method, reference: receipt.ref, paidAt: receipt.paidAt },
                    student: { name: student.name, guardian: student.guardian, admissionNo: student.admission_no, rollNo: (student.rolls && student.rolls[receipt.semester]) || "" },
                    program: program ? { name: program.name, code: program.code } : undefined,
                    semester: receipt.semester,
                  });
                }}
              >
                <Printer className="mr-2 h-4 w-4" /> Print Receipt
              </Button>
              <Button variant="outline" onClick={reset}>
                Record another payment
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ModeCard({ icon, title, desc, onClick }: { icon: React.ReactNode; title: string; desc: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-start rounded-xl border border-border bg-card p-6 text-left shadow-sm transition-all hover:border-primary/50 hover:shadow-md"
    >
      <div className="mb-4 rounded-full bg-primary/10 p-3 text-primary">{icon}</div>
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
    </button>
  );
}

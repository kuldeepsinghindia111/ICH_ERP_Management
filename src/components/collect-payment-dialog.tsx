import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Download, Loader2, Plus, RefreshCcw, Wallet, FileText } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import {
  useStore, semesterSummary, inr, nextReceiptNo,
  validatePaymentFields, referenceHint, formatYear
} from "@/lib/store";
import { generateReceiptPdf, type ReceiptData } from "@/lib/receipt";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";

type Method = "cash" | "upi" | "card" | "bank" | "cheque";
const METHOD_LABEL: Record<Method, string> = {
  cash: "Cash",
  upi: "UPI",
  card: "Debit / Credit card",
  bank: "Bank transfer / NEFT",
  cheque: "Cheque / DD",
};

type PreviewState =
  | { status: "loading"; data: ReceiptData }
  | { status: "ready"; url: string; filename: string; data: ReceiptData }
  | { status: "error"; error: string; data: ReceiptData };
type Preview = PreviewState | null;

export function CollectPaymentDialog({
  studentId,
  semester,
  trigger,
  variant = "primary",
}: {
  studentId: string;
  semester?: number;
  trigger?: React.ReactNode;
  variant?: "primary" | "outline" | "sm";
}) {
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

  const { data: canEditPayments } = useQuery({
    queryKey: ['canEditPayments', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.from('user_roles').select('role, permissions').eq('id', user.id).single();
      if (error || !data) return false;
      if (data.role === 'admin') return true;
      return !!data.permissions?.payments?.edit;
    },
    enabled: !!user,
  });

  const { data: student } = useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*').eq('id', studentId).single();
      if (error) throw error;
      return data;
    },
    enabled: !!studentId,
  });

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('programs').select('*');
      if (error) throw error;
      return data;
    }
  });

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
    queryKey: ['fee_payments'], // Fetch all for nextReceiptNo to work correctly across the system
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

  const { data: feeStructures = [] } = useQuery({
    queryKey: ['fee_structures'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_structures').select('*');
      if (error) throw error;
      return data;
    }
  });

  const paymentInfo = useStore((s) => s.paymentInfo);
  const receiptFormat = useStore((s) => s.receiptFormat);

  const [open, setOpen] = useState(false);
  const [sem, setSem] = useState(String(semester ?? student?.current_semester ?? 1));
  const [method, setMethod] = useState<Method>("cash");
  const [amount, setAmount] = useState("");
  const [concession, setConcession] = useState("");
  const [scholarship, setScholarship] = useState("");
  const [lateFee, setLateFee] = useState("");
  const [fine, setFine] = useState("");
  const [otherCharge, setOtherCharge] = useState("");
  const [reference, setReference] = useState("");
  const [transactionId, setTransactionId] = useState("");
  const [note, setNote] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [touched, setTouched] = useState<{ amount?: boolean; reference?: boolean }>({});
  const [preview, setPreview] = useState<Preview>(null);

  const semList = useMemo(
    () => Array.from({ length: student?.current_semester ?? 1 }, (_, i) => i + 1),
    [student?.current_semester],
  );

  const sum = useMemo(
    () => (student ? semesterSummary(student.id, Number(sem), { charges, adjustments, payments, structures: feeStructures, student }) : null),
    [student, sem, charges, adjustments, payments, feeStructures],
  );

  const regenReceipt = () => setReference(nextReceiptNo(new Date(paidAt).toISOString(), payments, receiptFormat));

  // Prefill on open and when semester/date changes.
  useEffect(() => {
    if (open && sum) {
      setAmount(String(Math.max(sum.balance, 0)));
      setConcession("");
      setScholarship("");
      setLateFee("");
      setFine("");
      setOtherCharge("");
    }
  }, [open, sem]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open && (method === "cash" || !reference)) {
      setReference(nextReceiptNo(new Date(paidAt).toISOString(), payments, receiptFormat));
    }
  }, [open, method, paidAt, payments]); // eslint-disable-line react-hooks/exhaustive-deps

  // Revoke blob url when preview replaced / dialog closed.
  const previewUrl = preview?.status === "ready" ? preview.url : undefined;
  useEffect(() => {
    return () => { if (previewUrl) URL.revokeObjectURL(previewUrl); };
  }, [previewUrl]);

  const genTokenRef = useRef(0);
  const generatePreview = async (data: ReceiptData) => {
    const token = ++genTokenRef.current;
    setPreview({ status: "loading", data });
    try {
      // Yield so React can paint the loading state before jsPDF blocks the thread.
      await new Promise((r) => setTimeout(r, 20));
      const doc = generateReceiptPdf(data);
      const blob: Blob = doc.output("blob");
      if (token !== genTokenRef.current) return;
      const url = URL.createObjectURL(blob);
      const safe = data.student.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
      const filename = `receipt-${safe}-sem${data.semester}-${data.payment.reference}.pdf`;
      setPreview({ status: "ready", url, filename, data });
    } catch (e) {
      if (token !== genTokenRef.current) return;
      const msg = e instanceof Error ? e.message : "Failed to generate receipt PDF";
      setPreview({ status: "error", error: msg, data });
    }
  };

  const errors = useMemo(
    () => validatePaymentFields(
      { amount: Number(amount), method, reference, transactionId, paidAt: new Date(paidAt).toISOString() },
      payments,
    ),
    [amount, method, reference, transactionId, paidAt, payments],
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
      
      const adjustmentsToInsert = [];
      if (data.concession > 0) {
        adjustmentsToInsert.push({
          student_id: data.studentId,
          semester: data.semester,
          type: "concession",
          amount: data.concession,
          label: "Applied during payment",
        });
      }
      if (data.scholarship > 0) {
        adjustmentsToInsert.push({
          student_id: data.studentId,
          semester: data.semester,
          type: "scholarship",
          amount: data.scholarship,
          label: "Applied during payment",
        });
      }
      if (adjustmentsToInsert.length > 0) {
        const { error: adjErr } = await supabase.from('fee_adjustments').insert(adjustmentsToInsert);
        if (adjErr) throw adjErr;
      }

      const chargesToInsert = [];
      if (data.lateFee > 0) {
        chargesToInsert.push({ student_id: data.studentId, semester: data.semester, head: "late", amount: data.lateFee, label: "Added during payment" });
      }
      if (data.fine > 0) {
        chargesToInsert.push({ student_id: data.studentId, semester: data.semester, head: "fine", amount: data.fine, label: "Added during payment" });
      }
      if (data.otherCharge > 0) {
        chargesToInsert.push({ student_id: data.studentId, semester: data.semester, head: "other", amount: data.otherCharge, label: "Added during payment" });
      }
      if (chargesToInsert.length > 0) {
        const { error: chgErr } = await supabase.from('fee_charges').insert(chargesToInsert);
        if (chgErr) throw chgErr;
      }
      
      if (userRole && student) {
        let summaryParts = [`Collected ₹${data.amount} via ${data.method.toUpperCase()} for ${student.name} (Sem ${data.semester})`];
        if (data.concession) summaryParts.push(`+ ₹${data.concession} Concession`);
        if (data.scholarship) summaryParts.push(`+ ₹${data.scholarship} Scholarship`);
        if (data.lateFee) summaryParts.push(`+ ₹${data.lateFee} Late Fee`);
        if (data.fine) summaryParts.push(`+ ₹${data.fine} Fine`);
        if (data.otherCharge) summaryParts.push(`+ ₹${data.otherCharge} Other Charges`);

        await supabase.from('audit_logs').insert([{
          actor_user_id: userRole.id,
          actor_name: userRole.name,
          actor_code: userRole.user_code,
          actor_role: userRole.role,
          event: 'payment.collected',
          summary: summaryParts.join(" "),
          student_id: data.studentId,
        }]);
      }
    },
    onSuccess: () => {
      toast.success("Payment recorded successfully");
      queryClient.invalidateQueries({ queryKey: ['fee_payments'] });
      queryClient.invalidateQueries({ queryKey: ['fee_adjustments'] });
      queryClient.invalidateQueries({ queryKey: ['fee_charges'] });
      // Generate receipt
      const amt = Number(amount);
      const ref = reference.trim() || nextReceiptNo(new Date(paidAt).toISOString(), payments, receiptFormat);
      const finalTx = method !== "cash" && transactionId.trim() ? transactionId.trim() : undefined;
      const program = programs.find((p: any) => p.id === student.program_id);
      generatePreview({
        college: paymentInfo,
        payment: { amount: amt, method, reference: ref, transactionId: finalTx, paidAt: new Date(paidAt).toISOString() } as any,
        student: { name: student.name, admissionNo: student.admission_no, rollNo: student.roll_number || "" },
        program: program ? { name: program.name, code: program.code } : undefined,
        semester: Number(sem),
      });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  if (!student) return null;
  if (!canEditPayments) return null;

  const resetForm = () => {
    setReference(""); setTransactionId(""); setNote(""); setAmount(""); setTouched({});
    setLateFee(""); setFine(""); setOtherCharge("");
  };

  const closeAll = () => {
    setOpen(false);
    setPreview(null);
    resetForm();
  };
  const submit = async () => {
    setTouched({ amount: true, reference: true });
    const amt = Number(amount);
    const conc = Number(concession);
    const schol = Number(scholarship);
    const lf = Number(lateFee);
    const f = Number(fine);
    const oc = Number(otherCharge);
    
    if ((!amt || amt <= 0) && (!conc || conc <= 0) && (!schol || schol <= 0) && (!lf || lf <= 0) && (!f || f <= 0) && (!oc || oc <= 0)) {
      return toast.error("Enter a valid payment, concession, scholarship, or charge amount");
    }
    
    const hasPayment = amt > 0;
    if (hasPayment && Object.keys(errors).length > 0) {
      if (errors.amount || errors.reference) {
        return toast.error(errors.amount ?? errors.reference ?? "Please fix the errors");
      }
    }
    
    const ref = reference.trim() || nextReceiptNo(new Date(paidAt).toISOString(), payments, receiptFormat);
    const iso = new Date(paidAt).toISOString();
    
    let finalNote = note;
    if (method !== "cash" && transactionId.trim()) {
      const prefix = method === "cheque" ? "CHEQUE:" : "UTR:";
      finalNote = `${prefix}${transactionId.trim()}\n${note}`;
    }
    
    savePaymentMutation.mutate({
      studentId: student.id, 
      semester: Number(sem), 
      amount: amt,
      method, 
      reference: ref, 
      note: finalNote || undefined, 
      paidAt: iso,
      concession: conc,
      scholarship: schol,
      lateFee: lf,
      fine: f,
      otherCharge: oc
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
          <Button size={variant === "sm" ? "sm" : "default"} variant={variant === "outline" ? "outline" : "default"} className={variant === "outline" ? "bg-white" : ""}>
            <Wallet className={`${variant === "sm" ? "mr-1 h-3.5 w-3.5" : "mr-2 h-4 w-4"}`} />
            Collect
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-md sm:max-w-lg overflow-y-auto max-h-[90vh]">
        {!preview ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">Collect Payment</DialogTitle>
              <DialogDescription>
                Record a fee payment for <strong>{student.name}</strong>.
              </DialogDescription>
            </DialogHeader>

            {sum && (
              <div className="grid grid-cols-3 gap-2 mt-4">
                <div className="rounded-md bg-muted/60 p-2 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Billed</p>
                  <p className="mt-1 font-semibold text-sm">{inr(sum.netPayable)}</p>
                </div>
                <div className="rounded-md bg-muted/60 p-2 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Paid</p>
                  <p className="mt-1 font-semibold text-sm text-success">{inr(sum.totalPaid)}</p>
                </div>
                <div className="rounded-md bg-muted/60 p-2 text-center">
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Balance</p>
                  <p className={`mt-1 font-semibold text-sm ${sum.balance > 0 ? "text-warning" : "text-foreground"}`}>
                    {inr(sum.balance)}
                  </p>
                </div>
              </div>
            )}
            <div className="grid gap-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Course</Label>
                  <Input value={programs.find((p: any) => p.id === student.program_id)?.name || ""} disabled className="bg-muted text-muted-foreground" />
                </div>
                <div>
                  <Label>Session</Label>
                  <Select defaultValue="2024-2025">
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2023-2024">2023-2024</SelectItem>
                      <SelectItem value="2024-2025">2024-2025</SelectItem>
                      <SelectItem value="2025-2026">2025-2026</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Year</Label>
                  <Select value={sem} onValueChange={setSem}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {semList.map((n) => (
                        <SelectItem key={n} value={String(n)}>{formatYear(n)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Date</Label>
                  <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} max={new Date().toISOString().slice(0, 10)} />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label>Concession (INR)</Label>
                  <Input type="number" min={0} step="0.01" value={concession} onChange={(e) => setConcession(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <Label>Scholarship (INR)</Label>
                  <Input type="number" min={0} step="0.01" value={scholarship} onChange={(e) => setScholarship(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <Label>Late Fee (INR)</Label>
                  <Input type="number" min={0} step="0.01" value={lateFee} onChange={(e) => setLateFee(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <Label>Fine (INR)</Label>
                  <Input type="number" min={0} step="0.01" value={fine} onChange={(e) => setFine(e.target.value)} placeholder="0.00" />
                </div>
                <div>
                  <Label>Other (INR)</Label>
                  <Input type="number" min={0} step="0.01" value={otherCharge} onChange={(e) => setOtherCharge(e.target.value)} placeholder="0.00" />
                </div>
              </div>
              <div>
                <Label>Payment Method</Label>
                <Select value={method} onValueChange={(v) => { setMethod(v as Method); setTouched({ ...touched, reference: false }); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(METHOD_LABEL) as Method[]).map((k) => (
                      <SelectItem key={k} value={k}>{METHOD_LABEL[k]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <Label className={touched.amount && errors.amount ? "text-destructive" : ""}>Amount paid</Label>
                    {sum && sum.balance > 0 && (
                      <span className="text-[10px] uppercase text-muted-foreground">Due: {inr(sum.balance)}</span>
                    )}
                  </div>
                  <Input
                    type="number" min={0} step="0.01"
                    className={touched.amount && errors.amount ? "border-destructive focus-visible:ring-destructive" : ""}
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); setTouched({ ...touched, amount: true }); }}
                    placeholder="0.00"
                  />
                  {touched.amount && errors.amount && (
                    <p className="mt-1 text-[10px] text-destructive">{errors.amount}</p>
                  )}
                </div>

                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <Label className={touched.reference && errors.reference ? "text-destructive" : ""}>Receipt No.</Label>
                    <button type="button" onClick={regenReceipt} className="text-muted-foreground hover:text-primary">
                      <RefreshCcw className="h-3 w-3" />
                    </button>
                  </div>
                  <Input
                    className={touched.reference && errors.reference ? "border-destructive focus-visible:ring-destructive" : ""}
                    value={reference}
                    onChange={(e) => { setReference(e.target.value); setTouched({ ...touched, reference: true }); }}
                    placeholder="Auto-generated if empty"
                  />
                  {touched.reference && errors.reference && (
                    <p className="mt-1 text-[10px] text-destructive">{errors.reference}</p>
                  )}
                </div>
              </div>

              {method !== "cash" && (
                <div>
                  <Label className={touched.transactionId && errors.transactionId ? "text-destructive" : ""}>{method === "cheque" ? "Cheque No." : "Reference / UTR No."}</Label>
                  <Input
                    className={touched.transactionId && errors.transactionId ? "border-destructive focus-visible:ring-destructive" : ""}
                    value={transactionId}
                    onChange={(e) => { setTransactionId(e.target.value); setTouched({ ...touched, transactionId: true }); }}
                    placeholder={method === "cheque" ? "Enter cheque number" : "Enter transaction UTR"}
                  />
                  {touched.transactionId && errors.transactionId && (
                    <p className="mt-1 text-[10px] text-destructive">{errors.transactionId}</p>
                  )}
                </div>
              )}

              <div>
                <Label>Notes (Optional)</Label>
                <Textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Any additional details..." className="h-16 resize-none" />
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={savePaymentMutation.isPending}>
                {savePaymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Confirm Payment
              </Button>
            </DialogFooter>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 py-8">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-success/20 text-success">
              <CheckCircleIcon className="h-6 w-6" />
            </div>
            <DialogTitle className="text-center font-display text-xl">Payment successful!</DialogTitle>
            <p className="text-center text-sm text-muted-foreground">
              A receipt has been generated for {student.name}.
            </p>
            {preview.status === "loading" ? (
              <div className="mt-4 flex items-center text-sm text-muted-foreground">
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating PDF...
              </div>
            ) : preview.status === "error" ? (
              <div className="mt-4 flex items-center rounded-md bg-destructive/10 px-4 py-2 text-sm text-destructive">
                <AlertTriangle className="mr-2 h-4 w-4" /> {preview.error}
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2 sm:flex-row">
                <Button asChild>
                  <a href={preview.url} download={preview.filename}>
                    <Download className="mr-2 h-4 w-4" /> Download PDF
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href={preview.url} target="_blank" rel="noreferrer">
                    <FileText className="mr-2 h-4 w-4" /> View receipt
                  </a>
                </Button>
              </div>
            )}
            <Button variant="ghost" className="mt-2 text-xs" onClick={closeAll}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

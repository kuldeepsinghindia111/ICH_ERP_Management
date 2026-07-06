import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Download, Loader2, Plus, RefreshCcw, Wallet, FileText } from "lucide-react";
import { toast } from "sonner";

import {
  useStore, semesterSummary, inr, nextReceiptNo,
  validatePaymentFields, referenceHint,
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
  const student = useStore((s) => s.students.find((x) => x.id === studentId));
  const programs = useStore((s) => s.programs);
  const charges = useStore((s) => s.charges);
  const adjustments = useStore((s) => s.adjustments);
  const payments = useStore((s) => s.payments);
  const addPayment = useStore((s) => s.addPayment);
  const paymentInfo = useStore((s) => s.paymentInfo);
  const receiptFormat = useStore((s) => s.receiptFormat);
  const can = useStore((s) => s.can);

  const [open, setOpen] = useState(false);
  const [sem, setSem] = useState(String(semester ?? student?.currentSemester ?? 1));
  const [method, setMethod] = useState<Method>("cash");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));
  const [touched, setTouched] = useState<{ amount?: boolean; reference?: boolean }>({});
  const [preview, setPreview] = useState<Preview>(null);

  const semList = useMemo(
    () => Array.from({ length: student?.currentSemester ?? 1 }, (_, i) => i + 1),
    [student?.currentSemester],
  );

  const sum = useMemo(
    () => (student ? semesterSummary(student.id, Number(sem), { charges, adjustments, payments }) : null),
    [student, sem, charges, adjustments, payments],
  );

  const regenReceipt = () => setReference(nextReceiptNo(new Date(paidAt).toISOString(), payments, receiptFormat));

  // Prefill on open and when semester/date changes.
  useEffect(() => {
    if (open && sum) setAmount(String(Math.max(sum.balance, 0)));
  }, [open, sem]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (open && (method === "cash" || !reference)) {
      setReference(nextReceiptNo(new Date(paidAt).toISOString(), payments, receiptFormat));
    }
  }, [open, method, paidAt]); // eslint-disable-line react-hooks/exhaustive-deps

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
      { amount: Number(amount), method, reference, paidAt: new Date(paidAt).toISOString() },
      payments,
    ),
    [amount, method, reference, paidAt, payments],
  );

  if (!student) return null;
  if (!can("payments", "edit")) return null;

  const resetForm = () => {
    setReference(""); setNote(""); setAmount(""); setTouched({});
  };

  const closeAll = () => {
    setOpen(false);
    setPreview(null);
    resetForm();
  };

  const submit = async () => {
    setTouched({ amount: true, reference: true });
    if (errors.amount || errors.reference) {
      return toast.error(errors.amount ?? errors.reference ?? "Please fix the errors");
    }
    const amt = Number(amount);
    const ref = reference.trim() || nextReceiptNo(new Date(paidAt).toISOString(), payments, receiptFormat);
    const iso = new Date(paidAt).toISOString();
    const res = addPayment({
      studentId: student.id, semester: Number(sem), amount: amt,
      method, reference: ref, note: note || undefined, paidAt: iso,
    });
    if (!res.ok) return toast.error(res.error);
    toast.success(`Received ${inr(amt)} for ${student.name}`);

    const program = programs.find((p) => p.id === student.programId);
    const data: ReceiptData = {
      college: paymentInfo,
      payment: { amount: amt, method, reference: res.reference, note: note || undefined, paidAt: iso },
      student: { name: student.name, admissionNo: student.admissionNo, rollNo: student.rolls[Number(sem)] },
      program: program ? { name: program.name, code: program.code } : undefined,
      semester: Number(sem),
    };
    await generatePreview(data);
  };

  const downloadCurrent = () => {
    if (preview?.status !== "ready") return;
    const a = document.createElement("a");
    a.href = preview.url;
    a.download = preview.filename;
    a.click();
  };

  const recordAnother = () => {
    setPreview(null);
    resetForm();
  };

  const defaultTrigger =
    variant === "sm" ? (
      <Button size="sm"><Wallet className="mr-1 h-3.5 w-3.5" /> Collect</Button>
    ) : variant === "outline" ? (
      <Button variant="outline" size="sm"><Plus className="mr-1 h-3.5 w-3.5" /> Record payment</Button>
    ) : (
      <Button><Wallet className="mr-1 h-4 w-4" /> Collect fees</Button>
    );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) closeAll(); else setOpen(true); }}>
      <DialogTrigger asChild>{trigger ?? defaultTrigger}</DialogTrigger>
      <DialogContent className={preview ? "max-w-3xl" : "max-w-lg"}>
        <DialogHeader>
          <DialogTitle className="font-display">
            {preview ? "Payment saved · receipt preview" : "Collect fees"}
          </DialogTitle>
          <DialogDescription>
            {student.name} · {student.admissionNo}
            {preview && <> · Receipt <span className="font-mono">{preview.data.payment.reference}</span></>}
          </DialogDescription>
        </DialogHeader>

        {preview ? (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/40 p-3 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <FileText className="h-4 w-4" />
                Preview of the printable receipt
              </div>
              <div className="text-right">
                <span className="text-muted-foreground">Amount </span>
                <span className="font-semibold text-success">{inr(preview.data.payment.amount)}</span>
              </div>
            </div>
            {preview.status === "ready" ? (
              <iframe
                title="Receipt preview"
                src={preview.url}
                className="h-[520px] w-full rounded-md border border-border bg-white"
              />
            ) : preview.status === "loading" ? (
              <div className="flex h-[520px] w-full flex-col items-center justify-center gap-3 rounded-md border border-border bg-muted/30 text-sm text-muted-foreground">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
                <p>Generating receipt PDF…</p>
                <p className="text-[11px]">This usually takes a moment.</p>
              </div>
            ) : (
              <div className="flex h-[520px] w-full flex-col items-center justify-center gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-6 text-center text-sm">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <p className="font-medium text-foreground">Receipt preview failed to generate</p>
                <p className="text-xs text-muted-foreground">{preview.error}</p>
                <Button size="sm" variant="outline" onClick={() => generatePreview(preview.data)}>
                  <RefreshCcw className="mr-1 h-3.5 w-3.5" /> Retry
                </Button>
                <p className="text-[11px] text-muted-foreground">The payment has already been saved.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid gap-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Semester</Label>
                <Select value={sem} onValueChange={setSem}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {semList.map((n) => (
                      <SelectItem key={n} value={String(n)}>Semester {n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Payment date</Label>
                <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} />
              </div>
            </div>

            {sum && (
              <div className="rounded-md border border-border bg-muted/50 p-3 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Net payable</span>
                  <span className="font-medium">{inr(sum.netPayable)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Already paid</span>
                  <span className="text-success">{inr(sum.totalPaid)}</span>
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-border pt-1">
                  <span className="text-muted-foreground">Outstanding</span>
                  <span className={sum.balance > 0 ? "font-semibold text-destructive" : "text-success"}>
                    {inr(Math.max(sum.balance, 0))}
                  </span>
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label>Amount received (INR)</Label>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  onBlur={() => setTouched((t) => ({ ...t, amount: true }))}
                  aria-invalid={!!(touched.amount && errors.amount)}
                />
                {touched.amount && errors.amount && (
                  <p className="mt-1 text-xs text-destructive">{errors.amount}</p>
                )}
              </div>
              <div>
                <Label>Method</Label>
                <Select value={method} onValueChange={(v) => { setMethod(v as Method); setTouched((t) => ({ ...t, reference: false })); }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(METHOD_LABEL) as Method[]).map((m) => (
                      <SelectItem key={m} value={m}>{METHOD_LABEL[m]}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label>Reference / receipt no.</Label>
                <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={regenReceipt}>
                  <RefreshCcw className="mr-1 h-3 w-3" /> Auto receipt no.
                </Button>
              </div>
              <Input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                onBlur={() => setTouched((t) => ({ ...t, reference: true }))}
                placeholder="Txn ID, cheque no., receipt no."
                aria-invalid={!!(touched.reference && errors.reference)}
              />
              {touched.reference && errors.reference ? (
                <p className="mt-1 text-xs text-destructive">{errors.reference}</p>
              ) : (
                <p className="mt-1 text-[11px] text-muted-foreground">{referenceHint(method)}</p>
              )}
            </div>
            <div>
              <Label>Note (optional)</Label>
              <Textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:justify-between">
          {preview ? (
            <>
              <Button variant="ghost" onClick={recordAnother}>Record another</Button>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  onClick={downloadCurrent}
                  disabled={preview.status !== "ready"}
                >
                  {preview.status === "loading" ? (
                    <><Loader2 className="mr-1 h-4 w-4 animate-spin" /> Preparing…</>
                  ) : (
                    <><Download className="mr-1 h-4 w-4" /> Download PDF</>
                  )}
                </Button>
                <Button onClick={closeAll}>Done</Button>
              </div>
            </>
          ) : (
            <>
              <Button variant="ghost" onClick={closeAll}>Cancel</Button>
              <Button onClick={submit}>Save & preview receipt</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

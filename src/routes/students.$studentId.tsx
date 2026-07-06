import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, FileSpreadsheet, Lock, Plus, Printer, RotateCcw, Trash2, Undo2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useStore, semesterSummary, studentTotals, inr, FEE_HEADS, type FeeHead, type FeePayment } from "@/lib/store";
import { downloadReceiptPdf } from "@/lib/receipt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";


export const Route = createFileRoute("/students/$studentId")({
  head: () => ({
    meta: [{ title: "Student profile — Imperial CMS" }],
  }),
  component: StudentDetail,
  notFoundComponent: () => (
    <div className="p-8 text-sm text-muted-foreground">Student not found.</div>
  ),
});

function StudentDetail() {
  const { studentId } = Route.useParams();
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

  const { data: canEditStudents } = useQuery({
    queryKey: ['canEditStudents', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.from('user_roles').select('role, permissions').eq('id', user.id).single();
      if (error || !data) return false;
      if (data.role === 'admin') return true;
      return !!data.permissions?.students?.edit;
    },
    enabled: !!user,
  });

  const { data: student, isLoading: loadingStudent } = useQuery({
    queryKey: ['student', studentId],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*').eq('id', studentId).single();
      if (error) throw error;
      return data;
    },
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
    queryKey: ['fee_payments', studentId], // Only this student's payments
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_payments').select('*').eq('student_id', studentId);
      if (error) throw error;
      return data.map((d: any) => ({
        id: d.id, studentId: d.student_id, semester: d.semester,
        amount: d.amount, method: d.method, reference: d.reference,
        note: d.note, paidAt: d.paid_at, voided: d.voided,
        voidedAt: d.voided_at, voidReason: d.void_reason
      }));
    },
    enabled: !!studentId,
  });

  const updateStudentMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase.from('students').update(updates).eq('id', studentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      toast.success("Student updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const [activeSem, setActiveSem] = useState<string | null>(null);

  if (loadingStudent) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }
  
  if (!student) throw notFound();

  const program = programs.find((p: any) => p.id === student.program_id);
  const currentSemester = student.current_semester;
  const totals = studentTotals(student.id, currentSemester, { charges, adjustments, payments });
  const activeSemValue = activeSem ?? String(currentSemester);

  const semesters = Array.from({ length: program?.total_semesters ?? 6 }, (_, i) => i + 1);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/students"><ArrowLeft className="mr-1 h-4 w-4" /> Back to students</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardContent className="flex flex-wrap items-start justify-between gap-6 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-display text-xl font-semibold text-primary">
                {student.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("")}
              </div>
              <div>
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  {program?.name} · Joined {student.joined_year}
                </p>
                <h1 className="font-display text-2xl font-semibold text-foreground">{student.name}</h1>
                <p className="mt-1 font-mono text-xs text-muted-foreground">{student.admission_no}</p>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {student.gender && <span className="capitalize">{student.gender}</span>}
                  {student.dob && <span>· DOB {new Date(student.dob).toLocaleDateString()}</span>}
                  {student.category && <span>· {student.category}</span>}
                  {student.blood_group && <span>· Blood {student.blood_group}</span>}
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {student.phone && <span>📱 {student.phone}</span>}
                  {student.email && <span>· ✉ {student.email}</span>}
                  {student.guardian && <span>· Guardian: {student.guardian}{student.guardian_phone ? ` (${student.guardian_phone})` : ""}</span>}
                </div>
                {(student.address || student.city || student.state || student.pincode) && (
                  <p className="mt-1 text-xs text-muted-foreground">
                    🏠 {[student.address, student.city, student.state, student.pincode].filter(Boolean).join(", ")}
                  </p>
                )}
              </div>

            </div>
            <div className="flex flex-col items-end gap-2">
              <Badge variant={student.status === "active" ? "default" : "secondary"}>
                {student.status}
              </Badge>
              {canEditStudents ? (
                <Select
                  value={String(currentSemester)}
                  onValueChange={(v) => {
                    updateStudentMutation.mutate({ current_semester: Number(v) });
                    setActiveSem(v);
                  }}
                >
                  <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {semesters.map((n) => (
                      <SelectItem key={n} value={String(n)}>Current: Sem {n}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="text-sm font-medium">Current: Sem {currentSemester}</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="grid grid-cols-3 gap-2 p-6">
            <TotalPill label="Billed" value={inr(totals.netPayable)} />
            <TotalPill label="Paid" value={inr(totals.totalPaid)} tone="success" />
            <TotalPill label="Balance" value={inr(totals.balance)} tone={totals.balance > 0 ? "warning" : "default"} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Roll Number</CardTitle>
          <p className="text-xs text-muted-foreground">
            Current and past roll numbers.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Current Roll No.</p>
              <div className="mt-2 font-mono text-xl font-medium">{student.roll_number}</div>
            </div>
            
            {student.past_roll_numbers && student.past_roll_numbers.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Past Roll Numbers</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {student.past_roll_numbers.map((r: string, i: number) => (
                    <Badge key={i} variant="secondary" className="font-mono text-xs">{r}</Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Semester fee ledger</CardTitle>
          <p className="text-xs text-muted-foreground">
            Charges, concessions / scholarships and payments per semester.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSemValue} onValueChange={setActiveSem}>
            <TabsList className="flex flex-wrap">
              {semesters.map((n) => (
                <TabsTrigger key={n} value={String(n)}>Sem {n}</TabsTrigger>
              ))}
            </TabsList>
            {semesters.map((n) => (
              <TabsContent key={n} value={String(n)} className="pt-4">
                <SemesterLedger 
                  student={student} 
                  semester={n} 
                  charges={charges} 
                  adjustments={adjustments} 
                  payments={payments}
                  canEditPayments={canEditPayments ?? false} 
                  userRole={userRole}
                />
              </TabsContent>
            ))}
          </Tabs>
        </CardContent>
      </Card>

      <PaymentHistory 
        student={student} 
        program={program}
        payments={payments} 
        canEditPayments={canEditPayments ?? false}
        userRole={userRole}
      />
    </div>

  );
}

function TotalPill({
  label, value, tone = "default",
}: { label: string; value: string; tone?: "default" | "success" | "warning" }) {
  const cls = tone === "success" ? "text-success" : tone === "warning" ? "text-warning" : "text-foreground";
  return (
    <div className="rounded-md bg-muted/60 p-3 text-center">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-lg font-semibold ${cls}`}>{value}</p>
    </div>
  );
}

function SemesterLedger({ 
  student, semester, charges, adjustments, payments, canEditPayments, userRole 
}: { 
  student: any; semester: number; 
  charges: any[]; adjustments: any[]; payments: any[];
  canEditPayments: boolean;
  userRole?: any;
}) {
  const studentId = student.id;
  const queryClient = useQueryClient();

  const removeChargeMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fee_charges').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee_charges', studentId] });
      toast.success("Charge removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removeAdjustmentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fee_adjustments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee_adjustments', studentId] });
      toast.success("Adjustment removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const removePaymentMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fee_payments').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee_payments', studentId] });
      queryClient.invalidateQueries({ queryKey: ['fee_payments'] });
      toast.success("Payment removed");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const sum = useMemo(
    () => semesterSummary(studentId, semester, { charges, adjustments, payments }),
    [studentId, semester, charges, adjustments, payments],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <SummaryPanel sum={sum} />

      <div className="lg:col-span-2 space-y-4">
        <LedgerBlock
          title="Charges"
          addBtn={canEditPayments ? <AddChargeDialog studentId={studentId} semester={semester} /> : <></>}
          rows={sum.charges.map((c) => ({
            id: c.id,
            main: FEE_HEADS.find((h) => h.key === c.head)?.label ?? c.head,
            sub: c.label,
            right: inr(c.amount),
            onDelete: canEditPayments ? () => removeChargeMutation.mutate(c.id) : undefined,
          }))}
          empty="No charges added for this semester yet."
        />
        <LedgerBlock
          title="Concessions & scholarships"
          addBtn={canEditPayments ? <AddAdjustmentDialog studentId={studentId} semester={semester} /> : <></>}
          rows={sum.adjustments.map((a) => ({
            id: a.id,
            main: a.type === "concession" ? "Concession" : "Scholarship",
            sub: a.label,
            right: `− ${inr(a.amount)}`,
            rightClass: "text-warning",
            onDelete: canEditPayments ? () => removeAdjustmentMutation.mutate(a.id) : undefined,
          }))}
          empty="No concessions or scholarships applied."
        />
        <LedgerBlock
          title="Payments"
          addBtn={canEditPayments ? <AddPaymentDialog student={student} semester={semester} defaultAmount={Math.max(sum.balance, 0)} userRole={userRole} /> : <></>}
          rows={sum.payments.map((p) => ({
            id: p.id,
            main: `${p.method.toUpperCase()}${p.voided ? " · VOID" : ""}`,
            sub: `${new Date(p.paidAt).toLocaleDateString()} · ${p.reference ?? "—"}${p.voided && p.voidReason ? ` — ${p.voidReason}` : ""}`,
            right: inr(p.amount),
            rightClass: p.voided ? "text-muted-foreground line-through" : "text-success",
            onDelete: canEditPayments ? () => removePaymentMutation.mutate(p.id) : undefined,
          }))}
          empty="No payments recorded."
        />

      </div>
    </div>
  );
}

function SummaryPanel({ sum }: { sum: ReturnType<typeof semesterSummary> }) {
  const rows: [string, string, string?][] = [
    ["Total charged", inr(sum.totalCharged)],
    ["Concessions", `− ${inr(sum.totalConcession)}`, "text-warning"],
    ["Scholarships", `− ${inr(sum.totalScholarship)}`, "text-warning"],
    ["Net payable", inr(sum.netPayable), "font-semibold text-foreground"],
    ["Paid", inr(sum.totalPaid), "text-success"],
  ];
  return (
    <Card>
      <CardContent className="space-y-2 p-5">
        {rows.map(([l, v, cls]) => (
          <div key={l} className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{l}</span>
            <span className={cls ?? "text-foreground"}>{v}</span>
          </div>
        ))}
        <div className="mt-3 border-t border-border pt-3">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-muted-foreground">Balance</span>
            <span className={`font-display text-2xl font-semibold ${sum.balance > 0 ? "text-destructive" : "text-success"}`}>
              {inr(sum.balance)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LedgerBlock({
  title, addBtn, rows, empty,
}: {
  title: string;
  addBtn: React.ReactNode;
  rows: { id: string; main: string; sub?: string; right: string; rightClass?: string; onDelete?: () => void }[];
  empty: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        {addBtn}
      </div>
      <div className="divide-y divide-border">
        {rows.length === 0 && <div className="p-4 text-sm text-muted-foreground">{empty}</div>}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium text-foreground">{r.main}</p>
              {r.sub && <p className="text-xs text-muted-foreground">{r.sub}</p>}
            </div>
            <div className="flex items-center gap-2">
              <span className={r.rightClass ?? "text-foreground"}>{r.right}</span>
              {r.onDelete && (
                <Button variant="ghost" size="icon" onClick={r.onDelete}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AddChargeDialog({ studentId, semester }: { studentId: string; semester: number }) {
  const queryClient = useQueryClient();
  const addChargeMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('fee_charges').insert([{
        student_id: data.studentId,
        semester: data.semester,
        head: data.head,
        amount: data.amount,
        label: data.label,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee_charges', studentId] });
      toast.success("Charge added");
      setOpen(false); setAmount(""); setLabel("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const [open, setOpen] = useState(false);
  const [head, setHead] = useState<FeeHead>("tuition");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="mr-1 h-3.5 w-3.5" /> Add charge</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Add fee charge</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Fee head</Label>
            <Select value={head} onValueChange={(v) => setHead(v as FeeHead)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {FEE_HEADS.map((h) => (
                  <SelectItem key={h.key} value={h.key}>{h.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Amount (INR)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>Note (optional)</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Practical exam" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={addChargeMutation.isPending}
            onClick={() => {
              const amt = Number(amount);
              if (!amt || amt <= 0) return toast.error("Enter a valid amount");
              addChargeMutation.mutate({ studentId, semester, head, amount: amt, label: label || undefined });
            }}
          >
            {addChargeMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddAdjustmentDialog({ studentId, semester }: { studentId: string; semester: number }) {
  const queryClient = useQueryClient();
  const addAdjustmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('fee_adjustments').insert([{
        student_id: data.studentId,
        semester: data.semester,
        type: data.type,
        amount: data.amount,
        label: data.label,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee_adjustments', studentId] });
      toast.success("Adjustment added");
      setOpen(false); setAmount(""); setLabel("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"concession" | "scholarship">("concession");
  const [amount, setAmount] = useState("");
  const [label, setLabel] = useState("");

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm"><Plus className="mr-1 h-3.5 w-3.5" /> Add adjustment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Add concession / scholarship</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as "concession" | "scholarship")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="concession">Concession</SelectItem>
                <SelectItem value="scholarship">Scholarship</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Amount (INR)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>Reason / label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="e.g. Merit, Sibling, State scheme" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={addAdjustmentMutation.isPending}
            onClick={() => {
              const amt = Number(amount);
              if (!amt || amt <= 0) return toast.error("Enter a valid amount");
              addAdjustmentMutation.mutate({ studentId, semester, type, amount: amt, label: label || undefined });
            }}
          >
            {addAdjustmentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddPaymentDialog({
  student, semester, defaultAmount, userRole
}: { student: any; semester: number; defaultAmount: number; userRole?: any }) {
  const queryClient = useQueryClient();
  const addPaymentMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('fee_payments').insert([{
        student_id: data.studentId,
        semester: data.semester,
        amount: data.amount,
        method: data.method,
        reference: data.reference,
        paid_at: new Date().toISOString(),
      }]);
      if (error) throw error;
      
      if (userRole) {
        await supabase.from('audit_logs').insert([{
          actor_user_id: userRole.id,
          actor_name: userRole.name,
          actor_code: userRole.user_code,
          actor_role: userRole.role,
          event: 'payment.collected',
          summary: `Collected ₹${data.amount} via ${data.method.toUpperCase()} for ${student.name} (Sem ${data.semester})`,
          student_id: data.studentId,
        }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee_payments', student.id] });
      queryClient.invalidateQueries({ queryKey: ['fee_payments'] });
      toast.success("Payment recorded");
      setOpen(false); setReference("");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState(String(defaultAmount || ""));
  const [method, setMethod] = useState<"cash" | "upi" | "card" | "bank" | "cheque">("upi");
  const [reference, setReference] = useState("");

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (o) setAmount(String(defaultAmount || "")); }}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="mr-1 h-3.5 w-3.5" /> Record payment</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Record payment</DialogTitle></DialogHeader>
        <div className="grid gap-3">
          <div>
            <Label>Amount (INR)</Label>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </div>
          <div>
            <Label>Method</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as typeof method)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["cash", "upi", "card", "bank", "cheque"].map((m) => (
                  <SelectItem key={m} value={m}>{m.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Reference / receipt no.</Label>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            disabled={addPaymentMutation.isPending}
            onClick={() => {
              const amt = Number(amount);
              if (!amt || amt <= 0) return toast.error("Enter a valid amount");
              addPaymentMutation.mutate({ studentId: student.id, semester, amount: amt, method, reference: reference.trim() || undefined });
            }}
          >
            {addPaymentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Payment history with filters + void ----------

function PaymentHistory({ student, program, payments, canEditPayments, userRole }: { student: any, program: any, payments: any[], canEditPayments: boolean, userRole?: any }) {
  const queryClient = useQueryClient();
  const paymentInfo = useStore((s) => s.paymentInfo);
  const isAdmin = canEditPayments;

  const [semFilter, setSemFilter] = useState<string>("all");
  const [methodFilter, setMethodFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const rows = useMemo(() => {
    return payments
      .filter((p) => (semFilter === "all" ? true : p.semester === Number(semFilter)))
      .filter((p) => (methodFilter === "all" ? true : p.method === methodFilter))
      .filter((p) =>
        statusFilter === "all"
          ? true
          : statusFilter === "voided"
          ? p.voided
          : !p.voided,
      )
      .sort((a, b) => +new Date(b.paidAt) - +new Date(a.paidAt));
  }, [payments, semFilter, methodFilter, statusFilter]);

  const totalReceived = rows.filter((p) => !p.voided).reduce((s, p) => s + p.amount, 0);
  const totalVoided = rows.filter((p) => p.voided).reduce((s, p) => s + p.amount, 0);

  const semList = Array.from({ length: student.current_semester }, (_, i) => i + 1);

  const downloadReceipt = (p: FeePayment) => {
    const rolls = student.rolls || {};
    downloadReceiptPdf({
      college: paymentInfo,
      payment: p,
      student: {
        name: student.name,
        admissionNo: student.admission_no,
        rollNo: rolls[p.semester] || "",
      },
      program: program ? { name: program.name, code: program.code } : undefined,
      semester: p.semester,
    });
  };

  const exportCsv = () => {
    if (rows.length === 0) return toast.error("Nothing to export for these filters");
    const escape = (v: string | number | undefined) => {
      const s = v == null ? "" : String(v);
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const header = [
      "Date", "Semester", "Roll", "Method", "Reference",
      "Amount", "Status", "Voided at", "Void reason", "Note",
    ];
    const rolls = student.rolls || {};
    const lines = rows.map((p) => [
      new Date(p.paidAt).toISOString(),
      `Sem ${p.semester}`,
      rolls[p.semester] ?? "",
      p.method.toUpperCase(),
      p.reference ?? "",
      p.amount,
      p.voided ? "VOIDED" : "RECEIVED",
      p.voidedAt ? new Date(p.voidedAt).toISOString() : "",
      p.voidReason ?? "",
      p.note ?? "",
    ].map(escape).join(","));
    const csv = [header.join(","), ...lines].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const parts = [
      student.admission_no,
      semFilter !== "all" ? `sem${semFilter}` : "all-sem",
      methodFilter !== "all" ? methodFilter : "all-methods",
      statusFilter !== "all" ? statusFilter : "all-status",
    ];
    a.href = url;
    a.download = `payments-${parts.join("-")}.csv`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${rows.length} row(s)`);
  };

  const voidPaymentMutation = useMutation({
    mutationFn: async ({ id, reason, payment }: { id: string, reason?: string, payment: any }) => {
      const { error } = await supabase.from('fee_payments').update({
        voided: true,
        voided_at: new Date().toISOString(),
        void_reason: reason,
      }).eq('id', id);
      if (error) throw error;

      if (userRole) {
        await supabase.from('audit_logs').insert([{
          actor_user_id: userRole.id,
          actor_name: userRole.name,
          actor_code: userRole.user_code,
          actor_role: userRole.role,
          event: 'payment.voided',
          summary: `Voided payment of ₹${payment.amount} for ${student.name} (Sem ${payment.semester}). Reason: ${reason || 'None'}`,
          student_id: student.id,
        }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee_payments', student.id] });
      queryClient.invalidateQueries({ queryKey: ['fee_payments'] });
      toast.success("Payment voided");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const unvoidPaymentMutation = useMutation({
    mutationFn: async (payment: any) => {
      const { error } = await supabase.from('fee_payments').update({
        voided: false,
        voided_at: null,
        void_reason: null,
      }).eq('id', payment.id);
      if (error) throw error;
      
      if (userRole) {
        await supabase.from('audit_logs').insert([{
          actor_user_id: userRole.id,
          actor_name: userRole.name,
          actor_code: userRole.user_code,
          actor_role: userRole.role,
          event: 'payment.unvoided',
          summary: `Reversed void for payment of ₹${payment.amount} for ${student.name} (Sem ${payment.semester})`,
          student_id: student.id,
        }]);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee_payments', student.id] });
      queryClient.invalidateQueries({ queryKey: ['fee_payments'] });
      toast.success("Payment reinstated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="font-display text-lg">Payment history</CardTitle>
            <p className="text-xs text-muted-foreground">
              Itemized ledger of every recorded receipt. Filter by semester, method or status.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md bg-success/10 px-2 py-1 text-success">
              Received: {inr(totalReceived)}
            </span>
            {totalVoided > 0 && (
              <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground">
                Voided: {inr(totalVoided)}
              </span>
            )}
            <Button size="sm" variant="outline" onClick={exportCsv}>
              <FileSpreadsheet className="mr-1 h-3.5 w-3.5" /> Export CSV
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs">Semester</Label>
            <Select value={semFilter} onValueChange={setSemFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All semesters</SelectItem>
                {semList.map((n) => (
                  <SelectItem key={n} value={String(n)}>Semester {n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Method</Label>
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All methods</SelectItem>
                {["cash", "upi", "card", "bank", "cheque"].map((m) => (
                  <SelectItem key={m} value={m}>{m.toUpperCase()}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="active">Active only</SelectItem>
                <SelectItem value="voided">Voided / refunded</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Date</th>
                <th className="px-3 py-2 text-left">Sem</th>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">Reference</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">
                    No payments match these filters.
                  </td>
                </tr>
              )}
              {rows.map((p) => (
                <tr key={p.id} className={p.voided ? "bg-muted/30" : ""}>
                  <td className="px-3 py-2">{new Date(p.paidAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2">Sem {p.semester}</td>
                  <td className="px-3 py-2">{p.method.toUpperCase()}</td>
                  <td className="px-3 py-2 font-mono text-xs">{p.reference ?? "—"}</td>
                  <td className={`px-3 py-2 text-right font-medium ${p.voided ? "text-muted-foreground line-through" : ""}`}>
                    {inr(p.amount)}
                  </td>
                  <td className="px-3 py-2">
                    {p.voided ? (
                      <Badge variant="secondary">Voided</Badge>
                    ) : (
                      <Badge variant="default">Received</Badge>
                    )}
                  </td>
                  <td className="px-3 py-2 text-right">
                    <div className="flex justify-end gap-1">
                      <Button size="icon" variant="ghost" title="Re-print receipt (PDF)" onClick={() => downloadReceipt(p)}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      {p.voided ? (
                        <Button
                          size="icon"
                          variant="ghost"
                          title={isAdmin ? "Un-void" : "Admin only"}
                          disabled={!isAdmin || unvoidPaymentMutation.isPending}
                          onClick={() => {
                            unvoidPaymentMutation.mutate(p);
                          }}
                        >
                          {isAdmin ? <Undo2 className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
                        </Button>
                      ) : (
                        <VoidPaymentDialog 
                          paymentId={p.id} 
                          voidPayment={(id, reason) => voidPaymentMutation.mutate({ id, reason, payment: p })} 
                          isAdmin={isAdmin}
                          isPending={voidPaymentMutation.isPending}
                        />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!isAdmin && (
          <p className="text-[11px] text-muted-foreground">
            <Lock className="mr-1 inline h-3 w-3" /> Void / un-void requires admin role.
          </p>
        )}
        {rows.some((p) => p.voided) && (
          <p className="text-[11px] text-muted-foreground">
            Voided/refunded payments are excluded from the student's paid total and outstanding balance.
          </p>
        )}
      </CardContent>
    </Card>
  );
}

function VoidPaymentDialog({
  paymentId, voidPayment, isAdmin, isPending
}: {
  paymentId: string;
  voidPayment: (id: string, reason?: string) => void;
  isAdmin: boolean;
  isPending: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="icon" variant="ghost" title={isAdmin ? "Void / refund" : "Admin only"} disabled={!isAdmin}>
          {isAdmin ? <RotateCcw className="h-4 w-4 text-destructive" /> : <Lock className="h-4 w-4" />}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-display">Void / refund payment</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <p className="text-muted-foreground">
            The payment amount will be reversed from the student's paid total and the
            outstanding balance will be updated automatically. The record is kept for audit.
          </p>
          <div>
            <Label>Reason (optional)</Label>
            <Textarea rows={2} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Refunded via UPI, wrong entry" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() => {
              voidPayment(paymentId, reason || undefined);
              setOpen(false); setReason("");
            }}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Void payment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

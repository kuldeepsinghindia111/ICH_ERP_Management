import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useStore, inr, formatYear, FEE_HEADS } from "@/lib/store";
import { Pencil, Trash2, Save, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

export function LedgerSummaryDialog({ student, sum }: { student: any, sum: any }) {
  const { role } = useStore();
  const isAdmin = role === "admin";
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: async ({ table, id }: { table: string, id: string }) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { table }) => {
      toast.success("Transaction deleted");
      queryClient.invalidateQueries({ queryKey: [table] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ table, id, amount }: { table: string, id: string, amount: number }) => {
      const { error } = await supabase.from(table).update({ amount }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, { table }) => {
      toast.success("Transaction updated");
      queryClient.invalidateQueries({ queryKey: [table] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">Ledger</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Fee Ledger - {student.name}</DialogTitle>
          <p className="text-xs text-muted-foreground">
            {formatYear(student.current_semester)} · Roll No: {student.roll_number || "—"}
          </p>
        </DialogHeader>

        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-4">
          <div className="rounded-md bg-muted/60 p-3 text-center">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Net Payable</p>
            <p className="mt-1 font-display text-lg font-semibold">{inr(sum.netPayable)}</p>
          </div>
          <div className="rounded-md bg-muted/60 p-3 text-center">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Paid</p>
            <p className="mt-1 font-display text-lg font-semibold text-success">{inr(sum.totalPaid)}</p>
          </div>
          <div className="rounded-md bg-muted/60 p-3 text-center">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Balance</p>
            <p className={`mt-1 font-display text-lg font-semibold ${sum.balance > 0 ? "text-warning" : "text-foreground"}`}>
              {inr(sum.balance)}
            </p>
          </div>
          <div className="rounded-md bg-muted/60 p-3 text-center">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Late Fees</p>
            <p className="mt-1 font-display text-lg font-semibold text-muted-foreground">{inr(sum.totalLate)}</p>
          </div>
          <div className="rounded-md bg-muted/60 p-3 text-center">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Fine</p>
            <p className="mt-1 font-display text-lg font-semibold text-muted-foreground">{inr(sum.totalFine)}</p>
          </div>
          <div className="rounded-md bg-muted/60 p-3 text-center">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Other</p>
            <p className="mt-1 font-display text-lg font-semibold text-muted-foreground">{inr(sum.totalOther)}</p>
          </div>
        </div>

        <div className="space-y-4 mt-6">
          <LedgerBlock
            title="Charges"
            rows={sum.charges.map((c: any) => ({
              id: c.id,
              main: FEE_HEADS.find((h) => h.key === c.head)?.label ?? c.head,
              sub: c.label,
              right: inr(c.amount),
              rawAmount: c.amount,
            }))}
            empty="No charges."
            canEdit={isAdmin}
            onDelete={(id) => deleteMutation.mutate({ table: "fee_charges", id })}
            onSave={(id, amount) => updateMutation.mutate({ table: "fee_charges", id, amount })}
          />
          <LedgerBlock
            title="Concessions & scholarships"
            rows={sum.adjustments.map((a: any) => ({
              id: a.id,
              main: a.type === "concession" ? "Concession" : "Scholarship",
              sub: a.label,
              right: `− ${inr(a.amount)}`,
              rightClass: "text-warning",
              rawAmount: a.amount,
            }))}
            empty="No concessions or scholarships."
            canEdit={isAdmin}
            onDelete={(id) => deleteMutation.mutate({ table: "fee_adjustments", id })}
            onSave={(id, amount) => updateMutation.mutate({ table: "fee_adjustments", id, amount })}
          />
          <LedgerBlock
            title="Payments"
            rows={sum.payments.map((p: any) => ({
              id: p.id,
              main: `${p.method.toUpperCase()}${p.voided ? " · VOID" : ""}`,
              sub: `${new Date(p.paidAt).toLocaleDateString()} · ${p.reference ?? "—"}${p.voided && p.voidReason ? ` — ${p.voidReason}` : ""}`,
              right: inr(p.amount),
              rightClass: p.voided ? "text-muted-foreground line-through" : "text-success",
              rawAmount: p.amount,
            }))}
            empty="No payments recorded."
            canEdit={isAdmin}
            onDelete={(id) => deleteMutation.mutate({ table: "fee_payments", id })}
            onSave={(id, amount) => updateMutation.mutate({ table: "fee_payments", id, amount })}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LedgerBlock({
  title, rows, empty, canEdit, onDelete, onSave
}: {
  title: string;
  rows: { id: string; main: string; sub?: string; right: string; rightClass?: string; rawAmount: number }[];
  empty: string;
  canEdit?: boolean;
  onDelete?: (id: string) => void;
  onSave?: (id: string, amount: number) => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<string>("");

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="divide-y divide-border">
        {rows.length === 0 && <div className="p-4 text-sm text-muted-foreground">{empty}</div>}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/30 group">
            <div>
              <p className="font-medium text-foreground">{r.main}</p>
              {r.sub && <p className="text-xs text-muted-foreground">{r.sub}</p>}
            </div>
            
            <div className="flex items-center gap-3">
              {editingId === r.id ? (
                <div className="flex items-center gap-2">
                  <Input 
                    className="w-24 h-8 text-right" 
                    type="number"
                    value={editAmount}
                    onChange={(e) => setEditAmount(e.target.value)}
                    autoFocus
                  />
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-success hover:text-success hover:bg-success/10" 
                    onClick={() => {
                      if (onSave && !isNaN(Number(editAmount))) {
                        onSave(r.id, Number(editAmount));
                      }
                      setEditingId(null);
                    }}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setEditingId(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <span className={r.rightClass ?? "text-foreground"}>{r.right}</span>
                  {canEdit && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => {
                        setEditingId(r.id);
                        setEditAmount(String(r.rawAmount));
                      }}>
                        <Pencil className="h-3 w-3" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => {
                          if (confirm("Are you sure you want to delete this transaction?") && onDelete) {
                            onDelete(r.id);
                          }
                        }}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

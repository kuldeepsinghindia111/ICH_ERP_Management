import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { inr, formatYear, FEE_HEADS, type FeeCharge, type FeeAdjustment, type FeePayment } from "@/lib/store";

export function LedgerSummaryDialog({ student, sum }: { student: any, sum: any }) {
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

        <div className="grid grid-cols-3 gap-2 mt-4">
          <div className="rounded-md bg-muted/60 p-3 text-center">
            <p className="text-[11px] uppercase tracking-widest text-muted-foreground">Billed</p>
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
        </div>

        <div className="space-y-4 mt-6">
          <LedgerBlock
            title="Charges"
            rows={sum.charges.map((c: FeeCharge) => ({
              id: c.id,
              main: FEE_HEADS.find((h) => h.key === c.head)?.label ?? c.head,
              sub: c.label,
              right: inr(c.amount),
            }))}
            empty="No charges."
          />
          <LedgerBlock
            title="Concessions & scholarships"
            rows={sum.adjustments.map((a: FeeAdjustment) => ({
              id: a.id,
              main: a.type === "concession" ? "Concession" : "Scholarship",
              sub: a.label,
              right: `− ${inr(a.amount)}`,
              rightClass: "text-warning",
            }))}
            empty="No concessions or scholarships."
          />
          <LedgerBlock
            title="Payments"
            rows={sum.payments.map((p: FeePayment) => ({
              id: p.id,
              main: `${p.method.toUpperCase()}${p.voided ? " · VOID" : ""}`,
              sub: `${new Date(p.paidAt).toLocaleDateString()} · ${p.reference ?? "—"}${p.voided && p.voidReason ? ` — ${p.voidReason}` : ""}`,
              right: inr(p.amount),
              rightClass: p.voided ? "text-muted-foreground line-through" : "text-success",
            }))}
            empty="No payments recorded."
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LedgerBlock({
  title, rows, empty,
}: {
  title: string;
  rows: { id: string; main: string; sub?: string; right: string; rightClass?: string }[];
  empty: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-4 py-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      </div>
      <div className="divide-y divide-border">
        {rows.length === 0 && <div className="p-4 text-sm text-muted-foreground">{empty}</div>}
        {rows.map((r) => (
          <div key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
            <div>
              <p className="font-medium text-foreground">{r.main}</p>
              {r.sub && <p className="text-xs text-muted-foreground">{r.sub}</p>}
            </div>
            <span className={r.rightClass ?? "text-foreground"}>{r.right}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

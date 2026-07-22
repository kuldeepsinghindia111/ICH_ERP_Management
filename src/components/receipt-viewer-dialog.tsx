import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useStore, inr, formatYear } from "@/lib/store";
import { generateReceiptPdf, printReceiptPdf, downloadReceiptPdf, type ReceiptData } from "@/lib/receipt";
import { Printer, Download, Receipt, X } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function ReceiptViewerDialog({ student, payments, programs }: { student: any, payments: any[], programs: any[] }) {
  const { paymentInfo } = useStore();
  const [open, setOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Filter out voided payments
  const validPayments = useMemo(() => payments.filter(p => !p.voided), [payments]);

  useEffect(() => {
    if (open && validPayments.length > 0 && !selectedPaymentId) {
      // default to the most recent payment
      const sorted = [...validPayments].sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime());
      setSelectedPaymentId(sorted[0].id);
    }
  }, [open, validPayments, selectedPaymentId]);

  useEffect(() => {
    if (!open || !selectedPaymentId) return;
    
    const payment = validPayments.find(p => p.id === selectedPaymentId);
    if (!payment) return;

    const program = programs.find((p: any) => p.id === student.program_id);
    
    const receiptData: ReceiptData = {
      college: paymentInfo,
      payment: { amount: payment.amount, method: payment.method, reference: payment.reference, paidAt: payment.paidAt, note: payment.note },
      student: { name: student.name, guardian: student.guardian, admissionNo: student.admission_no, rollNo: student.roll_number || "" },
      program: program ? { name: program.name, code: program.code } : undefined,
      semester: student.current_semester,
    };

    try {
      const doc = generateReceiptPdf(receiptData);
      const url = doc.output("datauristring");
      setPreviewUrl(url);
    } catch (err) {
      console.error(err);
    }
  }, [selectedPaymentId, open, validPayments, student, programs, paymentInfo]);

  const handlePrint = () => {
    const payment = validPayments.find(p => p.id === selectedPaymentId);
    if (!payment) return;
    const program = programs.find((p: any) => p.id === student.program_id);
    printReceiptPdf({
      college: paymentInfo,
      payment: { amount: payment.amount, method: payment.method, reference: payment.reference, paidAt: payment.paidAt, note: payment.note },
      student: { name: student.name, guardian: student.guardian, admissionNo: student.admission_no, rollNo: student.roll_number || "" },
      program: program ? { name: program.name, code: program.code } : undefined,
      semester: student.current_semester,
    });
  };

  const handleDownload = () => {
    const payment = validPayments.find(p => p.id === selectedPaymentId);
    if (!payment) return;
    const program = programs.find((p: any) => p.id === student.program_id);
    downloadReceiptPdf({
      college: paymentInfo,
      payment: { amount: payment.amount, method: payment.method, reference: payment.reference, paidAt: payment.paidAt, note: payment.note },
      student: { name: student.name, guardian: student.guardian, admissionNo: student.admission_no, rollNo: student.roll_number || "" },
      program: program ? { name: program.name, code: program.code } : undefined,
      semester: student.current_semester,
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={validPayments.length === 0} title={validPayments.length === 0 ? "No valid payments to show" : "View Receipt"}>
          <Receipt className="mr-1.5 h-3.5 w-3.5" />
          Receipt
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 h-[90vh]">
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-b border-border gap-4 bg-background z-10 shrink-0">
          <div>
            <DialogTitle className="font-display">View Receipt</DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {student.name} · {formatYear(student.current_semester)}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
            {validPayments.length > 1 && (
              <Select value={selectedPaymentId || ""} onValueChange={setSelectedPaymentId}>
                <SelectTrigger className="w-full sm:w-[220px]">
                  <SelectValue placeholder="Select a payment..." />
                </SelectTrigger>
                <SelectContent>
                  {validPayments.sort((a, b) => new Date(b.paidAt).getTime() - new Date(a.paidAt).getTime()).map(p => (
                    <SelectItem key={p.id} value={p.id}>
                      {new Date(p.paidAt).toLocaleDateString()} - {inr(p.amount)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            
            <div className="flex items-center gap-2 shrink-0">
              <Button size="sm" variant="outline" onClick={handlePrint} disabled={!selectedPaymentId}>
                <Printer className="mr-2 h-4 w-4" /> Print
              </Button>
              <Button size="sm" variant="default" onClick={handleDownload} disabled={!selectedPaymentId}>
                <Download className="mr-2 h-4 w-4" /> Download
              </Button>
              <DialogClose asChild>
                <Button size="sm" variant="ghost">
                  <X className="mr-1 h-4 w-4" /> Close
                </Button>
              </DialogClose>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-muted/30 p-4 overflow-hidden h-full min-h-0">
          {previewUrl ? (
            <iframe src={`${previewUrl}#toolbar=0`} className="w-full h-full rounded-md border border-border bg-white" title="Receipt Preview" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              Generating preview...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

import jsPDF from "jspdf";
import { inr, type FeePayment, type Student, type Program } from "@/lib/store";

export type CollegeInfo = {
  collegeName: string;
  accountName: string;
  accountNumber: string;
  ifsc: string;
  bankName: string;
  branch: string;
  upiId: string;
  upiName: string;
  supportEmail: string;
  supportPhone: string;
};

export type ReceiptData = {
  college: CollegeInfo;
  payment: Pick<FeePayment, "amount" | "method" | "reference" | "note" | "paidAt"> & { id?: string };
  student: Pick<Student, "name" | "admissionNo"> & { rollNo?: string };
  program?: Pick<Program, "name" | "code">;
  semester: number;
};

export function generateReceiptPdf(data: ReceiptData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a5", orientation: "portrait" });
  const W = doc.internal.pageSize.getWidth();
  let y = 40;

  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(data.college.collegeName, W / 2, y, { align: "center" });
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Official Fee Payment Receipt", W / 2, y, { align: "center" });
  y += 8;
  doc.setDrawColor(180);
  doc.line(30, y, W - 30, y);
  y += 20;

  // Receipt meta
  doc.setFontSize(9);
  const ref = data.payment.reference || data.payment.id || "—";
  const dt = new Date(data.payment.paidAt).toLocaleString();
  doc.text(`Receipt No: ${ref}`, 30, y);
  doc.text(`Date: ${dt}`, W - 30, y, { align: "right" });
  y += 20;

  // Student box
  doc.setFont("helvetica", "bold");
  doc.text("Student", 30, y);
  doc.setFont("helvetica", "normal");
  y += 14;
  const lines: [string, string][] = [
    ["Name", data.student.name],
    ["Admission No.", data.student.admissionNo],
    ...(data.student.rollNo ? [["Roll No.", data.student.rollNo] as [string, string]] : []),
    ...(data.program ? [["Program", `${data.program.name} (${data.program.code})`] as [string, string]] : []),
    ["Semester", `Semester ${data.semester}`],
  ];
  lines.forEach(([k, v]) => {
    doc.setTextColor(120);
    doc.text(k, 30, y);
    doc.setTextColor(20);
    doc.text(String(v), 130, y);
    y += 14;
  });

  y += 8;
  doc.setDrawColor(220);
  doc.line(30, y, W - 30, y);
  y += 18;

  // Payment
  doc.setFont("helvetica", "bold");
  doc.text("Payment", 30, y);
  doc.setFont("helvetica", "normal");
  y += 14;

  const pay: [string, string][] = [
    ["Method", data.payment.method.toUpperCase()],
    ["Reference", ref],
    ...(data.payment.note ? [["Note", data.payment.note] as [string, string]] : []),
  ];
  pay.forEach(([k, v]) => {
    doc.setTextColor(120);
    doc.text(k, 30, y);
    doc.setTextColor(20);
    const wrapped = doc.splitTextToSize(String(v), W - 160);
    doc.text(wrapped, 130, y);
    y += 14 * wrapped.length;
  });

  y += 6;
  // Amount box
  doc.setFillColor(15, 33, 71);
  doc.rect(30, y, W - 60, 46, "F");
  doc.setTextColor(255);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Amount received", 44, y + 18);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(inr(data.payment.amount), W - 44, y + 30, { align: "right" });
  y += 66;

  doc.setTextColor(20);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(
    `Credited to: ${data.college.accountName} · ${data.college.bankName} · A/c ${data.college.accountNumber} · IFSC ${data.college.ifsc}`,
    30,
    y,
    { maxWidth: W - 60 },
  );
  y += 24;

  doc.setTextColor(120);
  doc.setFontSize(7);
  doc.text(
    `Support: ${data.college.supportEmail} · ${data.college.supportPhone}`,
    30,
    y,
  );
  y += 10;
  doc.text(
    "This is a system-generated receipt.",
    30,
    y,
  );

  return doc;
}

export function downloadReceiptPdf(data: ReceiptData) {
  const doc = generateReceiptPdf(data);
  const safe = data.student.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`receipt-${safe}-sem${data.semester}-${(data.payment.reference || Date.now()).toString()}.pdf`);
}

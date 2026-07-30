import jsPDF from "jspdf";
import { type FeePayment, type Student, type Program } from "@/lib/store";

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
  student: Pick<Student, "name" | "admissionNo" | "guardian"> & { rollNo?: string };
  program?: Pick<Program, "name" | "code">;
  semester: number;
};

function formatRs(amount: number) {
  return "Rs. " + amount.toLocaleString("en-IN");
}

function getYearString(sem: number) {
  if (sem <= 2) return "1st Year";
  if (sem <= 4) return "2nd Year";
  if (sem <= 6) return "3rd Year";
  return `${sem}th Sem`;
}

function drawReceiptHalf(
  doc: jsPDF,
  data: ReceiptData,
  startY: number,
  copyLabel: string,
  transactionId?: string
) {
  const W = doc.internal.pageSize.getWidth();
  const textColor: [number, number, number] = [0, 0, 0];
  const mutedColor: [number, number, number] = [80, 80, 80];

  let y = startY + 18;

  // College Name Centered & Copy Label Right
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.text(data.college.collegeName.toUpperCase(), W / 2, y, { align: "center" });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text(copyLabel.toUpperCase(), W - 30, y - 4, { align: "right" });

  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...mutedColor);
  doc.text("Official Fee Payment Receipt", W / 2, y, { align: "center" });

  y += 12;
  // Subtle separator
  doc.setDrawColor(210, 210, 210);
  doc.setLineWidth(0.8);
  doc.line(30, y, W - 30, y);

  y += 14;

  // Receipt Meta Info (Receipt No & Date)
  const ref = data.payment.reference || data.payment.id || "N/A";
  const dt = new Date(data.payment.paidAt).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...textColor);
  doc.text("Receipt No: " + ref, 30, y);
  doc.text("Date: " + dt, W - 30, y, { align: "right" });

  if (transactionId && data.payment.method !== "cash") {
    const refLabel = data.payment.method === "cheque" ? "Cheque No:" : "UTR / Ref No:";
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.text(`${refLabel} ${transactionId}`, W - 30, y + 12, { align: "right" });
  }

  y += 18;

  // Student Details Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...textColor);
  doc.text("Student Details", 30, y);

  y += 6;
  // Student Information Box
  doc.setDrawColor(210, 210, 210);
  doc.roundedRect(30, y, W - 60, 62, 4, 4, "S");

  const drawField = (label: string, value: string, fx: number, fy: number) => {
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...mutedColor);
    doc.text(label, fx, fy);
    const labelWidth = doc.getTextWidth(label);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...textColor);
    doc.text(value || "—", fx + labelWidth + 4, fy);
  };

  let sy = y + 16;
  doc.setFontSize(8.5);
  drawField("Name:", data.student.name.toUpperCase(), 45, sy);
  drawField("Roll No:", data.student.rollNo || "—", W / 2 + 15, sy);

  sy += 16;
  drawField("Father's Name:", (data.student.guardian || "—").toUpperCase(), 45, sy);
  drawField("Admission No:", data.student.admissionNo || "—", W / 2 + 15, sy);

  sy += 16;
  const progText = data.program
    ? `${data.program.name} (${getYearString(data.semester)})`
    : getYearString(data.semester);
  drawField("Program/Year:", progText, 45, sy);
  drawField("Payment Mode:", data.payment.method.toUpperCase(), W / 2 + 15, sy);

  y += 80;

  // Payment Details Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.setTextColor(...textColor);
  doc.text("Payment Details", 30, y);

  y += 8;
  doc.setDrawColor(210, 210, 210);
  doc.line(30, y, W - 30, y);

  y += 12;
  doc.setFontSize(8.5);
  doc.setFont("helvetica", "bold");
  doc.text("Description", 45, y);
  doc.text("Method", W / 2, y);
  const amountX = W - 45;
  doc.text("Amount", amountX, y, { align: "right" });

  y += 6;
  doc.line(30, y, W - 30, y);

  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  const descText = `Fee (${getYearString(data.semester)})`;
  doc.text(doc.splitTextToSize(descText, (W / 2) - 60), 45, y);
  doc.text(data.payment.method.toUpperCase(), W / 2, y);
  doc.text(formatRs(data.payment.amount), amountX, y, { align: "right" });

  y += 12;
  doc.line(30, y, W - 30, y);

  y += 16;
  // Total Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9.5);
  doc.text("Total Received:", W - 150, y, { align: "right" });
  doc.setFontSize(10.5);
  doc.text(formatRs(data.payment.amount), amountX, y, { align: "right" });

  y += 8;
  doc.setDrawColor(210, 210, 210);
  doc.line(W - 200, y, W - 30, y);

  y += 20;
  // Footer Notes
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...mutedColor);
  doc.text(`Support: ${data.college.supportEmail}  |  Phone: ${data.college.supportPhone}`, 30, y);
  doc.text("Note: Exam fees will be charged separately at the time of exam forms.", 30, y + 12);
  doc.text("This is a computer-generated document and does not require a physical signature.", 30, y + 24);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(60, 60, 60);
  doc.text("Authorized Signatory / Office Stamp", W - 45, y + 18, { align: "right" });
}

export function generateReceiptPdf(data: ReceiptData): jsPDF {
  let transactionId = (data.payment as any).transactionId;
  let cleanNote = data.payment.note;
  if (!transactionId && cleanNote) {
    const match = cleanNote.match(/^(CHEQUE|UTR):(.+?)(?:\n|$)/);
    if (match) {
      transactionId = match[2];
      cleanNote = cleanNote.replace(/^(CHEQUE|UTR):.+?(?:\n|$)/, "").trim();
    }
  }

  // A4 format portrait (dual-copy layout: Upper half & Lower half)
  const doc = new jsPDF({ unit: "pt", format: "a4", orientation: "portrait" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // 1. Upper copy (Student Copy) - Starts at Y = 25
  drawReceiptHalf(doc, data, 25, "STUDENT COPY", transactionId);

  // 2. Middle Cut/Fold Divider Line across A4 page middle
  const midY = H / 2;
  doc.setDrawColor(180, 180, 180);
  doc.setLineDashPattern([4, 4], 0);
  doc.line(20, midY, W - 20, midY);
  doc.setLineDashPattern([], 0);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(140, 140, 140);
  doc.text(
    "- - - - - - - - - - - - - - - - - - - - - - - - - - - CUT HERE - - - - - - - - - - - - - - - - - - - - - - - - - - -",
    W / 2,
    midY + 3,
    { align: "center" }
  );

  // 3. Lower copy (College Copy) - Starts at Y = 445
  drawReceiptHalf(doc, data, 445, "COLLEGE COPY", transactionId);

  return doc;
}

export function downloadReceiptPdf(data: ReceiptData) {
  const doc = generateReceiptPdf(data);
  const safe = data.student.name.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`receipt-${safe}-sem${data.semester}-${(data.payment.reference || Date.now()).toString()}.pdf`);
}

export function printReceiptPdf(data: ReceiptData) {
  const doc = generateReceiptPdf(data);
  doc.autoPrint();
  const url = doc.output("bloburl").toString();
  const win = window.open(url, "_blank");
  if (win) {
    win.onload = () => { win.print(); };
  }
}

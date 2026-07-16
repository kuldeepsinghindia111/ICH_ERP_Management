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

export function generateReceiptPdf(data: ReceiptData): jsPDF {
  // A5 format portrait (which is exactly half of A4)
  const doc = new jsPDF({ unit: "pt", format: "a5", orientation: "portrait" });
  const W = doc.internal.pageSize.getWidth();
  let y = 40;

  const textColor: [number, number, number] = [0, 0, 0]; // black
  const mutedColor: [number, number, number] = [80, 80, 80]; // dark grey for slight contrast

  // College Name & Info Centered
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(data.college.collegeName.toUpperCase(), W / 2, y, { align: "center" });
  
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text("Official Fee Payment Receipt", W / 2, y, { align: "center" });
  
  y += 15;
  
  // Subtle separator
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(1);
  doc.line(30, y, W - 30, y);
  
  y += 20;

  // Receipt Meta Info (Receipt No & Date)
  const ref = data.payment.reference || data.payment.id || "N/A";
  // Remove time, just keep date
  const dt = new Date(data.payment.paidAt).toLocaleString('en-IN', { 
    day: '2-digit', month: 'short', year: 'numeric'
  });
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Receipt No:", 30, y);
  doc.text("Date:", W - 30, y, { align: "right" });
  
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.text(ref, 30, y);
  doc.text(dt, W - 30, y, { align: "right" });

  y += 25;

  // Student Information Box
  doc.setDrawColor(200, 200, 200);
  doc.roundedRect(30, y, W - 60, 90, 4, 4, 'S'); // Just stroke, no fill
  
  let sy = y + 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.text("Student Details", 45, sy);
  
  sy += 20;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text("Name:", 45, sy);
  doc.text("Roll No:", W / 2, sy);
  
  sy += 12;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textColor);
  doc.text(data.student.name.toUpperCase(), 45, sy);
  doc.text(data.student.rollNo || "—", W / 2, sy);
  
  sy += 20;
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...mutedColor);
  doc.text("Program/Class:", 45, sy);
  doc.text("Admission No:", W / 2, sy);
  
  sy += 12;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...textColor);
  const progText = data.program ? `${data.program.name} (${getYearString(data.semester)})` : getYearString(data.semester);
  doc.text(progText, 45, sy);
  doc.text(data.student.admissionNo, W / 2, sy);

  y += 115;

  // Payment Details Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Payment Details", 30, y);
  
  y += 20;
  // Table Header (Normal Black Fonts, no strip)
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Description", 40, y);
  doc.text("Method", W / 2, y);
  // Align Amount header perfectly with the numbers on the right
  const amountX = W - 40;
  doc.text("Amount", amountX, y, { align: "right" });
  
  y += 8;
  doc.setDrawColor(200, 200, 200);
  doc.line(30, y, W - 30, y);
  
  y += 16;
  
  // Table Row
  doc.setFont("helvetica", "normal");
  
  const descText = data.payment.note ? `Tuition Fee - ${data.payment.note}` : `Tuition Fee (${getYearString(data.semester)})`;
  doc.text(doc.splitTextToSize(descText, (W / 2) - 50), 40, y);
  doc.text(data.payment.method.toUpperCase(), W / 2, y);
  
  // Amount
  doc.text(formatRs(data.payment.amount), amountX, y, { align: "right" });
  
  y += 16;
  doc.line(30, y, W - 30, y);

  y += 20;
  // Total Box
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Total Received", W / 2, y);
  doc.setFontSize(12);
  doc.text(formatRs(data.payment.amount), amountX, y, { align: "right" });

  y += 12;
  // Draw line after Total Received
  doc.setDrawColor(200, 200, 200);
  doc.line(30, y, W - 30, y);

  y += 30;
  
  // Footer Notes (Shifted right below the line)
  doc.setFontSize(9);
  doc.setTextColor(...textColor);
  doc.text(`Support: ${data.college.supportEmail}  |  Phone: ${data.college.supportPhone}`, W / 2, y, { align: "center" });

  y += 14;
  doc.setFontSize(8);
  doc.setTextColor(...mutedColor);
  doc.text("Note: Exam fees will be charged separately at the time of exam forms.", W / 2, y, { align: "center" });
  doc.text("This is a computer-generated document and does not require a physical signature.", W / 2, y + 12, { align: "center" });

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

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
  student: Pick<Student, "name" | "admissionNo" | "guardian"> & { rollNo?: string };
  program?: Pick<Program, "name" | "code">;
  semester: number;
};

export function generateReceiptPdf(data: ReceiptData): jsPDF {
  // A5 format portrait
  const doc = new jsPDF({ unit: "pt", format: "a5", orientation: "portrait" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  let y = 0;

  // Colors
  const primaryColor: [number, number, number] = [23, 37, 84]; // dark blue
  const accentColor: [number, number, number] = [241, 245, 249]; // slate-100
  const textColor: [number, number, number] = [30, 41, 59]; // slate-800
  const mutedColor: [number, number, number] = [100, 116, 139]; // slate-500

  // Top Header Banner
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, W, 50, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("FEE RECEIPT", W / 2, 32, { align: "center", renderingMode: "fill" });
  
  y = 75;

  // College Name & Info
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text(data.college.collegeName.toUpperCase(), 30, y);
  
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text(`Email: ${data.college.supportEmail}  |  Phone: ${data.college.supportPhone}`, 30, y);
  
  y += 20;
  
  // Subtle separator
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(1);
  doc.line(30, y, W - 30, y);
  
  y += 25;

  // Receipt Meta Info (Receipt No & Date)
  const ref = data.payment.reference || data.payment.id || "N/A";
  const dt = new Date(data.payment.paidAt).toLocaleString('en-IN', { 
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' 
  });
  
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...textColor);
  doc.text("Receipt No:", 30, y);
  doc.text("Date:", W - 30, y, { align: "right" });
  
  y += 14;
  doc.setFont("helvetica", "normal");
  doc.text(ref, 30, y);
  doc.text(dt, W - 30, y, { align: "right" });

  y += 25;

  // Student Information Box
  doc.setFillColor(...accentColor);
  doc.roundedRect(30, y, W - 60, 90, 6, 6, 'F');
  
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
  const progText = data.program ? `${data.program.name} (Sem ${data.semester})` : `Semester ${data.semester}`;
  doc.text(progText, 45, sy);
  doc.text(data.student.admissionNo, W / 2, sy);

  y += 115;

  // Payment Details Section
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Payment Details", 30, y);
  
  y += 15;
  // Table Header
  doc.setFillColor(...primaryColor);
  doc.rect(30, y, W - 60, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.text("Description", 40, y + 16);
  doc.text("Method", W / 2, y + 16);
  doc.text("Amount", W - 40, y + 16, { align: "right" });
  
  y += 25;
  
  // Table Row
  doc.setTextColor(...textColor);
  doc.setFont("helvetica", "normal");
  
  doc.setDrawColor(226, 232, 240);
  doc.rect(30, y, W - 60, 35, 'D');
  
  const descText = data.payment.note ? `Tuition Fee - ${data.payment.note}` : `Tuition Fee (Sem ${data.semester})`;
  doc.text(doc.splitTextToSize(descText, (W / 2) - 50), 40, y + 16);
  doc.text(data.payment.method.toUpperCase(), W / 2, y + 16);
  doc.text(inr(data.payment.amount), W - 40, y + 16, { align: "right" });
  
  y += 35;

  // Total Box
  doc.setFillColor(...accentColor);
  doc.rect(30, y, W - 60, 35, 'F');
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("Total Received", W / 2, y + 22);
  doc.setFontSize(12);
  doc.text(inr(data.payment.amount), W - 40, y + 22, { align: "right" });

  // Signatures
  y += 80;
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.5);
  doc.line(W - 150, y, W - 30, y);
  
  y += 12;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...mutedColor);
  doc.text("Authorized Signatory", W - 90, y, { align: "center" });
  
  // Footer Notes
  y = H - 40;
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

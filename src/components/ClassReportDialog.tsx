import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Printer, Download, FileSpreadsheet, FileText, Loader2, Filter } from "lucide-react";
import { formatYear } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { toast } from "sonner";

interface ClassReportDialogProps {
  programs: any[];
  defaultProgramId?: string;
  defaultSemester?: string;
}

export function ClassReportDialog({
  programs,
  defaultProgramId = "all",
  defaultSemester = "all",
}: ClassReportDialogProps) {
  const [open, setOpen] = useState(false);
  const [programFilter, setProgramFilter] = useState<string>(defaultProgramId);
  const [semFilter, setSemFilter] = useState<string>(defaultSemester);
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [isExporting, setIsExporting] = useState(false);

  // Fetch ALL matching students for the report (without pagination)
  const { data: students = [], isLoading } = useQuery({
    queryKey: ["class-report-students", programFilter, semFilter, genderFilter, categoryFilter, open],
    queryFn: async () => {
      if (!open) return [];
      let query = supabase.from("students").select("*").order("roll_number", { ascending: true });

      if (programFilter !== "all") query = query.eq("program_id", programFilter);
      if (semFilter !== "all") query = query.eq("current_semester", Number(semFilter));
      if (genderFilter !== "all") query = query.eq("gender", genderFilter);
      if (categoryFilter !== "all") query = query.eq("category", categoryFilter);

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: open,
  });

  const selectedProgramObj = useMemo(() => {
    return programs.find((p) => p.id === programFilter);
  }, [programs, programFilter]);

  // Export to Excel (.xlsx)
  const handleExportExcel = () => {
    try {
      setIsExporting(true);
      const rows = students.map((s, idx) => {
        const prog = programs.find((p) => p.id === s.program_id);
        return {
          "S.No": idx + 1,
          "Admission No": s.admission_no || "—",
          "Roll No": s.roll_number || "—",
          "Student Name": s.name || "—",
          "Father's/Guardian Name": s.guardian || "—",
          "Gender": s.gender ? s.gender.toUpperCase() : "—",
          "Category": s.category || "—",
          "Program": prog?.name || "—",
          "Year/Semester": formatYear(s.current_semester),
          "Mobile No": s.phone || "—",
          "Email": s.email || "—",
          "Address": [s.address, s.city, s.state, s.pincode].filter(Boolean).join(", ") || "—",
        };
      });

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Auto-adjust column widths
      const colWidths = Object.keys(rows[0] || {}).map((key) => {
        let maxLen = key.length;
        rows.forEach((row: any) => {
          const val = String(row[key] || "");
          if (val.length > maxLen) maxLen = val.length;
        });
        return { wch: Math.min(Math.max(maxLen + 2, 10), 40) };
      });
      worksheet["!cols"] = colWidths;

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "General Report");

      const cleanProgName = selectedProgramObj?.name ? selectedProgramObj.name.replace(/[^a-zA-Z0-9]/g, "_") : "All_Programs";
      const cleanYear = semFilter !== "all" ? `Year_${semFilter}` : "All_Years";
      const fileName = `Student_Report_${cleanProgName}_${cleanYear}.xlsx`;

      XLSX.writeFile(workbook, fileName);
      toast.success("Excel report downloaded successfully!");
    } catch (err: any) {
      toast.error("Failed to export Excel: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Export to PDF (.pdf) using jsPDF
  const handleExportPDF = () => {
    try {
      setIsExporting(true);
      const doc = new jsPDF({
        orientation: "landscape",
        unit: "pt",
        format: "a4",
      });

      const pageW = doc.internal.pageSize.getWidth();
      const pageH = doc.internal.pageSize.getHeight();
      const margin = 30;

      // Header Banner
      doc.setFillColor(28, 43, 75); // Deep navy
      doc.rect(0, 0, pageW, 60, "F");

      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.text("IMPERIAL COLLEGE, HISAR", pageW / 2, 26, { align: "center" });

      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text("CLASS-WISE GENERAL STUDENT REPORT (OFFICIAL COLLEGE RECORD)", pageW / 2, 44, { align: "center" });

      // Metadata Bar
      let y = 80;
      doc.setTextColor(40, 40, 40);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);

      const progText = `Program: ${selectedProgramObj?.name || "All Programs"}`;
      const yearText = `Year/Class: ${semFilter !== "all" ? formatYear(Number(semFilter)) : "All Years"}`;
      const totalText = `Total Enrolled: ${students.length} Students`;
      const dateText = `Generated On: ${new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}`;

      doc.text(progText, margin, y);
      doc.text(yearText, margin + 220, y);
      doc.text(totalText, margin + 400, y);
      doc.text(dateText, pageW - margin, y, { align: "right" });

      y += 15;
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.line(margin, y, pageW - margin, y);

      y += 20;

      // Table Setup
      const headers = [
        "S.No",
        "Adm. No",
        "Roll No",
        "Student Name",
        "Father's Name",
        "Gen.",
        "Cat.",
        "Mobile No",
        "Address",
      ];
      const colWidths = [35, 75, 65, 130, 130, 45, 55, 80, pageW - margin * 2 - (35 + 75 + 65 + 130 + 130 + 45 + 55 + 80)];

      // Table Header Row
      doc.setFillColor(240, 243, 248);
      doc.rect(margin, y - 12, pageW - margin * 2, 22, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);

      let currentX = margin;
      headers.forEach((h, i) => {
        doc.text(h, currentX + 4, y);
        currentX += colWidths[i];
      });

      y += 12;
      doc.line(margin, y, pageW - margin, y);

      // Student Data Rows
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);

      students.forEach((s, idx) => {
        // Page break if near bottom
        if (y > pageH - 60) {
          doc.addPage();
          y = 40;

          // Header on new page
          doc.setFillColor(240, 243, 248);
          doc.rect(margin, y - 12, pageW - margin * 2, 22, "F");
          doc.setFont("helvetica", "bold");
          doc.setFontSize(9);
          doc.setTextColor(30, 41, 59);

          let cx = margin;
          headers.forEach((h, i) => {
            doc.text(h, cx + 4, y);
            cx += colWidths[i];
          });
          y += 12;
          doc.line(margin, y, pageW - margin, y);
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8.5);
        }

        y += 16;
        if (idx % 2 === 1) {
          doc.setFillColor(250, 250, 252);
          doc.rect(margin, y - 11, pageW - margin * 2, 16, "F");
        }

        doc.setTextColor(30, 40, 55);
        const rowData = [
          String(idx + 1),
          s.admission_no || "—",
          s.roll_number || "—",
          s.name || "—",
          s.guardian || "—",
          s.gender ? s.gender.substring(0, 1).toUpperCase() : "—",
          s.category || "—",
          s.phone || "—",
          [s.address, s.city].filter(Boolean).join(", ") || "—",
        ];

        let cx = margin;
        rowData.forEach((val, i) => {
          let textVal = val;
          const maxW = colWidths[i] - 8;
          if (doc.getTextWidth(textVal) > maxW) {
            while (textVal.length > 3 && doc.getTextWidth(textVal + "...") > maxW) {
              textVal = textVal.slice(0, -1);
            }
            textVal += "...";
          }
          doc.text(textVal, cx + 4, y);
          cx += colWidths[i];
        });

        doc.setDrawColor(230, 230, 235);
        doc.line(margin, y + 4, pageW - margin, y + 4);
      });

      // Signature Block at the end
      if (y + 60 > pageH - 40) {
        doc.addPage();
        y = 40;
      } else {
        y += 40;
      }

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(50, 50, 50);
      doc.text("Prepared By: ____________________", margin, y);
      doc.text("Verified By: ____________________", pageW / 2 - 80, y);
      doc.text("Principal / Director Stamp & Sign", pageW - margin - 150, y);

      const cleanProgName = selectedProgramObj?.name ? selectedProgramObj.name.replace(/[^a-zA-Z0-9]/g, "_") : "All_Programs";
      const cleanYear = semFilter !== "all" ? `Year_${semFilter}` : "All_Years";
      const fileName = `Student_General_Report_${cleanProgName}_${cleanYear}.pdf`;

      doc.save(fileName);
      toast.success("PDF report downloaded successfully!");
    } catch (err: any) {
      toast.error("Failed to export PDF: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  // Print Trigger
  const handlePrint = () => {
    window.print();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2 shadow-sm">
          <FileText className="h-4 w-4" />
          General Report & Export
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 print:max-w-none print:m-0 print:p-0 print:overflow-visible">
        {/* Printable Wrapper Container */}
        <div id="printable-general-report" className="p-6 space-y-6">
          
          {/* Top Bar / Dialog Header (Hidden on Print) */}
          <div className="print:hidden border-b pb-4 space-y-3">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-primary" />
                Class-Wise General Student Report
              </DialogTitle>
              <DialogDescription>
                Prepare, print, and export official general reports of students grouped by class/program and year.
              </DialogDescription>
            </DialogHeader>

            {/* Filter Bar */}
            <div className="bg-muted/50 p-3 rounded-lg flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                <Filter className="h-3.5 w-3.5" /> Filters:
              </div>

              <div className="w-44">
                <Select value={programFilter} onValueChange={setProgramFilter}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Program" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Programs</SelectItem>
                    {programs.map((p) => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-36">
                <Select value={semFilter} onValueChange={setSemFilter}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Year" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {[1, 2, 3].map((n) => (
                      <SelectItem key={n} value={String(n)}>{formatYear(n)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="w-32">
                <Select value={genderFilter} onValueChange={setGenderFilter}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Gender" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Genders</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="w-32">
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Category" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    <SelectItem value="General">General</SelectItem>
                    <SelectItem value="OBC">OBC</SelectItem>
                    <SelectItem value="SC">SC</SelectItem>
                    <SelectItem value="ST">ST</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Action Buttons */}
              <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={handleExportExcel} disabled={isLoading || isExporting || students.length === 0} className="gap-1.5 text-xs">
                  <FileSpreadsheet className="h-3.5 w-3.5 text-emerald-600" />
                  Export Excel
                </Button>
                <Button size="sm" variant="outline" onClick={handleExportPDF} disabled={isLoading || isExporting || students.length === 0} className="gap-1.5 text-xs">
                  <Download className="h-3.5 w-3.5 text-rose-600" />
                  Download PDF
                </Button>
                <Button size="sm" variant="default" onClick={handlePrint} disabled={isLoading || students.length === 0} className="gap-1.5 text-xs">
                  <Printer className="h-3.5 w-3.5" />
                  Print Report
                </Button>
              </div>
            </div>
          </div>

          {/* Official Printable College Letterhead Document */}
          <div className="bg-card text-card-foreground border rounded-xl p-6 shadow-sm print:border-none print:shadow-none print:p-0 space-y-6">
            
            {/* Header */}
            <div className="text-center border-b pb-4 space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-primary uppercase print:text-xl">
                Imperial College, Hisar
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Class-Wise General Student Report — College Record
              </p>
              <div className="flex flex-wrap justify-between items-center text-xs text-muted-foreground pt-3 px-2 font-medium">
                <div><span className="font-semibold text-foreground">Program / Course:</span> {selectedProgramObj?.name || "All Programs"}</div>
                <div><span className="font-semibold text-foreground">Year / Semester:</span> {semFilter !== "all" ? formatYear(Number(semFilter)) : "All Years"}</div>
                <div><span className="font-semibold text-foreground">Total Students:</span> {students.length}</div>
                <div><span className="font-semibold text-foreground">Date:</span> {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</div>
              </div>
            </div>

            {/* Content Table */}
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : students.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                No student records found matching the selected class filters.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-y border-border bg-muted/60 text-muted-foreground uppercase font-semibold tracking-wider">
                      <th className="px-3 py-2 text-center w-10">S.No</th>
                      <th className="px-3 py-2">Admission No</th>
                      <th className="px-3 py-2">Roll No</th>
                      <th className="px-3 py-2">Student Name</th>
                      <th className="px-3 py-2">Father's Name</th>
                      <th className="px-3 py-2 text-center">Gender</th>
                      <th className="px-3 py-2 text-center">Category</th>
                      <th className="px-3 py-2">Mobile No</th>
                      <th className="px-3 py-2">Address</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {students.map((s, idx) => (
                      <tr key={s.id} className="hover:bg-accent/30 transition-colors">
                        <td className="px-3 py-2.5 text-center font-mono text-muted-foreground">{idx + 1}</td>
                        <td className="px-3 py-2.5 font-mono font-medium text-foreground">{s.admission_no}</td>
                        <td className="px-3 py-2.5 font-mono">{s.roll_number || "—"}</td>
                        <td className="px-3 py-2.5 font-medium text-foreground">{s.name}</td>
                        <td className="px-3 py-2.5">{s.guardian || "—"}</td>
                        <td className="px-3 py-2.5 text-center capitalize">{s.gender || "—"}</td>
                        <td className="px-3 py-2.5 text-center">{s.category || "—"}</td>
                        <td className="px-3 py-2.5 font-mono">{s.phone || "—"}</td>
                        <td className="px-3 py-2.5 max-w-xs truncate" title={[s.address, s.city, s.state, s.pincode].filter(Boolean).join(", ")}>
                          {[s.address, s.city].filter(Boolean).join(", ") || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Official Signature Footer for College Record */}
            <div className="pt-12 pb-4 hidden print:flex justify-between items-end text-xs font-semibold text-muted-foreground">
              <div>
                <p>___________________________</p>
                <p className="mt-1">Prepared By (Registry)</p>
              </div>
              <div>
                <p>___________________________</p>
                <p className="mt-1">Verified By (Coordinator)</p>
              </div>
              <div>
                <p>___________________________</p>
                <p className="mt-1">Principal / Director Stamp & Sign</p>
              </div>
            </div>

          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

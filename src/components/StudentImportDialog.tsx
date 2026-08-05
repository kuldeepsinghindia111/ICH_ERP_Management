import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Download, Upload, FileSpreadsheet, Loader2 } from "lucide-react";
import * as XLSX from "xlsx";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

interface StudentImportDialogProps {
  programs: any[];
}

export function StudentImportDialog({ programs }: StudentImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleDownloadTemplate = () => {
    // Generate a sample template
    const templateData = [
      {
        name: "John Doe",
        roll_number: "CS101",
        admission_no: "ADM2023001",
        email: "john@example.com",
        phone: "1234567890",
        gender: "male",
        category: "General",
        current_semester: 1,
        program_id: programs.length > 0 ? programs[0].id : "INSERT_PROGRAM_ID_HERE",
        guardian: "Jane Doe",
        address: "123 Main St",
        status: "active"
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students Template");
    XLSX.writeFile(wb, "Student_Import_Template.xlsx");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    setFile(selectedFile);
    setIsParsing(true);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: "binary" });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        setPreviewData(data);
      } catch (error) {
        toast.error("Failed to parse the file. Please ensure it is a valid Excel or CSV file.");
        setFile(null);
      } finally {
        setIsParsing(false);
      }
    };
    reader.readAsBinaryString(selectedFile);
  };

  const importMutation = useMutation({
    mutationFn: async () => {
      if (previewData.length === 0) throw new Error("No data found in file.");
      
      // Clean and format data before inserting
      const formattedData = previewData.map(row => ({
        name: row.name || "Unknown",
        roll_number: row.roll_number?.toString() || null,
        admission_no: row.admission_no?.toString() || null,
        email: row.email || null,
        phone: row.phone?.toString() || null,
        gender: row.gender?.toLowerCase() || null,
        category: row.category || null,
        current_semester: parseInt(row.current_semester) || 1,
        guardian: row.guardian || null,
        address: row.address || null,
        status: row.status?.toLowerCase() || "active",
        aadhar_no: row.aadhar_no?.toString() || row["Aadhar No"]?.toString() || null,
        abc_id: row.abc_id?.toString() || row["ABC ID"]?.toString() || null,
        family_id: row.family_id?.toString() || row["Family ID"]?.toString() || null,
        university_reg_no: row.university_reg_no?.toString() || row["University Reg. No"]?.toString() || null,
        university_roll_no: row.university_roll_no?.toString() || row["University Roll No"]?.toString() || null,
      }));

      let { error } = await supabase.from('students').insert(formattedData);
      
      if (error && error.message && (error.message.includes('schema cache') || error.message.includes('column'))) {
        const fallbackData = formattedData.map(row => {
          const r = { ...row };
          delete r.aadhar_no;
          delete r.abc_id;
          delete r.family_id;
          delete r.university_reg_no;
          delete r.university_roll_no;
          return r;
        });
        const retryRes = await supabase.from('students').insert(fallbackData);
        if (retryRes.error) throw retryRes.error;
        toast.warning("Students imported! Note: Database missing Aadhar/ABC ID columns. Please run SQL migration in Supabase.");
        return;
      }

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success(`Successfully imported ${previewData.length} students!`);
      resetState();
    },
    onError: (err: any) => {
      toast.error(`Import failed: ${err.message}`);
    }
  });

  const resetState = () => {
    setOpen(false);
    setFile(null);
    setPreviewData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => {
      if(!val) resetState();
      setOpen(val);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" /> Import Data
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Import Students</DialogTitle>
          <DialogDescription>
            Upload an Excel (.xlsx) or CSV file to bulk import students.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="flex items-center justify-between p-4 border rounded-lg bg-muted/50">
            <div>
              <h4 className="font-medium text-sm">Need a template?</h4>
              <p className="text-sm text-muted-foreground">Download the sample Excel file to see the required formatting.</p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleDownloadTemplate} className="gap-2">
              <Download className="h-4 w-4" /> Download Template
            </Button>
          </div>

          <div className="grid gap-2">
            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button 
              variant="outline" 
              className="w-full h-32 border-dashed gap-2 flex-col"
              onClick={() => fileInputRef.current?.click()}
            >
              <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              {file ? file.name : "Click to select Excel or CSV file"}
            </Button>
          </div>

          {isParsing && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {previewData.length > 0 && !isParsing && (
            <div className="space-y-2">
              <p className="text-sm font-medium">Preview (First 3 rows of {previewData.length} total)</p>
              <div className="border rounded-md overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted">
                    <tr>
                      <th className="p-2 font-medium">Name</th>
                      <th className="p-2 font-medium">Roll No</th>
                      <th className="p-2 font-medium">Admission No</th>
                      <th className="p-2 font-medium">Program ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {previewData.slice(0, 3).map((row, idx) => (
                      <tr key={idx}>
                        <td className="p-2">{row.name || "—"}</td>
                        <td className="p-2">{row.roll_number || "—"}</td>
                        <td className="p-2">{row.admission_no || "—"}</td>
                        <td className="p-2">{row.program_id || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={resetState}>Cancel</Button>
          <Button 
            onClick={() => importMutation.mutate()} 
            disabled={previewData.length === 0 || importMutation.isPending}
            className="gap-2"
          >
            {importMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Confirm Import
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

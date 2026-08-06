import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, FileSpreadsheet, Lock, Plus, Printer, RotateCcw, Trash2, Undo2, Loader2, Download, Camera, FileText, Eye, Upload, Share2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";
import { useStore, formatYear, semesterSummary, studentTotals, inr, FEE_HEADS, nextReceiptNo, type FeeHead, type FeePayment } from "@/lib/store";
import jsPDF from "jspdf";
import { downloadReceiptPdf, printReceiptPdf, shareReceiptPdf } from "@/lib/receipt";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { StudentFormDialog } from "@/components/StudentFormDialog";
import { Switch } from "@/components/ui/switch";


export const Route = createFileRoute("/students/$studentId")({
  head: () => ({
    meta: [{ title: "Student Portal — Imperial CMS" }],
  }),
  component: StudentDetail,
  notFoundComponent: () => (
    <div className="p-8 text-sm text-muted-foreground">Student not found.</div>
  ),
});

function usePhotoUpload(student: any, canEdit: boolean) {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !canEdit) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file");
      return;
    }

    try {
      setIsUploading(true);
      const fileExt = file.name.split('.').pop();
      const fileName = `${student.id}-${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('student_photos')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('student_photos')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('students')
        .update({ photo_url: publicUrl })
        .eq('id', student.id);

      if (updateError) throw updateError;

      toast.success("Photo updated successfully");
      queryClient.invalidateQueries({ queryKey: ['student', student.id] });
    } catch (error: any) {
      toast.error("Error uploading photo: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  return { handleFileChange, isUploading };
}

function StudentAvatar({ student, canEdit }: { student: any, canEdit: boolean }) {
  const { handleFileChange, isUploading } = usePhotoUpload(student, canEdit);

  return (
    <div className="relative group h-16 w-16 shrink-0">
      {student.photo_url ? (
        <img 
          src={student.photo_url} 
          alt={student.name} 
          className="h-16 w-16 rounded-full object-cover border border-primary/20 shadow-sm"
        />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 font-display text-xl font-semibold text-primary border border-primary/20 shadow-sm">
          {student.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("")}
        </div>
      )}

      {canEdit && (
        <label className="absolute inset-0 flex items-center justify-center rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
          {isUploading ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <Camera className="h-5 w-5 text-white" />
          )}
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileChange} 
            disabled={isUploading}
          />
        </label>
      )}
    </div>
  );
}

function PhotoUploadButton({ student, canEdit }: { student: any, canEdit: boolean }) {
  const { handleFileChange, isUploading } = usePhotoUpload(student, canEdit);

  if (!canEdit) return null;

  return (
    <div className="relative">
      <Button variant="outline" size="sm" disabled={isUploading}>
        {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Camera className="mr-2 h-4 w-4" />}
        {isUploading ? "Uploading..." : "Upload Photo"}
      </Button>
      <input 
        type="file" 
        accept="image/*" 
        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
        onChange={handleFileChange} 
        disabled={isUploading}
      />
    </div>
  );
}

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
      if (!studentId) return null;
      // 1. Try finding by ID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(studentId);
      if (isUuid) {
        const { data } = await supabase.from('students').select('*').eq('id', studentId).maybeSingle();
        if (data) return data;
      }
      // 2. Try finding by admission_no
      const admRes = await supabase.from('students').select('*').eq('admission_no', studentId).maybeSingle();
      if (admRes.data) return admRes.data;

      // 3. Try finding by roll_number
      const rollRes = await supabase.from('students').select('*').eq('roll_number', studentId).maybeSingle();
      if (rollRes.data) return rollRes.data;

      return null;
    },
    enabled: !!studentId,
  });

  const targetStudentId = student?.id || studentId;

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('programs').select('*');
      if (error) throw error;
      return data || [];
    }
  });

  const { data: charges = [] } = useQuery({
    queryKey: ['fee_charges', targetStudentId],
    queryFn: async () => {
      if (!targetStudentId) return [];
      const { data, error } = await supabase.from('fee_charges').select('*').eq('student_id', targetStudentId);
      if (error) return [];
      return (data || []).map((d: any) => ({
        ...d,
        id: d.id,
        studentId: d.student_id,
        student_id: d.student_id,
        semester: d.semester,
        head: d.head || d.fee_head,
        fee_head: d.fee_head || d.head,
        amount: d.amount,
        createdAt: d.created_at,
        created_at: d.created_at,
      }));
    },
    enabled: !!targetStudentId,
  });
  
  const { data: adjustments = [] } = useQuery({
    queryKey: ['fee_adjustments', targetStudentId],
    queryFn: async () => {
      if (!targetStudentId) return [];
      const { data, error } = await supabase.from('fee_adjustments').select('*').eq('student_id', targetStudentId);
      if (error) return [];
      return (data || []).map((d: any) => ({
        ...d,
        id: d.id,
        studentId: d.student_id,
        student_id: d.student_id,
        semester: d.semester,
        type: d.type,
        label: d.label,
        amount: d.amount,
        createdAt: d.created_at,
        created_at: d.created_at,
      }));
    },
    enabled: !!targetStudentId,
  });
  
  const { data: payments = [] } = useQuery({
    queryKey: ['fee_payments', targetStudentId],
    queryFn: async () => {
      if (!targetStudentId) return [];
      const { data, error } = await supabase.from('fee_payments').select('*').eq('student_id', targetStudentId);
      if (error) return [];
      return (data || []).map((d: any) => ({
        ...d,
        id: d.id,
        studentId: d.student_id,
        student_id: d.student_id,
        semester: d.semester,
        amount: d.amount,
        method: d.method,
        reference: d.reference,
        note: d.note,
        paidAt: d.paid_at,
        paid_at: d.paid_at,
        voided: d.voided,
        voidedAt: d.voided_at,
        voidReason: d.void_reason,
      }));
    },
    enabled: !!targetStudentId,
  });

  const { data: feeStructures = [] } = useQuery({
    queryKey: ['fee_structures'],
    queryFn: async () => {
      const { data, error } = await supabase.from('fee_structures').select('*');
      if (error) return [];
      return data || [];
    }
  });

  const updateStudentMutation = useMutation({
    mutationFn: async (updates: any) => {
      if (!targetStudentId) return;
      const { error } = await supabase.from('students').update(updates).eq('id', targetStudentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student', studentId] });
      toast.success("Student updated");
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const [activeSem, setActiveSem] = useState<string | null>(null);
  const [showMasterFeesSummary, setShowMasterFeesSummary] = useState(false);
  const [activeSummaryYears, setActiveSummaryYears] = useState<Record<number, boolean>>({});

  if (loadingStudent) {
    return <div className="flex h-[50vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }
  
  if (!student) {
    return (
      <div className="mx-auto max-w-xl py-16 text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Student Record Not Found</h2>
        <p className="text-sm text-muted-foreground">No student profile matches requested identifier ({studentId}).</p>
        <Button asChild variant="outline" size="sm">
          <Link to="/students"><ArrowLeft className="mr-2 h-4 w-4" /> Return to Student Directory</Link>
        </Button>
      </div>
    );
  }

  const program = programs.find((p: any) => p.id === student.program_id);
  const currentSemester = Number(student?.current_semester) || 1;
  const totals = studentTotals(student.id, currentSemester, { charges, adjustments, payments, structures: feeStructures, student });
  const activeSemValue = activeSem ?? String(currentSemester);

  const semesters = Array.from({ length: Math.ceil((program?.total_semesters ?? 6) / 2) }, (_, i) => i + 1);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2">
          <Link to="/students"><ArrowLeft className="mr-1 h-4 w-4" /> Back to students</Link>
        </Button>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-start justify-between gap-6 p-6">
          <div className="flex items-start gap-4">
            <StudentAvatar student={student} canEdit={canEditStudents ?? false} />
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                {program?.name} · Joined {student.joined_year}
              </p>
              <h1 className="font-display text-2xl font-semibold text-blue-600 dark:text-blue-400">{student.name}</h1>
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
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                {student.university_reg_no && <span>🆔 Univ Reg: {student.university_reg_no}</span>}
                {student.university_roll_no && <span>· Univ Roll: {student.university_roll_no}</span>}
                {student.aadhar_no && <span>· Aadhar: {student.aadhar_no}</span>}
                {student.abc_id && <span>· ABC ID: {student.abc_id}</span>}
                {student.family_id && <span>· Family ID: {student.family_id}</span>}
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
                <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {semesters.map((n) => (
                    <SelectItem key={n} value={String(n)}>Current: {formatYear(n)}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="text-sm font-medium">Current: {formatYear(currentSemester)}</div>
            )}
              <div className="flex flex-wrap gap-2 justify-end">
                <StudentReportDialog
                  student={student}
                  program={program}
                  semesters={semesters}
                  charges={charges}
                  adjustments={adjustments}
                  payments={payments}
                  feeStructures={feeStructures}
                  showMasterFeesSummary={showMasterFeesSummary}
                  activeSummaryYears={activeSummaryYears}
                />
                {canEditStudents && (
                  <>
                    <PhotoUploadButton student={student} canEdit={canEditStudents ?? false} />
                    <StudentFormDialog programs={programs} student={student} buttonVariant="outline" />
                  </>
                )}
              </div>
          </div>
        </CardContent>
      </Card>

      <FeesSummaryMasterSection
        student={student}
        currentSemester={currentSemester}
        semesters={semesters}
        charges={charges}
        adjustments={adjustments}
        payments={payments}
        feeStructures={feeStructures}
        showMaster={showMasterFeesSummary}
        setShowMaster={setShowMasterFeesSummary}
        activeYears={activeSummaryYears}
        setActiveYears={setActiveSummaryYears}
      />

      <Tabs defaultValue="overview" className="mt-6">
        <TabsList className="bg-background border">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="id-card">ID Card Preview</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6 mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="font-display text-lg">Identity &amp; Academic Registration</CardTitle>
                <p className="text-xs text-muted-foreground">
                  Official university registration numbers, roll numbers, and government IDs.
                </p>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">College Roll No.</p>
                  <div className="font-mono text-base font-medium text-foreground">{student.roll_number || "—"}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Univ. Reg. No.</p>
                  <div className="font-mono text-base font-medium text-foreground">{student.university_reg_no || "—"}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Univ. Roll No.</p>
                  <div className="font-mono text-base font-medium text-foreground">{student.university_roll_no || "—"}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Aadhar Card No.</p>
                  <div className="font-mono text-base font-medium text-foreground">{student.aadhar_no || "—"}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">ABC ID</p>
                  <div className="font-mono text-base font-medium text-foreground">{student.abc_id || "—"}</div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Family ID (PPP)</p>
                  <div className="font-mono text-base font-medium text-foreground">{student.family_id || "—"}</div>
                </div>
              </div>

              {student.past_roll_numbers && student.past_roll_numbers.length > 0 && (
                <div className="mt-6 border-t pt-4">
                  <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">Past College Roll Numbers</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {student.past_roll_numbers.map((r: string, i: number) => (
                      <Badge key={i} variant="secondary" className="font-mono text-xs">{r}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Fee Ledger</CardTitle>
          <p className="text-xs text-muted-foreground">
            Charges, concessions / scholarships and payments per semester.
          </p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeSemValue} onValueChange={setActiveSem}>
            <TabsList className="flex flex-wrap">
              {semesters.map((n) => (
                <TabsTrigger key={n} value={String(n)}>{formatYear(n)}</TabsTrigger>
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
                  feeStructures={feeStructures}
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
        </TabsContent>

        <TabsContent value="attendance" className="mt-6">
          <StudentAttendance studentId={student.id} />
        </TabsContent>

        <TabsContent value="id-card" className="mt-6">
          <IDCardPreview student={student} program={program} />
        </TabsContent>

        <TabsContent value="documents" className="mt-6">
          <StudentDocuments studentId={student.id} canEdit={canEditStudents ?? false} user={user} />
        </TabsContent>
      </Tabs>
    </div>

  );
}

function IDCardPreview({ student, program }: { student: any, program: any }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle className="font-display text-lg">ID Card Preview</CardTitle>
          <p className="text-xs text-muted-foreground">Preview and print student identity card.</p>
        </div>
        <Button onClick={() => window.print()} variant="secondary" size="sm">
          <Printer className="mr-2 h-4 w-4" /> Print ID Card
        </Button>
      </CardHeader>
      <CardContent className="flex justify-center py-10 bg-slate-50 rounded-b-lg border-t">
        {/* The ID Card Visual Wrapper */}
        <div className="w-75 min-h-117.5 bg-white rounded-xl shadow-xl border overflow-hidden flex flex-col relative print:shadow-none print:border-black">
          
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 text-center">
            <h2 className="font-display font-bold text-lg tracking-tight leading-tight">IMPERIAL COLLEGE, HISAR</h2>
            <p className="text-[10px] opacity-90 font-medium tracking-widest mt-1 uppercase">Student Identity Card</p>
          </div>

          {/* Photo */}
          <div className="flex justify-center mt-6">
            <div className="h-28 w-28 rounded-xl overflow-hidden border-4 border-white shadow-md bg-slate-100 flex items-center justify-center relative">
              {student.photo_url ? (
                <img src={student.photo_url} className="w-full h-full object-cover" alt="Student" />
              ) : (
                <span className="text-xs text-muted-foreground">No Photo</span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex-1 px-6 pt-4 pb-6 flex flex-col items-center text-center">
            <h3 className="font-bold text-lg leading-tight uppercase">{student.name}</h3>
            <p className="text-sm font-semibold text-primary mt-1">{program?.name || "Program"}</p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5">Admission No: {student.admission_no}</p>
            
            <div className="w-full h-px bg-slate-100 my-3"></div>

            <div className="w-full text-left space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Roll No.</span>
                <span className="font-bold font-mono">{student.roll_number || "N/A"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">DOB</span>
                <span className="font-bold">{student.dob ? new Date(student.dob).toLocaleDateString() : "N/A"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Blood Group</span>
                <span className="font-bold">{student.blood_group || "N/A"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Father's Name</span>
                <span className="font-bold truncate max-w-32">{student.guardian || "N/A"}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">Father's/Guardian Contact</span>
                <span className="font-bold font-mono">{student.guardian_phone || student.phone || "N/A"}</span>
              </div>
            </div>
          </div>


          {/* Footer */}
          <div className="bg-slate-900 text-white p-2 text-center">
            <p className="text-[9px]">IF FOUND, RETURN TO IMPERIAL COLLEGE, Dabra Road, Contact No. 90504-28858</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StudentReportDialog({
  student,
  program,
  semesters,
  charges,
  adjustments,
  payments,
  feeStructures,
  showMasterFeesSummary,
  activeSummaryYears,
}: {
  student: any;
  program: any;
  semesters: number[];
  charges: any[];
  adjustments: any[];
  payments: any[];
  feeStructures: any[];
  showMasterFeesSummary: boolean;
  activeSummaryYears: Record<number, boolean>;
}) {
  const [open, setOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const activeYearsForReport = showMasterFeesSummary
    ? semesters.filter((y) => y >= student.current_semester && activeSummaryYears[y])
    : [];

  const studentCharges = charges.filter((c: any) => (c.student_id || c.studentId) === student.id || !c.studentId);
  const activePayments = payments.filter((p: any) => ((p.student_id || p.studentId) === student.id || !p.studentId) && !p.voided);

  const generatePDFDoc = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 35;
    let y = 40;

    // Header Banner
    doc.setFillColor(28, 43, 75);
    doc.rect(0, 0, pageW, 55, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("IMPERIAL COLLEGE, HISAR", pageW / 2, 26, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("OFFICIAL STUDENT PROFILE & FEE LEDGER REPORT", pageW / 2, 42, { align: "center" });

    y = 75;
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Student: ${student.name}`, margin, y);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Adm No: ${student.admission_no}`, pageW - margin, y, { align: "right" });

    y += 16;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y);

    // 1. Personal & Academic Registration Details
    y += 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("1. PERSONAL & REGISTRATION DETAILS", margin, y);

    y += 14;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);

    const details = [
      [`Program: ${program?.name || "—"}`, `Joined Year: ${student.joined_year}`, `Current Year: ${formatYear(student.current_semester)}`],
      [`College Roll No: ${student.roll_number || "—"}`, `Univ Reg No: ${student.university_reg_no || "—"}`, `Univ Roll No: ${student.university_roll_no || "—"}`],
      [`Aadhar No: ${student.aadhar_no || "—"}`, `ABC ID: ${student.abc_id || "—"}`, `Family ID: ${student.family_id || "—"}`],
      [`Father's Name: ${student.guardian || "—"}`, `Father's Contact: ${student.guardian_phone || "—"}`, `Student Mobile: ${student.phone || "—"}`],
      [`Address: ${[student.address, student.city, student.state, student.pincode].filter(Boolean).join(", ") || "—"}`, "", ""],
    ];

    details.forEach((row) => {
      if (row[0]) doc.text(row[0], margin, y);
      if (row[1]) doc.text(row[1], margin + 185, y);
      if (row[2]) doc.text(row[2], margin + 350, y);
      y += 13;
    });

    let secIdx = 2;

    // 2. Year-Wise Fee Ledgers & Summaries (for active toggled-ON years)
    if (activeYearsForReport.length > 0) {
      activeYearsForReport.forEach((yNum) => {
        if (y > 660) {
          doc.addPage();
          y = 40;
        }

        const sum = semesterSummary(student.id, yNum, { charges, adjustments, payments, structures: feeStructures, student });
        const yCharges = studentCharges.filter((c: any) => (c.semester || 1) === yNum);
        const yAdjustments = adjustments.filter((a: any) => (a.semester || 1) === yNum);
        const yPayments = activePayments.filter((p: any) => (p.semester || 1) === yNum);

        y += 6;
        doc.setDrawColor(220, 220, 220);
        doc.line(margin, y, pageW - margin, y);

        y += 16;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(10);
        doc.text(`${secIdx}. ${formatYear(yNum).toUpperCase()} FEES SUMMARY & LEDGER`, margin, y);
        secIdx++;

        y += 12;
        // 9 Pills Summary Box Banner
        doc.setFillColor(248, 250, 252);
        doc.setDrawColor(226, 232, 240);
        doc.rect(margin, y, pageW - margin * 2, 28, "FD");

        doc.setFontSize(6.5);
        doc.setFont("helvetica", "bold");
        const colW = (pageW - margin * 2) / 9;
        const pills = [
          ["TOTAL PAYABLE", inr(sum.totalCharged)],
          ["LATE FEES", sum.totalLate > 0 ? inr(sum.totalLate) : "—"],
          ["FINE", sum.totalFine > 0 ? inr(sum.totalFine) : "—"],
          ["OTHER", sum.totalOther > 0 ? inr(sum.totalOther) : "—"],
          ["CONCESSION", sum.totalConcession ? `− ${inr(sum.totalConcession)}` : "—"],
          ["SCHOLARSHIP", sum.totalScholarship ? `− ${inr(sum.totalScholarship)}` : "—"],
          ["NET PAYABLE", inr(sum.netPayable)],
          ["PAID", inr(sum.totalPaid)],
          ["BALANCE", inr(sum.balance)],
        ];

        pills.forEach(([hdr, val], i) => {
          const px = margin + i * colW + colW / 2;
          doc.setFont("helvetica", "bold");
          doc.setTextColor(100, 116, 139);
          doc.text(hdr, px, y + 10, { align: "center" });
          doc.setTextColor(i === 7 ? 22 : i === 8 ? (sum.balance > 0 ? 220 : 15) : 30, i === 7 ? 101 : i === 8 ? (sum.balance > 0 ? 38 : 118) : 41, i === 7 ? 52 : i === 8 ? (sum.balance > 0 ? 38 : 52) : 59);
          doc.text(val, px, y + 21, { align: "center" });
        });
        doc.setTextColor(30, 41, 59);
        y += 36;

        // Summary Block Box (Left Side)
        doc.setDrawColor(203, 213, 225);
        doc.setFillColor(255, 255, 255);
        const boxStartY = y;
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        const leftRows: [string, string, boolean?][] = [
          ["Class Year", formatYear(yNum), true],
          ["Total charged", inr(sum.totalCharged)],
          ["Late fees", sum.totalLate > 0 ? inr(sum.totalLate) : "—"],
          ["Fine", sum.totalFine > 0 ? inr(sum.totalFine) : "—"],
          ["Other charges", sum.totalOther > 0 ? inr(sum.totalOther) : "—"],
          ["Concessions", sum.totalConcession ? `− ${inr(sum.totalConcession)}` : "—"],
          ["Scholarships", sum.totalScholarship ? `− ${inr(sum.totalScholarship)}` : "—"],
          ["Net payable", inr(sum.netPayable), true],
          ["Paid", inr(sum.totalPaid), true],
        ];

        let sumY = boxStartY + 10;
        leftRows.forEach(([lbl, val, isBold]) => {
          doc.setFont("helvetica", isBold ? "bold" : "normal");
          doc.text(lbl, margin + 8, sumY);
          doc.text(val, margin + 175, sumY, { align: "right" });
          sumY += 10;
        });

        doc.line(margin + 8, sumY - 4, margin + 175, sumY - 4);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.text("BALANCE", margin + 8, sumY + 6);
        doc.setTextColor(sum.balance > 0 ? 220 : 15, sum.balance > 0 ? 38 : 118, sum.balance > 0 ? 38 : 52);
        doc.text(inr(sum.balance), margin + 175, sumY + 6, { align: "right" });
        doc.setTextColor(30, 41, 59);

        const boxH = sumY + 12 - boxStartY;
        doc.rect(margin, boxStartY, 185, boxH);

        // Right Side: Ledger Blocks (Charges, Adjustments, Payments)
        let rightY = boxStartY;
        const rightMargin = margin + 195;
        const rightW = pageW - margin - rightMargin;

        // Charges Block
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("Charges", rightMargin, rightY + 8);
        rightY += 14;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        if (yCharges.length === 0) {
          doc.setFont("helvetica", "italic");
          doc.text("No charges added for this semester yet.", rightMargin, rightY);
          rightY += 12;
        } else {
          yCharges.forEach((c: any) => {
            doc.text(`• ${c.fee_head || c.description || 'Charge'}`, rightMargin, rightY);
            doc.setFont("helvetica", "bold");
            doc.text(inr(c.amount), pageW - margin, rightY, { align: "right" });
            doc.setFont("helvetica", "normal");
            rightY += 10;
          });
        }

        // Concessions & Scholarships Block
        rightY += 6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("Concessions & scholarships", rightMargin, rightY);
        rightY += 14;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        if (yAdjustments.length === 0) {
          doc.setFont("helvetica", "italic");
          doc.text("No concessions or scholarships added yet.", rightMargin, rightY);
          rightY += 12;
        } else {
          yAdjustments.forEach((a: any) => {
            doc.text(`• [${a.type}] ${a.label || 'Adjustment'}`, rightMargin, rightY);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(217, 119, 6);
            doc.text(`− ${inr(a.amount)}`, pageW - margin, rightY, { align: "right" });
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "normal");
            rightY += 10;
          });
        }

        // Payments Block
        rightY += 6;
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.text("Payments", rightMargin, rightY);
        rightY += 14;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        if (yPayments.length === 0) {
          doc.setFont("helvetica", "italic");
          doc.text("No payments recorded yet.", rightMargin, rightY);
          rightY += 12;
        } else {
          yPayments.forEach((p: any) => {
            doc.text(`• ${p.method.toUpperCase()} (${new Date(p.paidAt || p.paid_at).toLocaleDateString('en-IN')} · ${p.reference || 'RCPT-'+p.id.slice(0,6)})`, rightMargin, rightY);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(22, 101, 52);
            doc.text(inr(p.amount), pageW - margin, rightY, { align: "right" });
            doc.setTextColor(30, 41, 59);
            doc.setFont("helvetica", "normal");
            rightY += 10;
          });
        }

        y = Math.max(boxStartY + boxH, rightY) + 10;
      });
    } else {
      // General Overall Ledger when no specific year is toggled ON
      y += 6;
      doc.setDrawColor(220, 220, 220);
      doc.line(margin, y, pageW - margin, y);

      y += 16;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text("2. OVERALL PAYMENT RECEIPTS HISTORY", margin, y);

      y += 14;
      if (activePayments.length === 0) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.text("No payment receipt records found.", margin, y);
        y += 14;
      } else {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setFillColor(241, 245, 249);
        doc.rect(margin, y - 8, pageW - margin * 2, 14, "F");
        doc.text("#", margin + 4, y);
        doc.text("Receipt Ref", margin + 20, y);
        doc.text("Date", margin + 120, y);
        doc.text("Mode", margin + 210, y);
        doc.text("Academic Year", margin + 280, y);
        doc.text("Paid Amount (Rs.)", pageW - margin - 5, y, { align: "right" });

        y += 14;
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);

        activePayments.forEach((p: any, idx: number) => {
          doc.text(String(idx + 1), margin + 4, y);
          doc.text(p.reference || `REC-${p.id.slice(0, 6)}`, margin + 20, y);
          doc.text(new Date(p.paidAt).toLocaleDateString("en-IN"), margin + 120, y);
          doc.text((p.method || "Cash").toUpperCase(), margin + 210, y);
          doc.text(formatYear(p.semester || 1), margin + 280, y);
          doc.setFont("helvetica", "bold");
          doc.text(inr(p.amount || 0), pageW - margin - 5, y, { align: "right" });
          doc.setFont("helvetica", "normal");
          y += 12;
        });
      }
    }

    // Signatures Footer
    y += 40;
    if (y > 740) {
      doc.addPage();
      y = 60;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.line(margin, y, margin + 140, y);
    doc.line(pageW / 2 - 70, y, pageW / 2 + 70, y);
    doc.line(pageW - margin - 140, y, pageW - margin, y);

    y += 12;
    doc.text("Prepared By (Registry)", margin + 20, y);
    doc.text("Verified By (Accounts)", pageW / 2 - 50, y);
    doc.text("Principal / Director Stamp & Sign", pageW - margin - 135, y);

    return doc;
  };

  const handleSharePDF = async () => {
    try {
      setIsExporting(true);
      const doc = generatePDFDoc();
      const pdfBlob = doc.output("blob");
      const fileName = `Student_Report_${student.name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Student Report - ${student.name}`,
          text: `Official Student Profile & Fee Ledger Report for ${student.name}`,
        });
        toast.success("PDF report shared successfully!");
        return;
      }

      // Gmail Fallback
      doc.save(fileName);
      const subject = encodeURIComponent(`Student Profile & Fee Report - ${student.name} (${student.admission_no})`);
      const body = encodeURIComponent(`Hello,\n\nPlease find attached the official Student Profile & Fee Report for ${student.name} (${student.admission_no}).\n\nProgram: ${program?.name || '—'}\nRoll No: ${student.roll_number || '—'}\n\nNote: The PDF report "${fileName}" has been downloaded to your device. Please attach it to this email.`);
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${subject}&body=${body}`;
      window.open(gmailUrl, "_blank");
      toast.success("PDF downloaded & Gmail opened! Please attach the downloaded file.");
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error("Failed to share PDF: " + err.message);
      }
    } finally {
      setIsExporting(false);
    }
  };
  const handleDownloadPDF = () => {
    try {
      setIsExporting(true);
      const doc = generatePDFDoc();
      doc.save(`Student_Report_${student.name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`);
      toast.success("PDF report downloaded successfully!");
    } catch (err: any) {
      toast.error("Failed to generate PDF: " + err.message);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePrint = () => {
    const yearLedgersHtml = activeYearsForReport
      .map((y) => {
        const sum = semesterSummary(student.id, y, {
          charges,
          adjustments,
          payments,
          structures: feeStructures,
          student,
        });
        const yCharges = studentCharges.filter((c: any) => (c.semester || 1) === y);
        const yAdjustments = adjustments.filter((a: any) => (a.semester || 1) === y);
        const yPayments = activePayments.filter((p: any) => (p.semester || 1) === y);

        return `
          <div style="border: 1px solid #cbd5e1; border-radius: 8px; margin-bottom: 14px; overflow: hidden; background: #ffffff; page-break-inside: avoid;">
            <div style="background: #f1f5f9; padding: 6px 12px; font-weight: 700; font-size: 11px; color: #1e3a8a; border-bottom: 1px solid #cbd5e1; text-transform: uppercase;">
              ${formatYear(y).toUpperCase()} FEES SUMMARY
            </div>
            <div style="display: grid; grid-template-columns: repeat(9, 1fr); gap: 4px; padding: 8px; text-align: center; font-size: 9px; background: #f8fafc;">
              <div style="background: #ffffff; padding: 5px 2px; border-radius: 4px; border: 1px solid #e2e8f0;"><div style="color:#64748b; font-size: 7.5px; font-weight: 700;">TOTAL PAYABLE</div><div style="font-weight: 700; margin-top: 2px;">${inr(sum.totalCharged)}</div></div>
              <div style="background: #ffffff; padding: 5px 2px; border-radius: 4px; border: 1px solid #e2e8f0;"><div style="color:#64748b; font-size: 7.5px; font-weight: 700;">LATE FEES</div><div style="font-weight: 700; margin-top: 2px;">${sum.totalLate > 0 ? inr(sum.totalLate) : "—"}</div></div>
              <div style="background: #ffffff; padding: 5px 2px; border-radius: 4px; border: 1px solid #e2e8f0;"><div style="color:#64748b; font-size: 7.5px; font-weight: 700;">FINE</div><div style="font-weight: 700; margin-top: 2px;">${sum.totalFine > 0 ? inr(sum.totalFine) : "—"}</div></div>
              <div style="background: #ffffff; padding: 5px 2px; border-radius: 4px; border: 1px solid #e2e8f0;"><div style="color:#64748b; font-size: 7.5px; font-weight: 700;">OTHER</div><div style="font-weight: 700; margin-top: 2px;">${sum.totalOther > 0 ? inr(sum.totalOther) : "—"}</div></div>
              <div style="background: #ffffff; padding: 5px 2px; border-radius: 4px; border: 1px solid #e2e8f0;"><div style="color:#d97706; font-size: 7.5px; font-weight: 700;">CONCESSION</div><div style="font-weight: 700; color:#d97706; margin-top: 2px;">${sum.totalConcession ? `− ${inr(sum.totalConcession)}` : "—"}</div></div>
              <div style="background: #ffffff; padding: 5px 2px; border-radius: 4px; border: 1px solid #e2e8f0;"><div style="color:#d97706; font-size: 7.5px; font-weight: 700;">SCHOLARSHIP</div><div style="font-weight: 700; color:#d97706; margin-top: 2px;">${sum.totalScholarship ? `− ${inr(sum.totalScholarship)}` : "—"}</div></div>
              <div style="background: #ffffff; padding: 5px 2px; border-radius: 4px; border: 1px solid #e2e8f0;"><div style="color:#64748b; font-size: 7.5px; font-weight: 700;">NET PAYABLE</div><div style="font-weight: 700; margin-top: 2px;">${inr(sum.netPayable)}</div></div>
              <div style="background: #ffffff; padding: 5px 2px; border-radius: 4px; border: 1px solid #e2e8f0;"><div style="color:#166534; font-size: 7.5px; font-weight: 700;">PAID</div><div style="font-weight: 700; color:#166534; margin-top: 2px;">${inr(sum.totalPaid)}</div></div>
              <div style="background: #ffffff; padding: 5px 2px; border-radius: 4px; border: 1px solid #e2e8f0;"><div style="color:#b45309; font-size: 7.5px; font-weight: 700;">BALANCE</div><div style="font-weight: 700; color:${sum.balance > 0 ? '#dc2626' : '#166534'}; margin-top: 2px;">${inr(sum.balance)}</div></div>
            </div>
          </div>

          <div style="display: grid; grid-template-columns: 220px 1fr; gap: 14px; margin-bottom: 18px; page-break-inside: avoid;">
            <!-- Left Side: Summary Panel -->
            <div style="border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; background: #ffffff;">
              <div style="display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px; margin-bottom: 8px; font-weight: 700; font-size: 11px;">
                <span style="color: #64748b;">Class Year</span>
                <span style="color: #0f172a;">${formatYear(y)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 10px;">
                <span style="color: #64748b;">Total charged</span>
                <span style="font-weight: 600;">${inr(sum.totalCharged)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 10px; color: #64748b;">
                <span>Late fees</span>
                <span>${sum.totalLate > 0 ? inr(sum.totalLate) : "—"}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 10px; color: #64748b;">
                <span>Fine</span>
                <span>${sum.totalFine > 0 ? inr(sum.totalFine) : "—"}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 10px; color: #64748b;">
                <span>Other charges</span>
                <span>${sum.totalOther > 0 ? inr(sum.totalOther) : "—"}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 10px; color: #d97706;">
                <span>Concessions</span>
                <span>${sum.totalConcession ? `− ${inr(sum.totalConcession)}` : "—"}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 10px; color: #d97706;">
                <span>Scholarships</span>
                <span>${sum.totalScholarship ? `− ${inr(sum.totalScholarship)}` : "—"}</span>
              </div>
              <div style="display: flex; justify-content: space-between; border-top: 1px solid #e2e8f0; padding-top: 6px; margin-top: 6px; font-size: 10.5px; font-weight: 700;">
                <span>Net payable</span>
                <span>${inr(sum.netPayable)}</span>
              </div>
              <div style="display: flex; justify-content: space-between; margin-top: 5px; font-size: 10.5px; font-weight: 700; color: #166534;">
                <span>Paid</span>
                <span>${inr(sum.totalPaid)}</span>
              </div>
              <div style="border-top: 1px solid #e2e8f0; margin-top: 10px; padding-top: 8px; display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 9px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em;">BALANCE</span>
                <span style="font-size: 18px; font-weight: 800; color: ${sum.balance > 0 ? "#dc2626" : "#166534"};">${inr(sum.balance)}</span>
              </div>
            </div>

            <!-- Right Side: Ledger Blocks Stack -->
            <div style="display: flex; flex-direction: column; gap: 10px;">
              <!-- Charges Block -->
              <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #ffffff;">
                <div style="background: #f8fafc; padding: 6px 12px; font-weight: 700; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">Charges</div>
                <div style="padding: 8px 12px; font-size: 10px;">
                  ${yCharges.length === 0
                    ? `<p style="color:#64748b; font-style:italic; margin:0;">No charges added for this semester yet.</p>`
                    : yCharges.map(c => `
                      <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dashed #e2e8f0;">
                        <div><strong style="color:#0f172a;">${c.fee_head || c.description || 'Charge'}</strong></div>
                        <div><strong style="color:#0f172a;">${inr(c.amount)}</strong></div>
                      </div>
                    `).join('')}
                </div>
              </div>

              <!-- Concessions & Scholarships Block -->
              <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #ffffff;">
                <div style="background: #f8fafc; padding: 6px 12px; font-weight: 700; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">Concessions &amp; scholarships</div>
                <div style="padding: 8px 12px; font-size: 10px;">
                  ${yAdjustments.length === 0
                    ? `<p style="color:#64748b; font-style:italic; margin:0;">No concessions or scholarships added yet.</p>`
                    : yAdjustments.map(a => `
                      <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dashed #e2e8f0;">
                        <div>
                          <strong style="text-transform:capitalize; color:#0f172a;">${a.type}</strong><br/>
                          <span style="font-size:9px; color:#64748b;">${a.label || 'Adjustment'}</span>
                        </div>
                        <div style="color:#d97706; font-weight:700;">− ${inr(a.amount)}</div>
                      </div>
                    `).join('')}
                </div>
              </div>

              <!-- Payments Block -->
              <div style="border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #ffffff;">
                <div style="background: #f8fafc; padding: 6px 12px; font-weight: 700; font-size: 11px; border-bottom: 1px solid #e2e8f0; color: #0f172a;">Payments</div>
                <div style="padding: 8px 12px; font-size: 10px;">
                  ${yPayments.length === 0
                    ? `<p style="color:#64748b; font-style:italic; margin:0;">No payments recorded yet.</p>`
                    : yPayments.map(p => `
                      <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:1px dashed #e2e8f0;">
                        <div>
                          <strong style="text-transform:uppercase; color:#0f172a;">${p.method}</strong><br/>
                          <span style="font-size:9px; color:#64748b;">${new Date(p.paidAt || p.paid_at).toLocaleDateString('en-IN')} · ${p.reference || 'RCPT-'+p.id.slice(0,6)}</span>
                        </div>
                        <div style="color:#166534; font-weight:700;">${inr(p.amount)}</div>
                      </div>
                    `).join('')}
                </div>
              </div>
            </div>
          </div>
        `;
      })
      .join("");

    const overallPaymentsRowsHtml = activePayments
      .map(
        (p: any, idx: number) => `
        <tr>
          <td style="text-align: center;">${idx + 1}</td>
          <td style="font-family: monospace;">${p.reference || "REC-" + p.id.slice(0, 6)}</td>
          <td>${new Date(p.paidAt || p.paid_at).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
          <td style="text-transform: capitalize;">${p.method}</td>
          <td>${formatYear(p.semester)}</td>
          <td style="font-weight: 700; text-align: right;">${inr(p.amount)}</td>
        </tr>
      `
      )
      .join("");

    const html = `<!doctype html>
<html>
  <head>
    <title>Student Profile & Fee Report — ${student.name}</title>
    <style>
      @page { size: A4 portrait; margin: 12mm; }
      body { font-family: system-ui, sans-serif; color: #0f172a; margin: 0; padding: 0; font-size: 11px; }
      .header { text-align: center; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; }
      .header h1 { font-size: 20px; font-weight: 800; text-transform: uppercase; margin: 0 0 2px 0; letter-spacing: 0.05em; }
      .header p { font-size: 10px; font-weight: 700; text-transform: uppercase; color: #475569; margin: 0; letter-spacing: 0.1em; }
      .profile-card { border: 1px solid #cbd5e1; border-radius: 8px; padding: 12px; margin-bottom: 16px; background: #f8fafc; }
      .grid-details { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; width: 100%; }
      .detail-item { font-size: 11px; }
      .detail-label { font-size: 9px; text-transform: uppercase; color: #64748b; font-weight: 600; letter-spacing: 0.05em; }
      .detail-val { font-weight: 600; color: #0f172a; margin-top: 1px; }
      table { width: 100%; border-collapse: collapse; margin-top: 6px; margin-bottom: 12px; font-size: 10px; }
      th, td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: left; }
      th { background-color: #f1f5f9; font-weight: 700; text-transform: uppercase; }
      .sec-title { font-weight: 700; font-size: 12px; margin-top: 14px; margin-bottom: 8px; color: #0f172a; text-transform: uppercase; }
      .footer { margin-top: 36px; display: flex; justify-content: space-between; font-size: 10px; font-weight: 600; page-break-inside: avoid; }
      .sig { border-top: 1px solid #0f172a; width: 180px; text-align: center; padding-top: 4px; }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>Imperial College, Hisar</h1>
      <p>Official Student Profile &amp; Fee Ledger Report</p>
    </div>
    <div class="profile-card">
      <div class="grid-details">
        <div class="detail-item"><div class="detail-label">Student Name</div><div class="detail-val">${student.name}</div></div>
        <div class="detail-item"><div class="detail-label">Admission No</div><div class="detail-val" style="font-family:monospace">${student.admission_no}</div></div>
        <div class="detail-item"><div class="detail-label">Program / Class</div><div class="detail-val">${program?.name || "—"}</div></div>
        <div class="detail-item"><div class="detail-label">College Roll No</div><div class="detail-val" style="font-family:monospace">${student.roll_number || "—"}</div></div>
        <div class="detail-item"><div class="detail-label">Univ Reg No</div><div class="detail-val" style="font-family:monospace">${student.university_reg_no || "—"}</div></div>
        <div class="detail-item"><div class="detail-label">Univ Roll No</div><div class="detail-val" style="font-family:monospace">${student.university_roll_no || "—"}</div></div>
        <div class="detail-item"><div class="detail-label">Aadhar Card No</div><div class="detail-val" style="font-family:monospace">${student.aadhar_no || "—"}</div></div>
        <div class="detail-item"><div class="detail-label">ABC ID</div><div class="detail-val">${student.abc_id || "—"}</div></div>
        <div class="detail-item"><div class="detail-label">Family ID (PPP)</div><div class="detail-val">${student.family_id || "—"}</div></div>
        <div class="detail-item"><div class="detail-label">Father's Name</div><div class="detail-val">${student.guardian || "—"}</div></div>
        <div class="detail-item"><div class="detail-label">Father's Contact</div><div class="detail-val" style="font-family:monospace">${student.guardian_phone || "—"}</div></div>
        <div class="detail-item"><div class="detail-label">Student Mobile</div><div class="detail-val" style="font-family:monospace">${student.phone || "—"}</div></div>
        <div class="detail-item" style="grid-column: span 3;"><div class="detail-label">Full Address</div><div class="detail-val">${[student.address, student.city, student.state, student.pincode].filter(Boolean).join(", ") || "—"}</div></div>
      </div>
    </div>

    ${
      activeYearsForReport.length > 0
        ? `<div class="sec-title">Year-Wise Fee Ledgers &amp; Summaries</div>${yearLedgersHtml}`
        : `<div class="sec-title">Payment Receipts History</div>
           ${activePayments.length === 0
             ? `<p style="color:#64748b;">No payment records found.</p>`
             : `<table>
                 <thead>
                   <tr>
                     <th style="width:30px; text-align:center;">#</th>
                     <th>Receipt / Ref No.</th>
                     <th>Date</th>
                     <th>Payment Method</th>
                     <th>Academic Year</th>
                     <th style="text-align:right;">Amount (Rs.)</th>
                   </tr>
                 </thead>
                 <tbody>${overallPaymentsRowsHtml}</tbody>
               </table>`
           }`
    }

    <div class="footer">
      <div class="sig">Prepared By (Registry)</div>
      <div class="sig">Verified By (Accounts)</div>
      <div class="sig">Principal / Director Stamp &amp; Sign</div>
    </div>
    <script>window.onload = () => { window.print(); };</script>
  </body>
</html>`;

    const w = window.open("", "_blank");
    if (!w) {
      toast.error("Please allow popups to print report.");
      return;
    }
    w.document.write(html);
    w.document.close();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="default" className="gap-2 shadow-sm bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium">
          <FileText className="h-4 w-4" />
          Generate Report
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6 space-y-6">
          {/* Top Dialog Action Bar */}
          <div className="flex flex-wrap items-center justify-between border-b pb-4 gap-3">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                <FileText className="h-5 w-5 text-blue-600" />
                Student Official Profile &amp; Fee Report
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Official college record for {student.name} ({student.admission_no})
              </DialogDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" onClick={handleSharePDF} disabled={isExporting} className="gap-1.5 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 dark:hover:bg-blue-950">
                <Share2 className="h-3.5 w-3.5" />
                Share PDF
              </Button>
              <Button size="sm" variant="outline" onClick={handleDownloadPDF} disabled={isExporting} className="gap-1.5 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 dark:hover:bg-rose-950">
                <Download className="h-3.5 w-3.5" />
                Download PDF
              </Button>
              <Button size="sm" variant="default" onClick={handlePrint} className="gap-1.5 text-xs bg-blue-600 hover:bg-blue-700">
                <Printer className="h-3.5 w-3.5" />
                Print Report
              </Button>
            </div>
          </div>

          {/* Letterhead Preview Card */}
          <div className="bg-card text-card-foreground border rounded-xl p-6 shadow-xs space-y-6">
            <div className="text-center border-b pb-4 space-y-1">
              <h1 className="font-display text-2xl font-bold tracking-tight text-primary uppercase">
                Imperial College, Hisar
              </h1>
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Official Student Profile &amp; Fee Ledger Report
              </p>
            </div>

            {/* Profile Grid */}
            <div className="bg-muted/40 rounded-lg p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div><span className="text-muted-foreground font-medium">Student Name:</span> <p className="font-semibold text-foreground">{student.name}</p></div>
              <div><span className="text-muted-foreground font-medium">Admission No:</span> <p className="font-mono font-semibold text-foreground">{student.admission_no}</p></div>
              <div><span className="text-muted-foreground font-medium">Program / Class:</span> <p className="font-semibold text-foreground">{program?.name || "—"}</p></div>
              <div><span className="text-muted-foreground font-medium">College Roll No:</span> <p className="font-mono font-semibold text-foreground">{student.roll_number || "—"}</p></div>
              <div><span className="text-muted-foreground font-medium">Univ Reg No:</span> <p className="font-mono font-semibold text-foreground">{student.university_reg_no || "—"}</p></div>
              <div><span className="text-muted-foreground font-medium">Univ Roll No:</span> <p className="font-mono font-semibold text-foreground">{student.university_roll_no || "—"}</p></div>
              <div><span className="text-muted-foreground font-medium">Aadhar Card No:</span> <p className="font-mono font-semibold text-foreground">{student.aadhar_no || "—"}</p></div>
              <div><span className="text-muted-foreground font-medium">ABC ID:</span> <p className="font-semibold text-foreground">{student.abc_id || "—"}</p></div>
              <div><span className="text-muted-foreground font-medium">Family ID (PPP):</span> <p className="font-semibold text-foreground">{student.family_id || "—"}</p></div>
              <div><span className="text-muted-foreground font-medium">Father's Name:</span> <p className="font-semibold text-foreground">{student.guardian || "—"}</p></div>
              <div><span className="text-muted-foreground font-medium">Father's Contact:</span> <p className="font-mono font-semibold text-foreground">{student.guardian_phone || "—"}</p></div>
              <div><span className="text-muted-foreground font-medium">Student Mobile:</span> <p className="font-mono font-semibold text-foreground">{student.phone || "—"}</p></div>
              <div className="sm:col-span-2 lg:col-span-3"><span className="text-muted-foreground font-medium">Address:</span> <p className="font-semibold text-foreground">{[student.address, student.city, student.state, student.pincode].filter(Boolean).join(", ") || "—"}</p></div>
            </div>

            {/* Fees & Ledgers Section for Toggled-ON Years matching Image 2 */}
            {activeYearsForReport.length > 0 ? (
              <div className="space-y-6">
                <h3 className="font-display font-bold text-sm uppercase tracking-wide text-primary border-b pb-1">
                  Year-Wise Fee Ledgers &amp; Summaries
                </h3>
                {activeYearsForReport.map((yNum) => {
                  const sum = semesterSummary(student.id, yNum, { charges, adjustments, payments, structures: feeStructures, student });
                  const yCharges = studentCharges.filter((c: any) => (c.semester || 1) === yNum);
                  const yAdjustments = adjustments.filter((a: any) => (a.semester || 1) === yNum);
                  const yPayments = activePayments.filter((p: any) => (p.semester || 1) === yNum);

                  return (
                    <div key={yNum} className="space-y-4 border-b pb-6 last:border-b-0 last:pb-0">
                      {/* 9-Pills Summary Banner */}
                      <div className="border rounded-xl p-3 bg-muted/20 space-y-2">
                        <div className="font-bold text-xs text-blue-600 dark:text-blue-400 uppercase tracking-wide">
                          {formatYear(yNum)} FEES SUMMARY
                        </div>
                        <div className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 text-center text-xs">
                          <div className="bg-background p-1.5 rounded border"><div className="text-[10px] text-muted-foreground font-semibold">TOTAL PAYABLE</div><div className="font-bold mt-0.5">{inr(sum.totalCharged)}</div></div>
                          <div className="bg-background p-1.5 rounded border"><div className="text-[10px] text-muted-foreground font-semibold">LATE FEES</div><div className="font-bold mt-0.5">{sum.totalLate > 0 ? inr(sum.totalLate) : "—"}</div></div>
                          <div className="bg-background p-1.5 rounded border"><div className="text-[10px] text-muted-foreground font-semibold">FINE</div><div className="font-bold mt-0.5">{sum.totalFine > 0 ? inr(sum.totalFine) : "—"}</div></div>
                          <div className="bg-background p-1.5 rounded border"><div className="text-[10px] text-muted-foreground font-semibold">OTHER</div><div className="font-bold mt-0.5">{sum.totalOther > 0 ? inr(sum.totalOther) : "—"}</div></div>
                          <div className="bg-background p-1.5 rounded border"><div className="text-[10px] text-amber-600 font-semibold">CONCESSION</div><div className="font-bold text-amber-600 mt-0.5">{sum.totalConcession ? `− ${inr(sum.totalConcession)}` : "—"}</div></div>
                          <div className="bg-background p-1.5 rounded border"><div className="text-[10px] text-amber-600 font-semibold">SCHOLARSHIP</div><div className="font-bold text-amber-600 mt-0.5">{sum.totalScholarship ? `− ${inr(sum.totalScholarship)}` : "—"}</div></div>
                          <div className="bg-background p-1.5 rounded border"><div className="text-[10px] text-muted-foreground font-semibold">NET PAYABLE</div><div className="font-bold mt-0.5">{inr(sum.netPayable)}</div></div>
                          <div className="bg-background p-1.5 rounded border"><div className="text-[10px] text-emerald-600 font-semibold">PAID</div><div className="font-bold text-emerald-600 mt-0.5">{inr(sum.totalPaid)}</div></div>
                          <div className="bg-background p-1.5 rounded border"><div className="text-[10px] text-amber-600 font-semibold">BALANCE</div><div className="font-bold text-amber-600 mt-0.5">{inr(sum.balance)}</div></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Left Summary Panel */}
                      <Card className="md:col-span-1 border shadow-xs">
                        <CardContent className="space-y-2 p-4 text-xs">
                          <div className="flex items-center justify-between border-b pb-2">
                            <span className="text-muted-foreground font-medium">Class Year</span>
                            <span className="font-bold text-foreground">{formatYear(yNum)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Total charged</span>
                            <span className="font-semibold text-foreground">{inr(sum.totalCharged)}</span>
                          </div>
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Late fees</span>
                            <span>{sum.totalLate > 0 ? inr(sum.totalLate) : "—"}</span>
                          </div>
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Fine</span>
                            <span>{sum.totalFine > 0 ? inr(sum.totalFine) : "—"}</span>
                          </div>
                          <div className="flex items-center justify-between text-muted-foreground">
                            <span>Other charges</span>
                            <span>{sum.totalOther > 0 ? inr(sum.totalOther) : "—"}</span>
                          </div>
                          <div className="flex items-center justify-between text-amber-600 font-medium">
                            <span>Concessions</span>
                            <span>{sum.totalConcession ? `− ${inr(sum.totalConcession)}` : "—"}</span>
                          </div>
                          <div className="flex items-center justify-between text-amber-600 font-medium">
                            <span>Scholarships</span>
                            <span>{sum.totalScholarship ? `− ${inr(sum.totalScholarship)}` : "—"}</span>
                          </div>
                          <div className="flex items-center justify-between font-bold text-foreground pt-1 border-t">
                            <span>Net payable</span>
                            <span>{inr(sum.netPayable)}</span>
                          </div>
                          <div className="flex items-center justify-between font-bold text-emerald-600">
                            <span>Paid</span>
                            <span>{inr(sum.totalPaid)}</span>
                          </div>

                          <div className="mt-3 border-t pt-3 flex items-center justify-between">
                            <span className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">BALANCE</span>
                            <span className={`font-display text-xl font-bold ${sum.balance > 0 ? "text-destructive" : "text-emerald-600"}`}>
                              {inr(sum.balance)}
                            </span>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Right Ledger Stack */}
                      <div className="md:col-span-2 space-y-3">
                        {/* Charges Block */}
                        <div className="rounded-lg border bg-card shadow-xs">
                          <div className="border-b px-4 py-2 bg-muted/40">
                            <h4 className="text-xs font-bold text-foreground">Charges</h4>
                          </div>
                          <div className="divide-y text-xs">
                            {yCharges.length === 0 ? (
                              <div className="p-3 text-muted-foreground italic">No charges added for this semester yet.</div>
                            ) : (
                              yCharges.map((c: any) => (
                                <div key={c.id} className="flex items-center justify-between px-4 py-2.5">
                                  <div>
                                    <p className="font-semibold text-foreground">{c.fee_head || c.description || "Fee Charge"}</p>
                                    {c.description && c.fee_head && <p className="text-[11px] text-muted-foreground">{c.description}</p>}
                                  </div>
                                  <span className="font-bold text-foreground">{inr(c.amount)}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Concessions & Scholarships Block */}
                        <div className="rounded-lg border bg-card shadow-xs">
                          <div className="border-b px-4 py-2 bg-muted/40">
                            <h4 className="text-xs font-bold text-foreground">Concessions &amp; scholarships</h4>
                          </div>
                          <div className="divide-y text-xs">
                            {yAdjustments.length === 0 ? (
                              <div className="p-3 text-muted-foreground italic">No concessions or scholarships added yet.</div>
                            ) : (
                              yAdjustments.map((a: any) => (
                                <div key={a.id} className="flex items-center justify-between px-4 py-2.5">
                                  <div>
                                    <p className="font-semibold text-foreground capitalize">{a.type}</p>
                                    <p className="text-[11px] text-muted-foreground">{a.label || "Adjustment"}</p>
                                  </div>
                                  <span className="font-bold text-amber-600">− {inr(a.amount)}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>

                        {/* Payments Block */}
                        <div className="rounded-lg border bg-card shadow-xs">
                          <div className="border-b px-4 py-2 bg-muted/40">
                            <h4 className="text-xs font-bold text-foreground">Payments</h4>
                          </div>
                          <div className="divide-y text-xs">
                            {yPayments.length === 0 ? (
                              <div className="p-3 text-muted-foreground italic">No payments recorded yet.</div>
                            ) : (
                              yPayments.map((p: any) => (
                                <div key={p.id} className="flex items-center justify-between px-4 py-2.5">
                                  <div>
                                    <p className="font-bold text-foreground uppercase">{p.method}</p>
                                    <p className="text-[11px] text-muted-foreground">
                                      {new Date(p.paidAt || p.paid_at).toLocaleDateString("en-IN")} · {p.reference || `RCPT-${p.id.slice(0, 6)}`}
                                    </p>
                                  </div>
                                  <span className="font-bold text-emerald-600">{inr(p.amount)}</span>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            ) : (
              <div className="p-4 border rounded-xl bg-muted/20 text-center text-xs text-muted-foreground">
                No specific year fees summary toggled ON. Turn ON any year toggle in the Fees Summary section to view and print its complete fee ledger.
              </div>
            )}

            {/* Payment Receipts History */}
            <div className="space-y-3">
              <h3 className="font-display font-bold text-sm uppercase tracking-wide text-primary">Payment Receipts History</h3>
              {activePayments.length === 0 ? (
                <p className="text-xs text-muted-foreground">No payment receipt records found.</p>
              ) : (
                <div className="border rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-muted/60 font-semibold border-b">
                      <tr>
                        <th className="p-2 text-center w-8">#</th>
                        <th className="p-2">Receipt / Ref No.</th>
                        <th className="p-2">Date</th>
                        <th className="p-2">Method</th>
                        <th className="p-2">Year</th>
                        <th className="p-2 text-right">Paid Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {activePayments.map((p: any, idx: number) => (
                        <tr key={p.id || idx}>
                          <td className="p-2 text-center text-muted-foreground">{idx + 1}</td>
                          <td className="p-2 font-mono font-medium">{p.reference || "REC-" + p.id.slice(0, 6)}</td>
                          <td className="p-2">{new Date(p.paidAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                          <td className="p-2 capitalize">{p.method}</td>
                          <td className="p-2">{formatYear(p.semester)}</td>
                          <td className="p-2 text-right font-bold text-emerald-600">{inr(p.amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FeesSummaryMasterSection({
  student,
  currentSemester,
  semesters,
  charges,
  adjustments,
  payments,
  feeStructures,
  showMaster,
  setShowMaster,
  activeYears,
  setActiveYears,
}: {
  student: any;
  currentSemester: number;
  semesters: number[];
  charges: any[];
  adjustments: any[];
  payments: any[];
  feeStructures: any[];
  showMaster: boolean;
  setShowMaster: (v: boolean) => void;
  activeYears: Record<number, boolean>;
  setActiveYears: React.Dispatch<React.SetStateAction<Record<number, boolean>>>;
}) {
  const applicableYears = semesters.filter((yearNum) => yearNum >= currentSemester);

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden border shadow-xs">
        <CardHeader className="py-3 px-4 bg-card flex flex-row items-center justify-between">
          <CardTitle className="font-display text-base font-bold text-foreground tracking-wide">
            Fees Summary
          </CardTitle>
          <div className="flex items-center gap-2">
            <Label htmlFor="master-fees-summary-toggle" className="text-xs text-muted-foreground font-medium cursor-pointer">
              {showMaster ? "ON" : "OFF"}
            </Label>
            <Switch
              id="master-fees-summary-toggle"
              checked={showMaster}
              onCheckedChange={setShowMaster}
            />
          </div>
        </CardHeader>
      </Card>

      {showMaster && (
        <div className="space-y-4 transition-all animate-in fade-in-50">
          {applicableYears.map((yearNum) => (
            <YearFeesSummaryCard
              key={yearNum}
              yearNum={yearNum}
              student={student}
              charges={charges}
              adjustments={adjustments}
              payments={payments}
              feeStructures={feeStructures}
              isOpen={!!activeYears[yearNum]}
              onToggle={(val) => setActiveYears((prev) => ({ ...prev, [yearNum]: val }))}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function YearFeesSummaryCard({
  yearNum,
  student,
  charges,
  adjustments,
  payments,
  feeStructures,
  isOpen,
  onToggle,
}: {
  yearNum: number;
  student: any;
  charges: any[];
  adjustments: any[];
  payments: any[];
  feeStructures: any[];
  isOpen: boolean;
  onToggle: (val: boolean) => void;
}) {
  const yearTotals = semesterSummary(student.id, yearNum, {
    charges,
    adjustments,
    payments,
    structures: feeStructures,
    student,
  });

  return (
    <Card className="overflow-hidden border shadow-xs transition-all">
      <CardHeader className="py-2.5 px-4 bg-muted/30 border-b flex flex-row items-center justify-between">
        <CardTitle className="font-display text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
          {formatYear(yearNum)} Fees Summary
        </CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor={`toggle-year-${yearNum}`} className="text-xs text-muted-foreground font-medium cursor-pointer">
            {isOpen ? "ON" : "OFF"}
          </Label>
          <Switch
            id={`toggle-year-${yearNum}`}
            checked={isOpen}
            onCheckedChange={onToggle}
          />
        </div>
      </CardHeader>
      {isOpen && (
        <CardContent className="grid grid-cols-3 sm:grid-cols-5 lg:grid-cols-9 gap-2 p-3 transition-all animate-in fade-in-50">
          <TotalPill label="Total Payable" value={inr(yearTotals.totalCharged)} />
          <TotalPill label="Late Fees" value={yearTotals.totalLate > 0 ? inr(yearTotals.totalLate) : "—"} />
          <TotalPill label="Fine" value={yearTotals.totalFine > 0 ? inr(yearTotals.totalFine) : "—"} />
          <TotalPill label="Other" value={yearTotals.totalOther > 0 ? inr(yearTotals.totalOther) : "—"} />
          <TotalPill
            label={
              <span>
                Conce-
                <br />
                ssion
              </span>
            }
            value={yearTotals.totalConcession ? `− ${inr(yearTotals.totalConcession)}` : "—"}
          />
          <TotalPill
            label={
              <span>
                Scholar-
                <br />
                ship
              </span>
            }
            value={yearTotals.totalScholarship ? `− ${inr(yearTotals.totalScholarship)}` : "—"}
          />
          <TotalPill label="Net Payable" value={inr(yearTotals.netPayable)} />
          <TotalPill label="Paid" value={inr(yearTotals.totalPaid)} tone="success" />
          <TotalPill label="Balance" value={inr(yearTotals.balance)} tone={yearTotals.balance > 0 ? "warning" : "default"} />
        </CardContent>
      )}
    </Card>
  );
}

function TotalPill({
  label, value, tone = "default",
}: { label: React.ReactNode; value: string; tone?: "default" | "success" | "warning" }) {
  const cls = tone === "success" ? "text-emerald-600 dark:text-emerald-400 font-bold" : tone === "warning" ? "text-amber-600 dark:text-amber-400 font-bold" : "text-foreground";
  return (
    <div className="rounded-md bg-muted/50 p-2.5 text-center flex flex-col justify-between items-center h-full min-h-19 border border-border/40">
      <div className="text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground font-semibold leading-tight flex items-center justify-center text-center">
        {label}
      </div>
      <p className={`mt-1.5 font-display text-sm sm:text-base font-bold ${cls}`}>{value}</p>
    </div>
  );
}

function SemesterLedger({ 
  student, semester, charges, adjustments, payments, canEditPayments, userRole, feeStructures 
}: { 
  student: any; semester: number; 
  charges: any[]; adjustments: any[]; payments: any[];
  canEditPayments: boolean;
  userRole?: any;
  feeStructures: any[];
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
    () => semesterSummary(studentId, semester, { charges, adjustments, payments, structures: feeStructures, student }),
    [studentId, semester, charges, adjustments, payments, feeStructures, student],
  );

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <SummaryPanel sum={sum} semester={semester} />

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

function SummaryPanel({ sum, semester }: { sum: ReturnType<typeof semesterSummary>, semester: number }) {
  const rows: [string, string, string?][] = [
    ["Total charged", inr(sum.totalCharged)],
    ["Late fees", sum.totalLate > 0 ? inr(sum.totalLate) : "—", "text-muted-foreground"],
    ["Fine", sum.totalFine > 0 ? inr(sum.totalFine) : "—", "text-muted-foreground"],
    ["Other charges", sum.totalOther > 0 ? inr(sum.totalOther) : "—", "text-muted-foreground"],
    ["Concessions", `− ${inr(sum.totalConcession)}`, "text-warning"],
    ["Scholarships", `− ${inr(sum.totalScholarship)}`, "text-warning"],
    ["Net payable", inr(sum.netPayable), "font-semibold text-foreground"],
    ["Paid", inr(sum.totalPaid), "text-success"],
  ];
  return (
    <Card>
      <CardContent className="space-y-2 p-5">
        <div className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="flex justify-between border-b pb-2 sm:border-0 sm:pb-0">
            <span className="text-muted-foreground">Class Year</span>
            <span className="font-medium text-foreground">{formatYear(semester)}</span>
          </div>
        </div>
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
      const { data: allPayments, error: fetchErr } = await supabase.from('fee_payments').select('reference, paid_at');
      if (fetchErr) throw fetchErr;
      
      const mappedPayments = (allPayments || []).map((p: any) => ({
        id: '', studentId: '', semester: 0, amount: 0, method: 'cash' as any,
        reference: p.reference, paidAt: p.paid_at
      }));

      const receiptFormat = useStore.getState().receiptFormat;
      const receiptNum = nextReceiptNo(new Date().toISOString(), mappedPayments, receiptFormat);
      
      const txnRef = data.reference?.trim();
      const finalNote = txnRef ? `Txn Ref: ${txnRef}` : null;

      const { error } = await supabase.from('fee_payments').insert([{
        student_id: data.studentId,
        semester: data.semester,
        amount: data.amount,
        method: data.method,
        reference: receiptNum,
        note: finalNote,
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
          summary: `Collected ₹${data.amount} via ${data.method.toUpperCase()} for ${student.name} (${formatYear(data.semester)})`,
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
  const [method, setMethod] = useState<"cash" | "online" | "upi" | "card" | "bank" | "cheque">("upi");
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
                {["cash", "online", "upi", "card", "bank", "cheque"].map((m) => (
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

  const semList = Array.from({ length: Math.max(1, Number(student?.current_semester) || 1) }, (_, i) => i + 1);

  const downloadReceipt = (p: FeePayment) => {
    const rolls = student.rolls || {};
    downloadReceiptPdf({
      college: paymentInfo,
      payment: p,
      student: {
        name: student.name,
        admissionNo: student.admission_no,
        rollNo: student.roll_number || "",
      },
      program: program ? { name: program.name, code: program.code } : undefined,
      semester: p.semester,
    });
  };

  const printReceipt = (p: FeePayment) => {
    const rolls = student.rolls || {};
    printReceiptPdf({
      college: paymentInfo,
      payment: p,
      student: {
        name: student.name,
        guardian: student.guardian,
        admissionNo: student.admission_no,
        rollNo: student.roll_number || "",
      },
      program: program ? { name: program.name, code: program.code } : undefined,
      semester: p.semester,
    });
  };

  const shareReceipt = (p: FeePayment) => {
    shareReceiptPdf({
      college: paymentInfo,
      payment: p,
      student: {
        name: student.name,
        guardian: student.guardian,
        admissionNo: student.admission_no,
        rollNo: student.roll_number || "",
      },
      program: program ? { name: program.name, code: program.code } : undefined,
      semester: p.semester,
    });
  };

  const generatePaymentHistoryPdfDoc = () => {
    const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const margin = 35;
    let y = 40;

    // Header Banner
    doc.setFillColor(28, 43, 75);
    doc.rect(0, 0, pageW, 55, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("IMPERIAL COLLEGE, HISAR", pageW / 2, 26, { align: "center" });

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("PAYMENT RECEIPTS HISTORY REPORT", pageW / 2, 42, { align: "center" });

    y = 75;
    doc.setTextColor(30, 41, 59);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(`Student: ${student.name}`, margin, y);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Adm No: ${student.admission_no}`, pageW - margin, y, { align: "right" });

    y += 16;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, pageW - margin, y);

    y += 18;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.text(`Program: ${program?.name || "—"} | Roll No: ${student.roll_number || "—"}`, margin, y);
    y += 12;
    doc.text(`Total Received: ${inr(totalReceived)}${totalVoided > 0 ? ` | Total Voided: ${inr(totalVoided)}` : ""}`, margin, y);

    y += 18;
    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 8, pageW - margin * 2, 16, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.text("#", margin + 4, y + 3);
    doc.text("Receipt Ref", margin + 20, y + 3);
    doc.text("Date", margin + 120, y + 3);
    doc.text("Mode", margin + 210, y + 3);
    doc.text("Class / Year", margin + 275, y + 3);
    doc.text("Status", margin + 355, y + 3);
    doc.text("Amount (Rs.)", pageW - margin - 5, y + 3, { align: "right" });

    y += 18;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);

    rows.forEach((p: any, idx: number) => {
      if (y > 750) {
        doc.addPage();
        y = 40;
      }
      doc.text(String(idx + 1), margin + 4, y);
      doc.text(p.reference || `REC-${p.id.slice(0, 6)}`, margin + 20, y);
      doc.text(new Date(p.paidAt || p.paid_at).toLocaleDateString("en-IN"), margin + 120, y);
      doc.text((p.method || "Cash").toUpperCase(), margin + 210, y);
      doc.text(formatYear(p.semester || 1), margin + 275, y);
      doc.text(p.voided ? "VOIDED" : "RECEIVED", margin + 355, y);
      doc.setFont("helvetica", "bold");
      if (p.voided) doc.setTextColor(150, 150, 150);
      doc.text(inr(p.amount || 0), pageW - margin - 5, y, { align: "right" });
      doc.setTextColor(30, 41, 59);
      doc.setFont("helvetica", "normal");
      y += 12;
    });

    // Footer Signatures
    y += 30;
    if (y > 740) {
      doc.addPage();
      y = 60;
    }
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.line(margin, y, margin + 140, y);
    doc.line(pageW / 2 - 70, y, pageW / 2 + 70, y);
    doc.line(pageW - margin - 140, y, pageW - margin, y);

    y += 12;
    doc.text("Prepared By (Registry)", margin + 20, y);
    doc.text("Verified By (Accounts)", pageW / 2 - 50, y);
    doc.text("Principal / Director Stamp & Sign", pageW - margin - 135, y);

    return doc;
  };

  const downloadPaymentHistoryPdf = () => {
    if (rows.length === 0) return toast.error("No payment records to download");
    const doc = generatePaymentHistoryPdfDoc();
    const fileName = `Payment_History_${student.name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
    doc.save(fileName);
    toast.success("Payment history PDF downloaded!");
  };

  const printPaymentHistoryPdf = () => {
    if (rows.length === 0) return toast.error("No payment records to print");
    const doc = generatePaymentHistoryPdfDoc();
    doc.autoPrint();
    const url = doc.output("bloburl").toString();
    const win = window.open(url, "_blank");
    if (win) {
      win.onload = () => { win.print(); };
    }
  };

  const sharePaymentHistoryPdf = async () => {
    if (rows.length === 0) return toast.error("No payment records to share");
    try {
      const doc = generatePaymentHistoryPdfDoc();
      const pdfBlob = doc.output("blob");
      const fileName = `Payment_History_${student.name.replace(/[^a-zA-Z0-9]/g, "_")}.pdf`;
      const file = new File([pdfBlob], fileName, { type: "application/pdf" });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: `Payment History Report - ${student.name}`,
          text: `Official Fee Payment Receipts History for ${student.name}`,
        });
        toast.success("Payment history shared successfully!");
        return;
      }

      // Gmail Fallback
      doc.save(fileName);
      const subject = encodeURIComponent(`Payment History Report - ${student.name} (${student.admission_no})`);
      const body = encodeURIComponent(`Hello,\n\nPlease find attached the official Payment Receipts History Report for student ${student.name} (${student.admission_no}).\n\nTotal Received: Rs. ${totalReceived}\n\nNote: The PDF report "${fileName}" has been downloaded to your device. Please attach it to this email.`);
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&su=${subject}&body=${body}`;
      window.open(gmailUrl, "_blank");
      toast.success("PDF downloaded & Gmail opened! Please attach the downloaded file.");
    } catch (err: any) {
      if (err.name !== "AbortError") {
        toast.error("Failed to share PDF: " + err.message);
      }
    }
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
      `${formatYear(p.semester)}`,
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
          summary: `Voided payment of ₹${payment.amount} for ${student.name} (${formatYear(payment.semester)}). Reason: ${reason || 'None'}`,
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
          summary: `Reversed void for payment of ₹${payment.amount} for ${student.name} (${formatYear(payment.semester)})`,
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
              Itemized ledger of every recorded receipt. Filter by year, method or status.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-md bg-success/10 px-2 py-1 text-success font-medium">
              Received: {inr(totalReceived)}
            </span>
            {totalVoided > 0 && (
              <span className="rounded-md bg-muted px-2 py-1 text-muted-foreground font-medium">
                Voided: {inr(totalVoided)}
              </span>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label className="text-xs">Year</Label>
            <Select value={semFilter} onValueChange={setSemFilter}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {semList.map((n) => (
                  <SelectItem key={n} value={String(n)}>{formatYear(n)}</SelectItem>
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
                {["cash", "online", "upi", "card", "bank", "cheque"].map((m) => (
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
                <th className="px-3 py-2 text-left">Class</th>
                <th className="px-3 py-2 text-left">Method</th>
                <th className="px-3 py-2 text-left">Reference</th>
                <th className="px-3 py-2 text-right">Amount</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">
                    No payments match these filters.
                  </td>
                </tr>
              )}
              {rows.map((p) => (
                <tr key={p.id} className={p.voided ? "bg-muted/30" : ""}>
                  <td className="px-3 py-2">{new Date(p.paidAt).toLocaleDateString()}</td>
                  <td className="px-3 py-2">{formatYear(p.semester)}</td>
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

function StudentDocuments({ studentId, canEdit, user }: { studentId: string; canEdit: boolean; user: any }) {
  const queryClient = useQueryClient();
  const [isUploading, setIsUploading] = useState(false);
  const [docName, setDocName] = useState("");
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['student_documents', studentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('student_documents')
        .select('*')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!docName.trim()) throw new Error("Please enter a document name");
      
      const fileExt = file.name.split('.').pop();
      const filePath = `${studentId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('student_documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('student_documents')
        .getPublicUrl(filePath);

      // Save metadata to database
      const { error: dbError } = await supabase
        .from('student_documents')
        .insert({
          student_id: studentId,
          name: docName,
          file_url: publicUrl,
          uploaded_by: user?.id
        });

      if (dbError) throw dbError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student_documents', studentId] });
      toast.success("Document uploaded successfully");
      setIsUploadDialogOpen(false);
      setDocName("");
    },
    onError: (error: any) => {
      toast.error(error.message);
    },
    onSettled: () => setIsUploading(false)
  });

  const deleteMutation = useMutation({
    mutationFn: async (doc: any) => {
      if (!confirm("Are you sure you want to delete this document?")) throw new Error("Cancelled");
      
      // We don't necessarily delete the file from storage right away (can be done with edge function)
      // but we will delete the db record.
      const { error } = await supabase.from('student_documents').delete().eq('id', doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['student_documents', studentId] });
      toast.success("Document deleted");
    },
    onError: (e: any) => {
      if (e.message !== "Cancelled") toast.error(e.message);
    }
  });

  const handleFileSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("file") as File;
    if (!file || file.size === 0) {
      toast.error("Please select a file to upload");
      return;
    }
    setIsUploading(true);
    uploadMutation.mutate(file);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4 border-b">
        <div>
          <CardTitle className="font-display text-lg">Document Vault</CardTitle>
          <p className="text-xs text-muted-foreground">Securely store student documents and records.</p>
        </div>
        {canEdit && (
          <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Upload className="mr-2 h-4 w-4" /> Upload Document
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Upload New Document</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleFileSubmit} className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Document Name</Label>
                  <Input 
                    placeholder="e.g. Aadhar Card, Previous Marksheet" 
                    value={docName} 
                    onChange={e => setDocName(e.target.value)} 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>File</Label>
                  <Input type="file" name="file" accept=".pdf,image/*" required />
                  <p className="text-[10px] text-muted-foreground">Accepted formats: PDF, JPG, PNG.</p>
                </div>
                <DialogFooter>
                  <Button type="submit" disabled={isUploading}>
                    {isUploading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Upload"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </CardHeader>
      <CardContent className="pt-6">
        {isLoading ? (
          <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : documents.length === 0 ? (
          <div className="text-center p-8 text-sm text-muted-foreground border-2 border-dashed rounded-lg">
            No documents uploaded yet.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc: any) => (
              <div key={doc.id} className="group relative flex items-center gap-4 rounded-lg border p-4 transition-colors hover:bg-muted/50">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-primary/10 text-primary">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="flex-1 overflow-hidden">
                  <h4 className="truncate text-sm font-medium" title={doc.name}>{doc.name}</h4>
                  <p className="text-xs text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</p>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                    <a href={doc.file_url} target="_blank" rel="noopener noreferrer" title="View Document">
                      <Eye className="h-4 w-4" />
                    </a>
                  </Button>
                  {canEdit && (
                    <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteMutation.mutate(doc)} title="Delete Document">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StudentAttendance({ studentId }: { studentId: string }) {
  const { data: attendance = [], isLoading } = useQuery({
    queryKey: ['attendance', 'student', studentId],
    queryFn: async () => {
      const { data, error } = await supabase.from('attendance').select('*').eq('student_id', studentId).order('date', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  if (isLoading) return <div className="p-8 text-center text-muted-foreground animate-pulse">Loading attendance records...</div>;

  const presentDays = attendance.filter((a: any) => a.status === 'Present').length;
  const totalDays = attendance.length;
  const percentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm font-medium text-muted-foreground">Overall Attendance</p>
            <div className="mt-2 flex items-baseline gap-2">
              <h2 className="text-3xl font-bold">{percentage}%</h2>
              <span className="text-sm text-muted-foreground">({presentDays} / {totalDays} days)</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Attendance Log</CardTitle>
          <CardDescription>Recent attendance records</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {attendance.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">No attendance records found for this student.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-4 py-3 text-left font-medium">Date</th>
                    <th className="px-4 py-3 text-left font-medium">Semester / Class</th>
                    <th className="px-4 py-3 text-left font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {attendance.map((record: any) => (
                    <tr key={record.id} className="hover:bg-muted/30">
                      <td className="px-4 py-3 whitespace-nowrap">{new Date(record.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3">{record.semester}</td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant={record.status === 'Present' ? 'default' : record.status === 'Absent' ? 'destructive' : 'secondary'}
                          className={record.status === 'Present' ? 'bg-green-100 text-green-700 hover:bg-green-100 border-green-200' : ''}
                        >
                          {record.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

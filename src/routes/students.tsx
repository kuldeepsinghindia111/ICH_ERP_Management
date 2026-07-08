import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Trash2, Loader2, Pencil, Settings } from "lucide-react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

import { useStore, formatYear } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "Student Management — Imperial CMS" },
      { name: "description", content: "Directory of enrolled students with permanent roll numbers." },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const { user } = useAuth();
  
  // Get user's permissions
  const { data: canEdit } = useQuery({
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

  const { data: programs = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('programs').select('*').order('created_at', { ascending: true });
      if (error) throw error;
      return data;
    }
  });

  const [q, setQ] = useState("");
  const [programFilter, setProgramFilter] = useState<string>("all");
  const [sem, setSem] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data: { students = [], total = 0 } = {}, isLoading: loadingStudents } = useQuery({
    queryKey: ['students', page, q, programFilter, sem],
    queryFn: async () => {
      let query = supabase.from('students').select('*', { count: 'exact' }).order('created_at', { ascending: false });
      
      if (programFilter !== "all") query = query.eq('program_id', programFilter);
      if (sem !== "all") query = query.eq('current_semester', Number(sem));
      if (q) {
        query = query.or(`name.ilike.%${q}%,admission_no.ilike.%${q}%,roll_number.ilike.%${q}%`);
      }
      
      query = query.range((page - 1) * pageSize, page * pageSize - 1);
      
      const { data, error, count } = await query;
      if (error) throw error;
      return { students: data, total: count || 0 };
    },
    placeholderData: keepPreviousData
  });

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [q, programFilter, sem]);

  if (loadingPrograms || loadingStudents) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Registry</p>
          <h1 className="font-display text-3xl font-semibold text-foreground">Student's Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} enrolled · Permanent roll numbers tracked per student.
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/settings"><Settings className="mr-1 h-4 w-4" /> Settings</Link>
          </Button>
          {canEdit && <StudentFormDialog programs={programs} />}
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-center gap-3 p-4">
          <div className="relative min-w-[240px] flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name, admission or roll no."
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />
          </div>
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Program" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programs</SelectItem>
              {programs.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sem} onValueChange={setSem}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Year" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All years</SelectItem>
              {[1, 2, 3].map((n) => (
                <SelectItem key={n} value={String(n)}>{formatYear(n)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50 text-left text-xs uppercase tracking-widest text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Student</th>
                  <th className="px-4 py-3 font-medium">Father's Name</th>
                  <th className="px-4 py-3 font-medium">Male/Female</th>
                  <th className="px-4 py-3 font-medium">Address</th>
                  <th className="px-4 py-3 font-medium">Mobile No.</th>
                  <th className="px-4 py-3 font-medium">Admission No</th>
                  <th className="px-4 py-3 font-medium">Program</th>
                  <th className="px-4 py-3 font-medium">Year</th>
                  <th className="px-4 py-3 font-medium">Roll No.</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.length === 0 && (
                  <tr><td colSpan={10} className="p-6 text-center text-muted-foreground">No students match your filters.</td></tr>
                )}
                {students.map((s: any) => {
                  const program = programs.find((p: any) => p.id === s.program_id);
                  // Safe initial logic for students with single-word names
                  const parts = s.name.split(" ");
                  const initials = parts.length > 1 
                    ? parts[0][0] + parts[1][0] 
                    : s.name.substring(0, 2);

                  return (
                    <tr key={s.id} className="hover:bg-accent/40">
                      <td className="px-4 py-3">
                        <Link to="/students/$studentId" params={{ studentId: s.id }} className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary uppercase">
                            {initials}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.email || "—"}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3">{s.guardian || "—"}</td>
                      <td className="px-4 py-3 capitalize">{s.gender || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="max-w-[150px] truncate" title={s.address}>{s.address || "—"}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{s.phone || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.admission_no}</td>
                      <td className="px-4 py-3">{program?.name ?? "—"}</td>
                      <td className="px-4 py-3">{formatYear(s.current_semester)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{s.roll_number || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {canEdit && <StudentFormDialog programs={programs} student={s} />}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} students
          </p>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>
              Previous
            </Button>
            <p className="text-sm font-medium">Page {page} of {totalPages}</p>
            <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

function StudentFormDialog({ programs, student }: { programs: any[], student?: any }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const isEditing = !!student;
  
  const [form, setForm] = useState({
    admissionNo: "",
    name: "",
    programId: programs[0]?.id ?? "",
    currentSemester: 1,
    rollNumber: "",
    joinedYear: new Date().getFullYear(),
    email: "",
    phone: "",
    guardian: "",
    guardianPhone: "",
    gender: "male",
    dob: "",
    category: "General",
    bloodGroup: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  // Pre-fill form when editing
  useEffect(() => {
    setErrors({});
    if (isEditing && open) {
      setForm({
        admissionNo: student.admission_no || "",
        name: student.name || "",
        programId: student.program_id || programs[0]?.id || "",
        currentSemester: student.current_semester || 1,
        rollNumber: student.roll_number || "",
        joinedYear: student.joined_year || new Date().getFullYear(),
        email: student.email || "",
        phone: student.phone || "",
        guardian: student.guardian || "",
        guardianPhone: student.guardian_phone || "",
        gender: student.gender || "male",
        dob: student.dob || "",
        category: student.category || "General",
        bloodGroup: student.blood_group || "",
        address: student.address || "",
        city: student.city || "",
        state: student.state || "",
        pincode: student.pincode || "",
      });
    } else if (!isEditing && open) {
      // Reset form if opening in Add mode
      setForm({
        admissionNo: "",
        name: "",
        programId: programs[0]?.id ?? "",
        currentSemester: 1,
        rollNumber: "",
        joinedYear: new Date().getFullYear(),
        email: "",
        phone: "",
        guardian: "",
        guardianPhone: "",
        gender: "male",
        dob: "",
        category: "General",
        bloodGroup: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
      });
    }
  }, [isEditing, student, open, programs]);

  // Auto-increment global admission no
  useEffect(() => {
    if (isEditing || !open) return;
    async function fetchMaxAdmission() {
      const { data } = await supabase.from('students').select('admission_no').order('created_at', { ascending: false }).limit(1);
      if (data && data.length > 0) {
        const lastAd = data[0].admission_no;
        const match = lastAd.match(/\d+$/);
        if (match) {
          const next = (parseInt(match[0], 10) + 1).toString().padStart(match[0].length, '0');
          setForm(f => ({ ...f, admissionNo: lastAd.replace(/\d+$/, next) }));
        }
      }
    }
    fetchMaxAdmission();
  }, [isEditing, open]);

  // Auto-increment program-specific roll no
  useEffect(() => {
    if (isEditing || !open || !form.programId) return;
    async function fetchMaxRoll() {
      const { data } = await supabase.from('students')
        .select('roll_number')
        .eq('program_id', form.programId)
        .order('created_at', { ascending: false })
        .limit(1);
      if (data && data.length > 0) {
        const lastRoll = data[0].roll_number;
        const match = lastRoll.match(/\d+$/);
        if (match) {
          const next = (parseInt(match[0], 10) + 1).toString().padStart(match[0].length, '0');
          setForm(f => ({ ...f, rollNumber: lastRoll.replace(/\d+$/, next) }));
        }
      } else {
        setForm(f => ({ ...f, rollNumber: "" }));
      }
    }
    fetchMaxRoll();
  }, [isEditing, open, form.programId]);

  const saveStudentMutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEditing) {
        const { error } = await supabase.from('students').update(data).eq('id', student.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('students').insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success(isEditing ? "Student updated successfully" : "Student added successfully");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });
  
  const removeStudentMutation = useMutation({
    mutationFn: async () => {
      if (!isEditing) return;
      const { error } = await supabase.from('students').delete().eq('id', student.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Student removed");
      setOpen(false);
      queryClient.invalidateQueries({ queryKey: ['students'] });
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const submit = () => {
    const newErrors: Record<string, string> = {};
    const alphaRegex = /^[A-Za-z\s]+$/;
    const phoneRegex = /^\d{10}$/;

    if (!form.name.trim()) {
      newErrors.name = "Full name is required.";
    } else if (!alphaRegex.test(form.name.trim())) {
      newErrors.name = "Only alphabets allowed.";
    }

    if (!form.admissionNo.trim()) {
      newErrors.admissionNo = "Admission no. is required.";
    }

    if (!form.programId) {
      newErrors.programId = "Program is required.";
    }

    if (form.phone && !phoneRegex.test(form.phone.trim())) {
      newErrors.phone = "Must be exactly 10 digits.";
    }
    
    if (form.guardian && !alphaRegex.test(form.guardian.trim())) {
      newErrors.guardian = "Only alphabets allowed.";
    }
    
    if (form.guardianPhone && !phoneRegex.test(form.guardianPhone.trim())) {
      newErrors.guardianPhone = "Must be exactly 10 digits.";
    }
    
    if (form.city && !alphaRegex.test(form.city.trim())) {
      newErrors.city = "Only alphabets allowed.";
    }
    
    if (form.state && !alphaRegex.test(form.state.trim())) {
      newErrors.state = "Only alphabets allowed.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    
    setErrors({});

    const dataToSave: any = {
      admission_no: form.admissionNo.trim(),
      name: form.name.trim(),
      program_id: form.programId,
      current_semester: form.currentSemester,
      joined_year: form.joinedYear,
      email: form.email || null,
      phone: form.phone || null,
      guardian: form.guardian || null,
      guardian_phone: form.guardianPhone || null,
      gender: form.gender,
      dob: form.dob || null,
      category: form.category || null,
      blood_group: form.bloodGroup || null,
      address: form.address || null,
      city: form.city || null,
      state: form.state || null,
      pincode: form.pincode || null,
      status: "active",
      roll_number: form.rollNumber.trim(),
    };

    if (isEditing && form.rollNumber.trim() !== student.roll_number) {
      dataToSave.past_roll_numbers = [...(student.past_roll_numbers || []), student.roll_number];
    }
    
    saveStudentMutation.mutate(dataToSave);
  };
  
  const handleDelete = () => {
    if (confirm(`Delete ${student?.name}? This removes all fee records.`)) {
      removeStudentMutation.mutate();
    }
  };

  const setField = (field: string, value: any) => {
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) setErrors((e) => ({ ...e, [field]: "" }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {isEditing ? (
          <Button variant="ghost" size="icon" title="Edit student">
            <Pencil className="h-4 w-4" />
          </Button>
        ) : (
          <Button><Plus className="mr-1 h-4 w-4" /> New student</Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">{isEditing ? "Edit student" : "Add student"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Update student details." : "Register a new admission with personal details and current year roll."}
          </DialogDescription>
        </DialogHeader>

        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Academic</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label className={errors.name ? "text-destructive" : ""}>Full name</Label>
            <Input 
              className={errors.name ? "border-destructive focus-visible:ring-destructive" : ""}
              value={form.name} 
              onChange={(e) => setField('name', e.target.value.replace(/[^A-Za-z\s]/g, ''))} 
            />
            {errors.name && <p className="mt-1 text-[10px] text-destructive">{errors.name}</p>}
          </div>
          <div>
            <Label className={errors.admissionNo ? "text-destructive" : ""}>Admission no.</Label>
            <Input 
              className={errors.admissionNo ? "border-destructive focus-visible:ring-destructive" : ""}
              value={form.admissionNo} 
              onChange={(e) => setField('admissionNo', e.target.value)} 
            />
            {errors.admissionNo && <p className="mt-1 text-[10px] text-destructive">{errors.admissionNo}</p>}
          </div>
          <div>
            <Label>Joined year</Label>
            <Input type="number" value={form.joinedYear}
              onChange={(e) => setField('joinedYear', Number(e.target.value))} />
          </div>
          <div>
            <Label className={errors.programId ? "text-destructive" : ""}>Program</Label>
            <Select value={form.programId} onValueChange={(v) => setField('programId', v)}>
              <SelectTrigger className={errors.programId ? "border-destructive focus-visible:ring-destructive" : ""}><SelectValue /></SelectTrigger>
              <SelectContent>
                {programs.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.programId && <p className="mt-1 text-[10px] text-destructive">{errors.programId}</p>}
          </div>
          <div>
            <Label>Current year</Label>
            <Select value={String(form.currentSemester)}
              onValueChange={(v) => setField('currentSemester', Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {Array.from({ length: 8 }, (_, i) => i + 1).map(n => (
                  <SelectItem key={n} value={String(n)}>{formatYear(n)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Roll Number</Label>
            <Input value={form.rollNumber} onChange={(e) => setField('rollNumber', e.target.value)} placeholder="e.g. 260bca001" />
          </div>
        </div>

        <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Personal</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => setField('gender', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Date of birth</Label>
            <Input type="date" value={form.dob} onChange={(e) => setField('dob', e.target.value)} />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setField('category', v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {["General", "OBC", "SC", "ST", "EWS"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Blood group</Label>
            <Input value={form.bloodGroup} onChange={(e) => setField('bloodGroup', e.target.value)} placeholder="e.g. O+" />
          </div>
        </div>

        <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contact</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label className={errors.phone ? "text-destructive" : ""}>Mobile no.</Label>
            <Input 
              type="text" 
              maxLength={10} 
              className={errors.phone ? "border-destructive focus-visible:ring-destructive" : ""}
              value={form.phone} 
              onChange={(e) => setField('phone', e.target.value.replace(/\D/g, ''))} 
              placeholder="10-digit number" 
            />
            {errors.phone && <p className="mt-1 text-[10px] text-destructive">{errors.phone}</p>}
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setField('email', e.target.value)} />
          </div>
          <div>
            <Label className={errors.guardian ? "text-destructive" : ""}>Guardian name</Label>
            <Input 
              className={errors.guardian ? "border-destructive focus-visible:ring-destructive" : ""}
              value={form.guardian} 
              onChange={(e) => setField('guardian', e.target.value.replace(/[^A-Za-z\s]/g, ''))} 
            />
            {errors.guardian && <p className="mt-1 text-[10px] text-destructive">{errors.guardian}</p>}
          </div>
          <div>
            <Label className={errors.guardianPhone ? "text-destructive" : ""}>Guardian mobile</Label>
            <Input 
              type="text" 
              maxLength={10} 
              className={errors.guardianPhone ? "border-destructive focus-visible:ring-destructive" : ""}
              value={form.guardianPhone} 
              onChange={(e) => setField('guardianPhone', e.target.value.replace(/\D/g, ''))} 
              placeholder="10-digit number" 
            />
            {errors.guardianPhone && <p className="mt-1 text-[10px] text-destructive">{errors.guardianPhone}</p>}
          </div>
          <div className="sm:col-span-2">
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => setField('address', e.target.value)} placeholder="House, street, area" />
          </div>
          <div>
            <Label className={errors.city ? "text-destructive" : ""}>City</Label>
            <Input 
              className={errors.city ? "border-destructive focus-visible:ring-destructive" : ""}
              value={form.city} 
              onChange={(e) => setField('city', e.target.value.replace(/[^A-Za-z\s]/g, ''))} 
            />
            {errors.city && <p className="mt-1 text-[10px] text-destructive">{errors.city}</p>}
          </div>
          <div>
            <Label className={errors.state ? "text-destructive" : ""}>State</Label>
            <Input 
              className={errors.state ? "border-destructive focus-visible:ring-destructive" : ""}
              value={form.state} 
              onChange={(e) => setField('state', e.target.value.replace(/[^A-Za-z\s]/g, ''))} 
            />
            {errors.state && <p className="mt-1 text-[10px] text-destructive">{errors.state}</p>}
          </div>
          <div>
            <Label>Pincode</Label>
            <Input value={form.pincode} onChange={(e) => setField('pincode', e.target.value)} />
          </div>
        </div>

        <DialogFooter className="sm:justify-between">
          <div className="flex justify-start">
            {isEditing && (
              <Button type="button" variant="ghost" className="text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={handleDelete} disabled={removeStudentMutation.isPending}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={saveStudentMutation.isPending} onClick={submit}>
              {saveStudentMutation.isPending ? 'Saving...' : (isEditing ? 'Save changes' : 'Add student')}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

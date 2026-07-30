import { useState, useEffect, useRef } from "react";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { formatYear } from "@/lib/store";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";

export function StudentFormDialog({ programs, student, buttonVariant = "icon" }: { programs: any[], student?: any, buttonVariant?: "icon" | "default" | "outline" }) {
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
    category: "GENERAL",
    bloodGroup: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });

  const prevOpenRef = useRef(false);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      setErrors({});
      if (isEditing && student) {
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
          category: student.category || "GENERAL",
          bloodGroup: student.blood_group || "",
          address: student.address || "",
          city: student.city || "",
          state: student.state || "",
          pincode: student.pincode || "",
        });
      } else {
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
          category: "GENERAL",
          bloodGroup: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
        });
      }
    }
    prevOpenRef.current = open;
  }, [isEditing, student, open, programs]);

  useEffect(() => {
    if (isEditing || !open || !form.programId || !form.joinedYear) return;
    
    async function fetchNumbers() {
      const joinYY = form.joinedYear.toString().slice(-2);
      const prog = programs.find(p => p.id === form.programId);
      const durationYears = prog ? Math.ceil(prog.total_semesters / 2) : 3;
      const completeYY = (form.joinedYear + durationYears).toString().slice(-2);
      const adPrefix = `${joinYY}0${completeYY}`;
      
      // Fetch Max Admission No with prefix
      const { data: adData } = await supabase.from('students')
        .select('admission_no')
        .like('admission_no', `${adPrefix}%`)
        .order('admission_no', { ascending: false })
        .limit(1);

      let nextAd = `${adPrefix}101`;
      if (adData && adData.length > 0 && adData[0].admission_no) {
        const lastAd = adData[0].admission_no;
        const match = lastAd.match(/\d+$/);
        if (match) {
           const nextVal = (BigInt(match[0]) + 1n).toString().padStart(match[0].length, '0');
           nextAd = lastAd.replace(/\d+$/, nextVal);
        }
      }

      // Fetch Max Roll No with prefix
      const progIndex = programs.findIndex(p => p.id === form.programId);
      const progWord = prog ? (prog.name || "").replace(/[^A-Za-z]/g, '').toUpperCase() : "";
      const rollPrefix = `${joinYY}0${progWord}`;
      
      const defaultSeries = "1001";

      const { data: rollData } = await supabase.from('students')
        .select('roll_number')
        .like('roll_number', `${rollPrefix}%`)
        .order('roll_number', { ascending: false })
        .limit(1);

      let nextRoll = `${rollPrefix}${defaultSeries}`;
      if (rollData && rollData.length > 0 && rollData[0].roll_number) {
        const lastRoll = rollData[0].roll_number;
        const match = lastRoll.match(/\d+$/);
        if (match) {
           const nextVal = (BigInt(match[0]) + 1n).toString().padStart(match[0].length, '0');
           nextRoll = lastRoll.replace(/\d+$/, nextVal);
        }
      }

      setForm(f => ({ ...f, admissionNo: nextAd, rollNumber: nextRoll }));
    }
    fetchNumbers();
  }, [isEditing, open, form.programId, form.joinedYear, programs]);

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
      queryClient.invalidateQueries({ queryKey: ['student', student?.id] });
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
      // Might want to navigate away if deleting from profile page, handled upstream or user clicks back
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
          buttonVariant === "icon" ? (
            <Button variant="ghost" size="icon" title="Edit student">
              <Pencil className="h-4 w-4" />
            </Button>
          ) : (
            <Button variant={buttonVariant} size="sm">
              <Pencil className="mr-2 h-4 w-4" /> Edit Details
            </Button>
          )
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
              onChange={(e) => setField('name', e.target.value.replace(/[^A-Za-z\s]/g, '').toUpperCase())} 
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
            <Label>Joining Year</Label>
            <Select value={String(form.joinedYear)} onValueChange={(v) => setField('joinedYear', Number(v))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026, 2027, 2028, 2029].map(y => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                {[1, 2, 3].map(n => (
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
                {["GENERAL", "OBC", "S.C.", "Others"].map((c) => (
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
            <Label className={errors.guardian ? "text-destructive" : ""}>Father's Name</Label>
            <Input 
              className={errors.guardian ? "border-destructive focus-visible:ring-destructive" : ""}
              value={form.guardian} 
              onChange={(e) => setField('guardian', e.target.value.replace(/[^A-Za-z\s]/g, '').toUpperCase())} 
            />
            {errors.guardian && <p className="mt-1 text-[10px] text-destructive">{errors.guardian}</p>}
          </div>
          <div>
            <Label className={errors.guardianPhone ? "text-destructive" : ""}>Father's mobile</Label>
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

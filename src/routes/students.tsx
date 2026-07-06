import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search, Trash2 } from "lucide-react";

import { useStore, studentTotals, inr } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/students")({
  head: () => ({
    meta: [
      { title: "Students — Northfield CMS" },
      { name: "description", content: "Directory of enrolled students with class and semester rolls." },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const students = useStore((s) => s.students);
  const programs = useStore((s) => s.programs);
  const charges = useStore((s) => s.charges);
  const adjustments = useStore((s) => s.adjustments);
  const payments = useStore((s) => s.payments);
  const removeStudent = useStore((s) => s.removeStudent);
  const canEdit = useStore((s) => s.can("students", "edit"));

  const [q, setQ] = useState("");
  const [program, setProgram] = useState<string>("all");
  const [sem, setSem] = useState<string>("all");

  const filtered = useMemo(() => {
    return students.filter((s) => {
      if (program !== "all" && s.programId !== program) return false;
      if (sem !== "all" && s.currentSemester !== Number(sem)) return false;
      if (q) {
        const t = q.toLowerCase();
        const hit =
          s.name.toLowerCase().includes(t) ||
          s.admissionNo.toLowerCase().includes(t) ||
          Object.values(s.rolls).some((r) => r.toLowerCase().includes(t));
        if (!hit) return false;
      }
      return true;
    });
  }, [students, q, program, sem]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Registry</p>
          <h1 className="font-display text-3xl font-semibold text-foreground">Students</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {students.length} enrolled · semester-wise roll numbers tracked per student.
          </p>
        </div>
        {canEdit && <AddStudentDialog />}
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
          <Select value={program} onValueChange={setProgram}>
            <SelectTrigger className="w-[180px]"><SelectValue placeholder="Program" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programs</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sem} onValueChange={setSem}>
            <SelectTrigger className="w-[160px]"><SelectValue placeholder="Semester" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All semesters</SelectItem>
              {[1, 2, 3, 4, 5, 6].map((n) => (
                <SelectItem key={n} value={String(n)}>Semester {n}</SelectItem>
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
                  <th className="px-4 py-3 font-medium">Admission No</th>
                  <th className="px-4 py-3 font-medium">Program</th>
                  <th className="px-4 py-3 font-medium">Semester</th>
                  <th className="px-4 py-3 font-medium">Current roll</th>
                  <th className="px-4 py-3 text-right font-medium">Balance</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.length === 0 && (
                  <tr><td colSpan={7} className="p-6 text-center text-muted-foreground">No students match your filters.</td></tr>
                )}
                {filtered.map((s) => {
                  const program = programs.find((p) => p.id === s.programId);
                  const t = studentTotals(s.id, s.currentSemester, { charges, adjustments, payments });
                  return (
                    <tr key={s.id} className="hover:bg-accent/40">
                      <td className="px-4 py-3">
                        <Link to="/students/$studentId" params={{ studentId: s.id }} className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                            {s.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{s.name}</p>
                            <p className="text-xs text-muted-foreground">{s.email}</p>
                          </div>
                        </Link>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.admissionNo}</td>
                      <td className="px-4 py-3">{program?.name ?? "—"}</td>
                      <td className="px-4 py-3">Sem {s.currentSemester}</td>
                      <td className="px-4 py-3 font-mono text-xs">{s.rolls[s.currentSemester] || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        {t.balance > 0 ? (
                          <Badge variant="destructive">{inr(t.balance)}</Badge>
                        ) : (
                          <Badge className="bg-success text-success-foreground hover:bg-success/90">Cleared</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost" size="icon"
                          disabled={!canEdit}
                          title={canEdit ? "Delete student" : "You don't have permission to delete students"}
                          onClick={() => {
                            if (!canEdit) return;
                            if (confirm(`Delete ${s.name}? This removes all fee records.`)) {
                              removeStudent(s.id);
                              toast.success("Student removed");
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AddStudentDialog() {
  const programs = useStore((s) => s.programs);
  const addStudent = useStore((s) => s.addStudent);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    admissionNo: "",
    name: "",
    programId: programs[0]?.id ?? "",
    currentSemester: 1,
    roll: "",
    joinedYear: new Date().getFullYear(),
    email: "",
    phone: "",
    guardian: "",
    guardianPhone: "",
    gender: "male" as "male" | "female" | "other",
    dob: "",
    category: "General",
    bloodGroup: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
  });


  const submit = () => {
    if (!form.name.trim() || !form.admissionNo.trim() || !form.programId) {
      toast.error("Name, admission no. and program are required");
      return;
    }
    const rolls: Record<number, string> = {};
    if (form.roll) rolls[form.currentSemester] = form.roll;
    addStudent({
      admissionNo: form.admissionNo.trim(),
      name: form.name.trim(),
      programId: form.programId,
      currentSemester: form.currentSemester,
      joinedYear: form.joinedYear,
      email: form.email || undefined,
      phone: form.phone || undefined,
      guardian: form.guardian || undefined,
      guardianPhone: form.guardianPhone || undefined,
      gender: form.gender,
      dob: form.dob || undefined,
      category: form.category || undefined,
      bloodGroup: form.bloodGroup || undefined,
      address: form.address || undefined,
      city: form.city || undefined,
      state: form.state || undefined,
      pincode: form.pincode || undefined,
      status: "active",
      rolls,
    });
    toast.success("Student added");
    setOpen(false);
    setForm((f) => ({
      ...f, admissionNo: "", name: "", roll: "", email: "", phone: "",
      guardian: "", guardianPhone: "", dob: "", bloodGroup: "",
      address: "", city: "", state: "", pincode: "",
    }));
  };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-1 h-4 w-4" /> New student</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display">Add student</DialogTitle>
          <DialogDescription>Register a new admission with personal details and current semester roll.</DialogDescription>
        </DialogHeader>

        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Academic</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <Label>Full name</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div>
            <Label>Admission no.</Label>
            <Input value={form.admissionNo} onChange={(e) => setForm({ ...form, admissionNo: e.target.value })} />
          </div>
          <div>
            <Label>Joined year</Label>
            <Input type="number" value={form.joinedYear}
              onChange={(e) => setForm({ ...form, joinedYear: Number(e.target.value) })} />
          </div>
          <div>
            <Label>Program</Label>
            <Select value={form.programId} onValueChange={(v) => setForm({ ...form, programId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {programs.map((p) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Current semester</Label>
            <Select value={String(form.currentSemester)}
              onValueChange={(v) => setForm({ ...form, currentSemester: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <SelectItem key={n} value={String(n)}>Semester {n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="sm:col-span-2">
            <Label>Roll no. (for current semester)</Label>
            <Input value={form.roll} onChange={(e) => setForm({ ...form, roll: e.target.value })} placeholder="e.g. BC24-15" />
          </div>
        </div>

        <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Personal</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Gender</Label>
            <Select value={form.gender} onValueChange={(v) => setForm({ ...form, gender: v as typeof form.gender })}>
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
            <Input type="date" value={form.dob} onChange={(e) => setForm({ ...form, dob: e.target.value })} />
          </div>
          <div>
            <Label>Category</Label>
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
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
            <Input value={form.bloodGroup} onChange={(e) => setForm({ ...form, bloodGroup: e.target.value })} placeholder="e.g. O+" />
          </div>
        </div>

        <p className="mt-2 text-xs font-semibold uppercase tracking-widest text-muted-foreground">Contact</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label>Mobile no.</Label>
            <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 …" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div>
            <Label>Guardian name</Label>
            <Input value={form.guardian} onChange={(e) => setForm({ ...form, guardian: e.target.value })} />
          </div>
          <div>
            <Label>Guardian mobile</Label>
            <Input value={form.guardianPhone} onChange={(e) => setForm({ ...form, guardianPhone: e.target.value })} />
          </div>
          <div className="sm:col-span-2">
            <Label>Address</Label>
            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="House, street, area" />
          </div>
          <div>
            <Label>City</Label>
            <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          </div>
          <div>
            <Label>State</Label>
            <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} />
          </div>
          <div>
            <Label>Pincode</Label>
            <Input value={form.pincode} onChange={(e) => setForm({ ...form, pincode: e.target.value })} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit}>Add student</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


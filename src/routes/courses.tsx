import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2, Pencil, Settings } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Courses — Imperial CMS" },
      { name: "description", content: "Program, semester and course catalog." },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const [programFilter, setProgramFilter] = useState("all");
  const { can } = useAuth();
  const canEdit = can("courses", "edit");
  const queryClient = useQueryClient();

  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("programs").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["courses"],
    queryFn: async () => {
      const { data, error } = await supabase.from("courses").select("*");
      if (error) throw error;
      return data;
    },
  });

  const removeCourse = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("courses").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const grouped = useMemo(() => {
    const filtered = programFilter === "all" ? courses : courses.filter((c) => c.program_id === programFilter);
    const map: Record<string, typeof courses> = {};
    filtered.forEach((c) => {
      const key = `${c.program_id}::${c.semester}`;
      (map[key] = map[key] ?? []).push(c);
    });
    return map;
  }, [courses, programFilter]);

  if (isLoading) return <div className="p-8 animate-pulse text-muted-foreground">Loading courses...</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Academics</p>
          <h1 className="font-display text-3xl font-semibold text-foreground">Course Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Program & semester-wise course catalog.</p>
        </div>
        <div className="flex gap-2">
          <Select value={programFilter} onValueChange={setProgramFilter}>
            <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All programs</SelectItem>
              {programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {canEdit && <ManageProgramsDialog programs={programs} />}
          {canEdit && <AddCourseDialog programs={programs} />}
        </div>
      </div>

      <div className="space-y-6">
        {Object.entries(grouped).length === 0 && (
          <p className="text-sm text-muted-foreground">No courses yet.</p>
        )}
        {Object.entries(grouped)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([key, list]) => {
            const [pid, sem] = key.split("::");
            const prog = programs.find((p) => p.id === pid);
            return (
              <Card key={key}>
                <CardContent className="p-0">
                  <div className="flex items-center justify-between border-b border-border px-5 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-muted-foreground">{prog?.name}</p>
                      <h3 className="font-display text-lg font-semibold">Semester {sem}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{list.length} courses</p>
                  </div>
                  <table className="w-full text-sm">
                    <tbody className="divide-y divide-border">
                      {list.map((c) => (
                        <tr key={c.id}>
                          <td className="px-5 py-3 font-mono text-xs text-muted-foreground">{c.code}</td>
                          <td className="px-5 py-3 font-medium">{c.title}</td>
                          <td className="px-5 py-3 text-right text-muted-foreground">{c.credits} cr.</td>
                          <td className="px-5 py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <EditCourseDialog 
                                course={c} 
                                programs={programs} 
                                canEdit={canEdit}
                                onRemove={() => removeCourse.mutate(c.id)}
                                isRemoving={removeCourse.isPending}
                              />
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            );
          })}
      </div>
    </div>
  );
}

function AddCourseDialog({ programs }: { programs: any[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [c, setC] = useState({
    program_id: programs[0]?.id ?? "",
    semester: 1, code: "", title: "", credits: 4,
  });

  const addCourse = useMutation({
    mutationFn: async (course: any) => {
      const { error } = await supabase.from("courses").insert([course]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course added");
      setOpen(false);
      setC({ ...c, code: "", title: "" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const p = programs.find((prog) => prog.id === c.program_id);
  const maxSemesters = p ? p.total_semesters : 8;
  const semOptions = Array.from({ length: maxSemesters }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-1 h-4 w-4" /> Add course</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Add course</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Program</Label>
            <Select value={c.program_id} onValueChange={(v) => {
              setC({ ...c, program_id: v, semester: 1 });
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Semester</Label>
            <Select value={String(c.semester)} onValueChange={(v) => setC({ ...c, semester: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{semOptions.map((n) => <SelectItem key={n} value={String(n)}>Semester {n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Course code</Label><Input value={c.code} onChange={(e) => setC({ ...c, code: e.target.value })} /></div>
          <div><Label>Credits</Label><Input type="number" min={1} value={c.credits} onChange={(e) => setC({ ...c, credits: Number(e.target.value) })} /></div>
          <div className="sm:col-span-2"><Label>Title</Label><Input value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={addCourse.isPending} onClick={() => {
            if (!c.title.trim() || !c.code.trim()) return toast.error("Code and title required");
            addCourse.mutate(c);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function EditCourseDialog({ course, programs, canEdit, onRemove, isRemoving }: { course: any, programs: any[], canEdit: boolean, onRemove: () => void, isRemoving: boolean }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [c, setC] = useState({ ...course });

  const editCourse = useMutation({
    mutationFn: async (updatedCourse: any) => {
      const { id, ...updates } = updatedCourse;
      const { error } = await supabase.from("courses").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["courses"] });
      toast.success("Course updated");
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const p = programs.find((prog) => prog.id === c.program_id);
  const maxSemesters = p ? p.total_semesters : 8;
  const semOptions = Array.from({ length: maxSemesters }, (_, i) => i + 1);

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o) setC({ ...course });
    }}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" disabled={!canEdit}>
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Edit course</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Program</Label>
            <Select value={c.program_id} onValueChange={(v) => {
              setC({ ...c, program_id: v, semester: 1 });
            }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Semester</Label>
            <Select value={String(c.semester)} onValueChange={(v) => setC({ ...c, semester: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{semOptions.map((n) => <SelectItem key={n} value={String(n)}>Semester {n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Course code</Label><Input value={c.code} onChange={(e) => setC({ ...c, code: e.target.value })} /></div>
          <div><Label>Credits</Label><Input type="number" min={1} value={c.credits} onChange={(e) => setC({ ...c, credits: Number(e.target.value) })} /></div>
          <div className="sm:col-span-2"><Label>Title</Label><Input value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} /></div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="destructive" disabled={!canEdit || isRemoving} onClick={onRemove}>
            Delete
          </Button>
          <div className="flex justify-end gap-2 mt-2 sm:mt-0">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={editCourse.isPending} onClick={() => {
              if (!c.title.trim() || !c.code.trim()) return toast.error("Code and title required");
              editCourse.mutate(c);
            }}>Save changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export function ManageProgramsDialog({ programs }: { programs: any[] }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [semesters, setSemesters] = useState(6);
  
  const queryClient = useQueryClient();

  const addProgram = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("programs").insert({ name, code, total_semesters: semesters });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success("Program added");
      setAdding(false);
      setName("");
      setCode("");
      setSemesters(6);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeProgram = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("programs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success("Program removed");
    },
    onError: (e: any) => toast.error("Could not remove program (it might be in use by courses/students)."),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Settings className="mr-2 h-4 w-4" /> Settings</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Programs</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {programs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No programs found.</p>
          ) : (
            <div className="space-y-2">
              {programs.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                  <div>
                    <span className="font-medium">{p.name} ({p.code})</span>
                    <span className="ml-2 text-muted-foreground">{p.total_semesters} Semesters</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => { if(confirm(`Remove ${p.name}?`)) removeProgram.mutate(p.id) }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          {adding ? (
            <div className="space-y-3 rounded-md border bg-muted/50 p-3 mt-4">
              <h4 className="text-sm font-medium">New Program</h4>
              <div className="grid gap-2">
                <Label>Program Name (e.g. Bachelor of Arts)</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Program Code (e.g. BA)</Label>
                <Input value={code} onChange={e => setCode(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Total Semesters</Label>
                <Input type="number" value={semesters} onChange={e => setSemesters(Number(e.target.value))} />
              </div>
              <div className="flex gap-2 justify-end mt-2">
                <Button variant="ghost" onClick={() => setAdding(false)}>Cancel</Button>
                <Button disabled={!name || !code || addProgram.isPending} onClick={() => addProgram.mutate()}>Save</Button>
              </div>
            </div>
          ) : (
            <Button variant="outline" className="w-full mt-4" onClick={() => setAdding(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Program
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

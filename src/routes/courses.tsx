import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

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
  const canEdit = useStore((s) => s.can("courses", "edit"));
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
          <h1 className="font-display text-3xl font-semibold text-foreground">Courses</h1>
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
                            <Button variant="ghost" size="icon" disabled={!canEdit || removeCourse.isPending} onClick={() => removeCourse.mutate(c.id)}>
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
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

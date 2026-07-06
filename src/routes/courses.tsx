import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";

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
      { title: "Courses — Northfield CMS" },
      { name: "description", content: "Program, semester and course catalog." },
    ],
  }),
  component: CoursesPage,
});

function CoursesPage() {
  const programs = useStore((s) => s.programs);
  const courses = useStore((s) => s.courses);
  const removeCourse = useStore((s) => s.removeCourse);

  const [programFilter, setProgramFilter] = useState("all");

  const grouped = useMemo(() => {
    const filtered = programFilter === "all" ? courses : courses.filter((c) => c.programId === programFilter);
    const map: Record<string, typeof courses> = {};
    filtered.forEach((c) => {
      const key = `${c.programId}::${c.semester}`;
      (map[key] = map[key] ?? []).push(c);
    });
    return map;
  }, [courses, programFilter]);

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
          <AddCourseDialog />
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
                            <Button variant="ghost" size="icon" onClick={() => { removeCourse(c.id); toast.success("Removed"); }}>
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

function AddCourseDialog() {
  const programs = useStore((s) => s.programs);
  const addCourse = useStore((s) => s.addCourse);
  const [open, setOpen] = useState(false);
  const [c, setC] = useState({
    programId: programs[0]?.id ?? "",
    semester: 1, code: "", title: "", credits: 4,
  });

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
            <Select value={c.programId} onValueChange={(v) => setC({ ...c, programId: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{programs.map((p) => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Semester</Label>
            <Select value={String(c.semester)} onValueChange={(v) => setC({ ...c, semester: Number(v) })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{[1,2,3,4,5,6].map((n) => <SelectItem key={n} value={String(n)}>Semester {n}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div><Label>Course code</Label><Input value={c.code} onChange={(e) => setC({ ...c, code: e.target.value })} /></div>
          <div><Label>Credits</Label><Input type="number" value={c.credits} onChange={(e) => setC({ ...c, credits: Number(e.target.value) })} /></div>
          <div className="sm:col-span-2"><Label>Title</Label><Input value={c.title} onChange={(e) => setC({ ...c, title: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!c.title.trim() || !c.code.trim()) return toast.error("Code and title required");
            addCourse(c); toast.success("Course added"); setOpen(false);
            setC({ ...c, code: "", title: "" });
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

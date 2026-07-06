import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2 } from "lucide-react";

import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty")({
  head: () => ({
    meta: [
      { title: "Faculty — Northfield CMS" },
      { name: "description", content: "Faculty and staff directory." },
    ],
  }),
  component: FacultyPage,
});

function FacultyPage() {
  const faculty = useStore((s) => s.faculty);
  const removeFaculty = useStore((s) => s.removeFaculty);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Administration</p>
          <h1 className="font-display text-3xl font-semibold text-foreground">Faculty</h1>
          <p className="mt-1 text-sm text-muted-foreground">{faculty.length} members across departments.</p>
        </div>
        <AddFacultyDialog />
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {faculty.map((f) => (
          <Card key={f.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {f.name.split(" ").map((p) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.designation}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={() => {
                  if (confirm(`Remove ${f.name}?`)) { removeFaculty(f.id); toast.success("Removed"); }
                }}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
              <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                <p><span className="text-foreground">Dept:</span> {f.department}</p>
                <p><span className="text-foreground">Email:</span> {f.email}</p>
                {f.phone && <p><span className="text-foreground">Phone:</span> {f.phone}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function AddFacultyDialog() {
  const addFaculty = useStore((s) => s.addFaculty);
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ name: "", email: "", department: "", designation: "", phone: "" });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-1 h-4 w-4" /> Add faculty</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle className="font-display">Add faculty</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><Label>Department</Label><Input value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} /></div>
          <div><Label>Designation</Label><Input value={f.designation} onChange={(e) => setF({ ...f, designation: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => {
            if (!f.name.trim()) return toast.error("Name required");
            addFaculty(f); toast.success("Faculty added"); setOpen(false);
            setF({ name: "", email: "", department: "", designation: "", phone: "" });
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

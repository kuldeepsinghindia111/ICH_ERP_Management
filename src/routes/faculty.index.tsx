import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
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
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/faculty/")({
  head: () => ({
    meta: [
      { title: "Faculty — Imperial CMS" },
      { name: "description", content: "Faculty and staff directory." },
    ],
  }),
  component: FacultyPage,
});

function FacultyPage() {
  const queryClient = useQueryClient();
  const { can } = useAuth();
  const canEdit = can("faculty", "edit");

  const { data: faculty = [], isLoading } = useQuery({
    queryKey: ["faculty"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faculty").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const removeFaculty = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("faculty").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      toast.success("Removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 animate-pulse text-muted-foreground">Loading faculty...</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Administration</p>
          <h1 className="font-display text-3xl font-semibold text-foreground">Faculty Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">{faculty.length} members across departments.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="outline">
            <Link to="/settings"><Settings className="mr-1 h-4 w-4" /> Settings</Link>
          </Button>
          {canEdit && <AddFacultyDialog />}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {faculty.map((f: any) => (
          <Card key={f.id}>
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                    {f.name.split(" ").map((p: string) => p[0]).slice(0, 2).join("")}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{f.name}</p>
                    <p className="text-xs text-muted-foreground">{f.designation}</p>
                  </div>
                </div>
                <div>
                  <Button asChild variant="ghost" size="sm">
                    <Link to="/faculty/$facultyId" params={{ facultyId: f.id }}>View Profile</Link>
                  </Button>
                </div>
              </div>
              <div className="mt-4 space-y-1 text-xs text-muted-foreground">
                <p><span className="text-foreground">Dept:</span> {f.department}</p>
                <p><span className="text-foreground">Email:</span> {f.email}</p>
                {f.phone && <p><span className="text-foreground">Phone:</span> {f.phone}</p>}
              </div>
            </CardContent>
          </Card>
        ))}
        {faculty.length === 0 && (
          <p className="col-span-full text-muted-foreground text-sm">No faculty members found.</p>
        )}
      </div>
    </div>
  );
}

function AddFacultyDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({
    name: "",
    email: "",
    department: "",
    designation: "",
    phone: "",
    employee_id: "",
    gender: "male",
    status: "Active",
    role_type: "Teaching Staff",
    aadhar_number: "",
    base_salary: "0"
  });

  const addFaculty = useMutation({
    mutationFn: async (fac: any) => {
      const { error } = await supabase.from("faculty").insert([fac]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      toast.success("Faculty added");
      setOpen(false);
      setF({ name: "", email: "", department: "", designation: "", phone: "", employee_id: "", gender: "male", status: "Active", role_type: "Teaching Staff", aadhar_number: "", base_salary: "0" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button><Plus className="mr-1 h-4 w-4" /> Add faculty</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">Add faculty</DialogTitle></DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Name</Label><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><Label>Employee ID</Label><Input value={f.employee_id} onChange={(e) => setF({ ...f, employee_id: e.target.value })} /></div>
          <div><Label>Department</Label><Input value={f.department} onChange={(e) => setF({ ...f, department: e.target.value })} /></div>
          <div><Label>Designation</Label><Input value={f.designation} onChange={(e) => setF({ ...f, designation: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <div><Label>Aadhar No.</Label><Input value={f.aadhar_number} onChange={(e) => setF({ ...f, aadhar_number: e.target.value })} /></div>
          <div>
            <Label>Base Salary</Label>
            <Input type="number" value={f.base_salary} onChange={(e) => setF({ ...f, base_salary: e.target.value })} />
          </div>
          <div>
            <Label>Role Type</Label>
            <select className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring" value={f.role_type} onChange={(e) => setF({ ...f, role_type: e.target.value })}>
              <option value="Teaching Staff">Teaching Staff</option>
              <option value="Non-Teaching Staff">Non-Teaching Staff</option>
              <option value="Supportive Staff">Supportive Staff</option>
              <option value="Temporary Staff">Temporary Staff</option>
            </select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={addFaculty.isPending} onClick={() => {
            if (!f.name.trim()) return toast.error("Name required");
            addFaculty.mutate(f);
          }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}



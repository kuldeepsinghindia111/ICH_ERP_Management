import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, Pencil, Settings, UserCircle, Briefcase, Mail, Phone, Hash, Save, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/faculty/$facultyId")({
  head: () => ({
    meta: [{ title: "Faculty Profile — Imperial CMS" }],
  }),
  component: FacultyProfilePage,
});

function FacultyProfilePage() {
  const { facultyId } = Route.useParams();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { can } = useAuth();
  const canEdit = can("faculty", "edit");

  const { data: faculty, isLoading } = useQuery({
    queryKey: ["faculty", facultyId],
    queryFn: async () => {
      const { data, error } = await supabase.from("faculty").select("*").eq("id", facultyId).single();
      if (error) throw error;
      return data;
    },
  });

  const removeFaculty = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("faculty").delete().eq("id", facultyId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      toast.success("Faculty removed");
      navigate({ to: "/faculty" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="p-8 animate-pulse text-muted-foreground">Loading faculty details...</div>;
  if (!faculty) return <div className="p-8 text-destructive">Faculty not found.</div>;

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-6 py-8">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/faculty"><ArrowLeft className="h-4 w-4" /></Link>
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-semibold text-foreground">{faculty.name}</h1>
            <Badge variant={faculty.status === "Active" ? "default" : faculty.status === "On Leave" ? "secondary" : "destructive"}>
              {faculty.status || "Active"}
            </Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">{faculty.designation} &bull; {faculty.department}</p>
        </div>
        <div className="ml-auto">
          {canEdit && (
            <EditFacultyFullDialog 
              faculty={faculty} 
              onRemove={() => { if (confirm(`Remove ${faculty.name}? This cannot be undone.`)) { removeFaculty.mutate(); } }}
              isRemoving={removeFaculty.isPending}
            />
          )}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="space-y-6 md:col-span-1">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><UserCircle className="h-4 w-4 text-muted-foreground" /> Personal Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Employee ID</span>
                <span className="font-medium">{faculty.employee_id || "—"}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Gender</span>
                <span className="font-medium capitalize">{faculty.gender || "—"}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Date of Birth</span>
                <span className="font-medium">{faculty.dob ? new Date(faculty.dob).toLocaleDateString() : "—"}</span>
              </div>
              <div className="grid grid-cols-2">
                <span className="text-muted-foreground">Blood Group</span>
                <span className="font-medium">{faculty.blood_group || "—"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Address</span>
                <span className="font-medium mt-1">{faculty.address || "—"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Mail className="h-4 w-4 text-muted-foreground" /> Contact</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex flex-col">
                <span className="text-muted-foreground">Email</span>
                <span className="font-medium">{faculty.email || "—"}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-muted-foreground">Phone</span>
                <span className="font-medium">{faculty.phone || "—"}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6 md:col-span-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Briefcase className="h-4 w-4 text-muted-foreground" /> Professional Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Role Type</span>
                  <span className="font-medium">{faculty.role_type || "—"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Joining Date</span>
                  <span className="font-medium">{faculty.joining_date ? new Date(faculty.joining_date).toLocaleDateString() : "—"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Qualification</span>
                  <span className="font-medium">{faculty.qualification || "—"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Experience</span>
                  <span className="font-medium">{faculty.experience_years ? `${faculty.experience_years} years` : "—"}</span>
                </div>
              </div>
              <div className="flex flex-col pt-2 border-t">
                <span className="text-muted-foreground mb-1">Subjects Taught</span>
                <span className="font-medium">{faculty.subjects_taught || "—"}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base"><Hash className="h-4 w-4 text-muted-foreground" /> Official Records</CardTitle>
              <CardDescription>Sensitive information for administrative use only.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-muted-foreground">PAN Number</span>
                  <span className="font-medium uppercase tracking-wider">{faculty.pan_number || "—"}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-muted-foreground">Bank Account Details</span>
                  <span className="font-medium whitespace-pre-wrap">{faculty.bank_account_details || "—"}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function EditFacultyFullDialog({ faculty, onRemove, isRemoving }: { faculty: any, onRemove: () => void, isRemoving: boolean }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [f, setF] = useState({ ...faculty });

  const editFaculty = useMutation({
    mutationFn: async (fac: any) => {
      const { id, created_at, ...updates } = fac;
      const { error } = await supabase.from("faculty").update(updates).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty"] });
      toast.success("Faculty updated");
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => {
      setOpen(o);
      if (o) setF({ ...faculty });
    }}>
      <DialogTrigger asChild>
        <Button variant="outline"><Pencil className="mr-2 h-4 w-4" /> Edit Details</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle className="font-display">Edit Faculty Details</DialogTitle></DialogHeader>
        
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-2">Basic Info</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Name</Label><Input value={f.name || ""} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
          <div><Label>Employee ID</Label><Input value={f.employee_id || ""} onChange={(e) => setF({ ...f, employee_id: e.target.value })} /></div>
          <div>
            <Label>Status</Label>
            <Select value={f.status || "Active"} onValueChange={(v) => setF({ ...f, status: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Inactive">Inactive</SelectItem>
                <SelectItem value="On Leave">On Leave</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-2">Professional</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Department</Label><Input value={f.department || ""} onChange={(e) => setF({ ...f, department: e.target.value })} /></div>
          <div><Label>Designation</Label><Input value={f.designation || ""} onChange={(e) => setF({ ...f, designation: e.target.value })} /></div>
          <div>
            <Label>Role Type</Label>
            <Select value={f.role_type || "Teaching"} onValueChange={(v) => setF({ ...f, role_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Teaching">Teaching</SelectItem>
                <SelectItem value="Non-Teaching">Non-Teaching</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Joining Date</Label><Input type="date" value={f.joining_date || ""} onChange={(e) => setF({ ...f, joining_date: e.target.value })} /></div>
          <div><Label>Qualification</Label><Input value={f.qualification || ""} onChange={(e) => setF({ ...f, qualification: e.target.value })} /></div>
          <div><Label>Experience (Years)</Label><Input type="number" value={f.experience_years || ""} onChange={(e) => setF({ ...f, experience_years: parseInt(e.target.value) || null })} /></div>
          <div className="sm:col-span-2"><Label>Subjects Taught</Label><Input value={f.subjects_taught || ""} onChange={(e) => setF({ ...f, subjects_taught: e.target.value })} placeholder="e.g. Physics, Chemistry (Comma separated)" /></div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-2">Personal & Contact</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Email</Label><Input value={f.email || ""} onChange={(e) => setF({ ...f, email: e.target.value })} /></div>
          <div><Label>Phone</Label><Input value={f.phone || ""} onChange={(e) => setF({ ...f, phone: e.target.value })} /></div>
          <div>
            <Label>Gender</Label>
            <Select value={f.gender || "male"} onValueChange={(v) => setF({ ...f, gender: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div><Label>Date of Birth</Label><Input type="date" value={f.dob || ""} onChange={(e) => setF({ ...f, dob: e.target.value })} /></div>
          <div><Label>Blood Group</Label><Input value={f.blood_group || ""} onChange={(e) => setF({ ...f, blood_group: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Address</Label><Input value={f.address || ""} onChange={(e) => setF({ ...f, address: e.target.value })} /></div>
        </div>

        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mt-2">Financial</p>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>PAN Number</Label><Input className="uppercase" value={f.pan_number || ""} onChange={(e) => setF({ ...f, pan_number: e.target.value.toUpperCase() })} /></div>
          <div className="sm:col-span-2"><Label>Bank Account Details</Label><Input value={f.bank_account_details || ""} onChange={(e) => setF({ ...f, bank_account_details: e.target.value })} placeholder="Bank Name, Account No, IFSC Code" /></div>
        </div>

        <DialogFooter className="sm:justify-between mt-4">
          <Button variant="destructive" disabled={isRemoving} onClick={onRemove}>
            Delete Faculty
          </Button>
          <div className="flex justify-end gap-2 mt-2 sm:mt-0">
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button disabled={editFaculty.isPending} onClick={() => {
              if (!f.name?.trim()) return toast.error("Name required");
              editFaculty.mutate(f);
            }}>Save changes</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

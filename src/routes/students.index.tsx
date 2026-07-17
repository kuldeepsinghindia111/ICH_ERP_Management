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
import { StudentFormDialog } from "@/components/StudentFormDialog";
import { StudentImportDialog } from "@/components/StudentImportDialog";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/students/")({
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
  const [genderFilter, setGenderFilter] = useState<string>("all");
  const [sem, setSem] = useState<string>("all");
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const { data: { students = [], total = 0 } = {}, isLoading: loadingStudents } = useQuery({
    queryKey: ['students', page, q, programFilter, sem, genderFilter],
    queryFn: async () => {
      let query = supabase.from('students').select('*', { count: 'exact' }).order('created_at', { ascending: false });
      
      if (programFilter !== "all") query = query.eq('program_id', programFilter);
      if (sem !== "all") query = query.eq('current_semester', Number(sem));
      if (genderFilter !== "all") query = query.eq('gender', genderFilter);
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
  }, [q, programFilter, sem, genderFilter]);

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
          {canEdit && (
            <>
              <StudentImportDialog programs={programs} />
              <StudentFormDialog programs={programs} />
            </>
          )}
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
          <Select value={genderFilter} onValueChange={setGenderFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All genders</SelectItem>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
            </SelectContent>
          </Select>
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
                  <th className="px-4 py-3 font-medium">Category</th>
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
                      <td className="px-4 py-3">{s.category || "—"}</td>
                      <td className="px-4 py-3">
                        <div className="max-w-[150px] truncate" title={s.address}>{s.address || "—"}</div>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">{s.phone || "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.admission_no}</td>
                      <td className="px-4 py-3">{program?.name ?? "—"}</td>
                      <td className="px-4 py-3">{formatYear(s.current_semester)}</td>
                      <td className="px-4 py-3 font-mono text-xs">{s.roll_number || "—"}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex justify-end gap-2">
                          {canEdit && (
                            <Link 
                              to="/students/$studentId" 
                              params={{ studentId: s.id }}
                              className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                              title="View Full Profile"
                            >
                              <Pencil className="h-4 w-4" />
                            </Link>
                          )}
                          <Link 
                            to="/students/$studentId" 
                            params={{ studentId: s.id }}
                            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
                          >
                            View Profile
                          </Link>
                        </div>
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

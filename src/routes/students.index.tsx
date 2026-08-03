import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { Plus, Search, Trash2, Loader2, Pencil, Settings, LayoutList, Table, Phone, Mail, MapPin, User, GraduationCap, Shield } from "lucide-react";
import { useQuery, useMutation, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { toast } from "sonner";

import { useStore, formatYear } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks/use-auth";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StudentFormDialog } from "@/components/StudentFormDialog";
import { StudentImportDialog } from "@/components/StudentImportDialog";
import { ClassReportDialog } from "@/components/ClassReportDialog";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/students/")({
  head: () => ({
    meta: [
      { title: "Student Portal — Imperial CMS" },
      { name: "description", content: "Directory of enrolled students with permanent roll numbers." },
    ],
  }),
  component: StudentsPage,
});

function StudentsPage() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [viewMode, setViewMode] = useState<"vertical" | "table">("vertical");
  
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

  const removeStudent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('students').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['students'] });
      toast.success("Student deleted successfully");
    },
    onError: (e: any) => toast.error(e.message),
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
      {/* Top Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Registry</p>
          <h1 className="font-display text-3xl font-semibold text-blue-600 dark:text-blue-400">Student Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {total} enrolled · Permanent roll numbers tracked per student.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <ClassReportDialog programs={programs} defaultProgramId={programFilter} defaultSemester={sem} />
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

      {/* Filter and View Switcher Bar */}
      <Card>
        <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
          <div className="flex flex-wrap items-center gap-3 flex-1">
            <div className="relative min-w-60 flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name, admission or roll no."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
            <Select value={genderFilter} onValueChange={setGenderFilter}>
              <SelectTrigger className="w-35"><SelectValue placeholder="Gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All genders</SelectItem>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="w-45"><SelectValue placeholder="Program" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All programs</SelectItem>
                {programs.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sem} onValueChange={setSem}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Year" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All years</SelectItem>
                {[1, 2, 3].map((n) => (
                  <SelectItem key={n} value={String(n)}>{formatYear(n)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border">
            <Button
              variant={viewMode === "vertical" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-2.5 text-xs gap-1.5"
              onClick={() => setViewMode("vertical")}
              title="Vertical Stack Card View"
            >
              <LayoutList className="h-3.5 w-3.5" />
              Vertical View
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "ghost"}
              size="sm"
              className="h-8 px-2.5 text-xs gap-1.5"
              onClick={() => setViewMode("table")}
              title="Compact Table View"
            >
              <Table className="h-3.5 w-3.5" />
              Table View
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Area */}
      {students.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No students match your filters.
          </CardContent>
        </Card>
      ) : viewMode === "vertical" ? (
        /* ENHANCED VERTICAL CARDS VIEW */
        <div className="space-y-4">
          {students.map((s: any, idx: number) => {
            const program = programs.find((p: any) => p.id === s.program_id);
            const serialNo = (page - 1) * pageSize + idx + 1;

            return (
              <Card key={s.id} className="hover:border-primary/50 transition-all duration-200 shadow-sm overflow-hidden">
                <CardContent className="p-5 space-y-4">
                  {/* Top Bar: Primary Info & Actions */}
                  <div className="flex flex-wrap items-start justify-between gap-4 border-b pb-3">
                    <div className="flex items-center gap-3.5 min-w-60">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 font-mono text-xs font-bold text-primary shadow-inner border border-primary/20" title={`Serial No. ${serialNo}`}>
                        {serialNo}
                      </div>

                      <div>
                        <Link to="/students/$studentId" params={{ studentId: s.id }} className="group">
                          <h3 className="font-display text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                            {s.name}
                          </h3>
                        </Link>
                        {s.email ? (
                          <p className="text-xs text-muted-foreground">{s.email}</p>
                        ) : null}
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                          <span className="font-mono text-muted-foreground">Adm: <span className="font-semibold text-foreground">{s.admission_no}</span></span>
                          <span className="text-muted-foreground">•</span>
                          <span className="font-mono text-muted-foreground">Roll: <span className="font-semibold text-primary">{s.roll_number || "—"}</span></span>
                        </div>
                      </div>
                    </div>

                    {/* Badges & Actions */}
                    <div className="flex flex-wrap items-center gap-2 ml-auto">
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                        <GraduationCap className="mr-1 h-3 w-3" />
                        {program?.name ?? "—"}
                      </Badge>
                      <Badge variant="secondary" className="font-medium">
                        {formatYear(s.current_semester)}
                      </Badge>
                      {s.gender && (
                        <Badge variant="outline" className="capitalize">
                          {s.gender}
                        </Badge>
                      )}
                      {s.category && (
                        <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20">
                          {s.category}
                        </Badge>
                      )}

                      <div className="flex items-center gap-1.5 ml-2 border-l pl-3">
                        <Link
                          to="/students/$studentId"
                          params={{ studentId: s.id }}
                          className="inline-flex h-8 px-3 items-center justify-center rounded-md bg-primary text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                        >
                          View Profile
                        </Link>
                        {canEdit && (
                          <>
                            <Link
                              to="/students/$studentId"
                              params={{ studentId: s.id }}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground"
                              title="Edit Profile"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Link>
                            <Button
                              variant="destructive"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                if (window.confirm("Are you sure you want to delete this student?")) {
                                  removeStudent.mutate(s.id);
                                }
                              }}
                              title="Delete Student"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Vertical Details Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs bg-muted/30 p-3.5 rounded-lg border">
                    {/* Col 1: Guardian & Personal */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <User className="h-3.5 w-3.5 text-primary/70" />
                        <span>Father / Guardian Name:</span>
                      </div>
                      <p className="font-semibold text-foreground pl-5">{s.guardian || "—"}</p>
                    </div>

                    {/* Col 2: Contact Info */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <Phone className="h-3.5 w-3.5 text-primary/70" />
                        <span>Contact & Communication:</span>
                      </div>
                      <div className="pl-5 space-y-0.5 font-mono">
                        <p className="text-foreground">{s.phone ? `Mob: ${s.phone}` : "No phone"}</p>
                        {s.email && <p className="text-muted-foreground truncate">{s.email}</p>}
                      </div>
                    </div>

                    {/* Col 3: Address Details */}
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-1.5 text-muted-foreground font-medium">
                        <MapPin className="h-3.5 w-3.5 text-primary/70" />
                        <span>Address / Location:</span>
                      </div>
                      <p className="text-foreground pl-5 truncate" title={[s.address, s.city, s.state, s.pincode].filter(Boolean).join(", ")}>
                        {[s.address, s.city, s.state, s.pincode].filter(Boolean).join(", ") || "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        /* COMPACT TABLE VIEW */
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            <div className="overflow-auto max-h-[calc(100vh-270px)] relative">
              <table className="w-full text-sm border-collapse">
                <thead className="sticky top-0 z-40 bg-blue-600 dark:bg-blue-700 text-white border-b shadow-xs">
                  <tr className="text-left text-xs uppercase tracking-widest bg-blue-600 dark:bg-blue-700 text-white">
                    <th className="px-4 py-3.5 font-semibold text-center min-w-16 sticky left-0 top-0 z-50 bg-blue-600 dark:bg-blue-700 text-white border-r border-blue-500/40">S.No.</th>
                    <th className="px-4 py-3.5 font-semibold min-w-48 sticky left-16 top-0 z-50 bg-blue-600 dark:bg-blue-700 text-white border-r border-blue-500/40 shadow-sm">Student</th>
                    <th className="px-4 py-3.5 font-semibold min-w-44 whitespace-nowrap bg-blue-600 dark:bg-blue-700 text-white">Father's Name</th>
                    <th className="px-4 py-3.5 font-semibold min-w-36 whitespace-nowrap bg-blue-600 dark:bg-blue-700 text-white">Admission No</th>
                    <th className="px-4 py-3.5 font-semibold min-w-32 whitespace-nowrap bg-blue-600 dark:bg-blue-700 text-white">Program</th>
                    <th className="px-4 py-3.5 font-semibold min-w-28 whitespace-nowrap bg-blue-600 dark:bg-blue-700 text-white">Year</th>
                    <th className="px-4 py-3.5 font-semibold min-w-36 whitespace-nowrap bg-blue-600 dark:bg-blue-700 text-white">Roll No.</th>
                    <th className="px-4 py-3.5 font-semibold min-w-28 whitespace-nowrap bg-blue-600 dark:bg-blue-700 text-white">Gender</th>
                    <th className="px-4 py-3.5 font-semibold min-w-32 whitespace-nowrap bg-blue-600 dark:bg-blue-700 text-white">Category</th>
                    <th className="px-4 py-3.5 font-semibold min-w-36 whitespace-nowrap bg-blue-600 dark:bg-blue-700 text-white">Mobile No.</th>
                    <th className="px-4 py-3.5 font-semibold min-w-48 whitespace-nowrap bg-blue-600 dark:bg-blue-700 text-white">Address</th>
                    <th className="px-4 py-3.5 min-w-44 text-right whitespace-nowrap bg-blue-600 dark:bg-blue-700 text-white">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {students.map((s: any, idx: number) => {
                    const program = programs.find((p: any) => p.id === s.program_id);
                    const serialNo = (page - 1) * pageSize + idx + 1;

                    return (
                      <tr key={s.id} className="hover:bg-accent/40 group transition-colors">
                        <td className="px-4 py-3 text-center font-mono text-xs font-bold text-muted-foreground sticky left-0 z-30 bg-card group-hover:bg-secondary border-r border-border">
                          {serialNo}
                        </td>
                        <td className="px-4 py-3 sticky left-16 z-30 bg-card group-hover:bg-secondary border-r border-border shadow-sm">
                          <Link to="/students/$studentId" params={{ studentId: s.id }} className="flex items-center gap-2.5">
                            <div>
                              <p className="font-medium text-foreground group-hover:text-primary transition-colors">{s.name}</p>
                              {s.email ? <p className="text-xs text-muted-foreground">{s.email}</p> : null}
                            </div>
                          </Link>
                        </td>

                        <td className="px-4 py-3 whitespace-nowrap">{s.guardian || "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground whitespace-nowrap">{s.admission_no}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{program?.name ?? "—"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{formatYear(s.current_semester)}</td>
                        <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{s.roll_number || "—"}</td>
                        <td className="px-4 py-3 capitalize whitespace-nowrap">{s.gender || "—"}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{s.category || "—"}</td>
                        <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">{s.phone || "—"}</td>
                        <td className="px-4 py-3">
                          <div className="max-w-44 truncate" title={[s.address, s.city, s.state, s.pincode].filter(Boolean).join(", ")}>
                            {[s.address, s.city].filter(Boolean).join(", ") || "—"}
                          </div>
                        </td>

                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          <div className="flex justify-end gap-2">
                            {canEdit && (
                              <Link
                                to="/students/$studentId"
                                params={{ studentId: s.id }}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent hover:text-accent-foreground"
                                title="Edit Profile"
                              >
                                <Pencil className="h-4 w-4" />
                              </Link>
                            )}
                            <Link
                              to="/students/$studentId"
                              params={{ studentId: s.id }}
                              className="inline-flex h-8 items-center justify-center whitespace-nowrap rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                            >
                              View Profile
                            </Link>
                            {canEdit && (
                              <Button
                                variant="destructive"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => {
                                  if (window.confirm("Are you sure you want to delete this student?")) {
                                    removeStudent.mutate(s.id);
                                  }
                                }}
                                title="Delete Student"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
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

      )}
      
      {/* Pagination Footer */}
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

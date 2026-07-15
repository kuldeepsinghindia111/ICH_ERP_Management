import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { CalendarCheck, Save, CheckCircle2, Search } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/attendance")({
  head: () => ({
    meta: [{ title: "Attendance Management — Imperial CMS" }],
  }),
  component: AttendancePage,
});

function AttendancePage() {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  
  const [date, setDate] = useState(today);
  const [programId, setProgramId] = useState("all");
  const [semester, setSemester] = useState("all");
  const [search, setSearch] = useState("");

  const [localAttendance, setLocalAttendance] = useState<Record<string, string>>({});

  // Fetch Programs
  const { data: programs = [] } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("programs").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Fetch Students
  const { data: students = [], isLoading: loadingStudents } = useQuery({
    queryKey: ["students", programId, semester],
    queryFn: async () => {
      let q = supabase.from("students").select("*").eq("status", "active").order("name");
      if (programId !== "all") q = q.eq("program_id", programId);
      if (semester !== "all") q = q.eq("current_semester", parseInt(semester));
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  // Fetch Attendance for the selected date
  const { data: attendanceRecords = [], isLoading: loadingAttendance } = useQuery({
    queryKey: ["attendance", date, programId, semester],
    queryFn: async () => {
      let q = supabase.from("attendance").select("*").eq("date", date);
      if (programId !== "all") q = q.eq("program_id", programId);
      if (semester !== "all") q = q.eq("semester", parseInt(semester));
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
  });

  // Sync db attendance to local state when db data changes
  useMemo(() => {
    const newLocal: Record<string, string> = {};
    attendanceRecords.forEach((r: any) => {
      newLocal[r.student_id] = r.status;
    });
    setLocalAttendance(newLocal);
  }, [attendanceRecords]);

  const filteredStudents = students.filter((s: any) => 
    s.name?.toLowerCase().includes(search.toLowerCase()) || 
    (s.roll_number || "").toLowerCase().includes(search.toLowerCase())
  );

  const saveAttendance = useMutation({
    mutationFn: async () => {
      if (programId === "all" || semester === "all") {
        throw new Error("Please select a specific Program and Class to save attendance.");
      }

      const recordsToUpsert = filteredStudents
        .filter((s: any) => localAttendance[s.id])
        .map((s: any) => ({
          date,
          student_id: s.id,
          program_id: programId,
          semester: parseInt(semester),
          status: localAttendance[s.id],
        }));
      
      if (recordsToUpsert.length === 0) return;

      const { error } = await supabase.from("attendance").upsert(recordsToUpsert, {
        onConflict: "date,student_id"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance", date, programId, semester] });
      toast.success("Attendance saved successfully");
    },
    onError: (e: any) => toast.error(e.message)
  });

  const markAll = (status: string) => {
    const newLocal = { ...localAttendance };
    filteredStudents.forEach((s: any) => {
      newLocal[s.id] = status;
    });
    setLocalAttendance(newLocal);
  };

  const getStatusColor = (status: string) => {
    if (status === "Present") return "bg-green-100 text-green-700 hover:bg-green-200 border-green-200";
    if (status === "Absent") return "bg-red-100 text-red-700 hover:bg-red-200 border-red-200";
    if (status === "Late") return "bg-orange-100 text-orange-700 hover:bg-orange-200 border-orange-200";
    if (status === "Half-day") return "bg-blue-100 text-blue-700 hover:bg-blue-200 border-blue-200";
    return "bg-secondary text-secondary-foreground hover:bg-secondary/80";
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Operations</p>
          <h1 className="font-display text-3xl font-semibold text-foreground flex items-center gap-2">
            <CalendarCheck className="h-7 w-7 text-primary" /> Attendance Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">Track daily student attendance.</p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div>
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
            <div>
              <Label>Program</Label>
              <Select value={programId} onValueChange={setProgramId}>
                <SelectTrigger><SelectValue placeholder="All Programs" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Programs</SelectItem>
                  {programs.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Class (Semester)</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <SelectItem key={s} value={s.toString()}>Sem / Class {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Search Student</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input className="pl-8" placeholder="Name or Roll No..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {programId === "all" || semester === "all" ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
            <CalendarCheck className="h-12 w-12 mb-4 text-muted-foreground/50" />
            <h3 className="text-lg font-medium text-foreground">Select a Class</h3>
            <p className="text-sm mt-1 max-w-md">Please select a specific Program and Class (Semester) above to view students and mark attendance.</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
            <div>
              <CardTitle className="text-base">Students ({filteredStudents.length})</CardTitle>
              <CardDescription>Mark attendance for {date}</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => markAll("Present")} className="text-green-600 border-green-200 hover:bg-green-50">
                <CheckCircle2 className="mr-1 w-4 h-4" /> Mark All Present
              </Button>
              <Button size="sm" onClick={() => saveAttendance.mutate()} disabled={saveAttendance.isPending}>
                <Save className="mr-1 w-4 h-4" /> Save
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {loadingStudents || loadingAttendance ? (
              <div className="p-8 text-center animate-pulse text-muted-foreground">Loading...</div>
            ) : filteredStudents.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">No active students found in this class.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-4 py-3 text-left font-medium">Roll No</th>
                      <th className="px-4 py-3 text-left font-medium">Student</th>
                      <th className="px-4 py-3 text-left font-medium min-w-[300px]">Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {filteredStudents.map((s: any) => {
                      const currentStatus = localAttendance[s.id];
                      return (
                        <tr key={s.id} className="hover:bg-muted/30 transition-colors">
                          <td className="px-4 py-3 text-muted-foreground font-mono">{s.roll_number || "—"}</td>
                          <td className="px-4 py-3 font-medium">{s.name}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              {["Present", "Absent", "Late", "Half-day"].map((status) => (
                                <Badge
                                  key={status}
                                  variant="outline"
                                  className={`cursor-pointer transition-colors px-3 py-1 ${
                                    currentStatus === status 
                                      ? getStatusColor(status)
                                      : "hover:bg-muted"
                                  }`}
                                  onClick={() => setLocalAttendance({ ...localAttendance, [s.id]: status })}
                                >
                                  {status}
                                </Badge>
                              ))}
                              {!currentStatus && (
                                <span className="text-xs text-muted-foreground italic ml-2">Not marked</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Plus, Trash2, Pencil, Save, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

import { useAuth } from "@/hooks/use-auth";
import { useStore } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "@tanstack/react-router";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Imperial CMS" },
      { name: "description", content: "Session configuration and setup." },
    ],
  }),
  component: GeneralManagementPage,
  errorComponent: ({ error }) => (
    <div className="p-8 text-red-500">
      <h1 className="font-bold text-2xl">Page Crashed</h1>
      <pre className="mt-4 p-4 bg-red-100 rounded overflow-auto">{error.message}</pre>
      <pre className="mt-4 p-4 bg-red-100 rounded overflow-auto text-xs">{error.stack}</pre>
    </div>
  )
});

const FEE_COLUMNS = ["Admission Fee", "Tuition Fee", "Library Fee", "Exam Fee", "Late Fees", "Fine", "Other Charges"];

function GeneralManagementPage() {
  const { can } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();

  useEffect(() => setIsMounted(true), []);

  const canEdit = isMounted && can("settings", "edit");
  const queryClient = useQueryClient();

  const { data: sessions = [], isLoading: loadingSessions } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sessions").select("*").order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: settings, isLoading: loadingSettings } = useQuery({
    queryKey: ["college_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("college_settings").select("*").limit(1).single();
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
  });

  const { data: programs = [], isLoading: loadingPrograms } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("programs").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: feeStructures = [], isLoading: loadingFees } = useQuery({
    queryKey: ["fee_structures"],
    queryFn: async () => {
      const { data, error } = await supabase.from("fee_structures").select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: sections = [], isLoading: loadingSections } = useQuery({
    queryKey: ["program_sections"],
    queryFn: async () => {
      const { data, error } = await supabase.from("program_sections").select("*");
      if (error) throw error;
      return data;
    },
  });

  const isLoading = loadingSessions || loadingSettings || loadingPrograms || loadingFees || loadingSections;

  // --- Session & Key Settings: per-row edit/save/delete like Academic Sessions ---
  const [settingsEditingIndex, setSettingsEditingIndex] = useState<number | null>(null);
  const [settingsLocal, setSettingsLocal] = useState({ sessionId: "", name: "", startDate: "", endDate: "", admissionSeries: "" });

  // --- New session row state ---
  const [headerSession, setHeaderSession] = useState("2024-25");

  // The active sessions loaded from DB
  const activeSessions = sessions.filter(s => s.name === headerSession);

  const startSettingsEdit = (index: number) => {
    const s = activeSessions[index];
    if (!s) return;
    setSettingsEditingIndex(index);
    setSettingsLocal({
      sessionId: s.id,
      name: s.name || "",
      startDate: s.start_date || "",
      endDate: s.end_date || "",
      admissionSeries: s.admission_series || "",
    });
  };

  const cancelSettingsEdit = () => {
    setSettingsEditingIndex(null);
  };

  // Save a single existing row
  const saveSettingsRow = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sessions").update({
        name: settingsLocal.name,
        start_date: settingsLocal.startDate,
        end_date: settingsLocal.endDate,
        admission_series: settingsLocal.admissionSeries
      }).eq("id", settingsLocal.sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setSettingsEditingIndex(null);
      toast.success("Session updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Toggle active/inactive for a session in Session & Key Settings
  const toggleSettingsStatus = useMutation({
    mutationFn: async ({ sessionId, currentStatus }: { sessionId: string; currentStatus: boolean }) => {
      const { error } = await supabase.from("sessions").update({ is_settings_active: !currentStatus }).eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Remove from active settings (deactivate) without deleting from DB
  const removeSessionFromSettings = useMutation({
    mutationFn: async (sessionId: string) => {
      const { error } = await supabase.from("sessions").update({ is_settings_active: false }).eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session removed from active settings");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="p-8 animate-pulse text-muted-foreground">Loading configuration...</div>;
  }

  const activeSessionNames = sessions.filter(s => s.is_settings_active).map(s => s.name).filter(Boolean);
  const activeSessionName = activeSessionNames.length > 0 ? activeSessionNames.join(", ") : "Not Set";

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3 sm:px-6 py-6 sm:py-8">
      <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-4 rounded-lg flex items-center justify-center">
        <span className="font-display text-xl sm:text-2xl md:text-3xl font-semibold text-center leading-tight">Welcome to Imperial College ERP/CMS - ichacc.online Portal</span>
      </div>
      <div>
        <h1 className="font-display text-2xl sm:text-3xl font-semibold text-foreground">
          General Portal Setup
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure essential parameters and academic structures for the active session.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <CardTitle>Session & Admission Portal</CardTitle>
          <div className="flex flex-wrap items-center gap-2 sm:gap-4">
            <Select value={headerSession} onValueChange={setHeaderSession}>
              <SelectTrigger className="w-35 h-9">
                <SelectValue placeholder="Session" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2024-25">2024-25</SelectItem>
                <SelectItem value="2025-26">2025-26</SelectItem>
                <SelectItem value="2026-27">2026-27</SelectItem>
                <SelectItem value="2027-28">2027-28</SelectItem>
                <SelectItem value="2028-29">2028-29</SelectItem>
                <SelectItem value="2029-30">2029-30</SelectItem>
                <SelectItem value="2030-31">2030-31</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Admission No. Series</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeSessions.map((s, index) => {
                const isEditing = settingsEditingIndex === index;
                return (
                  <TableRow key={s.id}>
                    <TableCell>
                      {isEditing ? (
                        <Input type="date" value={settingsLocal.startDate} onChange={e => setSettingsLocal({ ...settingsLocal, startDate: e.target.value })} />
                      ) : s.start_date}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input type="date" value={settingsLocal.endDate} onChange={e => setSettingsLocal({ ...settingsLocal, endDate: e.target.value })} />
                      ) : s.end_date}
                    </TableCell>
                    <TableCell>
                      {isEditing ? (
                        <Input value={settingsLocal.admissionSeries} onChange={e => setSettingsLocal({ ...settingsLocal, admissionSeries: e.target.value })} placeholder="e.g. ADM-2027-0001" />
                      ) : (s.admission_series || "—")}
                    </TableCell>
                    <TableCell className="text-right">
                      {canEdit && (
                        isEditing ? (
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => saveSettingsRow.mutate()}><Save className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" onClick={cancelSettingsEdit}>x</Button>
                          </div>
                        ) : (
                          <div className="flex justify-end gap-2">
                            <Button size="icon" variant="ghost" onClick={() => startSettingsEdit(index)}><Pencil className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" title="Remove from settings" onClick={() => { if (confirm("Remove this session from active settings?")) removeSessionFromSettings.mutate(s.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        )
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}

            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CourseFeeSetup programs={programs} feeStructures={feeStructures} canEdit={canEdit} />
      <RollNoManagementSetup configSessions={sessions.filter(s => s.name?.startsWith('Config'))} realSessions={sessions.filter(s => !s.name?.startsWith('Config'))} programs={programs} canEdit={canEdit} />

    </div>
  );
}

function RollNoManagementSetup({ configSessions, realSessions, programs, canEdit }: { configSessions: any[], realSessions: any[], programs: any[], canEdit: boolean }) {
  const queryClient = useQueryClient();

  const predefinedSessions = ["2026-27", "2027-28", "2028-29", "2029-30", "2030-31"];
  const [selectedSessionId, setSelectedSessionId] = useState<string>(predefinedSessions[0]);
  const [selectedProgramFilter, setSelectedProgramFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [localRollSeries, setLocalRollSeries] = useState("");
  const [localProgramId, setLocalProgramId] = useState("");

  const startAdd = () => {
    if (!selectedSessionId) {
      toast.error("Please select a session first");
      return;
    }
    setEditingId("new");
    setLocalRollSeries("ROL-2027-0001");
    setLocalProgramId(programs[0]?.id || "");
  };

  const startEdit = (s: any) => {
    setEditingId(s.id);
    setLocalRollSeries(s.roll_number_series || "ROL-2026-0001");
    setLocalProgramId(s.program_id || "");
  };

  const saveConfig = useMutation({
    mutationFn: async () => {
      if (editingId === "new") {
        const { error } = await supabase.from("sessions").insert({
          name: `Config_${selectedSessionId}_${Date.now()}`,
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
          roll_number_series: localRollSeries,
          program_id: localProgramId === "none" || !localProgramId ? null : localProgramId
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sessions").update({
          roll_number_series: localRollSeries,
          program_id: localProgramId === "none" || !localProgramId ? null : localProgramId
        }).eq("id", editingId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setEditingId(null);
      toast.success("Roll No configuration saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteConfig = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Roll No configuration deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <CardTitle>Roll No. Portal</CardTitle>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
            <SelectTrigger className="w-35 h-9">
              <SelectValue placeholder="Select Session" />
            </SelectTrigger>
            <SelectContent>
              {predefinedSessions.map(rs => (
                <SelectItem key={rs} value={rs}>{rs}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedProgramFilter} onValueChange={setSelectedProgramFilter}>
            <SelectTrigger className="w-35 h-9">
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {programs.map(pr => <SelectItem key={pr.id} value={pr.id}>{pr.name}</SelectItem>)}
            </SelectContent>
          </Select>
          {canEdit && (
            <Button variant="secondary" size="sm" onClick={startAdd}>
              <Plus className="mr-2 h-4 w-4" /> Add Configuration
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course</TableHead>
              <TableHead>Roll No. Series</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configSessions
              .filter(s => s.name?.startsWith(`Config_${selectedSessionId}`))
              .filter(s => selectedProgramFilter === "all" || s.program_id === selectedProgramFilter)
              .map(s => {
              const isEditing = editingId === s.id;
              const p = programs.find(pr => pr.id === s.program_id);
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    {isEditing ? (
                      <Select value={localProgramId} onValueChange={setLocalProgramId}>
                        <SelectTrigger><SelectValue placeholder="Global / All Courses" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Global / All Courses</SelectItem>
                          {programs.map(pr => <SelectItem key={pr.id} value={pr.id}>{pr.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      p?.name || "Global / All Courses"
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input value={localRollSeries} onChange={e => setLocalRollSeries(e.target.value)} />
                    ) : s.roll_number_series}
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit && (
                      isEditing ? (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => saveConfig.mutate()}><Save className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>x</Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this configuration?")) deleteConfig.mutate(s.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      )
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

            {editingId === "new" && (
              <TableRow>
                <TableCell>
                  <Select value={localProgramId} onValueChange={setLocalProgramId}>
                    <SelectTrigger><SelectValue placeholder="Global / All Courses" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Global / All Courses</SelectItem>
                      {programs.map(pr => <SelectItem key={pr.id} value={pr.id}>{pr.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input value={localRollSeries} onChange={e => setLocalRollSeries(e.target.value)} /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => saveConfig.mutate()}><Save className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>x</Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}


function CourseFeeSetup({ programs, feeStructures, canEdit }: { programs: any[], feeStructures: any[], canEdit: boolean }) {
  const queryClient = useQueryClient();

  const [editingProgramId, setEditingProgramId] = useState<string | null>(null);
  // local edits for the currently editing program row
  const [localFees, setLocalFees] = useState<Record<string, number>>({});
  const [localProgramName, setLocalProgramName] = useState("");
  
  const [selectedSession, setSelectedSession] = useState("2026-2027");
  const [selectedProgram, setSelectedProgram] = useState("all");
  const [selectedYear, setSelectedYear] = useState("1");

  const startEdit = (pId: string) => {
    setEditingProgramId(pId);
    const existing = feeStructures.filter(f => f.program_id === pId && f.semester === Number(selectedYear));
    const m: Record<string, number> = {};
    FEE_COLUMNS.forEach(col => {
      const found = existing.find(f => f.fee_head === col);
      m[col] = found ? found.amount : 0;
    });
    setLocalFees(m);
    
    const p = programs.find((prog) => prog.id === pId);
    setLocalProgramName(p ? p.name : "");
  };

  const saveFees = useMutation({
    mutationFn: async (pId: string) => {
      // update program name if changed
      const p = programs.find((prog) => prog.id === pId);
      if (p && localProgramName && localProgramName !== p.name) {
        const { error: nameError } = await supabase.from("programs").update({ name: localProgramName }).eq("id", pId);
        if (nameError) throw nameError;
      }

      // delete existing fees first
      await supabase.from("fee_structures").delete().eq("program_id", pId).eq("semester", Number(selectedYear)).in("fee_head", FEE_COLUMNS);

      const inserts = FEE_COLUMNS.map(col => ({
        program_id: pId,
        semester: Number(selectedYear),
        fee_head: col,
        amount: localFees[col] || 0
      })).filter(f => f.amount > 0);

      if (inserts.length > 0) {
        const { error } = await supabase.from("fee_structures").insert(inserts);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["fee_structures"] });
      setEditingProgramId(null);
      toast.success("Fees updated successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeProgram = useMutation({
    mutationFn: async (id: string) => {
      // Check if program is in use by students
      const { count: studentCount, error: studentError } = await supabase
        .from("students")
        .select("*", { count: "exact", head: true })
        .eq("program_id", id);
        
      if (studentError) throw studentError;
      if (studentCount && studentCount > 0) {
        throw new Error(`Cannot delete: ${studentCount} student(s) are currently enrolled in this course/class.`);
      }

      // Cascade delete fee structures and courses
      await supabase.from("fee_structures").delete().eq("program_id", id);
      await supabase.from("courses").delete().eq("program_id", id);

      // Finally delete the program
      const { error } = await supabase.from("programs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      queryClient.invalidateQueries({ queryKey: ["fee_structures"] });
      toast.success("Course/Class removed successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2">
        <CardTitle>Course & Fee Setup</CardTitle>
        <div className="flex flex-wrap items-center gap-2 sm:gap-4">
          <Select value={selectedSession} onValueChange={setSelectedSession}>
            <SelectTrigger className="w-30 h-9">
              <SelectValue placeholder="Session" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026-2027">2026-2027</SelectItem>
              <SelectItem value="2027-2028">2027-2028</SelectItem>
              <SelectItem value="2028-2029">2028-2029</SelectItem>
              <SelectItem value="2029-2030">2029-2030</SelectItem>
              <SelectItem value="2030-2031">2030-2031</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger className="w-35 h-9">
              <SelectValue placeholder="Course" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              {programs.map(pr => <SelectItem key={pr.id} value={pr.id}>{pr.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-30 h-9">
              <SelectValue placeholder="Year" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1st Year</SelectItem>
              <SelectItem value="2">2nd Year</SelectItem>
              <SelectItem value="3">3rd Year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="secondary" size="sm" asChild>
            <a href="/courses"><Plus className="mr-2 h-4 w-4" /> Add New Course/Class</a>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course Name</TableHead>
              {FEE_COLUMNS.map(col => <TableHead key={col}>{col} (Rs.)</TableHead>)}
              <TableHead>Total Fees (Rs.)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs
              .filter(p => selectedProgram === "all" || p.id === selectedProgram)
              .map(p => {
              const isEditing = editingProgramId === p.id;

              const feesForProgram = feeStructures.filter(f => f.program_id === p.id && f.semester === Number(selectedYear));
              let total = 0;

              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">
                    {isEditing ? (
                      <Input
                        value={localProgramName}
                        onChange={(e) => setLocalProgramName(e.target.value)}
                        className="w-40 h-8 font-medium"
                      />
                    ) : (
                      p.name
                    )}
                  </TableCell>
                  {FEE_COLUMNS.map(col => {
                    const existingAmt = feesForProgram.find(f => f.fee_head === col)?.amount || 0;
                    total += Number(existingAmt);
                    return (
                      <TableCell key={col}>
                        {isEditing ? (
                          <Input
                            type="number"
                            className="w-24 h-8"
                            value={localFees[col] || ""}
                            onChange={(e) => setLocalFees({ ...localFees, [col]: Number(e.target.value) })}
                          />
                        ) : (
                          existingAmt || "-"
                        )}
                      </TableCell>
                    );
                  })}
                  <TableCell className="font-semibold">{isEditing ? Object.values(localFees).reduce((a, b) => a + (Number(b) || 0), 0) : total}</TableCell>
                  <TableCell className="text-right">
                    {canEdit && (
                      isEditing ? (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => saveFees.mutate(p.id)}><Save className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingProgramId(null)}>x</Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(p.id)}><Pencil className="h-4 w-4" /></Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            disabled={removeProgram.isPending}
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${p.name}?`)) {
                                removeProgram.mutate(p.id);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      )
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}



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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/general")({
  head: () => ({
    meta: [
      { title: "General Management — Imperial CMS" },
      { name: "description", content: "Session configuration and setup." },
    ],
  }),
  component: GeneralManagementPage,
});

const FEE_COLUMNS = ["Admission Fee", "Tuition Fee", "Library Fee", "Exam Fee", "Other Fees"];

function GeneralManagementPage() {
  const { can } = useAuth();
  const [isMounted, setIsMounted] = useState(false);
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

  // The active sessions loaded from DB
  const activeSessions = sessions.filter(s => s.is_settings_active);

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

  // --- New session row state ---
  const [addingNewSession, setAddingNewSession] = useState(false);
  const [newSessionLocal, setNewSessionLocal] = useState({ name: "", startDate: "", endDate: "", admissionSeries: "" });

  const startAddSession = () => {
    setNewSessionLocal({
      name: "2027-28",
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      admissionSeries: "ADM-2027-0001",
    });
    setAddingNewSession(true);
  };

  const cancelAddSession = () => {
    setAddingNewSession(false);
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

  // Save the new row (mark as active)
  const saveNewSettingsRow = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("sessions").insert({
        is_settings_active: true,
        name: newSessionLocal.name,
        start_date: newSessionLocal.startDate,
        end_date: newSessionLocal.endDate,
        admission_series: newSessionLocal.admissionSeries
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setAddingNewSession(false);
      toast.success("Session added & activated");
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
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="bg-primary/10 border border-primary/20 text-primary px-4 py-4 rounded-lg flex items-center justify-center">
        <span className="font-display text-3xl font-semibold">Welcome to ichacc.online Portal</span>
      </div>
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          General Management Setup
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure essential parameters and academic structures for the active session.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle>Session & Admission Management</CardTitle>
          {canEdit && (
            <Button variant="secondary" size="sm" onClick={startAddSession}>
              <Plus className="mr-2 h-4 w-4" /> Add session
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Session Name</TableHead>
                <TableHead>Start Date</TableHead>
                <TableHead>End Date</TableHead>
                <TableHead>Admission Series</TableHead>
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
                        <Input value={settingsLocal.name} onChange={e => setSettingsLocal({ ...settingsLocal, name: e.target.value })} />
                      ) : s.name}
                    </TableCell>
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

              {addingNewSession && (
                <TableRow>
                  <TableCell>
                    <Input value={newSessionLocal.name} onChange={e => setNewSessionLocal({ ...newSessionLocal, name: e.target.value })} placeholder="e.g. 2026-27" />
                  </TableCell>
                  <TableCell>
                    <Input type="date" value={newSessionLocal.startDate} onChange={e => setNewSessionLocal({ ...newSessionLocal, startDate: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input type="date" value={newSessionLocal.endDate} onChange={e => setNewSessionLocal({ ...newSessionLocal, endDate: e.target.value })} />
                  </TableCell>
                  <TableCell>
                    <Input value={newSessionLocal.admissionSeries} onChange={e => setNewSessionLocal({ ...newSessionLocal, admissionSeries: e.target.value })} placeholder="e.g. ADM-2027-0001" />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="icon" variant="ghost" onClick={() => saveNewSettingsRow.mutate()}><Save className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={cancelAddSession}>x</Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <CourseFeeSetup programs={programs} feeStructures={feeStructures} canEdit={canEdit} />
      <RollNoManagementSetup configSessions={sessions.filter(s => s.name.startsWith('Config'))} realSessions={sessions.filter(s => !s.name.startsWith('Config'))} programs={programs} canEdit={canEdit} />

    </div>
  );
}

function RollNoManagementSetup({ configSessions, realSessions, programs, canEdit }: { configSessions: any[], realSessions: any[], programs: any[], canEdit: boolean }) {
  const queryClient = useQueryClient();

  const [selectedSessionId, setSelectedSessionId] = useState<string>(realSessions[0]?.id || "");
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
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Roll No. Management</CardTitle>
        <div className="flex items-center gap-4">
          <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select Session" />
            </SelectTrigger>
            <SelectContent>
              {realSessions.map(rs => (
                <SelectItem key={rs.id} value={rs.id}>{rs.name}</SelectItem>
              ))}
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
            {configSessions.filter(s => s.name.startsWith(`Config_${selectedSessionId}`)).map(s => {
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

  const startEdit = (pId: string) => {
    setEditingProgramId(pId);
    const existing = feeStructures.filter(f => f.program_id === pId && f.semester === 1);
    const m: Record<string, number> = {};
    FEE_COLUMNS.forEach(col => {
      const found = existing.find(f => f.fee_head === col);
      m[col] = found ? found.amount : 0;
    });
    setLocalFees(m);
  };

  const saveFees = useMutation({
    mutationFn: async (pId: string) => {
      // delete existing first
      await supabase.from("fee_structures").delete().eq("program_id", pId).eq("semester", 1).in("fee_head", FEE_COLUMNS);

      const inserts = FEE_COLUMNS.map(col => ({
        program_id: pId,
        semester: 1,
        fee_head: col,
        amount: localFees[col] || 0
      })).filter(f => f.amount > 0);

      if (inserts.length > 0) {
        const { error } = await supabase.from("fee_structures").insert(inserts);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee_structures"] });
      setEditingProgramId(null);
      toast.success("Fees updated successfully");
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
      toast.success("Course/Class removed successfully");
    },
    onError: (e: any) => toast.error("Could not remove course. It might be in use by students or other records."),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Course & Fee Setup</CardTitle>
        <Button variant="secondary" size="sm" asChild>
          <a href="/courses"><Plus className="mr-2 h-4 w-4" /> Add New Course/Class</a>
        </Button>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Course/Class Name</TableHead>
              {FEE_COLUMNS.map(col => <TableHead key={col}>{col} (Rs.)</TableHead>)}
              <TableHead>Total Fees (Rs.)</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {programs.map(p => {
              const isEditing = editingProgramId === p.id;

              const feesForProgram = feeStructures.filter(f => f.program_id === p.id && f.semester === 1);
              let total = 0;

              return (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.name}</TableCell>
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



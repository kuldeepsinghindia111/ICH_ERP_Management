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
  const [newSessionLocal, setNewSessionLocal] = useState({ sessionId: "", startDate: "", endDate: "", admissionSeries: "" });

  const startAddSession = () => {
    const first = sessions.find(s => !s.is_settings_active) || sessions[0];
    setNewSessionLocal({
      sessionId: first?.id || "",
      startDate: first?.start_date || "",
      endDate: first?.end_date || "",
      admissionSeries: first?.admission_series || "",
    });
    setAddingNewSession(true);
  };

  const cancelAddSession = () => {
    setAddingNewSession(false);
  };

  const handleNewSessionChange = (newSessionId: string) => {
    const session = sessions.find(s => s.id === newSessionId);
    if (!session) return;
    setNewSessionLocal({
      sessionId: newSessionId,
      startDate: session.start_date || "",
      endDate: session.end_date || "",
      admissionSeries: session.admission_series || "",
    });
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
      const { error } = await supabase.from("sessions").update({
        is_settings_active: true,
        start_date: newSessionLocal.startDate,
        end_date: newSessionLocal.endDate,
        admission_series: newSessionLocal.admissionSeries
      }).eq("id", newSessionLocal.sessionId);
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
      <div>
        <h1 className="font-display text-3xl font-semibold text-foreground">
          General Management: {activeSessionName} Setup
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure essential parameters and academic structures for the active session.
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle>Session & Key Settings</CardTitle>
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
                    <Select value={newSessionLocal.sessionId} onValueChange={handleNewSessionChange}>
                      <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                      <SelectContent>
                        {sessions.filter(s => !s.is_settings_active).map(s => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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

      <SessionManagementSetup sessions={sessions} programs={programs} canEdit={canEdit} />
      <CourseFeeSetup programs={programs} feeStructures={feeStructures} canEdit={canEdit} />
      <RollNumberInitialization programs={programs} sections={sections} canEdit={canEdit} />
    </div>
  );
}

function SessionManagementSetup({ sessions, programs, canEdit }: { sessions: any[], programs: any[], canEdit: boolean }) {
  const queryClient = useQueryClient();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [localName, setLocalName] = useState("");
  const [localStart, setLocalStart] = useState("");
  const [localEnd, setLocalEnd] = useState("");
  const [localSeries, setLocalSeries] = useState("");
  const [localRollSeries, setLocalRollSeries] = useState("");
  const [localProgramId, setLocalProgramId] = useState("");

  const startAdd = () => {
    setEditingId("new");
    setLocalName("2027-28");
    setLocalStart(new Date().toISOString().split('T')[0]);
    setLocalEnd(new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0]);
    setLocalSeries("ADM-2027-0001");
    setLocalRollSeries("ROL-2027-0001");
    setLocalProgramId(programs[0]?.id || "");
  };

  const startEdit = (s: any) => {
    setEditingId(s.id);
    setLocalName(s.name);
    setLocalStart(s.start_date);
    setLocalEnd(s.end_date);
    setLocalSeries(s.admission_series || "ADM-2026-0001");
    setLocalRollSeries(s.roll_number_series || "ROL-2026-0001");
    setLocalProgramId(s.program_id || "");
  };

  const saveSession = useMutation({
    mutationFn: async () => {
      if (editingId === "new") {
        const { error } = await supabase.from("sessions").insert({
          name: localName,
          start_date: localStart,
          end_date: localEnd,
          admission_series: localSeries,
          roll_number_series: localRollSeries,
          program_id: localProgramId === "none" || !localProgramId ? null : localProgramId
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("sessions").update({
          name: localName,
          start_date: localStart,
          end_date: localEnd,
          admission_series: localSeries,
          roll_number_series: localRollSeries,
          program_id: localProgramId === "none" || !localProgramId ? null : localProgramId
        }).eq("id", editingId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      setEditingId(null);
      toast.success("Session saved successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  // Toggle active/inactive for a session
  const toggleSessionStatus = useMutation({
    mutationFn: async ({ sessionId, currentStatus }: { sessionId: string; currentStatus: boolean }) => {
      const { error } = await supabase.from("sessions").update({ is_active: !currentStatus }).eq("id", sessionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session status updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Academic Sessions</CardTitle>
        {canEdit && (
          <Button id="add-session-btn" variant="secondary" size="sm" onClick={startAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Session
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Session Name</TableHead>
              <TableHead>Course Name</TableHead>
              <TableHead>Roll Number Series</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sessions.map(s => {
              const isEditing = editingId === s.id;
              const p = programs.find(pr => pr.id === s.program_id);
              return (
                <TableRow key={s.id}>
                  <TableCell>
                    {isEditing ? (
                      <Input value={localName} onChange={e => setLocalName(e.target.value)} />
                    ) : s.name}
                  </TableCell>
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
                  <TableCell>
                    {canEdit ? (
                      <button
                        className={`text-sm font-medium cursor-pointer hover:underline ${s.is_active ? "text-primary" : "text-muted-foreground"}`}
                        onClick={() => toggleSessionStatus.mutate({ sessionId: s.id, currentStatus: s.is_active })}
                      >
                        {s.is_active ? "Active" : "Inactive"}
                      </button>
                    ) : (
                      s.is_active ? <span className="text-primary font-medium">Active</span> : <span className="text-muted-foreground">Inactive</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit && (
                      isEditing ? (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => saveSession.mutate()}><Save className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>x</Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this session?")) deleteSession.mutate(s.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      )
                    )}
                  </TableCell>
                </TableRow>
              );
            })}

            {editingId === "new" && (
              <TableRow>
                <TableCell><Input value={localName} onChange={e => setLocalName(e.target.value)} /></TableCell>
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
                <TableCell><span className="text-muted-foreground">Inactive</span></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => saveSession.mutate()}><Save className="h-4 w-4" /></Button>
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
                        <Button size="icon" variant="ghost" onClick={() => startEdit(p.id)}><Pencil className="h-4 w-4" /></Button>
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

function RollNumberInitialization({ programs, sections, canEdit }: { programs: any[], sections: any[], canEdit: boolean }) {
  const queryClient = useQueryClient();

  // local state for inline add/edit
  const [editingId, setEditingId] = useState<string | null>(null); // "new" for adding
  const [localProgramId, setLocalProgramId] = useState("");
  const [localSectionName, setLocalSectionName] = useState("");
  const [localStartRoll, setLocalStartRoll] = useState<number>(0);

  const startAdd = () => {
    setEditingId("new");
    setLocalProgramId(programs[0]?.id || "");
    setLocalSectionName("A");
    setLocalStartRoll(101);
  };

  const startEdit = (s: any) => {
    setEditingId(s.id);
    setLocalProgramId(s.program_id);
    setLocalSectionName(s.section_name);
    setLocalStartRoll(s.starting_roll_number);
  };

  const saveSection = useMutation({
    mutationFn: async () => {
      if (editingId === "new") {
        const { error } = await supabase.from("program_sections").insert({
          program_id: localProgramId,
          section_name: localSectionName,
          starting_roll_number: localStartRoll
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("program_sections").update({
          program_id: localProgramId,
          section_name: localSectionName,
          starting_roll_number: localStartRoll
        }).eq("id", editingId);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["program_sections"] });
      setEditingId(null);
      toast.success("Section mapped successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteSection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("program_sections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["program_sections"] }),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle>Roll Number Initialization</CardTitle>
        {canEdit && (
          <Button variant="secondary" size="sm" onClick={startAdd}>
            <Plus className="mr-2 h-4 w-4" /> Add Section
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class Name</TableHead>
              <TableHead>Section</TableHead>
              <TableHead>Starting Roll Number</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {sections.map(s => {
              const p = programs.find(p => p.id === s.program_id);
              const isEditing = editingId === s.id;

              return (
                <TableRow key={s.id}>
                  <TableCell>
                    {isEditing ? (
                      <Select value={localProgramId} onValueChange={setLocalProgramId}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {programs.map(pr => <SelectItem key={pr.id} value={pr.id}>{pr.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : (
                      p?.name || "Unknown"
                    )}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input value={localSectionName} onChange={e => setLocalSectionName(e.target.value)} className="w-20" />
                    ) : s.section_name}
                  </TableCell>
                  <TableCell>
                    {isEditing ? (
                      <Input type="number" value={localStartRoll} onChange={e => setLocalStartRoll(Number(e.target.value))} className="w-24" />
                    ) : s.starting_roll_number}
                  </TableCell>
                  <TableCell className="text-right">
                    {canEdit && (
                      isEditing ? (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => saveSection.mutate()}><Save className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>x</Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteSection.mutate(s.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
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
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {programs.map(pr => <SelectItem key={pr.id} value={pr.id}>{pr.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell><Input value={localSectionName} onChange={e => setLocalSectionName(e.target.value)} className="w-20" /></TableCell>
                <TableCell><Input type="number" value={localStartRoll} onChange={e => setLocalStartRoll(Number(e.target.value))} className="w-24" /></TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="icon" variant="ghost" onClick={() => saveSection.mutate()}><Save className="h-4 w-4" /></Button>
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


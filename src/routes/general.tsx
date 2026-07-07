import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
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

  const [activeSessionId, setActiveSessionId] = useState<string>("");
  const [activeStart, setActiveStart] = useState("");
  const [activeEnd, setActiveEnd] = useState("");
  const [activeAdmissionSeries, setActiveAdmissionSeries] = useState("");
  
  useEffect(() => {
    if (sessions.length && !activeSessionId) {
      const active = sessions.find(s => s.is_active);
      if (active) setActiveSessionId(active.id);
    }
  }, [sessions, activeSessionId]);

  useEffect(() => {
    const s = sessions.find(s => s.id === activeSessionId);
    if (s) {
      setActiveStart(s.start_date || "");
      setActiveEnd(s.end_date || "");
      setActiveAdmissionSeries(s.admission_series || "");
    }
  }, [activeSessionId, sessions]);

  const updateSettings = useMutation({
    mutationFn: async () => {
      // Unset all active sessions
      await supabase.from("sessions").update({ is_active: false }).neq("id", "00000000-0000-0000-0000-000000000000"); // hack to update all
      if (activeSessionId) {
        await supabase.from("sessions").update({ 
          is_active: true,
          start_date: activeStart,
          end_date: activeEnd,
          admission_series: activeAdmissionSeries
        }).eq("id", activeSessionId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["college_settings"] });
      toast.success("Settings saved");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) {
    return <div className="p-8 animate-pulse text-muted-foreground">Loading configuration...</div>;
  }

  const activeSessionName = sessions.find(s => s.id === activeSessionId)?.name || "Not Set";

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
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => {
                const btn = document.getElementById("add-session-btn");
                if (btn) {
                  btn.click();
                  setTimeout(() => {
                    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                  }, 100);
                }
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add session
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-end gap-6">
            <div className="grid gap-2 w-[240px]">
              <label className="text-sm font-medium">Current Active Session:</label>
              <Select value={activeSessionId} onValueChange={setActiveSessionId}>
                <SelectTrigger><SelectValue placeholder="Select session" /></SelectTrigger>
                <SelectContent>
                  {sessions.map((s) => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2 flex-1 min-w-[200px] max-w-[250px]">
              <label className="text-sm font-medium">Start Date:</label>
              <Input 
                type="date"
                value={activeStart} 
                onChange={(e) => setActiveStart(e.target.value)}
              />
            </div>

            <div className="grid gap-2 flex-1 min-w-[200px] max-w-[250px]">
              <label className="text-sm font-medium">End Date:</label>
              <Input 
                type="date"
                value={activeEnd} 
                onChange={(e) => setActiveEnd(e.target.value)}
              />
            </div>

            <div className="grid gap-2 flex-1 min-w-[200px] max-w-[250px]">
              <label className="text-sm font-medium">Admission Series:</label>
              <Input 
                value={activeAdmissionSeries} 
                onChange={(e) => setActiveAdmissionSeries(e.target.value)}
                placeholder="e.g. ADM-2027-0001"
              />
            </div>

            {canEdit && (
              <Button disabled={updateSettings.isPending} onClick={() => updateSettings.mutate()}>
                <Save className="mr-2 h-4 w-4" /> Save
              </Button>
            )}
          </div>
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
              {canEdit && <TableHead className="text-right">Actions</TableHead>}
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
                    {s.is_active ? <span className="text-primary font-medium">Active</span> : <span className="text-muted-foreground">Inactive</span>}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => saveSession.mutate()}><Save className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>x</Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this session?")) deleteSession.mutate(s.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      )}
                    </TableCell>
                  )}
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
              {canEdit && <TableHead className="text-right">Actions</TableHead>}
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
                  {canEdit && (
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => saveFees.mutate(p.id)}><Save className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingProgramId(null)}>x</Button>
                        </div>
                      ) : (
                        <Button size="icon" variant="ghost" onClick={() => startEdit(p.id)}><Pencil className="h-4 w-4" /></Button>
                      )}
                    </TableCell>
                  )}
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
              {canEdit && <TableHead className="text-right">Actions</TableHead>}
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
                  {canEdit && (
                    <TableCell className="text-right">
                      {isEditing ? (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => saveSection.mutate()}><Save className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => setEditingId(null)}>x</Button>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <Button size="icon" variant="ghost" onClick={() => startEdit(s)}><Pencil className="h-4 w-4" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete?")) deleteSection.mutate(s.id); }}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                        </div>
                      )}
                    </TableCell>
                  )}
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


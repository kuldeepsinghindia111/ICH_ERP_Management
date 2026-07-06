import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarRange, Check, Hash, Lock, Plus, RotateCcw, Save,
  Settings as SettingsIcon, Trash2, FileText, UploadCloud
} from "lucide-react";

import { useStore, formatReceiptDate, DEFAULT_RECEIPT_FORMAT, type ReceiptFormat } from "@/lib/store";
import { supabase } from "@/lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FEE_HEADS } from "@/lib/store";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Payment Settings — Imperial CMS" },
      { name: "description", content: "Manage college bank / UPI beneficiary details, receipt number format, and academic sessions." },
    ],
  }),
  component: SettingsPage,
});

const FIELDS = [
  { key: "college_name", label: "College name" },
  { key: "account_name", label: "Beneficiary account name" },
  { key: "account_number", label: "Account number", mono: true },
  { key: "ifsc", label: "IFSC code", mono: true },
  { key: "bank_name", label: "Bank name" },
  { key: "branch", label: "Branch" },
  { key: "upi_id", label: "UPI ID", mono: true },
  { key: "upi_name", label: "UPI display name" },
  { key: "support_email", label: "Support email" },
  { key: "support_phone", label: "Support phone" },
];

function SettingsPage() {
  const canEdit = useStore((s) => s.can("settings", "edit"));

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-6 py-8">
      <header className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <SettingsIcon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Configuration</p>
          <h1 className="font-display text-2xl font-semibold text-foreground">College Payment Settings</h1>
        </div>
        {!canEdit && (
          <Badge variant="secondary" className="gap-1">
            <Lock className="h-3.5 w-3.5" /> Read-only
          </Badge>
        )}
      </header>

      {!canEdit && (
        <div className="rounded-md border border-warning/40 bg-warning/10 p-3 text-sm text-warning-foreground">
          You don't have permission to edit settings. Ask an admin to grant "settings" edit access.
        </div>
      )}

      <CollegeSettingsCard canEdit={canEdit} />
      <SessionsCard canEdit={canEdit} />
      <FeeStructuresCard canEdit={canEdit} />
    </div>
  );
}

function CollegeSettingsCard({ canEdit }: { canEdit: boolean }) {
  const queryClient = useQueryClient();
  const { data: settings, isLoading } = useQuery({
    queryKey: ["college_settings"],
    queryFn: async () => {
      const { data, error } = await supabase.from("college_settings").select("*").limit(1).single();
      if (error && error.code !== "PGRST116") throw error; // PGRST116 = zero rows
      return data;
    },
  });

  const [draft, setDraft] = useState<any>({});
  
  useEffect(() => {
    if (settings) {
      setDraft(settings);
    }
  }, [settings]);

  const updateSettings = useMutation({
    mutationFn: async (newSettings: any) => {
      if (settings?.id) {
        const { error } = await supabase.from("college_settings").update(newSettings).eq("id", settings.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("college_settings").insert([newSettings]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["college_settings"] });
      toast.success("Settings updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (isLoading) return <div className="animate-pulse h-64 bg-muted/50 rounded-lg"></div>;

  const dirty = JSON.stringify(draft) !== JSON.stringify(settings || {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg">Beneficiary details & Receipt Format</CardTitle>
        <p className="text-xs text-muted-foreground">
          These details appear on the online payment page and every downloaded receipt.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key} className={f.key === "college_name" || f.key === "account_name" ? "sm:col-span-2" : ""}>
              <Label>{f.label}</Label>
              <Input
                className={f.mono ? "font-mono" : ""}
                value={draft[f.key] || ""}
                disabled={!canEdit}
                onChange={(e) => setDraft((d: any) => ({ ...d, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
        
        <div className="border-t pt-6 grid gap-4 sm:grid-cols-3">
          <div className="sm:col-span-3">
            <h4 className="font-medium text-sm">Receipt number format</h4>
          </div>
          <div>
            <Label>Prefix</Label>
            <Input value={draft.receipt_prefix || ""} disabled={!canEdit}
              onChange={(e) => setDraft((d: any) => ({ ...d, receipt_prefix: e.target.value }))} />
          </div>
          <div>
            <Label>Date pattern</Label>
            <Input className="font-mono" value={draft.receipt_date_pattern || ""} disabled={!canEdit}
              onChange={(e) => setDraft((d: any) => ({ ...d, receipt_date_pattern: e.target.value }))} />
          </div>
          <div>
            <Label>Daily counter starts at</Label>
            <Input type="number" min={1} value={draft.receipt_counter_start || 1} disabled={!canEdit}
              onChange={(e) => setDraft((d: any) => ({ ...d, receipt_counter_start: Number(e.target.value) }))} />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 pt-4">
          <Button variant="outline" onClick={() => setDraft(settings || {})} disabled={!dirty || !canEdit}>
            Discard changes
          </Button>
          <Button
            onClick={() => {
              updateSettings.mutate(draft);
            }}
            disabled={!dirty || !canEdit || updateSettings.isPending}
          >
            <Save className="mr-1 h-4 w-4" /> Save changes
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SessionsCard({ canEdit }: { canEdit: boolean }) {
  const queryClient = useQueryClient();
  const { data: settings } = useQuery({
    queryKey: ["college_settings"],
    queryFn: async () => {
      const { data } = await supabase.from("college_settings").select("*").limit(1).single();
      return data;
    },
  });

  const { data: sessions, isLoading } = useQuery({
    queryKey: ["sessions"],
    queryFn: async () => {
      const { data, error } = await supabase.from("sessions").select("*").order("start_date", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const addSession = useMutation({
    mutationFn: async (session: any) => {
      const { error } = await supabase.from("sessions").insert([session]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session added");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeSession = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sessions").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      toast.success("Session removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const setActiveSession = useMutation({
    mutationFn: async (sessionId: string) => {
      if (!settings?.id) throw new Error("No settings record found to update");
      const { error } = await supabase.from("college_settings").update({ active_session_id: sessionId }).eq("id", settings.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["college_settings"] });
      toast.success("Active session updated");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const [name, setName] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");

  if (isLoading) return <div className="animate-pulse h-32 bg-muted/50 rounded-lg"></div>;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <CalendarRange className="h-4 w-4" /> Academic sessions / years
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Define academic years to filter payments and receipts by session in reports.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-4">
          <div>
            <Label>Session name</Label>
            <Input value={name} disabled={!canEdit} onChange={(e) => setName(e.target.value)} placeholder="e.g. 2026-27" />
          </div>
          <div>
            <Label>Start date</Label>
            <Input type="date" value={start} disabled={!canEdit} onChange={(e) => setStart(e.target.value)} />
          </div>
          <div>
            <Label>End date</Label>
            <Input type="date" value={end} disabled={!canEdit} onChange={(e) => setEnd(e.target.value)} />
          </div>
          <div className="flex items-end">
            <Button
              className="w-full"
              disabled={!canEdit || addSession.isPending}
              onClick={() => {
                if (!name.trim() || !start || !end) return toast.error("Name, start and end date are required");
                if (start > end) return toast.error("End date must be after start date");
                addSession.mutate({ name: name.trim(), start_date: start, end_date: end });
                setName(""); setStart(""); setEnd("");
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Add session
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-md border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-xs uppercase tracking-widest text-muted-foreground">
              <tr>
                <th className="px-3 py-2 text-left">Session</th>
                <th className="px-3 py-2 text-left">Range</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sessions?.map((s: any) => {
                const isActive = s.id === settings?.active_session_id;
                return (
                  <tr key={s.id}>
                    <td className="px-3 py-2">
                      <span className="font-medium">{s.name}</span>
                      {isActive && <Badge className="ml-2 bg-success text-success-foreground"><Check className="mr-1 h-3 w-3" /> Active</Badge>}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground">
                      {s.start_date} → {s.end_date}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {!isActive && (
                        <Button size="sm" variant="ghost" disabled={!canEdit || setActiveSession.isPending}
                          onClick={() => setActiveSession.mutate(s.id)}>
                          Set active
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" disabled={!canEdit || isActive || removeSession.isPending}
                        onClick={() => removeSession.mutate(s.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
              {sessions?.length === 0 && (
                <tr><td colSpan={3} className="px-3 py-4 text-center text-muted-foreground text-xs">No sessions configured.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}

function FeeStructuresCard({ canEdit }: { canEdit: boolean }) {
  const queryClient = useQueryClient();
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("");
  const [head, setHead] = useState<string>("tuition");
  const [amount, setAmount] = useState<string>("");
  
  const { data: programs } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("programs").select("*").order("name");
      if (error) throw error;
      return data;
    }
  });

  const { data: structures, isLoading } = useQuery({
    queryKey: ["fee_structures", selectedProgram, selectedSemester],
    queryFn: async () => {
      if (!selectedProgram || !selectedSemester) return [];
      const { data, error } = await supabase
        .from("fee_structures")
        .select("*, program:programs(name)")
        .eq("program_id", selectedProgram)
        .eq("semester", parseInt(selectedSemester));
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProgram && !!selectedSemester
  });

  const addStructure = useMutation({
    mutationFn: async (struct: any) => {
      const { error } = await supabase.from("fee_structures").insert([struct]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee_structures"] });
      toast.success("Fee structure added");
      setAmount("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeStructure = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("fee_structures").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["fee_structures"] });
      toast.success("Fee structure removed");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const generateBills = useMutation({
    mutationFn: async () => {
      if (!selectedProgram || !selectedSemester || !structures || structures.length === 0) {
         throw new Error("No fee structures found for this program and semester.");
      }
      
      const sem = parseInt(selectedSemester);
      
      // 1. Get all students in this program and semester
      const { data: students, error: studErr } = await supabase
        .from("students")
        .select("id")
        .eq("program_id", selectedProgram)
        .eq("current_semester", sem)
        .eq("status", "active");
        
      if (studErr) throw studErr;
      if (!students || students.length === 0) throw new Error("No active students found in this program and semester.");
      
      // 2. Fetch all existing charges for these students this semester
      const { data: existingCharges, error: charErr } = await supabase
        .from("fee_charges")
        .select("student_id, head")
        .in("student_id", students.map(s => s.id))
        .eq("semester", sem);
        
      if (charErr) throw charErr;
      
      const toInsert: any[] = [];
      
      // 3. For each student, figure out what they are missing
      for (const student of students) {
        for (const struct of structures) {
          // Did the student already get billed for this head?
          const alreadyBilled = existingCharges.some(c => c.student_id === student.id && c.head === struct.fee_head);
          if (!alreadyBilled) {
            toInsert.push({
              student_id: student.id,
              semester: sem,
              head: struct.fee_head,
              label: "Standard Fee",
              amount: struct.amount
            });
          }
        }
      }
      
      if (toInsert.length === 0) {
        throw new Error("All students have already been billed for these heads.");
      }
      
      // 4. Insert charges
      const { error: insErr } = await supabase.from("fee_charges").insert(toInsert);
      if (insErr) throw insErr;
      
      return toInsert.length;
    },
    onSuccess: (count) => {
      toast.success(`Generated ${count} new fee charges successfully!`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const p = programs?.find(p => p.id === selectedProgram);
  const semOptions = p ? Array.from({ length: p.total_semesters }, (_, i) => i + 1) : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-display text-lg flex items-center gap-2">
          <FileText className="h-4 w-4" /> Fee Structures (Billing)
        </CardTitle>
        <CardDescription>
          Define standard fees for programs and automatically generate bills for enrolled students.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 bg-muted/40 p-4 rounded-md border border-border">
          <div>
            <Label>Select Program</Label>
            <Select value={selectedProgram} onValueChange={(v) => { setSelectedProgram(v); setSelectedSemester(""); }}>
              <SelectTrigger><SelectValue placeholder="Choose program" /></SelectTrigger>
              <SelectContent>
                {programs?.map((p: any) => (
                  <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Select Semester</Label>
            <Select value={selectedSemester} onValueChange={setSelectedSemester} disabled={!selectedProgram}>
              <SelectTrigger><SelectValue placeholder="Choose semester" /></SelectTrigger>
              <SelectContent>
                {semOptions.map(sem => (
                  <SelectItem key={sem} value={String(sem)}>Semester {sem}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedProgram && selectedSemester && (
          <div className="space-y-4 border rounded-md p-4">
            <h4 className="font-medium text-sm flex justify-between items-center">
              <span>Standard Fees for Semester {selectedSemester}</span>
              {structures && structures.length > 0 && (
                 <Button 
                   size="sm" 
                   disabled={!canEdit || generateBills.isPending} 
                   onClick={() => generateBills.mutate()}
                 >
                   {generateBills.isPending ? "Generating..." : <><UploadCloud className="w-4 h-4 mr-1" /> Generate Bills</>}
                 </Button>
              )}
            </h4>
            
            <div className="overflow-hidden rounded-md border border-border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase tracking-widest text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left">Fee Head</th>
                    <th className="px-3 py-2 text-right">Amount (₹)</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {structures?.map((s: any) => (
                    <tr key={s.id}>
                      <td className="px-3 py-2">
                        <span className="font-medium capitalize">{s.fee_head}</span>
                      </td>
                      <td className="px-3 py-2 text-right font-mono">
                        {Number(s.amount).toFixed(2)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        <Button size="sm" variant="ghost" disabled={!canEdit || removeStructure.isPending}
                          onClick={() => removeStructure.mutate(s.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {structures?.length === 0 && (
                    <tr><td colSpan={3} className="px-3 py-4 text-center text-muted-foreground text-xs">No fees defined for this semester.</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="flex gap-2 items-end pt-2">
              <div className="flex-1">
                 <Label>Fee Head</Label>
                 <Select value={head} onValueChange={setHead}>
                   <SelectTrigger><SelectValue /></SelectTrigger>
                   <SelectContent>
                     {FEE_HEADS.map(f => (
                        <SelectItem key={f.key} value={f.key}>{f.label}</SelectItem>
                     ))}
                   </SelectContent>
                 </Select>
              </div>
              <div className="flex-1">
                 <Label>Amount (₹)</Label>
                 <Input type="number" min={0} value={amount} onChange={(e) => setAmount(e.target.value)} />
              </div>
              <Button disabled={!canEdit || !amount || addStructure.isPending} onClick={() => {
                addStructure.mutate({
                  program_id: selectedProgram,
                  semester: parseInt(selectedSemester),
                  fee_head: head,
                  amount: parseFloat(amount)
                });
              }}>
                <Plus className="w-4 h-4 mr-1" /> Add Fee
              </Button>
            </div>
            
          </div>
        )}
      </CardContent>
    </Card>
  );
}

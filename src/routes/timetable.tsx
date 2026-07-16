import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Plus, Trash2, Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/timetable")({
  head: () => ({
    meta: [
      { title: "Timetable — Imperial CMS" },
    ],
  }),
  component: TimetablePage,
});

const DAYS_OF_WEEK = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

function TimetablePage() {
  const queryClient = useQueryClient();
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [selectedSemester, setSelectedSemester] = useState<string>("1");
  
  const [isSlotDialogOpen, setIsSlotDialogOpen] = useState(false);
  const [isEntryDialogOpen, setIsEntryDialogOpen] = useState(false);
  
  // Slot state
  const [slotDay, setSlotDay] = useState("Monday");
  const [slotStart, setSlotStart] = useState("09:00");
  const [slotEnd, setSlotEnd] = useState("10:00");

  // Entry state
  const [entrySlotId, setEntrySlotId] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [facultyId, setFacultyId] = useState("unassigned");
  const [roomNo, setRoomNo] = useState("");

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('programs').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: facultyList = [] } = useQuery({
    queryKey: ['faculty'],
    queryFn: async () => {
      const { data, error } = await supabase.from('faculty').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: timeSlots = [], isLoading: loadingSlots } = useQuery({
    queryKey: ['time_slots'],
    queryFn: async () => {
      const { data, error } = await supabase.from('time_slots').select('*').order('start_time');
      if (error) throw error;
      return data;
    }
  });

  const { data: timetableEntries = [], isLoading: loadingEntries } = useQuery({
    queryKey: ['timetable_entries', selectedProgram, selectedSemester],
    queryFn: async () => {
      if (!selectedProgram) return [];
      const { data, error } = await supabase
        .from('timetable_entries')
        .select('*, faculty:faculty(name)')
        .eq('program_id', selectedProgram)
        .eq('semester', parseInt(selectedSemester));
      if (error) throw error;
      return data;
    },
    enabled: !!selectedProgram
  });

  const createSlotMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('time_slots').insert({
        day_of_week: slotDay,
        start_time: slotStart,
        end_time: slotEnd,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_slots'] });
      setIsSlotDialogOpen(false);
      toast.success("Time slot added");
    },
    onError: (err: any) => toast.error(err.message)
  });

  const deleteSlotMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('time_slots').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time_slots'] });
      toast.success("Time slot deleted");
    }
  });

  const saveEntryMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        program_id: selectedProgram,
        semester: parseInt(selectedSemester),
        slot_id: entrySlotId,
        subject_name: subjectName,
        faculty_id: facultyId === "unassigned" ? null : facultyId,
        room_no: roomNo,
      };
      const { error } = await supabase
        .from('timetable_entries')
        .upsert(payload, { onConflict: 'program_id, semester, slot_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable_entries'] });
      setIsEntryDialogOpen(false);
      toast.success("Timetable entry saved");
    },
    onError: (err: any) => toast.error(err.message)
  });

  const deleteEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('timetable_entries').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['timetable_entries'] });
      toast.success("Timetable entry removed");
    }
  });

  // Group slots by day
  const slotsByDay: Record<string, any[]> = {};
  DAYS_OF_WEEK.forEach(day => slotsByDay[day] = []);
  timeSlots.forEach((slot: any) => {
    if (slotsByDay[slot.day_of_week]) {
      slotsByDay[slot.day_of_week].push(slot);
    }
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
          <p className="text-muted-foreground mt-1">Manage class schedules and faculty assignments.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsSlotDialogOpen(true)}>
            Manage Time Slots
          </Button>
        </div>
      </div>

      <div className="bg-card border rounded-lg p-4 shadow-sm flex flex-col sm:flex-row gap-4 items-end">
        <div className="grid gap-2 flex-1">
          <Label>Program</Label>
          <Select value={selectedProgram} onValueChange={setSelectedProgram}>
            <SelectTrigger>
              <SelectValue placeholder="Select Program" />
            </SelectTrigger>
            <SelectContent>
              {programs.map((p: any) => (
                <SelectItem key={p.id} value={p.id}>{p.code} - {p.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="grid gap-2 flex-1">
          <Label>Semester</Label>
          <Input type="number" min="1" value={selectedSemester} onChange={e => setSelectedSemester(e.target.value)} />
        </div>
      </div>

      {!selectedProgram ? (
        <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
          Please select a program and semester to view the timetable.
        </div>
      ) : loadingSlots || loadingEntries ? (
        <div className="py-12 text-center text-muted-foreground">Loading timetable...</div>
      ) : (
        <div className="grid gap-6">
          {DAYS_OF_WEEK.map(day => {
            const daySlots = slotsByDay[day] || [];
            if (daySlots.length === 0) return null;
            
            return (
              <Card key={day}>
                <CardHeader className="bg-muted/50 pb-4">
                  <CardTitle className="text-lg">{day}</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="divide-y">
                    {daySlots.map(slot => {
                      const entry = timetableEntries.find((e: any) => e.slot_id === slot.id);
                      
                      return (
                        <div key={slot.id} className="flex flex-col sm:flex-row p-4 items-center justify-between hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-4 w-full sm:w-auto">
                            <div className="w-32 font-medium text-sm">
                              {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                            </div>
                            
                            {entry ? (
                              <div className="flex flex-col">
                                <span className="font-semibold text-primary">{entry.subject_name}</span>
                                <span className="text-xs text-muted-foreground">
                                  {entry.faculty ? entry.faculty.name : "No Faculty Assigned"} 
                                  {entry.room_no && ` • Room: ${entry.room_no}`}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground italic text-sm">Free Slot</span>
                            )}
                          </div>
                          
                          <div className="mt-4 sm:mt-0 flex gap-2 w-full sm:w-auto justify-end">
                            {entry && (
                              <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => {
                                if(confirm("Remove this class?")) deleteEntryMutation.mutate(entry.id);
                              }}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="secondary" size="sm" onClick={() => {
                              setEntrySlotId(slot.id);
                              setSubjectName(entry?.subject_name || "");
                              setFacultyId(entry?.faculty_id || "unassigned");
                              setRoomNo(entry?.room_no || "");
                              setIsEntryDialogOpen(true);
                            }}>
                              {entry ? "Edit" : "Assign"}
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
          
          {timeSlots.length === 0 && (
             <div className="py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                No time slots have been created yet. Click "Manage Time Slots" to set up your schedule structure.
             </div>
          )}
        </div>
      )}

      {/* Time Slot Manager Dialog */}
      <Dialog open={isSlotDialogOpen} onOpenChange={setIsSlotDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Time Slots</DialogTitle>
            <DialogDescription>Define the available class periods.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 my-4">
            <div className="border rounded-md divide-y max-h-64 overflow-auto">
              {timeSlots.map((slot: any) => (
                <div key={slot.id} className="flex justify-between items-center p-3 text-sm">
                  <div>
                    <span className="font-medium mr-2">{slot.day_of_week}</span>
                    {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                  </div>
                  <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteSlotMutation.mutate(slot.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {timeSlots.length === 0 && <div className="p-4 text-center text-muted-foreground">No slots added.</div>}
            </div>

            <div className="grid grid-cols-2 gap-3 pt-4 border-t">
              <div className="col-span-2">
                <Label>Day</Label>
                <Select value={slotDay} onValueChange={setSlotDay}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DAYS_OF_WEEK.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Start Time</Label>
                <Input type="time" value={slotStart} onChange={e => setSlotStart(e.target.value)} />
              </div>
              <div>
                <Label>End Time</Label>
                <Input type="time" value={slotEnd} onChange={e => setSlotEnd(e.target.value)} />
              </div>
              <Button className="col-span-2 mt-2" onClick={() => createSlotMutation.mutate()} disabled={!slotStart || !slotEnd || createSlotMutation.isPending}>
                Add Slot
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Assign Entry Dialog */}
      <Dialog open={isEntryDialogOpen} onOpenChange={setIsEntryDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Class</DialogTitle>
            <DialogDescription>Assign a subject and faculty to this slot.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Subject Name</Label>
              <Input value={subjectName} onChange={e => setSubjectName(e.target.value)} placeholder="e.g. Mathematics" />
            </div>
            
            <div className="grid gap-2">
              <Label>Faculty Member</Label>
              <Select value={facultyId} onValueChange={setFacultyId}>
                <SelectTrigger><SelectValue placeholder="Select Faculty" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">-- Unassigned --</SelectItem>
                  {facultyList.map((f: any) => (
                    <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Room / Hall No.</Label>
              <Input value={roomNo} onChange={e => setRoomNo(e.target.value)} placeholder="e.g. Room 101" />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEntryDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveEntryMutation.mutate()} disabled={!subjectName || saveEntryMutation.isPending}>
              Save Assignment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

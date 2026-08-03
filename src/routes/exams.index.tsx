import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Plus, GraduationCap, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/exams/")({
  head: () => ({
    meta: [
      { title: "Examinations — Imperial CMS" },
    ],
  }),
  component: ExamsPage,
});

function ExamsPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const [title, setTitle] = useState("");
  const [programId, setProgramId] = useState("");
  const [semester, setSemester] = useState("");
  const [date, setDate] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");

  const { data: programs = [] } = useQuery({
    queryKey: ['programs'],
    queryFn: async () => {
      const { data, error } = await supabase.from('programs').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: exams = [], isLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const { data, error } = await supabase.from('exams').select('*, program:programs(name, code)').order('date', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const createExamMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('exams').insert({
        title,
        program_id: programId,
        semester: parseInt(semester),
        date,
        max_marks: parseInt(maxMarks),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      setIsDialogOpen(false);
      toast.success("Exam created successfully");
      // reset
      setTitle("");
      setProgramId("");
      setSemester("");
      setDate("");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to create exam");
    }
  });

  const deleteExamMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exams').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exams'] });
      toast.success("Exam deleted successfully");
    }
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">Examinations</h1>
          <p className="text-muted-foreground mt-1">Manage exams, tests, and student grades.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Exam
        </Button>
      </div>

      <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 mt-6">
        {isLoading ? (
          <div className="col-span-full py-12 text-center text-muted-foreground">Loading exams...</div>
        ) : exams.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            No exams found. Create one to get started.
          </div>
        ) : (
          exams.map((exam: any) => (
            <Card key={exam.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <CardTitle className="text-xl flex justify-between items-start">
                  <span>{exam.title}</span>
                  <div className="flex items-center gap-1">
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive opacity-50 hover:opacity-100" onClick={(e) => {
                       e.preventDefault();
                       if (confirm("Are you sure you want to delete this exam? All marks will be lost.")) {
                         deleteExamMutation.mutate(exam.id);
                       }
                     }}>
                       <Trash2 className="h-4 w-4" />
                     </Button>
                  </div>
                </CardTitle>
                <CardDescription>
                  {exam.program?.name} (Sem {exam.semester})
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{new Date(exam.date).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Max Marks:</span>
                    <span className="font-medium">{exam.max_marks}</span>
                  </div>
                </div>
                
                <div className="mt-6">
                  <Link to={`/exams/${exam.id}`} className="w-full">
                    <Button variant="outline" className="w-full flex items-center justify-center gap-2">
                      <GraduationCap className="h-4 w-4" />
                      Manage Marks
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Examination</DialogTitle>
            <DialogDescription>
              Set up a new exam. You can add student marks later.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Exam Title (e.g. Mid-Term, Final)</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Mid-Term Examination" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Program</Label>
                <Select value={programId} onValueChange={setProgramId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.code}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid gap-2">
                <Label>Semester</Label>
                <Input type="number" min="1" value={semester} onChange={e => setSemester(e.target.value)} placeholder="1" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Date of Exam</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Max Marks</Label>
                <Input type="number" min="1" value={maxMarks} onChange={e => setMaxMarks(e.target.value)} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => createExamMutation.mutate()} 
              disabled={!title || !programId || !semester || !date || createExamMutation.isPending}
            >
              {createExamMutation.isPending ? "Creating..." : "Create Exam"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

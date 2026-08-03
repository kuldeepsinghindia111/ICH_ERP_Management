import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { ArrowLeft, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";

export const Route = createFileRoute("/exams/$examId")({
  head: () => ({
    meta: [
      { title: "Manage Marks — Imperial CMS" },
    ],
  }),
  component: ManageExamMarksPage,
});

function ManageExamMarksPage() {
  const { examId } = useParams({ from: "/exams/$examId" });
  const queryClient = useQueryClient();
  const [marksState, setMarksState] = useState<Record<string, { marks: string; remarks: string }>>({});

  const { data: exam, isLoading: isLoadingExam } = useQuery({
    queryKey: ['exams', examId],
    queryFn: async () => {
      const { data, error } = await supabase.from('exams').select('*, program:programs(name, code)').eq('id', examId).single();
      if (error) throw error;
      return data;
    }
  });

  const { data: students = [], isLoading: isLoadingStudents } = useQuery({
    queryKey: ['exam_students', examId],
    queryFn: async () => {
      if (!exam) return [];
      
      // Fetch all students for this program and semester
      const { data: stData, error: stError } = await supabase
        .from('students')
        .select('*')
        .eq('program_id', exam?.program_id)
        .eq('current_semester', exam?.semester)
        .eq('status', 'active');
        
      if (stError) throw stError;

      // Fetch existing marks
      const { data: marksData, error: marksError } = await supabase
        .from('exam_marks')
        .select('*')
        .eq('exam_id', examId);
        
      if (marksError) throw marksError;

      // Initialize state with existing marks
      const stateObj: Record<string, { marks: string; remarks: string }> = {};
      stData.forEach((st: any) => {
        const mark = marksData.find((m: any) => m.student_id === st.id);
        if (mark) {
          stateObj[st.id] = { marks: mark.marks_obtained?.toString() || "", remarks: mark.remarks || "" };
        }
      });
      setMarksState(stateObj);

      return stData;
    },
    enabled: !!exam,
  });

  const saveMarksMutation = useMutation({
    mutationFn: async () => {
      const payload = Object.entries(marksState).map(([studentId, data]) => ({
        exam_id: examId,
        student_id: studentId,
        marks_obtained: data.marks ? parseFloat(data.marks) : null,
        remarks: data.remarks || null,
      })).filter(m => m.marks_obtained !== null || m.remarks !== null);

      if (payload.length === 0) return;

      // UPSERT operation
      const { error } = await supabase
        .from('exam_marks')
        .upsert(payload, { onConflict: 'exam_id, student_id' });
        
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['exam_students', examId] });
      toast.success("Marks saved successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to save marks");
    }
  });

  const handleMarkChange = (studentId: string, value: string) => {
    setMarksState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], marks: value }
    }));
  };

  const handleRemarkChange = (studentId: string, value: string) => {
    setMarksState(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], remarks: value }
    }));
  };

  if (isLoadingExam || isLoadingStudents) {
    return <div className="p-10 text-center text-muted-foreground">Loading...</div>;
  }

  if (!exam) {
    return <div className="p-10 text-center text-red-500">Exam not found.</div>;
  }

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link to="/exams" className="text-muted-foreground hover:text-foreground">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">{exam.title}</h1>
          </div>
          <p className="text-muted-foreground mt-1">
            {exam.program?.name} (Sem {exam.semester}) • Max Marks: {exam.max_marks}
          </p>
        </div>
        <Button 
          onClick={() => saveMarksMutation.mutate()} 
          disabled={saveMarksMutation.isPending}
          className="flex items-center gap-2"
        >
          {saveMarksMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Save Marks
        </Button>
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Roll No.</TableHead>
              <TableHead>Student Name</TableHead>
              <TableHead className="w-[150px]">Marks Obtained</TableHead>
              <TableHead>Remarks</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {students.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center h-24 text-muted-foreground">
                  No active students found in this program and semester.
                </TableCell>
              </TableRow>
            ) : (
              students.map((st: any) => (
                <TableRow key={st.id}>
                  <TableCell className="font-medium">{st.roll_number || "N/A"}</TableCell>
                  <TableCell>{st.name}</TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      step="0.1"
                      min="0"
                      max={exam.max_marks}
                      value={marksState[st.id]?.marks || ""}
                      onChange={(e) => handleMarkChange(st.id, e.target.value)}
                      placeholder={`/ ${exam.max_marks}`}
                    />
                  </TableCell>
                  <TableCell>
                    <Input
                      value={marksState[st.id]?.remarks || ""}
                      onChange={(e) => handleRemarkChange(st.id, e.target.value)}
                      placeholder="Optional remarks..."
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

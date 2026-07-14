import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Plus, Trash2, Pencil, Save, X, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "Courses — Imperial CMS" },
      { name: "description", content: "Manage courses (programs) and duration." },
    ],
  }),
  component: CoursesPage,
});

type Program = {
  id: string;
  name: string;
  code: string;
  total_semesters: number;
};

function CoursesPage() {
  const { can } = useAuth();
  const canEdit = can("courses", "edit");
  const queryClient = useQueryClient();

  const { data: courses = [], isLoading } = useQuery<Program[]>({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("programs").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const [addingCourse, setAddingCourse] = useState<Partial<Program> | null>(null);

  const handleAddClick = () => {
    setAddingCourse({ name: "", code: "", total_semesters: 6 });
  };

  if (isLoading) return <div className="p-8 animate-pulse text-muted-foreground">Loading courses...</div>;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Academics</p>
          <h1 className="font-display text-3xl font-semibold text-foreground">Course Management</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage courses and their durations.</p>
        </div>
        <div className="flex gap-2">
          {canEdit && (
            <Button onClick={handleAddClick} disabled={addingCourse !== null}>
              <Plus className="mr-2 h-4 w-4" /> Add course
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b">
                <tr>
                  <th className="px-5 py-3 text-left font-medium w-32">Course Code</th>
                  <th className="px-5 py-3 text-left font-medium">Name of the Course</th>
                  <th className="px-5 py-3 text-left font-medium w-32 whitespace-nowrap">No. of Semesters</th>
                  <th className="px-5 py-3 text-left font-medium w-32 whitespace-nowrap">Duration (Years)</th>
                  <th className="px-5 py-3 text-right font-medium w-32">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {addingCourse && (
                  <InlineCourseRow 
                    course={addingCourse} 
                    isNew={true} 
                    onCancel={() => setAddingCourse(null)} 
                  />
                )}
                {courses.length === 0 && !addingCourse && (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground">
                      No courses found. Add a new course to get started.
                    </td>
                  </tr>
                )}
                {courses.map((c) => (
                  <InlineCourseRow key={c.id} course={c} isNew={false} canEdit={canEdit} />
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function InlineCourseRow({ 
  course, 
  isNew, 
  onCancel,
  canEdit = true
}: { 
  course: Partial<Program>, 
  isNew: boolean, 
  onCancel?: () => void,
  canEdit?: boolean
}) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(isNew);
  const [editState, setEditState] = useState(course);

  const saveMutation = useMutation({
    mutationFn: async (data: Partial<Program>) => {
      if (isNew) {
        const { error } = await supabase.from("programs").insert({ 
          name: data.name, 
          code: data.code, 
          total_semesters: data.total_semesters 
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("programs").update({ 
          name: data.name, 
          code: data.code, 
          total_semesters: data.total_semesters 
        }).eq("id", data.id);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success(isNew ? "Course added" : "Course updated");
      if (isNew && onCancel) {
        onCancel();
      } else {
        setIsEditing(false);
      }
    },
    onError: (e: any) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("programs").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success("Course deleted");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleSave = () => {
    if (!editState.name?.trim() || !editState.code?.trim()) {
      toast.error("Course Code and Name are required");
      return;
    }
    saveMutation.mutate(editState);
  };

  const handleCancel = () => {
    if (isNew && onCancel) {
      onCancel();
    } else {
      setEditState(course);
      setIsEditing(false);
    }
  };

  if (isEditing) {
    return (
      <tr className="bg-slate-50/50">
        <td className="px-5 py-3 align-top">
          <Input 
            value={editState.code} 
            onChange={(e) => setEditState({ ...editState, code: e.target.value })} 
            placeholder="e.g. BCA"
            className="h-9 font-mono"
            autoFocus={isNew}
          />
        </td>
        <td className="px-5 py-3 align-top">
          <Input 
            value={editState.name} 
            onChange={(e) => setEditState({ ...editState, name: e.target.value })} 
            placeholder="e.g. Bachelor of Computer Applications"
            className="h-9"
          />
        </td>
        <td className="px-5 py-3 align-top">
          <Input 
            type="number" 
            min={1} 
            value={editState.total_semesters} 
            onChange={(e) => setEditState({ ...editState, total_semesters: Number(e.target.value) })} 
            className="h-9 w-24"
          />
        </td>
        <td className="px-5 py-3 align-top pt-5 text-muted-foreground whitespace-nowrap">
          {Math.ceil((editState.total_semesters || 1) / 2)} Years
        </td>
        <td className="px-5 py-3 text-right align-top">
          <div className="flex justify-end gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-green-600 hover:text-green-700 hover:bg-green-50"
              onClick={handleSave}
              disabled={saveMutation.isPending}
            >
              {saveMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-slate-500 hover:text-slate-700"
              onClick={handleCancel}
              disabled={saveMutation.isPending}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </td>
      </tr>
    );
  }

  return (
    <tr className="group hover:bg-slate-50/50 transition-colors">
      <td className="px-5 py-3 font-mono text-muted-foreground">{course.code}</td>
      <td className="px-5 py-3 font-medium">{course.name}</td>
      <td className="px-5 py-3">{course.total_semesters}</td>
      <td className="px-5 py-3 text-muted-foreground">{Math.ceil((course.total_semesters || 1) / 2)} Years</td>
      <td className="px-5 py-3 text-right">
        {canEdit ? (
          <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              onClick={() => setIsEditing(true)}
            >
              <Pencil className="h-4 w-4" />
            </Button>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 text-red-600 hover:text-red-700 hover:bg-red-50"
                  disabled={deleteMutation.isPending}
                >
                  {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Course</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete the course <strong>{course.name}</strong>? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => course.id && deleteMutation.mutate(course.id)}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        ) : (
          <span className="text-muted-foreground text-xs">Read-only</span>
        )}
      </td>
    </tr>
  );
}

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings, Save, Loader2 } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export function StudentSettingsDialog() {
  const [open, setOpen] = useState(false);
  const [selectedProgramId, setSelectedProgramId] = useState<string>("");
  const [startAdmissionNo, setStartAdmissionNo] = useState("");
  const [startRollNumber, setStartRollNumber] = useState("");

  const queryClient = useQueryClient();

  const { data: programs = [], isLoading } = useQuery({
    queryKey: ["programs"],
    queryFn: async () => {
      const { data, error } = await supabase.from("programs").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  // Load the settings for the selected program
  const handleProgramSelect = (pid: string) => {
    setSelectedProgramId(pid);
    const p = programs.find((pr: any) => pr.id === pid);
    if (p) {
      setStartAdmissionNo(p.start_admission_no || "");
      setStartRollNumber(p.start_roll_number || "");
    }
  };

  const updateProgramSettings = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("programs")
        .update({
          start_admission_no: startAdmissionNo.trim() || null,
          start_roll_number: startRollNumber.trim() || null,
        })
        .eq("id", selectedProgramId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["programs"] });
      toast.success("Settings saved successfully!");
      setOpen(false);
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline"><Settings className="mr-1 h-4 w-4" /> Settings</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Student Auto-Increment Settings</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="p-4 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : (
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Define the starting sequence for Admission No. and Roll No. When you add the very first student to this program, the system will use these values.
            </p>

            <div className="space-y-2">
              <Label>Select Course/Program</Label>
              <Select value={selectedProgramId} onValueChange={handleProgramSelect}>
                <SelectTrigger>
                  <SelectValue placeholder="Pick a course..." />
                </SelectTrigger>
                <SelectContent>
                  {programs.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.name} ({p.code})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedProgramId && (
              <div className="space-y-4 pt-2 border-t mt-4">
                <div className="space-y-2">
                  <Label>Starting Admission No. (e.g. 1001, BCA24001)</Label>
                  <Input 
                    placeholder="Leave blank to use global sequence"
                    value={startAdmissionNo} 
                    onChange={e => setStartAdmissionNo(e.target.value)} 
                  />
                  <p className="text-[0.8rem] text-muted-foreground">If left blank, the system will look at the global maximum admission number instead.</p>
                </div>
                
                <div className="space-y-2">
                  <Label>Starting Roll No. (e.g. 260BCA001)</Label>
                  <Input 
                    placeholder="Enter starting roll number"
                    value={startRollNumber} 
                    onChange={e => setStartRollNumber(e.target.value)} 
                  />
                </div>

                <Button 
                  className="w-full mt-2" 
                  disabled={updateProgramSettings.isPending}
                  onClick={() => updateProgramSettings.mutate()}
                >
                  {updateProgramSettings.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save Settings
                </Button>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

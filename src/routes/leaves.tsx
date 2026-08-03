import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Plus, CheckCircle, XCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export const Route = createFileRoute("/leaves")({
  head: () => ({
    meta: [
      { title: "Leave Portal — Imperial CMS" },
    ],
  }),
  component: LeavesPage,
});

function LeavesPage() {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");
  
  const [applicantType, setApplicantType] = useState<"student"|"faculty">("student");
  const [applicantId, setApplicantId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [reason, setReason] = useState("");

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: faculty = [] } = useQuery({
    queryKey: ['faculty'],
    queryFn: async () => {
      const { data, error } = await supabase.from('faculty').select('*');
      if (error) throw error;
      return data;
    }
  });

  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['leave_requests'],
    queryFn: async () => {
      const { data, error } = await supabase.from('leave_requests').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const submitLeaveMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('leave_requests').insert({
        applicant_type: applicantType,
        applicant_id: applicantId,
        start_date: startDate,
        end_date: endDate,
        reason,
        status: 'pending'
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leave_requests'] });
      setIsDialogOpen(false);
      toast.success("Leave request submitted");
      setApplicantId("");
      setStartDate("");
      setEndDate("");
      setReason("");
    },
    onError: (err: any) => toast.error(err.message)
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string, status: string }) => {
      const { error } = await supabase.from('leave_requests').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['leave_requests'] });
      toast.success(`Leave request ${variables.status}`);
    }
  });

  const filteredLeaves = leaves.filter((l: any) => {
    if (filterType === "all") return true;
    return l.status === filterType;
  });

  const getApplicantName = (type: string, id: string) => {
    if (type === 'student') return students.find((s: any) => s.id === id)?.name || "Unknown Student";
    if (type === 'faculty') return faculty.find((f: any) => f.id === id)?.name || "Unknown Faculty";
    return "Unknown";
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-blue-600 dark:text-blue-400">Leave Portal</h1>
          <p className="text-muted-foreground mt-1">Track and manage student and faculty absences.</p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Log New Leave
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Recent Leave Requests</CardTitle>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-45">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Requests</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Applicant</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Dates</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    Loading requests...
                  </TableCell>
                </TableRow>
              ) : filteredLeaves.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center h-24 text-muted-foreground">
                    No leave requests found.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLeaves.map((leave: any) => (
                  <TableRow key={leave.id}>
                    <TableCell className="font-medium">
                      {getApplicantName(leave.applicant_type, leave.applicant_id)}
                    </TableCell>
                    <TableCell className="capitalize">{leave.applicant_type}</TableCell>
                    <TableCell>
                      {new Date(leave.start_date).toLocaleDateString()} to {new Date(leave.end_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell className="max-w-50 truncate" title={leave.reason}>
                      {leave.reason}
                    </TableCell>
                    <TableCell>
                      {leave.status === 'pending' && <Badge variant="outline" className="text-yellow-600 bg-yellow-50"><Clock className="w-3 h-3 mr-1"/> Pending</Badge>}
                      {leave.status === 'approved' && <Badge variant="outline" className="text-green-600 bg-green-50"><CheckCircle className="w-3 h-3 mr-1"/> Approved</Badge>}
                      {leave.status === 'rejected' && <Badge variant="outline" className="text-red-600 bg-red-50"><XCircle className="w-3 h-3 mr-1"/> Rejected</Badge>}
                    </TableCell>
                    <TableCell className="text-right">
                      {leave.status === 'pending' && (
                        <div className="flex justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-green-600 border-green-200 hover:bg-green-50"
                            onClick={() => updateStatusMutation.mutate({ id: leave.id, status: 'approved' })}
                          >
                            Approve
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="text-red-600 border-red-200 hover:bg-red-50"
                            onClick={() => updateStatusMutation.mutate({ id: leave.id, status: 'rejected' })}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Leave Request</DialogTitle>
            <DialogDescription>Submit a leave of absence on behalf of a student or faculty.</DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Applicant Type</Label>
              <Select value={applicantType} onValueChange={(v: any) => { setApplicantType(v); setApplicantId(""); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Student</SelectItem>
                  <SelectItem value="faculty">Faculty Member</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-2">
              <Label>Select Applicant</Label>
              <Select value={applicantId} onValueChange={setApplicantId}>
                <SelectTrigger><SelectValue placeholder="Search..." /></SelectTrigger>
                <SelectContent>
                  {(applicantType === 'student' ? students : faculty).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} {p.roll_number ? `(${p.roll_number})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Start Date</Label>
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>End Date</Label>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Reason</Label>
              <Textarea 
                value={reason} 
                onChange={e => setReason(e.target.value)} 
                placeholder="Medical reason, family emergency, etc."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => submitLeaveMutation.mutate()} 
              disabled={!applicantId || !startDate || !endDate || !reason || submitLeaveMutation.isPending}
            >
              Submit Request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

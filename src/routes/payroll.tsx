import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calculator, Check, ReceiptText } from "lucide-react";
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

export const Route = createFileRoute("/payroll")({
  head: () => ({
    meta: [
      { title: "Payroll Portal — Imperial CMS" },
    ],
  }),
  component: PayrollPage,
});

function PayrollPage() {
  const queryClient = useQueryClient();
  
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);

  const [generateDialog, setGenerateDialog] = useState<{ open: boolean; faculty: any | null }>({
    open: false,
    faculty: null,
  });

  const { data: faculty = [], isLoading: loadingFaculty } = useQuery({
    queryKey: ["faculty"],
    queryFn: async () => {
      const { data, error } = await supabase.from("faculty").select("*").order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: salaries = [], isLoading: loadingSalaries } = useQuery({
    queryKey: ["salaries", selectedMonth],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("salary_records")
        .select("*")
        .eq("month_year", selectedMonth);
      if (error) throw error;
      return data;
    },
  });

  const { data: leaveRequests = [], isLoading: loadingLeaves } = useQuery({
    queryKey: ["approved_leaves", selectedMonth],
    queryFn: async () => {
      // Fetch all approved faculty leaves that overlap with this month
      const { data, error } = await supabase
        .from("leave_requests")
        .select("*")
        .eq("status", "approved")
        .eq("applicant_type", "faculty");
      if (error) throw error;
      return data;
    },
  });

  const paySalary = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("salary_records")
        .update({ status: "paid", payment_date: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
      toast.success("Salary marked as paid.");
    },
    onError: (err: any) => toast.error(err.message),
  });

  const isLoading = loadingFaculty || loadingSalaries || loadingLeaves;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Administration</p>
          <h1 className="font-display text-3xl font-semibold text-blue-600 dark:text-blue-400">Payroll & Salary</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage monthly salary processing for staff.</p>
        </div>
        <div className="flex items-center gap-2">
          <Label className="whitespace-nowrap">Month:</Label>
          <Input 
            type="month" 
            value={selectedMonth} 
            onChange={(e) => setSelectedMonth(e.target.value)} 
          />
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Staff Salary Status - {selectedMonth}</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="p-8 text-center animate-pulse text-muted-foreground">Loading payroll data...</div>
          ) : (
            <div className="border rounded-md overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Staff Name</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Base Salary</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {faculty.map((staff: any) => {
                    const record = salaries.find((s: any) => s.faculty_id === staff.id);
                    return (
                      <TableRow key={staff.id}>
                        <TableCell className="font-medium">{staff.name}</TableCell>
                        <TableCell>{staff.role_type || staff.designation}</TableCell>
                        <TableCell>₹{staff.base_salary || "0.00"}</TableCell>
                        <TableCell>
                          {record ? `₹${record.net_salary}` : "—"}
                        </TableCell>
                        <TableCell>
                          {record ? (
                            <Badge variant={record.status === 'paid' ? "default" : "secondary"}>
                              {record.status === 'paid' ? 'Paid' : 'Pending'}
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">Unprocessed</Badge>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            {!record && (
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => setGenerateDialog({ open: true, faculty: staff })}
                              >
                                <Calculator className="w-4 h-4 mr-1" /> Generate
                              </Button>
                            )}
                            {record && record.status === 'pending' && (
                              <Button 
                                size="sm" 
                                onClick={() => paySalary.mutate(record.id)}
                              >
                                <Check className="w-4 h-4 mr-1" /> Pay
                              </Button>
                            )}
                            {record && record.status === 'paid' && (
                              <Button size="sm" variant="secondary" onClick={() => toast.info("Print slip feature coming soon!")}>
                                <ReceiptText className="w-4 h-4 mr-1" /> Slip
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {generateDialog.faculty && (
        <GenerateSalaryDialog 
          open={generateDialog.open} 
          onOpenChange={(val: boolean) => setGenerateDialog({ ...generateDialog, open: val })} 
          faculty={generateDialog.faculty}
          month={selectedMonth}
          leaveRequests={leaveRequests}
        />
      )}
    </div>
  );
}

function GenerateSalaryDialog({ open, onOpenChange, faculty, month, leaveRequests }: any) {
  const queryClient = useQueryClient();
  
  // Calculate leaves taken in this month
  const calculatedLeaves = useMemo(() => {
    let leaves = 0;
    leaveRequests.forEach((req: any) => {
      if (req.applicant_id === faculty.id && req.start_date.startsWith(month)) {
        // Simplified calculation: just count days from start to end roughly (assuming they span same month)
        const start = new Date(req.start_date);
        const end = new Date(req.end_date);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        leaves += diffDays;
      }
    });
    return leaves;
  }, [leaveRequests, faculty, month]);

  const baseSalary = parseFloat(faculty.base_salary) || 0;
  
  const [formData, setFormData] = useState({
    working_days: 30,
    leaves_taken: calculatedLeaves,
    allowances: 0,
    epf_deduction: 0,
    esi_deduction: 0,
    other_deductions: 0,
  });

  // Derived calculations
  const leaveDeduction = formData.working_days > 0 
    ? (baseSalary / formData.working_days) * formData.leaves_taken 
    : 0;
  
  const netSalary = baseSalary 
    - leaveDeduction 
    + Number(formData.allowances) 
    - Number(formData.epf_deduction) 
    - Number(formData.esi_deduction) 
    - Number(formData.other_deductions);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("salary_records").insert({
        faculty_id: faculty.id,
        month_year: month,
        base_salary: baseSalary,
        working_days: formData.working_days,
        leaves_taken: formData.leaves_taken,
        leave_deduction: leaveDeduction,
        allowances: formData.allowances,
        epf_deduction: formData.epf_deduction,
        esi_deduction: formData.esi_deduction,
        other_deductions: formData.other_deductions,
        net_salary: netSalary,
        status: "pending"
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["salaries"] });
      toast.success("Salary record generated successfully.");
      onOpenChange(false);
    },
    onError: (err: any) => {
      toast.error(err.message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Generate Salary - {month}</DialogTitle>
          <DialogDescription>
            Process payroll for {faculty.name} ({faculty.role_type || faculty.designation})
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid grid-cols-2 gap-4 py-4">
          <div className="col-span-2 space-y-1">
            <Label className="text-muted-foreground">Base Salary</Label>
            <div className="text-xl font-semibold">₹{baseSalary.toFixed(2)}</div>
          </div>
          
          <div className="space-y-2">
            <Label>Working Days</Label>
            <Input 
              type="number" 
              value={formData.working_days}
              onChange={(e) => setFormData({...formData, working_days: parseInt(e.target.value) || 0})}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Leaves Taken (Auto-calculated: {calculatedLeaves})</Label>
            <Input 
              type="number" 
              value={formData.leaves_taken}
              onChange={(e) => setFormData({...formData, leaves_taken: parseInt(e.target.value) || 0})}
            />
          </div>

          <div className="space-y-2">
            <Label>Leave Deduction</Label>
            <Input type="text" value={`₹${leaveDeduction.toFixed(2)}`} disabled className="bg-muted" />
          </div>

          <div className="space-y-2">
            <Label>Allowances / Bonus (₹)</Label>
            <Input 
              type="number" 
              value={formData.allowances}
              onChange={(e) => setFormData({...formData, allowances: parseFloat(e.target.value) || 0})}
            />
          </div>
          
          <div className="space-y-2">
            <Label>EPF Deduction (₹)</Label>
            <Input 
              type="number" 
              value={formData.epf_deduction}
              onChange={(e) => setFormData({...formData, epf_deduction: parseFloat(e.target.value) || 0})}
            />
          </div>

          <div className="space-y-2">
            <Label>ESI Deduction (₹)</Label>
            <Input 
              type="number" 
              value={formData.esi_deduction}
              onChange={(e) => setFormData({...formData, esi_deduction: parseFloat(e.target.value) || 0})}
            />
          </div>

          <div className="space-y-2">
            <Label>Other Deductions (₹)</Label>
            <Input 
              type="number" 
              value={formData.other_deductions}
              onChange={(e) => setFormData({...formData, other_deductions: parseFloat(e.target.value) || 0})}
            />
          </div>

          <div className="col-span-2 p-4 mt-2 border rounded-lg bg-primary/5 flex justify-between items-center">
            <span className="font-medium text-lg">Net Salary</span>
            <span className="font-bold text-2xl text-primary">₹{netSalary.toFixed(2)}</span>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button 
            disabled={generateMutation.isPending}
            onClick={() => generateMutation.mutate()}
          >
            Confirm & Generate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

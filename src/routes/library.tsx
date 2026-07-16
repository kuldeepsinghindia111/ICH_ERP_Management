import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { Plus, BookOpen, UserCheck, Search, CornerDownLeft, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library Management — Imperial CMS" },
    ],
  }),
  component: LibraryPage,
});

function LibraryPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("books");
  
  // Modals state
  const [isAddBookOpen, setIsAddBookOpen] = useState(false);
  const [isIssueBookOpen, setIsIssueBookOpen] = useState(false);
  const [isReturnBookOpen, setIsReturnBookOpen] = useState(false);

  // Add Book state
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [isbn, setIsbn] = useState("");
  const [copies, setCopies] = useState("1");

  // Issue Book state
  const [issueBookId, setIssueBookId] = useState("");
  const [issueStudentId, setIssueStudentId] = useState("");
  const [dueDate, setDueDate] = useState("");

  // Return Book state
  const [returnIssueId, setReturnIssueId] = useState("");
  const [fineAmount, setFineAmount] = useState("0");

  const { data: students = [] } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const { data, error } = await supabase.from('students').select('*').eq('status', 'active');
      if (error) throw error;
      return data;
    }
  });

  const { data: books = [], isLoading: loadingBooks } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const { data, error } = await supabase.from('books').select('*').order('title');
      if (error) throw error;
      return data;
    }
  });

  const { data: bookIssues = [], isLoading: loadingIssues } = useQuery({
    queryKey: ['book_issues'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('book_issues')
        .select('*, book:books(title, isbn), student:students(name, roll_number)')
        .order('issued_at', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const addBookMutation = useMutation({
    mutationFn: async () => {
      const total = parseInt(copies);
      const { error } = await supabase.from('books').insert({
        title,
        author,
        isbn,
        total_copies: total,
        available_copies: total,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      setIsAddBookOpen(false);
      toast.success("Book added to catalog");
      setTitle(""); setAuthor(""); setIsbn(""); setCopies("1");
    },
    onError: (err: any) => toast.error(err.message)
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('books').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      toast.success("Book removed");
    },
    onError: (err: any) => toast.error(err.message)
  });

  const issueBookMutation = useMutation({
    mutationFn: async () => {
      // Create issue record
      const { error: issueError } = await supabase.from('book_issues').insert({
        book_id: issueBookId,
        student_id: issueStudentId,
        due_date: dueDate,
      });
      if (issueError) throw issueError;

      // Update available copies
      const book = books.find((b: any) => b.id === issueBookId);
      if (book) {
        await supabase.from('books').update({ available_copies: book.available_copies - 1 }).eq('id', issueBookId);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book_issues'] });
      setIsIssueBookOpen(false);
      toast.success("Book issued successfully");
      setIssueBookId(""); setIssueStudentId(""); setDueDate("");
    },
    onError: (err: any) => toast.error(err.message)
  });

  const returnBookMutation = useMutation({
    mutationFn: async () => {
      const issue = bookIssues.find((i: any) => i.id === returnIssueId);
      if (!issue) throw new Error("Issue record not found");

      // Mark as returned
      const { error: returnError } = await supabase.from('book_issues').update({
        returned_at: new Date().toISOString(),
        fine_amount: parseFloat(fineAmount || "0"),
      }).eq('id', returnIssueId);
      
      if (returnError) throw returnError;

      // Update available copies
      const book = books.find((b: any) => b.id === issue.book_id);
      if (book) {
        await supabase.from('books').update({ available_copies: book.available_copies + 1 }).eq('id', issue.book_id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['books'] });
      queryClient.invalidateQueries({ queryKey: ['book_issues'] });
      setIsReturnBookOpen(false);
      toast.success("Book marked as returned");
      setReturnIssueId(""); setFineAmount("0");
    },
    onError: (err: any) => toast.error(err.message)
  });

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Library Management</h1>
          <p className="text-muted-foreground mt-1">Manage the catalog and track book circulation.</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setIsIssueBookOpen(true)} variant="secondary" className="gap-2">
            <UserCheck className="h-4 w-4" /> Issue Book
          </Button>
          <Button onClick={() => setIsAddBookOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" /> Add Book
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList>
          <TabsTrigger value="books">Book Catalog</TabsTrigger>
          <TabsTrigger value="issues">Active Issues</TabsTrigger>
          <TabsTrigger value="history">Return History</TabsTrigger>
        </TabsList>

        <TabsContent value="books" className="mt-4">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">All Books</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>ISBN</TableHead>
                    <TableHead>Availability</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingBooks ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">Loading catalog...</TableCell></TableRow>
                  ) : books.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No books in catalog.</TableCell></TableRow>
                  ) : (
                    books.map((book: any) => (
                      <TableRow key={book.id}>
                        <TableCell className="font-medium">{book.title}</TableCell>
                        <TableCell>{book.author || "—"}</TableCell>
                        <TableCell>{book.isbn || "—"}</TableCell>
                        <TableCell>
                          <Badge variant={book.available_copies > 0 ? "outline" : "secondary"} className={book.available_copies > 0 ? "text-green-600 bg-green-50 border-green-200" : ""}>
                            {book.available_copies} / {book.total_copies} available
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => {
                            if(confirm("Delete this book?")) deleteBookMutation.mutate(book.id);
                          }}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="issues" className="mt-4">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Currently Issued</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Issued On</TableHead>
                    <TableHead>Due Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loadingIssues ? (
                    <TableRow><TableCell colSpan={5} className="text-center h-24">Loading issues...</TableCell></TableRow>
                  ) : (
                    bookIssues.filter((i: any) => !i.returned_at).length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center h-24 text-muted-foreground">No books currently issued.</TableCell></TableRow>
                    ) : (
                      bookIssues.filter((i: any) => !i.returned_at).map((issue: any) => {
                        const isLate = new Date(issue.due_date) < new Date();
                        return (
                          <TableRow key={issue.id}>
                            <TableCell className="font-medium">{issue.book?.title}</TableCell>
                            <TableCell>{issue.student?.name} ({issue.student?.roll_number})</TableCell>
                            <TableCell>{new Date(issue.issued_at).toLocaleDateString()}</TableCell>
                            <TableCell>
                              <span className={isLate ? "text-destructive font-semibold" : ""}>
                                {new Date(issue.due_date).toLocaleDateString()}
                              </span>
                              {isLate && <Badge variant="destructive" className="ml-2">Overdue</Badge>}
                            </TableCell>
                            <TableCell className="text-right">
                              <Button variant="outline" size="sm" onClick={() => {
                                setReturnIssueId(issue.id);
                                setIsReturnBookOpen(true);
                              }}>
                                <CornerDownLeft className="h-4 w-4 mr-2" />
                                Return
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })
                    )
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="mt-4">
          <Card>
            <CardHeader className="pb-3 border-b">
              <CardTitle className="text-lg">Return History</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Book</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Returned On</TableHead>
                    <TableHead>Fine Paid</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookIssues.filter((i: any) => i.returned_at).length === 0 ? (
                     <TableRow><TableCell colSpan={4} className="text-center h-24 text-muted-foreground">No return history.</TableCell></TableRow>
                  ) : (
                    bookIssues.filter((i: any) => i.returned_at).map((issue: any) => (
                      <TableRow key={issue.id}>
                        <TableCell className="font-medium">{issue.book?.title}</TableCell>
                        <TableCell>{issue.student?.name} ({issue.student?.roll_number})</TableCell>
                        <TableCell>{new Date(issue.returned_at).toLocaleDateString()}</TableCell>
                        <TableCell>
                          {issue.fine_amount > 0 ? (
                            <span className="text-destructive font-medium">₹{issue.fine_amount}</span>
                          ) : (
                            <span className="text-muted-foreground">None</span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Book Dialog */}
      <Dialog open={isAddBookOpen} onOpenChange={setIsAddBookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Book</DialogTitle>
            <DialogDescription>Add a new book to the library catalog.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Book Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Author</Label>
                <Input value={author} onChange={e => setAuthor(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>ISBN (Optional)</Label>
                <Input value={isbn} onChange={e => setIsbn(e.target.value)} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Number of Copies</Label>
              <Input type="number" min="1" value={copies} onChange={e => setCopies(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddBookOpen(false)}>Cancel</Button>
            <Button onClick={() => addBookMutation.mutate()} disabled={!title || !copies || addBookMutation.isPending}>Add Book</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Issue Book Dialog */}
      <Dialog open={isIssueBookOpen} onOpenChange={setIsIssueBookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Issue Book</DialogTitle>
            <DialogDescription>Check out a book to a student.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Select Book</Label>
              <Select value={issueBookId} onValueChange={setIssueBookId}>
                <SelectTrigger><SelectValue placeholder="Search books..." /></SelectTrigger>
                <SelectContent>
                  {books.filter((b: any) => b.available_copies > 0).map((b: any) => (
                    <SelectItem key={b.id} value={b.id}>{b.title} ({b.available_copies} available)</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Select Student</Label>
              <Select value={issueStudentId} onValueChange={setIssueStudentId}>
                <SelectTrigger><SelectValue placeholder="Search student..." /></SelectTrigger>
                <SelectContent>
                  {students.map((s: any) => (
                    <SelectItem key={s.id} value={s.id}>{s.name} ({s.roll_number})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsIssueBookOpen(false)}>Cancel</Button>
            <Button onClick={() => issueBookMutation.mutate()} disabled={!issueBookId || !issueStudentId || !dueDate || issueBookMutation.isPending}>Issue</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Return Book Dialog */}
      <Dialog open={isReturnBookOpen} onOpenChange={setIsReturnBookOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Return Book</DialogTitle>
            <DialogDescription>Mark this book as returned and collect any fines.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Late Fine Amount (if applicable)</Label>
              <Input type="number" step="1" min="0" value={fineAmount} onChange={e => setFineAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsReturnBookOpen(false)}>Cancel</Button>
            <Button onClick={() => returnBookMutation.mutate()} disabled={returnBookMutation.isPending}>Confirm Return</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

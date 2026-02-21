"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge
} from "@schoolerp/ui"
import { Plus, BookOpen, Clock, AlertCircle } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { LibraryIssue } from "@/types/library"
import { IssueDialog } from "@/components/library/issue-dialog"
import { toast } from "sonner"

export default function IssuesPage() {
  const [issues, setIssues] = useState<LibraryIssue[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)

  useEffect(() => {
    fetchIssues()
  }, [])

  const fetchIssues = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/admin/library/issues?limit=50")
      if (res.ok) {
        const data = await res.json()
        setIssues(data || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleReturn = async (issue: LibraryIssue) => {
    if (!confirm(`Confirm return for "${issue.book_title}"?`)) return
    
    try {
      const res = await apiClient(`/admin/library/issues/${issue.id}/return`, {
        method: "POST",
        body: JSON.stringify({ remarks: "Returned via admin dashboard" })
      })
      if (res.ok) {
        fetchIssues()
      } else {
        toast.error("Failed to process return")
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to process return")
    }
  }

  const handleCreate = () => {
    setDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Circulation Desk</h1>
          <p className="text-muted-foreground">Manage book issues, returns, and track overdues.</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Issue Book
        </Button>
      </div>

      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="border-b bg-muted/20">
          <CardTitle className="text-lg">Active Issues & History ({issues.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead className="font-bold text-muted-foreground">Book Title</TableHead>
                <TableHead className="font-bold text-muted-foreground">Student</TableHead>
                <TableHead className="font-bold text-muted-foreground">Issue Date</TableHead>
                <TableHead className="font-bold text-muted-foreground">Due Date</TableHead>
                <TableHead className="font-bold text-muted-foreground">Status</TableHead>
                <TableHead className="text-right font-bold text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading circulation data...
                  </TableCell>
                </TableRow>
              ) : issues.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No records found. Issue a book to see it here.
                  </TableCell>
                </TableRow>
              ) : (
                issues.map((issue) => (
                  <TableRow key={issue.id} className="hover:bg-muted/30 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        <span className="font-semibold text-foreground">{issue.book_title}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium text-foreground">{issue.student_name}</div>
                        <div className="text-xs text-muted-foreground font-mono mt-0.5">{issue.admission_number}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground font-medium text-sm">{new Date(issue.issue_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1.5 text-sm font-medium">
                            <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className={issue.status === 'overdue' ? 'text-rose-600 dark:text-rose-400 font-bold' : 'text-muted-foreground'}>
                                {new Date(issue.due_date).toLocaleDateString()}
                            </span>
                        </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                          issue.status === 'returned' ? 'secondary' : 
                          issue.status === 'overdue' ? 'destructive' : 'default'
                      } className={issue.status === 'issued' ? 'bg-primary' : ''}>
                        {issue.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {issue.status === 'issued' && (
                          <Button variant="outline" size="sm" onClick={() => handleReturn(issue)} className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-950/50">
                            Mark Returned
                          </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <IssueDialog 
        open={dialogOpen} 
        onOpenChange={setDialogOpen} 
        onSuccess={fetchIssues}
      />
    </div>
  )
}

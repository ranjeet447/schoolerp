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
        alert("Failed to process return")
      }
    } catch (err) {
      console.error(err)
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

      <Card>
        <CardHeader>
          <CardTitle>Active Issues & History ({issues.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Book Title</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Issue Date</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
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
                  <TableRow key={issue.id}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-muted-foreground" />
                        {issue.book_title}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{issue.student_name}</div>
                        <div className="text-xs text-muted-foreground">{issue.admission_number}</div>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(issue.issue_date).toLocaleDateString()}</TableCell>
                    <TableCell>
                        <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-muted-foreground" />
                            {new Date(issue.due_date).toLocaleDateString()}
                        </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={
                          issue.status === 'returned' ? 'secondary' : 
                          issue.status === 'overdue' ? 'secondary' : 'default'
                      }>
                        {issue.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {issue.status === 'issued' && (
                          <Button variant="outline" size="sm" onClick={() => handleReturn(issue)}>
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

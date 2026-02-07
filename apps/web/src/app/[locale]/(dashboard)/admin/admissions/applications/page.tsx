"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { AdmissionApplication } from "@/types/admission"
import { format } from "date-fns"
import { ApplicationDocumentsDialog } from "@/components/admission/documents-dialog"
import { FileText } from "lucide-react"

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<AdmissionApplication[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null)
  const [docDialogOpen, setDocDialogOpen] = useState(false)

  useEffect(() => {
    fetchApplications()
  }, [])

  const fetchApplications = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/admin/admissions/applications?limit=50")
      if (res.ok) {
        setApplications(await res.json() || [])
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDocs = (app: AdmissionApplication) => {
    setSelectedApp(app)
    setDocDialogOpen(true)
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admission Applications</h1>
          <p className="text-muted-foreground">Track formal applications and their workflow status.</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Applications ({applications.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>App Number</TableHead>
                <TableHead>Student Name</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Submitted Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Loading applications...
                  </TableCell>
                </TableRow>
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No applications found.
                  </TableCell>
                </TableRow>
              ) : (
                applications.map((app) => (
                  <TableRow key={app.id}>
                    <TableCell className="font-mono">{app.application_number}</TableCell>
                    <TableCell className="font-medium">
                        {app.student_name || "Unknown"}
                        <div className="text-xs text-muted-foreground">{app.parent_name}</div>
                    </TableCell>
                    <TableCell>{app.grade_interested}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(app.created_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell>
                        <Badge variant="outline">{app.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => handleDocs(app)}>
                        <FileText className="w-4 h-4" />
                        Docs
                      </Button>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ApplicationDocumentsDialog 
        application={selectedApp}
        open={docDialogOpen}
        onOpenChange={setDocDialogOpen}
        onSuccess={fetchApplications}
      />
    </div>
  )
}

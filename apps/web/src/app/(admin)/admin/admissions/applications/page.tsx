"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { AdmissionApplication } from "@/types/admission"
import { format } from "date-fns"
import { ApplicationDocumentsDialog } from "@/components/admission/documents-dialog"
import { FileText, Loader2, RefreshCw } from "lucide-react"
import { toast } from "sonner"

const textValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "String" in value) {
    const str = (value as { String?: string }).String
    return typeof str === "string" ? str : ""
  }
  return ""
}

const numberValue = (value: unknown) => {
  if (typeof value === "number") return value
  if (value && typeof value === "object" && "Int64" in value) {
    const n = (value as { Int64?: number }).Int64
    return typeof n === "number" ? n : 0
  }
  return 0
}

const uuidValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "Bytes" in value) {
    const bytes = (value as { Bytes?: unknown }).Bytes
    if (typeof bytes === "string") return bytes
  }
  return ""
}

const dateValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "Time" in value) {
    const time = (value as { Time?: string }).Time
    return typeof time === "string" ? time : ""
  }
  return ""
}

const statusVariant = (status: string) => {
  if (status === "admitted") return "default"
  if (status === "declined") return "outline"
  return "secondary"
}

const normalizeApp = (item: any): AdmissionApplication => ({
  id: uuidValue(item?.id),
  tenant_id: uuidValue(item?.tenant_id),
  enquiry_id: uuidValue(item?.enquiry_id),
  application_number: item?.application_number || "",
  status: item?.status || "submitted",
  form_data: item?.form_data || {},
  documents: Array.isArray(item?.documents) ? item.documents : [],
  reviewed_by: uuidValue(item?.reviewed_by),
  created_at: dateValue(item?.created_at),
  updated_at: dateValue(item?.updated_at),
  parent_name: textValue(item?.parent_name),
  student_name: textValue(item?.student_name),
  grade_interested: textValue(item?.grade_interested),
  processing_fee_amount: numberValue(item?.processing_fee_amount),
  processing_fee_status: textValue(item?.processing_fee_status),
  payment_reference: textValue(item?.payment_reference),
} as AdmissionApplication)

interface ClassRow {
  id: unknown
  name: string
}

interface SectionRow {
  id: unknown
  name: string
}

export default function AdminApplicationsPage() {
  const [applications, setApplications] = useState<AdmissionApplication[]>([])
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [sections, setSections] = useState<SectionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedApp, setSelectedApp] = useState<AdmissionApplication | null>(null)
  const [docDialogOpen, setDocDialogOpen] = useState(false)
  const [admitDialogOpen, setAdmitDialogOpen] = useState(false)
  const [admitClassID, setAdmitClassID] = useState("")
  const [admitSectionID, setAdmitSectionID] = useState("")
  const [feeDialogOpen, setFeeDialogOpen] = useState(false)
  const [feeAmount, setFeeAmount] = useState("5000")
  const [feeRef, setFeeRef] = useState("")

  useEffect(() => {
    fetchApplications(false)
    fetchClasses()
  }, [])

  const fetchApplications = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await apiClient("/admin/admissions/applications?limit=50")
      if (res.ok) {
        const payload = await res.json()
        const rows = Array.isArray(payload) ? payload : []
        setApplications(rows.map(normalizeApp))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const fetchClasses = async () => {
    try {
      const res = await apiClient("/admin/academic-structure/classes")
      if (!res.ok) return
      const data = await res.json()
      setClasses(Array.isArray(data) ? data : [])
    } catch {
      // ignore non-critical class loading failures
    }
  }

  const fetchSections = async (classID: string) => {
    try {
      const res = await apiClient(`/admin/academic-structure/classes/${classID}/sections`)
      if (!res.ok) {
        setSections([])
        return
      }
      const data = await res.json()
      setSections(Array.isArray(data) ? data : [])
    } catch {
      setSections([])
    }
  }

  const updateStatus = async (appID: string, status: string) => {
    setSaving(true)
    try {
      const res = await apiClient(`/admin/admissions/applications/${appID}/status`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to update status")
      }
      await fetchApplications(true)
      toast.success("Application status updated")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const openFeeDialog = (app: AdmissionApplication) => {
    setSelectedApp(app)
    setFeeAmount(String((app as any).processing_fee_amount || 5000))
    setFeeRef((app as any).payment_reference || "")
    setFeeDialogOpen(true)
  }

  const submitFeePayment = async () => {
    if (!selectedApp) return
    setSaving(true)
    try {
      const res = await apiClient(`/admin/admissions/applications/${selectedApp.id}/pay-fee`, {
        method: "POST",
        body: JSON.stringify({
          amount: Number(feeAmount),
          reference: feeRef,
        }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to record fee payment")
      }
      setFeeDialogOpen(false)
      await fetchApplications(true)
      toast.success("Processing fee marked as paid")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to record fee"
      toast.error(message)
    } finally {
      setSaving(false)
    }
  }

  const openAdmitDialog = (app: AdmissionApplication) => {
    setSelectedApp(app)
    setAdmitClassID("")
    setAdmitSectionID("")
    setSections([])
    setAdmitDialogOpen(true)
  }

  const admitStudent = async () => {
    if (!selectedApp || !admitSectionID) {
      toast.error("Select class and section")
      return
    }

    setSaving(true)
    try {
      const res = await apiClient(`/admin/admissions/applications/${selectedApp.id}/accept`, {
        method: "POST",
        body: JSON.stringify({
          class_id: admitClassID,
          section_id: admitSectionID,
        }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to admit student")
      }
      setAdmitDialogOpen(false)
      await fetchApplications(true)
      toast.success("Application admitted and student created")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to admit student"
      toast.error(message)
    } finally {
      setSaving(false)
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
        <Button variant="outline" onClick={() => fetchApplications(true)} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </Button>
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
                  <TableHead>Fee</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading applications...
                  </TableCell>
                </TableRow>
              ) : applications.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
                        {app.created_at ? format(new Date(app.created_at), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell>
                      {(app as any).processing_fee_status === "paid" ? (
                        <Badge variant="default">Paid</Badge>
                      ) : (
                        <Badge variant="secondary">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                        <Select value={app.status} onValueChange={(value) => updateStatus(app.id, value)}>
                          <SelectTrigger className="w-[130px] h-8"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="submitted">Submitted</SelectItem>
                            <SelectItem value="review">Review</SelectItem>
                            <SelectItem value="assessment">Assessment</SelectItem>
                            <SelectItem value="offered">Offered</SelectItem>
                            <SelectItem value="admitted">Admitted</SelectItem>
                            <SelectItem value="declined">Declined</SelectItem>
                          </SelectContent>
                        </Select>
                    </TableCell>
                    <TableCell className="text-right flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" className="gap-2" onClick={() => handleDocs(app)}>
                        <FileText className="w-4 h-4" />
                        Docs
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => openFeeDialog(app)} disabled={saving || (app as any).processing_fee_status === "paid"}>
                        Mark Fee Paid
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openAdmitDialog(app)} disabled={saving || app.status === "admitted"}>
                        Admit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={feeDialogOpen} onOpenChange={setFeeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record Processing Fee</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Amount</Label>
              <Input type="number" value={feeAmount} onChange={(e) => setFeeAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Payment Reference</Label>
              <Input value={feeRef} onChange={(e) => setFeeRef(e.target.value)} placeholder="TXN-12345" />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setFeeDialogOpen(false)}>Cancel</Button>
              <Button onClick={submitFeePayment} disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Save Payment
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={admitDialogOpen} onOpenChange={setAdmitDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admit Student</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select
                value={admitClassID}
                onValueChange={async (value) => {
                  setAdmitClassID(value)
                  setAdmitSectionID("")
                  await fetchSections(value)
                }}
              >
                <SelectTrigger><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {classes.map((cls) => {
                    const id = uuidValue(cls.id)
                    return <SelectItem key={id} value={id}>{cls.name}</SelectItem>
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={admitSectionID} onValueChange={setAdmitSectionID}>
                <SelectTrigger><SelectValue placeholder="Select section" /></SelectTrigger>
                <SelectContent>
                  {sections.map((section) => {
                    const id = uuidValue(section.id)
                    return <SelectItem key={id} value={id}>{section.name}</SelectItem>
                  })}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setAdmitDialogOpen(false)}>Cancel</Button>
              <Button onClick={admitStudent} disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Admit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ApplicationDocumentsDialog 
        application={selectedApp}
        open={docDialogOpen}
        onOpenChange={setDocDialogOpen}
        onSuccess={fetchApplications}
      />
    </div>
  )
}

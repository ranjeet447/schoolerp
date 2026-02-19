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
import { FileText, Loader2, RefreshCw, Search } from "lucide-react"
import { toast } from "sonner"
import { ClassSelect } from "@/components/ui/class-select"
import { SectionSelect } from "@/components/ui/section-select"

const WORKFLOW_STATUSES = ["submitted", "review", "assessment", "offered", "admitted", "declined"]

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
  const [search, setSearch] = useState("")  // Added search state
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
  const [allowedTransitions, setAllowedTransitions] = useState<Record<string, string[]>>({})
  const [requiredDocumentTypesByStatus, setRequiredDocumentTypesByStatus] = useState<Record<string, string[]>>({})
  const [workflowDialogOpen, setWorkflowDialogOpen] = useState(false)
  const [workflowSaving, setWorkflowSaving] = useState(false)

  useEffect(() => {
    fetchApplications(false)
    fetchClasses()
    fetchWorkflowSettings()
  }, [])

  const fetchWorkflowSettings = async () => {
    try {
      const res = await apiClient("/admin/admissions/settings/workflow")
      if (!res.ok) return
      const payload = await res.json()
      const transitions = payload?.allowed_transitions
      const requiredDocs = payload?.required_document_types_by_status
      if (transitions && typeof transitions === "object") {
        setAllowedTransitions(transitions as Record<string, string[]>)
      }
      if (requiredDocs && typeof requiredDocs === "object") {
        setRequiredDocumentTypesByStatus(requiredDocs as Record<string, string[]>)
      }
    } catch {
      // keep fallback static transitions
    }
  }

  const parseList = (value: string) => {
    const seen = new Set<string>()
    const items = value
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0)
      .filter((item) => {
        const key = item.toLowerCase()
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })
    return items
  }

  const normalizedStatusKey = (value: string) => String(value || "").trim().toLowerCase()

  const workflowStatuses = Array.from(
    new Set([
      ...WORKFLOW_STATUSES,
      ...Object.keys(allowedTransitions || {}),
      ...Object.keys(requiredDocumentTypesByStatus || {}),
    ]),
  ).map(normalizedStatusKey)

  const saveWorkflowSettings = async () => {
    setWorkflowSaving(true)
    try {
      const payload = {
        allowed_transitions: Object.fromEntries(
          Object.entries(allowedTransitions || {}).map(([status, values]) => [
            normalizedStatusKey(status),
            (Array.isArray(values) ? values : []).map(normalizedStatusKey).filter(Boolean),
          ]),
        ),
        required_document_types_by_status: Object.fromEntries(
          Object.entries(requiredDocumentTypesByStatus || {}).map(([status, values]) => [
            normalizedStatusKey(status),
            (Array.isArray(values) ? values : []).map((value) => String(value).trim()).filter(Boolean),
          ]),
        ),
      }

      const res = await apiClient("/admin/admissions/settings/workflow", {
        method: "PUT",
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to save workflow settings")
      }

      await fetchWorkflowSettings()
      toast.success("Workflow settings updated")
      setWorkflowDialogOpen(false)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to save workflow settings"
      toast.error(message)
    } finally {
      setWorkflowSaving(false)
    }
  }

  const statusLabel = (status: string) => {
    if (status === "submitted") return "Submitted"
    if (status === "review") return "Review"
    if (status === "assessment") return "Assessment"
    if (status === "offered") return "Offered"
    if (status === "admitted") return "Admitted"
    if (status === "declined") return "Declined"
    return status
  }

  const statusOptionsFor = (current: string) => {
    const normalized = String(current || "").toLowerCase()
    const next = Array.isArray(allowedTransitions[normalized]) ? allowedTransitions[normalized] : []
    const values = Array.from(new Set([normalized, ...next]))
    if (values.length > 0) return values
    return ["submitted", "review", "assessment", "offered", "admitted", "declined"]
  }

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
        <div className="flex items-center gap-2">
          <div className="relative">
             <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
             <Input
               type="search"
               placeholder="Search application..."
               className="w-[250px] pl-8 bg-white"
               value={search}
               onChange={(e) => setSearch(e.target.value)}
             />
          </div>
          <Button variant="outline" onClick={() => setWorkflowDialogOpen(true)}>Workflow Settings</Button>
          <Button variant="outline" onClick={() => fetchApplications(true)} disabled={refreshing} className="gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
          </Button>
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
                applications
                  .filter(app => 
                    search ? (
                      app.student_name?.toLowerCase().includes(search.toLowerCase()) || 
                      app.application_number?.toLowerCase().includes(search.toLowerCase()) ||
                      app.parent_name?.toLowerCase().includes(search.toLowerCase())
                    ) : true
                  )
                  .map((app) => (
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
                            {statusOptionsFor(app.status).map((statusValue) => (
                              <SelectItem key={statusValue} value={statusValue}>{statusLabel(statusValue)}</SelectItem>
                            ))}
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
              <ClassSelect
                value={admitClassID}
                onSelect={(value) => {
                  setAdmitClassID(value)
                  setAdmitSectionID("")
                }}
                placeholder="Select class"
              />
            </div>
            <div className="space-y-2">
              <Label>Section</Label>
              <SectionSelect 
                value={admitSectionID} 
                onSelect={setAdmitSectionID} 
                classId={admitClassID}
                disabled={!admitClassID}
                placeholder="Select section"
              />
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

      <Dialog open={workflowDialogOpen} onOpenChange={setWorkflowDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Admission Workflow Settings</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2 max-h-[70vh] overflow-auto">
            {workflowStatuses.map((status) => (
              <div key={status} className="space-y-3 rounded-md border p-3">
                <div className="text-sm font-medium">{statusLabel(status)}</div>
                <div className="space-y-2">
                  <Label>Allowed Next Statuses (comma-separated)</Label>
                  <Input
                    value={(allowedTransitions[status] || []).join(", ")}
                    onChange={(e) =>
                      setAllowedTransitions((prev) => ({
                        ...prev,
                        [status]: parseList(e.target.value).map(normalizedStatusKey),
                      }))
                    }
                    placeholder="review, declined"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Required Document Types (comma-separated)</Label>
                  <Input
                    value={(requiredDocumentTypesByStatus[status] || []).join(", ")}
                    onChange={(e) =>
                      setRequiredDocumentTypesByStatus((prev) => ({
                        ...prev,
                        [status]: parseList(e.target.value),
                      }))
                    }
                    placeholder="ID Proof, Birth Certificate"
                  />
                </div>
              </div>
            ))}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setWorkflowDialogOpen(false)}>Cancel</Button>
              <Button onClick={saveWorkflowSettings} disabled={workflowSaving} className="gap-2">
                {workflowSaving && <Loader2 className="h-4 w-4 animate-spin" />} Save Settings
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

"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { FileCheck2, Loader2, RefreshCw, Clock } from "lucide-react"
import { toast } from "sonner"

type CertificateType = "transfer_certificate" | "bonafide_certificate" | "character_certificate"
type CertificateStatus = "pending" | "approved" | "rejected" | "issued"

interface StudentRow {
  id: unknown
  full_name: string
  admission_number: string
}

interface CertificateRequest {
  id: string
  student_id: string
  student_name: string
  admission_number: string
  type: CertificateType
  reason: string
  requested_on: string
  status: CertificateStatus
  reviewed_by?: string
  remarks?: string
  issue_date?: string
  certificate_number?: string
  updated_at: string
}

const typeLabel = (type: CertificateType) => {
  if (type === "transfer_certificate") return "Transfer Certificate"
  if (type === "bonafide_certificate") return "Bonafide Certificate"
  return "Character Certificate"
}

const textValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "String" in value) {
    const v = (value as { String?: string }).String
    return typeof v === "string" ? v : ""
  }
  return ""
}

const bytesToUuid = (bytes: number[]) => {
  if (bytes.length !== 16) return ""
  const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("")
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
}

const uuidValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "Bytes" in value) {
    const bytes = (value as { Bytes?: unknown }).Bytes
    if (typeof bytes === "string") return bytes
    if (Array.isArray(bytes) && bytes.every((item) => typeof item === "number")) {
      return bytesToUuid(bytes as number[])
    }
  }
  return ""
}

export default function CertificatesPage() {
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState("")

  const [students, setStudents] = useState<StudentRow[]>([])
  const [requests, setRequests] = useState<CertificateRequest[]>([])
  const [statusFilter, setStatusFilter] = useState<CertificateStatus | "all">("all")

  const [form, setForm] = useState({
    student_id: "",
    type: "transfer_certificate" as CertificateType,
    reason: "",
    requested_on: new Date().toISOString().slice(0, 10),
  })

  // Student Search State
  const [studentQuery, setStudentQuery] = useState("")
  const [searchingStudents, setSearchingStudents] = useState(false)
  const [selectedStudentDisplay, setSelectedStudentDisplay] = useState<any>(null)

  const fetchRequests = async (status?: CertificateStatus | "all") => {
    const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : ""
    const res = await apiClient(`/admin/certificates/requests${query}`)
    if (!res.ok) throw new Error((await res.text()) || "Failed to fetch certificate requests")
    const payload = await res.json()
    setRequests(Array.isArray(payload) ? payload : [])
  }

  // Debounced Search
  useEffect(() => {
    if (studentQuery.length > 1) {
      const timer = setTimeout(async () => {
        setSearchingStudents(true)
        try {
          const res = await apiClient(`/admin/students?query=${encodeURIComponent(studentQuery)}&limit=10`)
          if (res.ok) {
            const data = await res.json()
            setStudents(Array.isArray(data) ? data : data.data || [])
          }
        } catch (err) {
          console.error("Failed to fetch students", err)
        } finally {
          setSearchingStudents(false)
        }
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setStudents([])
    }
  }, [studentQuery])

  const fetchAll = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError("")

    try {
      const requestsRes = await apiClient("/admin/certificates/requests")
      if (!requestsRes.ok) throw new Error((await requestsRes.text()) || "Failed to fetch certificate requests")
      const requestsPayload = await requestsRes.json()
      setRequests(Array.isArray(requestsPayload) ? requestsPayload : [])
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load certificate module"
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchAll(false)
  }, [])

  const createRequest = async () => {
    if (!form.student_id || !form.reason.trim()) {
      setError("Student and reason are required")
      return
    }

    setSaving(true)
    setError("")
    try {
      const res = await apiClient("/admin/certificates/requests", {
        method: "POST",
        body: JSON.stringify({
          student_id: form.student_id,
          type: form.type,
          reason: form.reason.trim(),
          requested_on: form.requested_on,
        }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to create request")
      }

      await fetchRequests(statusFilter)
      setForm((prev) => ({ ...prev, reason: "" }))
      setSelectedStudentDisplay(null)
      setForm(prev => ({ ...prev, student_id: "" }))
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create request"
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const updateStatus = async (id: string, status: CertificateStatus) => {
    setSaving(true)
    setError("")
    try {
      const res = await apiClient(`/admin/certificates/requests/${encodeURIComponent(id)}/status`, {
        method: "POST",
        body: JSON.stringify({
          status,
          remarks: status === "rejected" ? "Rejected by admin" : undefined,
        }),
      })
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to update status")
      }

      await fetchRequests(statusFilter)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to update status"
      setError(message)
    } finally {
      setSaving(false)
    }
  }

  const filteredRequests = useMemo(() => {
    const list = statusFilter === "all" ? requests : requests.filter((r) => r.status === statusFilter)
    return list.slice().sort((a, b) => (a.requested_on < b.requested_on ? 1 : -1))
  }, [requests, statusFilter])

  const pendingCount = requests.filter((r) => r.status === "pending").length
  const issuedCount = requests.filter((r) => r.status === "issued").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">TC & Certificates</h1>
          <p className="text-sm font-medium text-muted-foreground">Manage transfer, bonafide, and character certificate workflows.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => fetchAll(true)} disabled={refreshing} className="gap-2 shrink-0">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4 text-sm font-medium text-destructive">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Pending Requests</div>
            <div className="text-3xl font-black mt-2 text-foreground">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6">
            <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Issued Certificates</div>
            <div className="text-3xl font-black mt-2 text-foreground">{issuedCount}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex flex-col justify-center h-full text-muted-foreground">
            <div className="flex items-center gap-2 font-medium">
              <FileCheck2 className="h-5 w-5 text-primary" />
              Certificate records are tenant-scoped.
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader className="border-b pb-4">
          <CardTitle className="text-lg">New Certificate Request</CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-5">
            <div className="space-y-2 md:col-span-2">
              <Label>Student Search</Label>
              {selectedStudentDisplay ? (
                <div className="flex items-center justify-between p-2.5 bg-primary/5 border border-primary/20 rounded-xl">
                  <div>
                    <div className="font-bold text-sm">{selectedStudentDisplay.full_name}</div>
                    <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{selectedStudentDisplay.admission_number}</div>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                    setSelectedStudentDisplay(null)
                    setForm(p => ({ ...p, student_id: "" }))
                  }}>Change</Button>
                </div>
              ) : (
                <div className="relative">
                  <Input 
                    placeholder="Type name or admission no..." 
                    value={studentQuery}
                    onChange={(e) => setStudentQuery(e.target.value)}
                  />
                  {students.length > 0 && studentQuery.length > 1 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-xl z-50 overflow-hidden">
                      {students.map((s) => (
                        <button
                          key={uuidValue(s.id)}
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-muted flex justify-between items-center border-b last:border-0"
                          onClick={() => {
                             setSelectedStudentDisplay(s)
                             setForm(p => ({ ...p, student_id: uuidValue(s.id) }))
                             setStudentQuery("")
                             setStudents([])
                          }}
                        >
                          <div>
                            <div className="font-medium text-sm">{s.full_name}</div>
                            <div className="text-[10px] text-muted-foreground">{s.admission_number}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={form.type} onValueChange={(value) => setForm((prev) => ({ ...prev, type: value as CertificateType }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="transfer_certificate">Transfer Certificate</SelectItem>
                  <SelectItem value="bonafide_certificate">Bonafide Certificate</SelectItem>
                  <SelectItem value="character_certificate">Character Certificate</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Requested On</Label>
              <Input type="date" value={form.requested_on} onChange={(e) => setForm((prev) => ({ ...prev, requested_on: e.target.value }))} />
            </div>

            <div className="space-y-2">
              <Label>Reason</Label>
              <Input value={form.reason} onChange={(e) => setForm((prev) => ({ ...prev, reason: e.target.value }))} placeholder="Required for new admission" />
            </div>

            <div className="md:col-span-5 flex justify-end">
              <Button onClick={createRequest} disabled={saving || loading} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create Request
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-none shadow-sm">
        <CardHeader className="flex flex-col sm:flex-row items-center justify-between border-b pb-4 space-y-2 sm:space-y-0 text-lg">
          <CardTitle>Certificate Requests</CardTitle>
          <div className="w-full sm:w-44">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CertificateStatus | "all")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-b-lg border-x border-b border-border">
            <Table>
              <TableHeader className="bg-muted/40">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="w-[200px]">Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Certificate No.</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                         <Loader2 className="h-4 w-4 animate-spin" />
                         <span>Loading certificate requests...</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No certificate requests found.</TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((row) => (
                    <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell>
                        <div className="font-semibold text-foreground">{row.student_name}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{row.admission_number}</div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{typeLabel(row.type)}</TableCell>
                      <TableCell className="text-muted-foreground">{row.requested_on}</TableCell>
                      <TableCell>
                        <Badge variant={row.status === "issued" ? "default" : row.status === "rejected" ? "outline" : row.status === "approved" ? "secondary" : "default"} 
                               className={row.status === "pending" ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-none" : "capitalize"}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs text-muted-foreground">{row.certificate_number || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-400 hover:text-slate-600" onClick={() => toast("History: Requested -> Approved -> Issued")}>
                             <Clock className="h-4 w-4" />
                          </Button>
                          {row.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" className="h-8" disabled={saving} onClick={() => updateStatus(row.id, "approved")}>Approve</Button>
                              <Button size="sm" variant="ghost" className="h-8 text-destructive hover:text-destructive hover:bg-destructive/10" disabled={saving} onClick={() => updateStatus(row.id, "rejected")}>Reject</Button>
                            </>
                          )}
                          {(row.status === "approved" || row.status === "pending") && (
                            <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving} onClick={() => updateStatus(row.id, "issued")}>Issue</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

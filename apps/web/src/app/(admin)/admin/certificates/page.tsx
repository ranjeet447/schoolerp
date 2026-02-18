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
import { FileCheck2, Loader2, RefreshCw } from "lucide-react"

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

  const fetchRequests = async (status?: CertificateStatus | "all") => {
    const query = status && status !== "all" ? `?status=${encodeURIComponent(status)}` : ""
    const res = await apiClient(`/admin/certificates/requests${query}`)
    if (!res.ok) throw new Error((await res.text()) || "Failed to fetch certificate requests")
    const payload = await res.json()
    setRequests(Array.isArray(payload) ? payload : [])
  }

  const fetchAll = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError("")

    try {
      const [studentsRes, requestsRes] = await Promise.all([
        apiClient("/admin/students?limit=300"),
        apiClient("/admin/certificates/requests"),
      ])

      if (!studentsRes.ok) throw new Error((await studentsRes.text()) || "Failed to fetch students")
      if (!requestsRes.ok) throw new Error((await requestsRes.text()) || "Failed to fetch certificate requests")

      const studentsPayload = await studentsRes.json()
      const requestsPayload = await requestsRes.json()

      const studentRows = Array.isArray(studentsPayload)
        ? studentsPayload
        : Array.isArray(studentsPayload?.data)
          ? studentsPayload.data
          : []

      setStudents(studentRows)
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
    <div className="space-y-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">TC & Certificates</h1>
          <p className="text-sm text-muted-foreground">Manage transfer, bonafide, and character certificate workflows.</p>
        </div>
        <Button variant="outline" onClick={() => fetchAll(true)} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      {error && (
        <Card>
          <CardContent className="pt-6 text-sm text-red-600 dark:text-red-400">{error}</CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Pending Requests</div>
            <div className="text-3xl font-bold">{pendingCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-sm text-muted-foreground">Issued Certificates</div>
            <div className="text-3xl font-bold">{issuedCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 flex items-center gap-2 text-muted-foreground">
            <FileCheck2 className="h-5 w-5" />
            Certificate records are tenant-scoped.
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>New Certificate Request</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-5">
          <div className="space-y-2 md:col-span-2">
            <Label>Student</Label>
            <Select value={form.student_id} onValueChange={(value) => setForm((prev) => ({ ...prev, student_id: value }))}>
              <SelectTrigger><SelectValue placeholder="Select student" /></SelectTrigger>
              <SelectContent>
                {students.map((student) => {
                  const id = uuidValue(student.id)
                  return (
                    <SelectItem key={id} value={id}>
                      {student.full_name} ({student.admission_number})
                    </SelectItem>
                  )
                })}
              </SelectContent>
            </Select>
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

          <div className="md:col-span-5">
            <Button onClick={createRequest} disabled={saving || loading} className="gap-2">
              {saving && <Loader2 className="h-4 w-4 animate-spin" />} Create Request
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Certificate Requests</CardTitle>
          <div className="w-44">
            <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as CertificateStatus | "all")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="issued">Issued</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-muted-foreground">
              <Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin" />
              Loading certificate requests...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Requested</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Certificate No.</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRequests.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No certificate requests found.</TableCell>
                  </TableRow>
                ) : (
                  filteredRequests.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        <div className="font-medium">{row.student_name}</div>
                        <div className="text-xs text-muted-foreground">{row.admission_number}</div>
                      </TableCell>
                      <TableCell>{typeLabel(row.type)}</TableCell>
                      <TableCell>{row.requested_on}</TableCell>
                      <TableCell>
                        <Badge variant={row.status === "issued" ? "default" : row.status === "rejected" ? "outline" : "secondary"}>
                          {row.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{row.certificate_number || "-"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {row.status === "pending" && (
                            <>
                              <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus(row.id, "approved")}>Approve</Button>
                              <Button size="sm" variant="outline" disabled={saving} onClick={() => updateStatus(row.id, "rejected")}>Reject</Button>
                            </>
                          )}
                          {(row.status === "approved" || row.status === "pending") && (
                            <Button size="sm" disabled={saving} onClick={() => updateStatus(row.id, "issued")}>Issue</Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

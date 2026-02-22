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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@schoolerp/ui"
import { apiClient, API_BASE_URL } from "@/lib/api-client"
import { FileCheck2, Loader2, RefreshCw, Clock, Download, FileText } from "lucide-react"
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

interface GeneratedCertificate {
  id: string
  student_id: string
  student_name: string
  admission_number: string
  certificate_type: string
  certificate_number: string
  issuance_date: string
  status: string
  reason?: string
  file_id?: string
  issued_by_name: string
}

const typeLabel = (type: string) => {
  if (type === "transfer_certificate" || type === "tc") return "Transfer Certificate"
  if (type === "bonafide_certificate" || type === "bonafide") return "Bonafide Certificate"
  return "Character Certificate"
}

const uuidValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "Bytes" in value) {
    const bytes = (value as { Bytes?: unknown }).Bytes
    if (typeof bytes === "string") return bytes
    if (Array.isArray(bytes) && bytes.every((item) => typeof item === "number")) {
      const hex = bytes.map((b) => b.toString(16).padStart(2, "0")).join("")
      return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`
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
  const [generated, setGenerated] = useState<GeneratedCertificate[]>([])
  
  const [statusFilter, setStatusFilter] = useState<CertificateStatus | "all">("all")
  const [activeTab, setActiveTab] = useState("requests")

  // Request Form State
  const [form, setForm] = useState({
    student_id: "",
    type: "transfer_certificate" as CertificateType,
    reason: "",
    requested_on: new Date().toISOString().slice(0, 10),
  })

  // Direct Issue Form State
  const [issueForm, setIssueForm] = useState({
    student_id: "",
    type: "bonafide", // 'bonafide' or 'tc'
    reason: "",
    conduct: "Good",
    remarks: "",
  })

  // Student Search State
  const [studentQuery, setStudentQuery] = useState("")
  const [selectedStudentDisplay, setSelectedStudentDisplay] = useState<any>(null)

  const fetchAll = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    setError("")

    try {
      const [reqRes, genRes] = await Promise.all([
        apiClient("/admin/certificates/requests"),
        apiClient("/admin/certificates")
      ])

      if (!reqRes.ok) throw new Error("Failed to fetch requests")
      if (!genRes.ok && genRes.status !== 404) throw new Error("Failed to fetch generated certificates")

      if (reqRes.ok) {
        const payload = await reqRes.json()
        setRequests(Array.isArray(payload) ? payload : [])
      }
      
      if (genRes.ok) {
        const payload = await genRes.json()
        setGenerated(Array.isArray(payload) ? payload : [])
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load data"
      setError(message)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Debounced Search
  useEffect(() => {
    if (studentQuery.length > 1) {
      const timer = setTimeout(async () => {
        try {
          const res = await apiClient(`/admin/students?query=${encodeURIComponent(studentQuery)}&limit=10`)
          if (res.ok) {
            const data = await res.json()
            setStudents(Array.isArray(data) ? data : data.data || [])
          }
        } catch (err) {
          console.error("Failed to fetch students", err)
        }
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setStudents([])
    }
  }, [studentQuery])

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
      if (!res.ok) throw new Error(await res.text() || "Failed to create request")

      await fetchAll(true)
      setForm((prev) => ({ ...prev, reason: "" }))
      setSelectedStudentDisplay(null)
      setForm(prev => ({ ...prev, student_id: "" }))
      toast.success("Request created successfully")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create request")
    } finally {
      setSaving(false)
    }
  }

  const generateCertificate = async () => {
    if (!issueForm.student_id) {
      setError("Student selection is required")
      return
    }

    setSaving(true)
    setError("")
    try {
      const endpoint = issueForm.type === "bonafide" ? "/admin/certificates/bonafide" : "/admin/certificates/tc"
      const payload = issueForm.type === "bonafide" 
        ? { student_id: issueForm.student_id, reason: issueForm.reason }
        : { student_id: issueForm.student_id, reason: issueForm.reason, conduct: issueForm.conduct, remarks: issueForm.remarks }

      const res = await apiClient(endpoint, {
        method: "POST",
        body: JSON.stringify(payload),
      })
      if (!res.ok) throw new Error(await res.text() || "Failed to generate certificate")

      await fetchAll(true)
      toast.success(`${typeLabel(issueForm.type)} generated successfully!`)
      setIssueForm({ student_id: "", type: "bonafide", reason: "", conduct: "Good", remarks: "" })
      setSelectedStudentDisplay(null)
      setStudentQuery("")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate")
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
      if (!res.ok) throw new Error(await res.text() || "Failed to update status")
      await fetchAll(true)
      toast.success(`Request marked as ${status}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update status")
    } finally {
      setSaving(false)
    }
  }

  const downloadFile = (fileId: string) => {
    const url = `${API_BASE_URL}/uploads/${uuidValue(fileId)}`;
    const token = localStorage.getItem("auth_token");
    window.open(token ? `${url}?token=${token}` : url, '_blank');
  }

  const filteredRequests = useMemo(() => {
    const list = statusFilter === "all" ? requests : requests.filter((r) => r.status === statusFilter)
    return list.slice().sort((a, b) => (a.requested_on < b.requested_on ? 1 : -1))
  }, [requests, statusFilter])

  const pendingCount = requests.filter((r) => r.status === "pending").length
  const issuedCount = generated.filter((r) => r.status === "issued").length

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">TC & Certificates</h1>
          <p className="text-sm font-medium text-muted-foreground">Manage and issue transfer and bonafide certificates.</p>
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
            <div className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Generated Certificates</div>
            <div className="text-3xl font-black mt-2 text-foreground">{issuedCount}</div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm">
          <CardContent className="p-6 flex flex-col justify-center h-full text-muted-foreground">
            <div className="flex items-center gap-2 font-medium">
              <FileCheck2 className="h-5 w-5 text-primary" />
              Directly issue PDFs.
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="requests">Student Requests</TabsTrigger>
          <TabsTrigger value="issued">Direct Issue & History</TabsTrigger>
        </TabsList>

        <TabsContent value="requests" className="space-y-6 focus-visible:outline-none">
          <Card className="border-none shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle className="text-lg">Log Manual Request</CardTitle>
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
              <CardTitle>Approval Workflow</CardTitle>
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
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                           <Loader2 className="h-4 w-4 animate-spin mx-auto mr-2 inline" /> Loading...
                        </TableCell>
                      </TableRow>
                    ) : filteredRequests.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">No certificate requests found.</TableCell>
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
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              {row.status === "pending" && (
                                <>
                                  <Button size="sm" variant="outline" className="h-8" disabled={saving} onClick={() => updateStatus(row.id, "approved")}>Approve</Button>
                                  <Button size="sm" variant="ghost" className="h-8 text-destructive hover:bg-destructive/10" disabled={saving} onClick={() => updateStatus(row.id, "rejected")}>Reject</Button>
                                </>
                              )}
                              {(row.status === "approved" || row.status === "pending") && (
                                <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white" disabled={saving} onClick={() => {
                                  updateStatus(row.id, "issued")
                                  toast("Note: To generate a PDF, switch to the 'Direct Issue' tab.", { duration: 5000 })
                                }}>Mark Issued</Button>
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
        </TabsContent>

        <TabsContent value="issued" className="space-y-6 focus-visible:outline-none">
          <Card className="border-primary/20 bg-primary/5 shadow-inner">
            <CardHeader className="border-b border-primary/10 pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" /> Generate Certificate
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-4 lg:grid-cols-5">
                <div className="space-y-2 md:col-span-2">
                  <Label>Select Student</Label>
                  {selectedStudentDisplay ? (
                    <div className="flex items-center justify-between p-2.5 bg-background border border-primary/20 rounded-xl">
                      <div>
                        <div className="font-bold text-sm">{selectedStudentDisplay.full_name}</div>
                        <div className="text-[10px] text-muted-foreground uppercase tracking-widest">{selectedStudentDisplay.admission_number}</div>
                      </div>
                      <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => {
                        setSelectedStudentDisplay(null)
                        setIssueForm(p => ({ ...p, student_id: "" }))
                      }}>Change</Button>
                    </div>
                  ) : (
                    <div className="relative">
                      <Input 
                        placeholder="Type name or admission no..." 
                        value={studentQuery}
                        onChange={(e) => setStudentQuery(e.target.value)}
                        className="bg-background"
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
                                 setIssueForm(p => ({ ...p, student_id: uuidValue(s.id) }))
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
                  <Label>Certificate Type</Label>
                  <Select value={issueForm.type} onValueChange={(value) => setIssueForm((prev) => ({ ...prev, type: value }))}>
                    <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bonafide">Bonafide Certificate</SelectItem>
                      <SelectItem value="tc">Transfer Certificate</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {issueForm.type === "tc" && (
                  <div className="space-y-2">
                    <Label>Conduct</Label>
                    <Select value={issueForm.conduct} onValueChange={(val) => setIssueForm(p => ({...p, conduct: val}))}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Excellent">Excellent</SelectItem>
                        <SelectItem value="Good">Good</SelectItem>
                        <SelectItem value="Satisfactory">Satisfactory</SelectItem>
                        <SelectItem value="Poor">Poor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className={`space-y-2 ${issueForm.type === "bonafide" ? "md:col-span-2 lg:col-span-2" : ""}`}>
                  <Label>Reason</Label>
                  <Input 
                    value={issueForm.reason} 
                    onChange={(e) => setIssueForm((prev) => ({ ...prev, reason: e.target.value }))} 
                    placeholder="e.g. Higher Studies" 
                    className="bg-background"
                  />
                </div>

                {issueForm.type === "tc" && (
                  <div className="space-y-2 md:col-span-4 lg:col-span-5">
                    <Label>Remarks</Label>
                    <Input 
                      value={issueForm.remarks} 
                      onChange={(e) => setIssueForm((prev) => ({ ...prev, remarks: e.target.value }))} 
                      placeholder="Optional remarks" 
                      className="bg-background"
                    />
                  </div>
                )}

                <div className="md:col-span-4 lg:col-span-5 flex justify-end">
                  <Button onClick={generateCertificate} disabled={saving || loading} className="gap-2">
                    {saving && <Loader2 className="h-4 w-4 animate-spin" />} Issue & Download
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm">
            <CardHeader className="border-b pb-4">
              <CardTitle>Generated Certificates</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto rounded-b-lg border-x border-b border-border">
                <Table>
                  <TableHeader className="bg-muted/40">
                    <TableRow className="hover:bg-transparent">
                      <TableHead>Certificate No.</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Issued On</TableHead>
                      <TableHead>Issued By</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                           <Loader2 className="h-4 w-4 animate-spin mx-auto mr-2 inline" /> Loading...
                        </TableCell>
                      </TableRow>
                    ) : generated.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">No generated certificates found.</TableCell>
                      </TableRow>
                    ) : (
                      generated.map((row) => (
                        <TableRow key={row.id} className="hover:bg-muted/50 transition-colors">
                          <TableCell className="font-mono text-sm font-semibold">{row.certificate_number}</TableCell>
                          <TableCell>
                            <div className="font-semibold text-foreground">{row.student_name}</div>
                            <div className="text-xs text-muted-foreground mt-0.5">{row.admission_number}</div>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{typeLabel(row.certificate_type)}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(row.issuance_date).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">{row.issued_by_name}</TableCell>
                          <TableCell className="text-right">
                            {row.file_id ? (
                              <Button size="sm" variant="outline" className="h-8 gap-2" onClick={() => downloadFile(row.file_id as string)}>
                                <Download className="h-3.5 w-3.5" /> Download
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground italic">No PDF available</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

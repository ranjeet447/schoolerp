"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { AdmissionEnquiry } from "@/types/admission"
import { format } from "date-fns"
import { toast } from "sonner"
import { Loader2, RefreshCw, Calendar, MessageSquare } from "lucide-react"

const textValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "String" in value) {
    const str = (value as { String?: string }).String
    return typeof str === "string" ? str : ""
  }
  return ""
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

const normalizeEnquiry = (item: any): AdmissionEnquiry => ({
  id: uuidValue(item?.id),
  tenant_id: uuidValue(item?.tenant_id),
  parent_name: item?.parent_name || "",
  email: textValue(item?.email),
  phone: item?.phone || "",
  student_name: item?.student_name || "",
  grade_interested: item?.grade_interested || "",
  academic_year: item?.academic_year || "",
  source: textValue(item?.source),
  status: (item?.status || "open") as AdmissionEnquiry["status"],
  notes: textValue(item?.notes),
  created_at: dateValue(item?.created_at),
  updated_at: dateValue(item?.updated_at),
})

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<AdmissionEnquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [creatingForID, setCreatingForID] = useState("")

  useEffect(() => {
    fetchEnquiries()
  }, [])

  const fetchEnquiries = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await apiClient("/admin/admissions/enquiries?limit=50")
      if (res.ok) {
        const payload = await res.json()
        const rows = Array.isArray(payload) ? payload : []
        setEnquiries(rows.map(normalizeEnquiry))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const updateStatus = async (id: string, newStatus: string) => {
    try {
      const res = await apiClient(`/admin/admissions/enquiries/${id}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: newStatus as any } : e))
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to update status")
    }
  }

  const createApplication = async (enquiry: AdmissionEnquiry) => {
    setCreatingForID(enquiry.id)
    try {
      const body = {
        enquiry_id: enquiry.id,
        data: {
          parent_name: enquiry.parent_name,
          student_name: enquiry.student_name,
          grade_interested: enquiry.grade_interested,
          academic_year: enquiry.academic_year,
          phone: enquiry.phone,
          email: enquiry.email,
          notes: enquiry.notes,
        },
      }

      const res = await apiClient("/admin/admissions/applications", {
        method: "POST",
        body: JSON.stringify(body),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to create application")
      }

      await updateStatus(enquiry.id, "converted")
      toast.success("Application created from enquiry")
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create application"
      toast.error(message)
    } finally {
      setCreatingForID("")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Admission Enquiries</h1>
          <p className="text-muted-foreground">Manage incoming enquiries from the public portal.</p>
        </div>
        <Button variant="outline" onClick={() => fetchEnquiries(true)} disabled={refreshing} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Enquiries ({enquiries.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Parent Name</TableHead>
                <TableHead>Student</TableHead>
                <TableHead>Grade</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto mb-2" />
                    Loading enquiries...
                  </TableCell>
                </TableRow>
              ) : enquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No enquiries found.
                  </TableCell>
                </TableRow>
              ) : (
                enquiries.map((enquiry) => (
                  <TableRow key={enquiry.id}>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                        {enquiry.created_at ? format(new Date(enquiry.created_at), 'MMM d, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="font-medium">{enquiry.parent_name}</TableCell>
                    <TableCell>{enquiry.student_name}</TableCell>
                    <TableCell>{enquiry.grade_interested}</TableCell>
                    <TableCell>
                        <div className="text-sm">
                            <div>{enquiry.phone}</div>
                            <div className="text-muted-foreground text-xs">{enquiry.email}</div>
                        </div>
                    </TableCell>
                    <TableCell>
                        <Select 
                            value={enquiry.status} 
                            onValueChange={(val) => updateStatus(enquiry.id, val)}
                        >
                            <SelectTrigger className="w-[140px] h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="interview_scheduled">Interview</SelectItem>
                                <SelectItem value="converted">Converted</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="icon" title="Add Follow-up Reminder" onClick={() => toast.success("Follow-up reminder set")}>
                          <Calendar className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Record Outcome Note" onClick={() => toast.success("Outcome note recorded")}>
                          <MessageSquare className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => createApplication(enquiry)}
                          disabled={creatingForID === enquiry.id || enquiry.status === "converted"}
                          className="gap-2 ml-2"
                        >
                          {creatingForID === enquiry.id && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                          {enquiry.status === "converted" ? "Converted" : "Create Application"}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardHeader, CardTitle, 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Input, Badge
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { AdmissionEnquiry } from "@/types/admission"
import { format } from "date-fns"
import { toast } from "sonner"
import { 
  Loader2, 
  RefreshCw, 
  Calendar, 
  MessageSquare, 
  Search, 
  Filter, 
  UserPlus, 
  MoreHorizontal,
  Mail,
  Phone,
  GraduationCap
} from "lucide-react"

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
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")

  useEffect(() => {
    fetchEnquiries()
  }, [])

  const fetchEnquiries = async (silent = false) => {
    if (silent) setRefreshing(true)
    else setLoading(true)
    try {
      const res = await apiClient("/admin/admissions/enquiries?limit=100")
      if (res.ok) {
        const payload = await res.json()
        const rows = Array.isArray(payload) ? payload : []
        setEnquiries(rows.map(normalizeEnquiry))
      }
    } catch (err) {
      console.error(err)
      toast.error("Failed to load enquiries")
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
        toast.success(`Status updated to ${newStatus}`)
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

  const filteredEnquiries = enquiries.filter(e => {
    const matchesSearch = 
      e.parent_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.phone.includes(searchQuery) ||
      e.email.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || e.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'converted': return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 font-black italic uppercase italic tracking-wider">Converted</Badge>;
      case 'rejected': return <Badge variant="destructive" className="bg-rose-500/10 text-rose-500 border-rose-500/20 font-black uppercase tracking-wider">Rejected</Badge>;
      case 'open': return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20 font-black uppercase tracking-wider">New</Badge>;
      case 'contacted': return <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 font-black uppercase tracking-wider">Contacted</Badge>;
      case 'interview_scheduled': return <Badge className="bg-purple-500/10 text-purple-500 border-purple-500/20 font-black uppercase tracking-wider">Interview</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground italic uppercase">Admission <span className="text-primary">Pipeline</span></h1>
          <p className="text-muted-foreground font-medium mt-1">Manage incoming leads and conversion workflow.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => fetchEnquiries(true)} disabled={refreshing} className="rounded-2xl font-bold h-12 px-6 gap-2">
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Refresh Data
          </Button>
          <Button className="rounded-2xl font-bold h-12 px-6 gap-2">
            <UserPlus className="w-5 h-5" /> Manual Entry
          </Button>
        </div>
      </div>

      <Card className="bg-card border-border/50 rounded-3xl overflow-hidden shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/20 px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by parent, student, or phone..."
                className="bg-muted/50 border-border/50 pl-10 h-11 rounded-xl text-foreground focus:ring-1 focus:ring-primary/50"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-4 w-full md:w-auto">
               <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[160px] h-11 rounded-xl bg-muted/50 border-border/50">
                    <SelectValue placeholder="All Status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Enquiries</SelectItem>
                    <SelectItem value="open">New / Open</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="interview_scheduled">Interview</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
               </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border/50">
              <TableRow className="border-none">
                <TableHead className="text-muted-foreground font-black tracking-tighter uppercase px-8 py-4">Submission</TableHead>
                <TableHead className="text-muted-foreground font-black tracking-tighter uppercase">Primary Record</TableHead>
                <TableHead className="text-muted-foreground font-black tracking-tighter uppercase">Academic Info</TableHead>
                <TableHead className="text-muted-foreground font-black tracking-tighter uppercase">Contact Details</TableHead>
                <TableHead className="text-muted-foreground font-black tracking-tighter uppercase">Status</TableHead>
                <TableHead className="text-right px-8">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/50">
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    Syncing enquiry pipeline...
                  </TableCell>
                </TableRow>
              ) : filteredEnquiries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                    <MessageSquare className="h-16 w-16 opacity-10 mx-auto mb-4" />
                    <p className="font-medium italic">No enquiries matched your filters.</p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredEnquiries.map((enquiry) => (
                  <TableRow key={enquiry.id} className="border-none hover:bg-muted/30 transition-colors group">
                    <TableCell className="px-8 py-5">
                       <div className="flex flex-col">
                        <span className="text-xs font-black text-foreground">{enquiry.created_at ? format(new Date(enquiry.created_at), 'MMM dd') : '-'}</span>
                        <span className="text-[10px] text-muted-foreground font-bold">{enquiry.created_at ? format(new Date(enquiry.created_at), 'p') : '-'}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-black text-foreground group-hover:text-primary transition-colors">{enquiry.student_name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Parent: {enquiry.parent_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                        <GraduationCap className="h-4 w-4 text-muted-foreground" />
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-foreground">Grade {enquiry.grade_interested}</span>
                          <span className="text-[10px] text-muted-foreground uppercase tracking-tighter">AY {enquiry.academic_year}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                          <Phone className="h-3 w-3 text-emerald-500" /> {enquiry.phone}
                        </div>
                        {enquiry.email && (
                          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                            <Mail className="h-3 w-3 text-blue-500" /> {enquiry.email}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                       <Select 
                            value={enquiry.status} 
                            onValueChange={(val) => updateStatus(enquiry.id, val)}
                        >
                            <SelectTrigger className="h-8 border-none bg-transparent hover:bg-muted rounded-lg p-0 w-auto gap-2 shadow-none focus:ring-0">
                                {getStatusBadge(enquiry.status)}
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                <SelectItem value="open">New Enquiry</SelectItem>
                                <SelectItem value="contacted">Contacted</SelectItem>
                                <SelectItem value="interview_scheduled">Scheduled Interview</SelectItem>
                                <SelectItem value="converted">Admission Converted</SelectItem>
                                <SelectItem value="rejected">Rejected / Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </TableCell>
                    <TableCell className="text-right px-8">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="rounded-xl h-9 px-4 font-bold border-primary/20 text-primary hover:bg-primary/5 gap-2"
                          onClick={() => createApplication(enquiry)}
                          disabled={creatingForID === enquiry.id || enquiry.status === "converted"}
                        >
                          {creatingForID === enquiry.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : enquiry.status === "converted" ? (
                            "Converted"
                          ) : (
                            "Enroll Now"
                          )}
                        </Button>
                        <Button variant="ghost" size="icon" className="rounded-xl h-9 w-9">
                          <MoreHorizontal className="h-4 w-4" />
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
      
      {/* Summary Footer */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Total Enquiries</span>
            <span className="text-xl font-black text-foreground">{enquiries.length}</span>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1">Conversions</span>
            <span className="text-xl font-black text-foreground">{enquiries.filter(e => e.status === "converted").length}</span>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Active Leads</span>
            <span className="text-xl font-black text-foreground">{enquiries.filter(e => e.status !== "converted" && e.status !== "rejected").length}</span>
          </div>
          <div className="bg-card border border-border/50 rounded-2xl p-4 flex flex-col items-center justify-center text-center">
            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Conversion Rate</span>
            <span className="text-xl font-black text-foreground">
              {enquiries.length > 0 ? Math.round((enquiries.filter(e => e.status === "converted").length / enquiries.length) * 100) : 0}%
            </span>
          </div>
      </div>
    </div>
  )
}

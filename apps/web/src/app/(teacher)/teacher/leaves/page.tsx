"use client"

import { useEffect, useState } from "react"
import { 
  Calendar, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  Plus,
  Loader2,
  ChevronRight,
  FileText
} from "lucide-react"
import { 
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
  Textarea,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Separator
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"

type LeaveType = {
  id: string
  name: string
  is_active: boolean
}

type LeaveRequest = {
  id: string
  leave_type_name: string
  start_date: string
  end_date: string
  reason: string
  status: string
  created_at: string
}

export default function TeacherLeavesPage() {
  const { user } = useAuth()
  const [leaves, setLeaves] = useState<LeaveRequest[]>([])
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [isApplyOpen, setIsApplyOpen] = useState(false)

  // Form State
  const [selectedTypeID, setSelectedTypeID] = useState("")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [reason, setReason] = useState("")

  const fetchData = async () => {
    setLoading(true)
    try {
      const [leavesRes, typesRes] = await Promise.all([
        apiClient("/teacher/leaves"),
        apiClient("/teacher/leaves/types")
      ])

      if (leavesRes.ok) {
        setLeaves(await leavesRes.json())
      }
      if (typesRes.ok) {
        setLeaveTypes(await typesRes.json())
      }
    } catch (err) {
      toast.error("Failed to load leave data")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.id) fetchData()
  }, [user?.id])

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTypeID || !startDate || !endDate || !reason) {
      toast.error("Please fill all required fields")
      return
    }

    setSubmitting(true)
    try {
      const res = await apiClient("/teacher/leaves", {
        method: "POST",
        body: JSON.stringify({
          leave_type_id: selectedTypeID,
          start_date: new Date(startDate).toISOString(),
          end_date: new Date(endDate).toISOString(),
          reason
        })
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to submit request")
      }

      toast.success("Leave request submitted successfully")
      setIsApplyOpen(false)
      setSelectedTypeID("")
      setStartDate("")
      setEndDate("")
      setReason("")
      fetchData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit request")
    } finally {
      setSubmitting(false)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none gap-1"><CheckCircle2 className="h-3 w-3" /> Approved</Badge>
      case 'rejected':
        return <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border-none gap-1"><XCircle className="h-3 w-3" /> Rejected</Badge>
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 border-none gap-1"><Clock className="h-3 w-3" /> Pending</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">My Leaves</h1>
          <p className="text-slate-500 mt-1">Submit new requests and track your application status.</p>
        </div>
        <Button onClick={() => setIsApplyOpen(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 h-11 px-6 shadow-sm">
          <Plus className="h-5 w-5" /> Apply for Leave
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-sm bg-emerald-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-emerald-800 uppercase tracking-wider">Approved Leaves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-900">
              {leaves.filter(l => l.status.toLowerCase() === 'approved').length}
            </div>
            <p className="text-xs text-emerald-600 mt-1">Current academic year</p>
          </CardContent>
        </Card>
        
        <Card className="border-none shadow-sm bg-yellow-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-yellow-800 uppercase tracking-wider">Pending Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-900">
              {leaves.filter(l => l.status.toLowerCase() === 'pending').length}
            </div>
            <p className="text-xs text-yellow-600 mt-1">Awaiting principal approval</p>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-blue-50/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-blue-800 uppercase tracking-wider">Active Balance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-900">--</div>
            <p className="text-xs text-blue-600 mt-1 text-nowrap">Check HR for detailed quota</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-slate-100 shadow-sm overflow-hidden">
        <CardHeader className="bg-slate-50/50 border-b border-slate-100">
          <CardTitle className="text-lg">Recent Leave History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-emerald-600" />
              <p className="text-sm text-slate-500">Fetching history...</p>
            </div>
          ) : leaves.length === 0 ? (
            <div className="text-center py-20 px-6">
              <div className="h-16 w-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-8 w-8 text-slate-300" />
              </div>
              <h3 className="text-slate-900 font-semibold text-lg">No leave records yet</h3>
              <p className="text-slate-500 text-sm mt-1 max-w-sm mx-auto">
                Once you start submitting leave requests, they will appear here along with their current status.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {leaves.map((leave) => (
                <div key={leave.id} className="p-4 hover:bg-slate-50/50 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 group">
                  <div className="flex items-start gap-4">
                    <div className="mt-1 h-10 w-10 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="font-semibold text-slate-900 flex items-center gap-2">
                        {leave.leave_type_name}
                        <ChevronRight className="h-3 w-3 text-slate-300 md:hidden" />
                      </div>
                      <div className="text-sm text-slate-500 flex flex-wrap items-center gap-x-3 mt-0.5">
                        <span className="flex items-center gap-1">
                          {new Date(leave.start_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })} 
                          <span className="text-slate-300">→</span> 
                          {new Date(leave.end_date).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-slate-300 hidden md:block" />
                        <span className="italic">"{leave.reason}"</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between md:justify-end gap-4 border-t md:border-t-0 pt-3 md:pt-0">
                    <span className="text-[10px] text-slate-400 font-medium uppercase tracking-tighter md:hidden">Status</span>
                    {getStatusBadge(leave.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isApplyOpen} onOpenChange={setIsApplyOpen}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Apply for Leave</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleApply} className="space-y-6 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-1 gap-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Leave Category</Label>
                <Select value={selectedTypeID} onValueChange={setSelectedTypeID}>
                  <SelectTrigger className="h-11 bg-slate-50 hover:bg-slate-100 transition-colors">
                    <SelectValue placeholder="Select leave category" />
                  </SelectTrigger>
                  <SelectContent>
                    {leaveTypes.map((type) => (
                      <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">Start Date</Label>
                  <Input 
                    type="date" 
                    value={startDate} 
                    onChange={e => setStartDate(e.target.value)} 
                    className="h-11 bg-slate-50"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-slate-500">End Date</Label>
                  <Input 
                    type="date" 
                    value={endDate} 
                    onChange={e => setEndDate(e.target.value)} 
                    className="h-11 bg-slate-50"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase text-slate-500">Reason for Request</Label>
                <Textarea 
                  placeholder="Please provide a brief reason for your leave..." 
                  className="min-h-[120px] bg-slate-50 resize-none"
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  required
                />
              </div>
            </div>

            <Separator />

            <DialogFooter className="gap-2">
              <Button type="button" variant="ghost" className="h-11" onClick={() => setIsApplyOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="h-11 bg-emerald-600 hover:bg-emerald-700 text-white min-w-[140px] gap-2" disabled={submitting}>
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit Request"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useEffect, useState } from "react"
import { LeaveRequestCard, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@schoolerp/ui"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

export default function ParentLeavePage() {
  const [loading, setLoading] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(true)
  const [children, setChildren] = useState<any[]>([])
  const [leaves, setLeaves] = useState<any[]>([])
  const [selectedChildID, setSelectedChildID] = useState("")
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [reason, setReason] = useState("")

  const mapLeave = (leave: any) => ({
    id: String(leave.id),
    studentName: String(leave.full_name || leave.studentName || "Student"),
    admissionNumber: String(leave.admission_number || leave.admissionNumber || "-"),
    from: leave.from_date ? String(leave.from_date).slice(0, 10) : "",
    to: leave.to_date ? String(leave.to_date).slice(0, 10) : "",
    reason: String(leave.reason || ""),
    status: String(leave.status || "pending"),
  })

  const loadLeaves = async (targetChildID: string) => {
    if (!targetChildID) {
      setLeaves([])
      return
    }

    try {
      const res = await apiClient(`/parent/leaves?student_id=${encodeURIComponent(targetChildID)}`)
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to load leave requests")
      }

      const payload = await res.json()
      const data = Array.isArray(payload) ? payload : payload?.data || []
      setLeaves(data.map(mapLeave))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load leave requests")
      setLeaves([])
    }
  }

  useEffect(() => {
    const loadChildren = async () => {
      setBootstrapping(true)
      try {
        const res = await apiClient("/parent/me/children")
        if (!res.ok) {
          const msg = await res.text()
          throw new Error(msg || "Failed to load children")
        }

        const payload = await res.json()
        const data = Array.isArray(payload) ? payload : payload?.data || []
        setChildren(data)
        if (data.length > 0) {
          const childID = String(data[0].id)
          setSelectedChildID(childID)
          await loadLeaves(childID)
        } else {
          setLeaves([])
        }
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Failed to load children")
        setChildren([])
        setLeaves([])
      } finally {
        setBootstrapping(false)
      }
    }

    loadChildren()
  }, [])

  useEffect(() => {
    if (!selectedChildID || bootstrapping) return
    void loadLeaves(selectedChildID)
  }, [selectedChildID, bootstrapping])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedChildID || !fromDate || !toDate || !reason.trim()) {
      toast.error("Please fill all required fields")
      return
    }

    setLoading(true)

    try {
      const res = await apiClient("/parent/leaves", {
        method: "POST",
        body: JSON.stringify({
          student_id: selectedChildID,
          from_date: fromDate,
          to_date: toDate,
          reason,
        }),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to submit leave request")
      }

      await loadLeaves(selectedChildID)

      setFromDate("")
      setToDate("")
      setReason("")
      toast.success("Leave request submitted")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit leave request")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle>Request Leave</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label>Select Child</Label>
                <Select value={selectedChildID} onValueChange={setSelectedChildID} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    {children.map((child) => (
                      <SelectItem key={String(child.id)} value={String(child.id)}>
                        {child.full_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} required />
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Explain the reason for leave..." required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Submitting..." : "Submit Request"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-2 space-y-4">
        <h2 className="text-xl font-bold">Past Requests</h2>
        {bootstrapping && <div className="text-sm text-muted-foreground">Loading children...</div>}
        {leaves.map(leave => (
          <LeaveRequestCard key={leave.id} {...leave} />
        ))}
        {!bootstrapping && leaves.length === 0 && (
          <div className="text-sm text-muted-foreground">No leave requests yet.</div>
        )}
      </div>
    </div>
  )
}

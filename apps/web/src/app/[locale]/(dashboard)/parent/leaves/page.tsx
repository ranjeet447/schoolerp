"use client"

import { useState } from "react"
import { LeaveRequestCard, Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@schoolerp/ui"

export default function ParentLeavePage() {
  const [loading, setLoading] = useState(false)
  const [leaves, setLeaves] = useState<any[]>([
    {
      id: "1",
      studentName: "Aarav Sharma",
      admissionNumber: "SCH-2025-042",
      from: "2025-06-10",
      to: "2025-06-12",
      reason: "Family function.",
      status: "pending"
    }
  ])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    // In a real app, API call to POST /v1/parent/leaves
    setTimeout(() => {
      alert("Leave request submitted!")
      setLoading(false)
    }, 1000)
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
                <Select required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select child" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Aarav Sharma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>From Date</Label>
                  <Input type="date" required />
                </div>
                <div className="space-y-2">
                  <Label>To Date</Label>
                  <Input type="date" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Reason</Label>
                <Textarea placeholder="Explain the reason for leave..." required />
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
        {leaves.map(leave => (
          <LeaveRequestCard key={leave.id} {...leave} />
        ))}
      </div>
    </div>
  )
}

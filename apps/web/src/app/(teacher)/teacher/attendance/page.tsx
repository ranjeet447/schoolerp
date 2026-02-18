"use client"

import { useState, useEffect } from "react"
import { AttendanceGrid, AttendanceStatus, Button, Card, CardContent, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

type ClassSectionOption = {
  id: string
  class_name: string
  name: string
  label: string
}

export default function TeacherAttendancePage() {
  const [classSectionID, setClassSectionID] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [students, setStudents] = useState<any[]>([])
  const [classSections, setClassSections] = useState<ClassSectionOption[]>([])
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<any>(null)
  const [overrideReason, setOverrideReason] = useState("")
  
  // Fetch students/session for the selected class
  useEffect(() => {
    fetchClassSections()
  }, [])

  useEffect(() => {
    if (classSectionID) {
      fetchSession()
    }
  }, [classSectionID, date])

  const fetchClassSections = async () => {
    try {
      const res = await apiClient("/teacher/attendance/class-sections")
      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to load class sections")
      }
      const data = await res.json()
      const rows = Array.isArray(data) ? data : []
      setClassSections(rows)
      if (rows.length > 0) {
        setClassSectionID((current) => current || String(rows[0].id || ""))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load class sections")
      setClassSections([])
    }
  }

  const fetchSession = async () => {
    setLoading(true)
    try {
      const res = await apiClient(`/teacher/attendance/sessions?class_section_id=${classSectionID}&date=${date}`)
      if (res.ok) {
        const data = await res.json()
        setSession(data.session)
        setStudents(data.entries.map((e: any) => ({
          id: e.student_id,
          name: e.student_name,
          rollNumber: e.roll_number,
          status: e.status,
          remarks: e.remarks || ""
        })))
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s))
  }

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, remarks } : s))
  }

  const handleSubmit = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/teacher/attendance/mark", {
        method: "POST",
        body: JSON.stringify({
          class_section_id: classSectionID,
          date,
          override_reason: overrideReason,
          entries: students.map(s => ({
            student_id: s.id,
            status: s.status,
            remarks: s.remarks
          }))
        })
      })
      if (res.ok) {
        toast.success("Attendance submitted successfully")
        setOverrideReason("")
        fetchSession()
      } else {
        const message = await res.text()
        if (res.status === 202) {
          toast.info(message || "Attendance override request submitted for approval")
        } else {
          throw new Error(message || "Failed to submit attendance")
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit attendance")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Mark Attendance</h1>
        <Button onClick={handleSubmit} disabled={!classSectionID || loading}>
          Submit Attendance
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selection</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
          <div className="w-64">
            <Select value={classSectionID} onValueChange={setClassSectionID}>
              <SelectTrigger>
                <SelectValue placeholder="Select Class & Section" />
              </SelectTrigger>
              <SelectContent>
                {classSections.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.label || `${item.class_name} - ${item.name}`}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <input
            type="date"
            className="border rounded px-3 py-2 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Override Reason (required for policy overrides)</label>
            <textarea
              className="w-full min-h-[72px] rounded-md border px-3 py-2 text-sm"
              placeholder="Provide reason when editing locked or out-of-window attendance"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              disabled={loading}
            />
          </div>
        </CardContent>
      </Card>

      {classSectionID ? (
        <Card>
          <CardContent className="pt-6">
            <AttendanceGrid
              students={students}
              onStatusChange={handleStatusChange}
              onRemarksChange={handleRemarksChange}
              readOnly={loading}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="text-center py-20 text-gray-500 border-2 border-dashed rounded-lg">
          Please select a class and section to see the student list.
        </div>
      )}
    </div>
  )
}

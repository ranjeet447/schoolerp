"use client"

import { useState, useEffect } from "react"
import { AttendanceGrid, AttendanceStatus, Button, Card, CardContent, CardHeader, CardTitle, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

export default function TeacherAttendancePage() {
  const [classSectionID, setClassSectionID] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [session, setSession] = useState<any>(null)
  
  // Fetch students/session for the selected class
  useEffect(() => {
    if (classSectionID) {
      fetchSession()
    }
  }, [classSectionID, date])

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
          entries: students.map(s => ({
            student_id: s.id,
            status: s.status,
            remarks: s.remarks
          }))
        })
      })
      if (res.ok) {
        toast.success("Attendance submitted successfully")
        fetchSession()
      }
    } catch (err) {
      toast.error("Failed to submit attendance")
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
        <CardContent className="flex gap-4">
          <div className="w-64">
            <Select onValueChange={setClassSectionID}>
              <SelectTrigger>
                <SelectValue placeholder="Select Class & Section" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="cs-1">Grade 10 - A</SelectItem>
                <SelectItem value="cs-2">Grade 10 - B</SelectItem>
                <SelectItem value="cs-3">Grade 9 - A</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <input
            type="date"
            className="border rounded px-3 py-2 text-sm"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
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

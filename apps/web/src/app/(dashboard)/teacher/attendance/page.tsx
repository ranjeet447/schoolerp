"use client"

import { useState, useEffect } from "react"
import { AttendanceGrid, AttendanceStatus } from "@schoolerp/ui"
import { Button } from "@/components/ui/button" // Assuming standard shadcn path in apps/web
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function TeacherAttendancePage() {
  const [classSectionID, setClassSectionID] = useState("")
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [students, setStudents] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // Mock fetching students for the selected class
  useEffect(() => {
    if (classSectionID) {
      setLoading(true)
      // In a real app, this would be an API call
      setTimeout(() => {
        setStudents([
          { id: "1", name: "Aarav Sharma", rollNumber: "1", status: "present", remarks: "" },
          { id: "2", name: "Ishani Roy", rollNumber: "2", status: "present", remarks: "" },
          { id: "3", name: "Vihaan Gupta", rollNumber: "3", status: "present", remarks: "" },
        ])
        setLoading(false)
      }, 500)
    }
  }, [classSectionID])

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, status } : s))
  }

  const handleRemarksChange = (studentId: string, remarks: string) => {
    setStudents(prev => prev.map(s => s.id === studentId ? { ...s, remarks } : s))
  }

  const handleSubmit = async () => {
    // API call to /v1/teacher/attendance/mark
    alert("Attendance submitted successfully!")
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

"use client"

import { useEffect, useMemo, useState } from "react"
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@schoolerp/ui"
import { Loader2, Save } from "lucide-react"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

type ExamRow = {
  id: string
  name: string
  status: string
}

type ExamSubjectRow = {
  subject_id: string
  subject_name: string
  max_marks: number
}

type MarksRow = {
  student_id: string
  student_name: string
  marks_obtained: number
}

const textValue = (value: unknown): string => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "String" in value) {
    const v = (value as { String?: string }).String
    return typeof v === "string" ? v : ""
  }
  return ""
}

const numericValue = (value: unknown): number => {
  if (typeof value === "number") return value
  if (typeof value === "string") {
    const n = Number(value)
    return Number.isFinite(n) ? n : 0
  }
  if (value && typeof value === "object" && "Int" in value && "Exp" in value) {
    const raw = value as { Int?: { neg?: boolean; abs?: string[] } | number; Exp?: number }
    if (typeof raw.Int === "number" && typeof raw.Exp === "number") {
      return raw.Int * Math.pow(10, raw.Exp)
    }
  }
  return 0
}

export default function TeacherMarksPage() {
  const [exams, setExams] = useState<ExamRow[]>([])
  const [subjects, setSubjects] = useState<ExamSubjectRow[]>([])
  const [marksRows, setMarksRows] = useState<MarksRow[]>([])
  const [selectedExamID, setSelectedExamID] = useState("")
  const [selectedSubjectID, setSelectedSubjectID] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetchExams()
  }, [])

  useEffect(() => {
    if (selectedExamID) {
      fetchSubjects(selectedExamID)
    } else {
      setSubjects([])
      setSelectedSubjectID("")
    }
  }, [selectedExamID])

  useEffect(() => {
    if (selectedExamID && selectedSubjectID) {
      fetchMarks(selectedExamID, selectedSubjectID)
    } else {
      setMarksRows([])
    }
  }, [selectedExamID, selectedSubjectID])

  const selectedSubject = useMemo(
    () => subjects.find((subject) => subject.subject_id === selectedSubjectID),
    [subjects, selectedSubjectID],
  )

  const fetchExams = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/teacher/exams")
      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to load exams")
      }

      const data = await res.json()
      const normalized: ExamRow[] = Array.isArray(data)
        ? data.map((item) => ({
            id: textValue(item?.id),
            name: item?.name || "",
            status: textValue(item?.status),
          }))
        : []

      setExams(normalized)
      if (normalized.length > 0) {
        setSelectedExamID(normalized[0].id)
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load exams")
    } finally {
      setLoading(false)
    }
  }

  const fetchSubjects = async (examID: string) => {
    try {
      const res = await apiClient(`/teacher/exams/${examID}/subjects`)
      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to load exam subjects")
      }

      const data = await res.json()
      const normalized: ExamSubjectRow[] = Array.isArray(data)
        ? data.map((item) => ({
            subject_id: textValue(item?.subject_id),
            subject_name: item?.subject_name || "",
            max_marks: Number(item?.max_marks || 100),
          }))
        : []

      setSubjects(normalized)
      setSelectedSubjectID(normalized[0]?.subject_id || "")
    } catch (err) {
      setSubjects([])
      setSelectedSubjectID("")
      toast.error(err instanceof Error ? err.message : "Failed to load subjects")
    }
  }

  const fetchMarks = async (examID: string, subjectID: string) => {
    try {
      const res = await apiClient(`/teacher/exams/${examID}/subjects/${subjectID}/marks`)
      if (!res.ok) {
        throw new Error((await res.text()) || "Failed to load marks")
      }

      const data = await res.json()
      const normalized: MarksRow[] = Array.isArray(data)
        ? data.map((item) => ({
            student_id: textValue(item?.student_id),
            student_name: item?.student_name || "",
            marks_obtained: numericValue(item?.marks_obtained),
          }))
        : []
      setMarksRows(normalized)
    } catch (err) {
      setMarksRows([])
      toast.error(err instanceof Error ? err.message : "Failed to load marks")
    }
  }

  const handleMarksChange = (studentID: string, marks: number) => {
    setMarksRows((prev) => prev.map((row) => (row.student_id === studentID ? { ...row, marks_obtained: marks } : row)))
  }

  const handleSave = async () => {
    if (!selectedExamID || !selectedSubjectID || marksRows.length === 0) {
      toast.error("Select exam and subject with student rows")
      return
    }

    setSaving(true)
    try {
      for (const row of marksRows) {
        const res = await apiClient(`/teacher/exams/${selectedExamID}/subjects/${selectedSubjectID}/marks`, {
          method: "POST",
          body: JSON.stringify({
            student_id: row.student_id,
            marks: row.marks_obtained,
          }),
        })

        if (!res.ok) {
          const message = await res.text()
          throw new Error(message || `Failed to save marks for ${row.student_name}`)
        }
      }

      toast.success("Marks saved successfully")
      await fetchMarks(selectedExamID, selectedSubjectID)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save marks")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Marks Entry</h1>
          <p className="text-gray-500">
            {exams.find((exam) => exam.id === selectedExamID)?.name || "Select exam"}
            {selectedSubject ? ` • ${selectedSubject.subject_name}` : ""}
          </p>
        </div>
        <Button onClick={handleSave} disabled={saving || !selectedExamID || !selectedSubjectID || marksRows.length === 0} className="bg-green-600 hover:bg-green-700">
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          <Save className="w-4 h-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selection</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Exam</Label>
            <Select value={selectedExamID} onValueChange={setSelectedExamID}>
              <SelectTrigger>
                <SelectValue placeholder="Select exam" />
              </SelectTrigger>
              <SelectContent>
                {exams.map((exam) => (
                  <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Subject</Label>
            <Select value={selectedSubjectID} onValueChange={setSelectedSubjectID}>
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.subject_id} value={subject.subject_id}>{subject.subject_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Student Marks {selectedSubject ? `(Max ${selectedSubject.max_marks})` : ""}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading exams...</div>
          ) : marksRows.length === 0 ? (
            <div className="text-sm text-muted-foreground">No student marks rows found for the selected subject.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="px-3 py-2">Student</th>
                    <th className="px-3 py-2 w-40">Marks</th>
                  </tr>
                </thead>
                <tbody>
                  {marksRows.map((row) => (
                    <tr key={row.student_id || row.student_name} className="border-t">
                      <td className="px-3 py-2 text-sm font-medium">{row.student_name || "-"}</td>
                      <td className="px-3 py-2">
                        <Input
                          type="number"
                          min={0}
                          max={selectedSubject?.max_marks || 100}
                          step="0.01"
                          value={row.marks_obtained}
                          onChange={(e) => handleMarksChange(row.student_id, Number(e.target.value || 0))}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

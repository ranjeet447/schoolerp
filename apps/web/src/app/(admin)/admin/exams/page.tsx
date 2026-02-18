"use client"

import { useState, useEffect } from "react"
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@schoolerp/ui"
import { Calendar, Loader2, Plus } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

type ExamRow = {
  id: string
  name: string
  status: string
  academic_year_id: string
  start_date: string
  end_date: string
}

type SubjectRow = {
  id: string
  name: string
}

type ExamSubjectRow = {
  subject_id: string
  subject_name: string
  max_marks: number
  exam_date: string
}

type YearRow = {
  id: string
  name: string
}

const textValue = (value: unknown): string => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "String" in value) {
    const v = (value as { String?: string }).String
    return typeof v === "string" ? v : ""
  }
  return ""
}

const dateValue = (value: unknown): string => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "Time" in value) {
    const t = (value as { Time?: string }).Time
    return typeof t === "string" ? t.slice(0, 10) : ""
  }
  return ""
}

const normalizeExam = (item: any): ExamRow => ({
  id: textValue(item?.id),
  name: item?.name || "",
  status: textValue(item?.status) || "draft",
  academic_year_id: textValue(item?.academic_year_id),
  start_date: dateValue(item?.start_date),
  end_date: dateValue(item?.end_date),
})

const normalizeSubject = (item: any): SubjectRow => ({
  id: textValue(item?.id),
  name: item?.name || "",
})

const normalizeExamSubject = (item: any): ExamSubjectRow => ({
  subject_id: textValue(item?.subject_id),
  subject_name: item?.subject_name || "",
  max_marks: Number(item?.max_marks || 0),
  exam_date: dateValue(item?.exam_date),
})

export default function AdminExamsPage() {
  const [exams, setExams] = useState<ExamRow[]>([])
  const [years, setYears] = useState<YearRow[]>([])
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [examSubjects, setExamSubjects] = useState<ExamSubjectRow[]>([])
  const [loading, setLoading] = useState(true)

  const [newName, setNewName] = useState("")
  const [newAYID, setNewAYID] = useState("")
  const [newStartDate, setNewStartDate] = useState("")
  const [newEndDate, setNewEndDate] = useState("")
  const [creating, setCreating] = useState(false)

  const [selectedExamID, setSelectedExamID] = useState("")
  const [addingSubject, setAddingSubject] = useState(false)
  const [subjectID, setSubjectID] = useState("")
  const [maxMarks, setMaxMarks] = useState("100")
  const [examDate, setExamDate] = useState("")

  const [publishingExamID, setPublishingExamID] = useState("")
  const [calculating, setCalculating] = useState(false)

  useEffect(() => {
    fetchInitialData()
  }, [])

  useEffect(() => {
    if (selectedExamID) {
      fetchExamSubjects(selectedExamID)
    } else {
      setExamSubjects([])
    }
  }, [selectedExamID])

  const fetchInitialData = async () => {
    setLoading(true)
    try {
      const [examsRes, yearsRes, subjectsRes] = await Promise.all([
        apiClient("/admin/exams"),
        apiClient("/admin/academic-structure/academic-years"),
        apiClient("/admin/academic-structure/subjects"),
      ])

      if (examsRes.ok) {
        const data = await examsRes.json()
        const normalized = Array.isArray(data) ? data.map(normalizeExam) : []
        setExams(normalized)
        if (!selectedExamID && normalized.length > 0) {
          setSelectedExamID(normalized[0].id)
        }
      }

      if (yearsRes.ok) {
        const data = await yearsRes.json()
        const normalized: YearRow[] = Array.isArray(data)
          ? data.map((item) => ({ id: textValue(item?.id), name: item?.name || "" }))
          : []
        setYears(normalized)
        if (!newAYID && normalized.length > 0) {
          setNewAYID(normalized[0].id)
        }
      }

      if (subjectsRes.ok) {
        const data = await subjectsRes.json()
        const normalized = Array.isArray(data) ? data.map(normalizeSubject) : []
        setSubjects(normalized)
        if (!subjectID && normalized.length > 0) {
          setSubjectID(normalized[0].id)
        }
      }
    } catch (err) {
      console.error("Failed to fetch exams", err)
      toast.error("Failed to load exam data")
    } finally {
      setLoading(false)
    }
  }

  const fetchExamSubjects = async (examID: string) => {
    try {
      const res = await apiClient(`/admin/exams/${examID}/subjects`)
      if (!res.ok) {
        setExamSubjects([])
        return
      }
      const data = await res.json()
      setExamSubjects(Array.isArray(data) ? data.map(normalizeExamSubject) : [])
    } catch {
      setExamSubjects([])
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newName.trim() || !newAYID) {
      toast.error("Exam name and academic year are required")
      return
    }

    setCreating(true)
    try {
      const res = await apiClient("/admin/exams", {
        method: "POST",
        body: JSON.stringify({
          name: newName.trim(),
          academic_year_id: newAYID,
          start_date: newStartDate || undefined,
          end_date: newEndDate || undefined,
        })
      })

      if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "Failed to create exam")
      }

      toast.success("Exam created successfully")
      setNewName("")
      setNewStartDate("")
      setNewEndDate("")
      await fetchInitialData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create exam")
    } finally {
      setCreating(false)
    }
  }

  const handlePublish = async (examID: string) => {
    if (!examID) return

    setPublishingExamID(examID)
    try {
      const res = await apiClient(`/admin/exams/${examID}/publish`, { method: "POST" })
      if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "Failed to publish exam")
      }
      toast.success("Exam published")
      await fetchInitialData()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to publish exam")
    } finally {
      setPublishingExamID("")
    }
  }

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedExamID || !subjectID) {
      toast.error("Select exam and subject")
      return
    }

    setAddingSubject(true)
    try {
      const res = await apiClient(`/admin/exams/${selectedExamID}/subjects`, {
        method: "POST",
        body: JSON.stringify({
          subject_id: subjectID,
          max_marks: Number(maxMarks) || 100,
          exam_date: examDate || undefined,
        }),
      })

      if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "Failed to add subject")
      }

      toast.success("Subject added to exam")
      await fetchExamSubjects(selectedExamID)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to add subject")
    } finally {
      setAddingSubject(false)
    }
  }

  const handleCalculate = async () => {
    if (!newAYID) {
      toast.error("Select an academic year")
      return
    }

    setCalculating(true)
    try {
      const res = await apiClient("/admin/aggregates/calculate", {
        method: "POST",
        body: JSON.stringify({ academic_year_id: newAYID }),
      })
      if (!res.ok) {
        const message = await res.text()
        throw new Error(message || "Failed to calculate aggregates")
      }
      toast.success("Report-card aggregates calculated")
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to calculate aggregates")
    } finally {
      setCalculating(false)
    }
  }

  return (
    <div className="p-6 space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Examination Management</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Schedule New Exam</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Exam Name</Label>
                  <Input 
                    placeholder="e.g. Unit Test 1" 
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Select value={newAYID} onValueChange={setNewAYID}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Date</Label>
                    <Input type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>End Date</Label>
                    <Input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} />
                  </div>
                </div>
                <Button type="submit" className="w-full" disabled={creating || loading}>
                  {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  <Plus className="w-4 h-4 mr-2" />
                  Create Exam
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Report Card Aggregates</CardTitle>
              <CardDescription>Run weighted aggregate calculation after publishing exams.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" onClick={handleCalculate} disabled={calculating || !newAYID}>
                {calculating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Calculate Aggregates
              </Button>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Assign Subjects</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddSubject} className="space-y-3">
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
                  <Select value={subjectID} onValueChange={setSubjectID}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select subject" />
                    </SelectTrigger>
                    <SelectContent>
                      {subjects.map((subject) => (
                        <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input type="number" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} placeholder="Max marks" />
                  <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                </div>
                <Button type="submit" variant="outline" className="w-full" disabled={addingSubject || !selectedExamID || !subjectID}>
                  {addingSubject && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Add Subject
                </Button>
              </form>

              {selectedExamID && examSubjects.length > 0 && (
                <div className="mt-4 space-y-2">
                  {examSubjects.map((item) => (
                    <div key={`${item.subject_id}-${item.subject_name}`} className="text-sm rounded border p-2">
                      <div className="font-medium">{item.subject_name}</div>
                      <div className="text-muted-foreground">Max: {item.max_marks}{item.exam_date ? ` • ${item.exam_date}` : ""}</div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold">Planned Exams</h2>
          <div className="space-y-4">
            {loading ? (
              <div className="text-sm text-muted-foreground">Loading exams...</div>
            ) : exams.length === 0 ? (
              <div className="text-sm text-muted-foreground">No exams created yet.</div>
            ) : exams.map(exam => (
              <Card key={exam.id} className="hover:border-blue-200 transition-colors">
                <CardContent className="p-4 flex justify-between items-center">
                  <div className="space-y-1">
                    <h3 className="font-bold text-lg">{exam.name}</h3>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {(exam.start_date || "-") + " - " + (exam.end_date || "-")}
                      </div>
                      <Badge variant={exam.status === "published" ? "default" : "secondary"} className="capitalize">
                        {exam.status}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setSelectedExamID(exam.id)}>Manage Subjects</Button>
                    <Button variant="default" size="sm" disabled={exam.status === "published" || publishingExamID === exam.id} onClick={() => handlePublish(exam.id)}>
                      {publishingExamID === exam.id ? "Publishing..." : "Publish"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

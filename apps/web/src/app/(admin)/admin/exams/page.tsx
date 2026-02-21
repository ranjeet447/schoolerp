"use client"

import { useState, useEffect } from "react"
import { 
  Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, 
  Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Tabs, TabsContent, TabsList, TabsTrigger, Switch
} from "@schoolerp/ui"
import { Calendar, Loader2, Plus, ShieldCheck, Lock, Unlock, FileText, History, ListChecks, Printer, Download } from "lucide-react"
import { SubjectSelect } from "@/components/ui/subject-select"
import { SectionSelect } from "@/components/ui/section-select"
import { ClassSelect } from "@/components/ui/class-select"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { RubricGeneratorDialog } from "@/components/exams/rubric-generator-dialog"

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

type PaperRow = {
  id: string
  exam_id?: string
  exam_name?: string
  subject_id?: string
  subject_name?: string
  set_name: string
  file_path: string
  is_encrypted: boolean
  unlock_at: string
  is_previous_year: boolean
  academic_year_id: string
}

type HallTicketRow = {
  student_id: string
  student_name: string
  roll_number: string
  hall_number: string
  seat_number: string
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

const normalizePaper = (item: any): PaperRow => ({
  id: textValue(item?.id),
  exam_id: textValue(item?.exam_id),
  exam_name: item?.exam_name || "General/Previous Year",
  subject_id: textValue(item?.subject_id),
  subject_name: item?.subject_name || "All Subjects",
  set_name: item?.set_name || "Set A",
  file_path: item?.file_path || "",
  is_encrypted: !!item?.is_encrypted,
  unlock_at: dateValue(item?.unlock_at),
  is_previous_year: !!item?.is_previous_year,
  academic_year_id: textValue(item?.academic_year_id),
})

const normalizeHallTicket = (item: any): HallTicketRow => ({
  student_id: textValue(item?.student_id),
  student_name: item?.student_name || "",
  roll_number: item?.roll_number || "",
  hall_number: textValue(item?.hall_number),
  seat_number: textValue(item?.seat_number),
})

export default function AdminExamsPage() {
  const [exams, setExams] = useState<ExamRow[]>([])
  const [years, setYears] = useState<YearRow[]>([])
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [examSubjects, setExamSubjects] = useState<ExamSubjectRow[]>([])
  const [papers, setPapers] = useState<PaperRow[]>([])
  const [loading, setLoading] = useState(true)

  const [examPreset, setExamPreset] = useState("custom")
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

  // Paper Form
  const [uploadingPaper, setUploadingPaper] = useState(false)
  const [pExamID, setPExamID] = useState("")
  const [pSubjectID, setPSubjectID] = useState("")
  const [pSetName, setPSetName] = useState("Set A")
  const [pFilePath, setPFilePath] = useState("")
  const [pIsEncrypted, setPIsEncrypted] = useState(true)
  const [pUnlockAt, setPUnlockAt] = useState("")
  const [pIsPrevious, setPIsPrevious] = useState(false)

  // Hall Tickets State
  const [hallTickets, setHallTickets] = useState<HallTicketRow[]>([])
  const [targetClassID, setTargetClassID] = useState("")
  const [targetSectionID, setTargetSectionID] = useState("")
  const [rollPrefix, setRollPrefix] = useState("")
  const [generating, setGenerating] = useState(false)
  const [fetchingTickets, setFetchingTickets] = useState(false)

  // Grading State
  const [initializingGrading, setInitializingGrading] = useState(false)

  useEffect(() => {
    fetchInitialData()
    fetchPapers()
  }, [])

  useEffect(() => {
    if (selectedExamID) {
      fetchExamSubjects(selectedExamID)
      fetchHallTickets(selectedExamID)
    } else {
      setExamSubjects([])
      setHallTickets([])
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

  const fetchPapers = async () => {
    try {
      const res = await apiClient("/admin/exams/papers")
      if (res.ok) {
        const data = await res.json()
        setPapers(Array.isArray(data) ? data.map(normalizePaper) : [])
      }
    } catch (err) {
      console.error("Failed to fetch papers", err)
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

  const handleUploadPaper = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pFilePath || !newAYID) {
        toast.error("File path and academic year are required")
        return
    }

    setUploadingPaper(true)
    try {
        const res = await apiClient("/admin/exams/papers", {
            method: "POST",
            body: JSON.stringify({
                exam_id: pExamID || null,
                subject_id: pSubjectID || null,
                set_name: pSetName,
                file_path: pFilePath,
                is_encrypted: pIsEncrypted,
                unlock_at: pUnlockAt ? new Date(pUnlockAt).toISOString() : null,
                is_previous_year: pIsPrevious,
                academic_year_id: newAYID,
            })
        })
        if (!res.ok) throw new Error("Failed to upload paper")
        toast.success("Question paper saved to vault")
        setPFilePath("")
        await fetchPapers()
    } catch (err) {
        toast.error("Failed to save paper")
    } finally {
        setUploadingPaper(false)
    }
  }

  const fetchHallTickets = async (examID: string) => {
    setFetchingTickets(true)
    try {
      const res = await apiClient(`/admin/exams/${examID}/hall-tickets`)
      if (res.ok) {
        const data = await res.json()
        setHallTickets(Array.isArray(data) ? data.map(normalizeHallTicket) : [])
      }
    } catch (err) {
      console.error("Failed to fetch hall tickets", err)
    } finally {
      setFetchingTickets(false)
    }
  }

  const handleGenerateTickets = async () => {
    if (!selectedExamID) return
    setGenerating(true)
    try {
      const res = await apiClient(`/admin/exams/${selectedExamID}/hall-tickets`, {
        method: "POST",
        body: JSON.stringify({
          class_section_id: targetSectionID || undefined,
          roll_prefix: rollPrefix || undefined,
        })
      })
      if (!res.ok) throw new Error("Failed to generate tickets")
      toast.success("Hall tickets generated successfully")
      await fetchHallTickets(selectedExamID)
    } catch (err) {
      toast.error("Failed to generate tickets")
    } finally {
      setGenerating(false)
    }
  }

  const handleDownloadPDF = async (studentID: string) => {
    try {
      const res = await apiClient(`/admin/exams/${selectedExamID}/hall-tickets/${studentID}/pdf`)
      if (!res.ok) throw new Error("Failed to download PDF")
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `hall_ticket_${studentID}.pdf`
      a.click()
    } catch (err) {
      toast.error("Failed to download hall ticket")
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

  const handleInitializeGrading = async () => {
    setInitializingGrading(true)
    try {
      const res = await apiClient("/admin/grading/initialize", { method: "POST" })
      if (!res.ok) throw new Error("Failed to initialize grading")
      toast.success("Grading scales initialized based on board type")
    } catch (err) {
      toast.error("Failed to initialize grading")
    } finally {
      setInitializingGrading(false)
    }
  }

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Examination Management</h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Schedule exams, manage sets, and publish results.</p>
        </div>
      </div>

      <Tabs defaultValue="management" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 max-w-3xl">
          <TabsTrigger value="management" className="gap-2">
            <ListChecks className="w-4 h-4" /> Exam Management
          </TabsTrigger>
          <TabsTrigger value="papers" className="gap-2">
            <ShieldCheck className="w-4 h-4" /> Secure Paper Vault
          </TabsTrigger>
          <TabsTrigger value="grading" className="gap-2">
            <History className="w-4 h-4" /> Grading & Aggregates
          </TabsTrigger>
          <TabsTrigger value="hall-tickets" className="gap-2">
            <Printer className="w-4 h-4" /> Hall Tickets
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Schedule New Exam</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Template</Label>
                        <Select value={examPreset} onValueChange={(val) => {
                          setExamPreset(val)
                          if(val !== 'custom') {
                            const yearName = years.find(y => y.id === newAYID)?.name || new Date().getFullYear().toString()
                            setNewName(`${val} - ${yearName}`)
                          }
                        }}>
                          <SelectTrigger><SelectValue placeholder="Preset" /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="custom">Custom</SelectItem>
                            <SelectItem value="Unit Test 1">Unit Test 1</SelectItem>
                            <SelectItem value="Unit Test 2">Unit Test 2</SelectItem>
                            <SelectItem value="Half-Yearly">Half-Yearly</SelectItem>
                            <SelectItem value="Annual Exam">Annual Exam</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Exam Name</Label>
                        <Input 
                          placeholder="e.g. Mid-Term 2025" 
                          value={newName}
                          onChange={(e) => {
                            setNewName(e.target.value)
                            setExamPreset("custom")
                          }}
                          required 
                        />
                      </div>
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

              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Assign Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddSubject} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Select Exam</Label>
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
                        <SubjectSelect 
                          value={subjectID} 
                          onSelect={setSubjectID} 
                          placeholder="Select subject"
                        />
                      </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-xs">Max Marks</Label>
                        <Input type="number" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} placeholder="Max marks" />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-xs">Exam Date</Label>
                        <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} />
                      </div>
                    </div>
                    <Button type="submit" variant="outline" className="w-full" disabled={addingSubject || !selectedExamID || !subjectID}>
                      {addingSubject && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Add Subject
                    </Button>
                  </form>

                  {selectedExamID && examSubjects.length > 0 && (
                    <div className="mt-6 space-y-3 max-h-[300px] overflow-auto pr-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assigned Subjects</p>
                      {examSubjects.map((item) => (
                        <div key={`${item.subject_id}-${item.subject_name}`} className="flex items-center justify-between p-3 rounded-xl bg-muted/40 border border-border/50">
                          <div>
                            <div className="font-bold text-sm text-foreground">{item.subject_name}</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mt-1">
                                {item.exam_date ? new Date(item.exam_date).toLocaleDateString() : "No Date"}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <RubricGeneratorDialog 
                              subjectName={item.subject_name}
                              subjectId={item.subject_id}
                              examName={exams.find(e => e.id === selectedExamID)?.name || ""}
                              examId={selectedExamID}
                              maxMarks={item.max_marks}
                            />
                            <Badge variant="secondary" className="font-mono">{item.max_marks} M</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold tracking-tight">Planned Exams</h2>
                <Badge variant="secondary" className="font-mono">{exams.length} Total</Badge>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {loading ? (
                  <div className="flex items-center justify-center p-12 bg-muted/30 rounded-2xl border border-dashed">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : exams.length === 0 ? (
                  <div className="text-center p-12 bg-muted/30 rounded-2xl border border-dashed">
                    <Calendar className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground font-medium">No exams scheduled yet.</p>
                  </div>
                ) : exams.map(exam => (
                  <Card key={exam.id} className="group hover:border-primary/50 transition-colors border shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className={`w-2 shrink-0 ${exam.status === 'published' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                        <div className="p-5 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1.5">
                            <h3 className="font-bold text-base text-foreground group-hover:text-primary transition-colors tracking-tight">{exam.name}</h3>
                            <div className="flex items-center gap-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {exam.start_date || "TBD"} — {exam.end_date || "TBD"}
                              </div>
                              <span className="text-muted-foreground/30">•</span>
                              <div className="flex items-center gap-1.5 capitalize text-foreground">
                                <div className={`w-1.5 h-1.5 rounded-full ${exam.status === 'published' ? 'bg-emerald-500' : 'bg-orange-500'}`} />
                                {exam.status}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedExamID(exam.id)} className="font-semibold text-xs h-9">Manage Subjects</Button>
                            <Button 
                              variant={exam.status === 'published' ? 'outline' : 'default'}
                              className="font-semibold h-9" 
                              disabled={exam.status === "published" || publishingExamID === exam.id} 
                              onClick={() => handlePublish(exam.id)}
                            >
                              {publishingExamID === exam.id ? (
                                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Publishing...</>
                              ) : exam.status === "published" ? (
                                "Published"
                              ) : (
                                "Publish Results"
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="papers" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="border-none shadow-sm sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="w-5 h-5 text-primary" /> Secure Paper Deposit
                  </CardTitle>
                  <CardDescription>Upload question paper sets with time-based locking.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUploadPaper} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Target Exam (Optional)</Label>
                      <Select value={pExamID} onValueChange={setPExamID}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select exam" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None / Previous Year</SelectItem>
                          {exams.map((exam) => (
                            <SelectItem key={exam.id} value={exam.id}>{exam.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Subject (Optional)</Label>
                      <Select value={pSubjectID} onValueChange={setPSubjectID}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">All Subjects / General</SelectItem>
                          {subjects.map((subject) => (
                            <SelectItem key={subject.id} value={subject.id}>{subject.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Set Name</Label>
                            <Input value={pSetName} onChange={(e) => setPSetName(e.target.value)} placeholder="e.g. Set A" />
                        </div>
                        <div className="space-y-2">
                            <Label>Unlock At</Label>
                            <Input type="datetime-local" value={pUnlockAt} onChange={(e) => setPUnlockAt(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Storage Path / URL</Label>
                      <Input 
                        placeholder="s3://archives/math-set-a.pdf" 
                        value={pFilePath}
                        onChange={(e) => setPFilePath(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-primary/5 border border-primary/20">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-semibold">Encrypted Storage</Label>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">AES-256 enabled</p>
                        </div>
                        <Switch checked={pIsEncrypted} onCheckedChange={setPIsEncrypted} />
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-muted/40 border border-border/50">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-semibold">Previous Year Paper</Label>
                            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Add to visible archive</p>
                        </div>
                        <Switch checked={pIsPrevious} onCheckedChange={setPIsPrevious} />
                    </div>
                    <Button type="submit" className="w-full h-11" disabled={uploadingPaper}>
                      {uploadingPaper && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <ShieldCheck className="w-4 h-4 mr-2" />
                      Deposit to Vault
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold tracking-tight">Paper Repository</h2>
                <Badge variant="outline" className="font-semibold tracking-widest uppercase text-[10px] px-3">Secure Vault Active</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {papers.length === 0 ? (
                  <div className="col-span-2 text-center p-12 bg-muted/30 rounded-2xl border border-dashed border-border/50">
                    <FileText className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-sm text-muted-foreground font-medium">Vault is empty.</p>
                  </div>
                ) : papers.map(paper => (
                  <Card key={paper.id} className="border-none shadow-sm group hover:border-primary/30 transition-colors overflow-hidden bg-muted/10 border">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="secondary" className="text-[10px] font-bold uppercase tracking-wider font-mono bg-primary/10 text-primary hover:bg-primary/20 border-none">{paper.set_name}</Badge>
                            {paper.is_previous_year && <Badge variant="outline" className="text-[10px] uppercase font-semibold">Archive</Badge>}
                          </div>
                          <h3 className="font-bold text-base text-foreground line-clamp-1 group-hover:text-primary transition-colors tracking-tight">{paper.subject_name}</h3>
                          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5" /> {paper.exam_name}
                          </p>
                        </div>
                        <div className="p-2.5 bg-background rounded-full border shadow-sm group-hover:bg-primary/5 group-hover:border-primary/20 transition-colors shrink-0">
                            {paper.is_encrypted ? <Lock className="w-4 h-4 text-primary" /> : <Unlock className="w-4 h-4 text-muted-foreground" />}
                        </div>
                      </div>
                      
                      <div className="mt-5 pt-4 border-t border-border/50 flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-widest mb-0.5">Locked Until</span>
                            <span className="text-xs font-bold text-foreground font-mono">{paper.unlock_at || "Released"}</span>
                        </div>
                        <Button variant="outline" size="sm" className="font-semibold" onClick={() => window.open(paper.file_path)}>
                          View Paper
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="grading" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-primary" /> Report Card Aggregates
                </CardTitle>
                <CardDescription>Run weighted aggregate calculation after all subject marks are entered and exams are published.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 text-sm text-foreground font-medium">
                    This will process all marks entries for the selected academic year based on your defined weightage rules (e.g., Mid-Term: 40%, Finals: 60%).
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
                <Button className="w-full h-11" onClick={handleCalculate} disabled={calculating || !newAYID}>
                  {calculating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Calculate Final Aggregates
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Grading Policy</CardTitle>
                        <CardDescription>Define how percentage maps to grade labels.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Button 
                              variant="outline" 
                              className="w-full h-11 border-dashed"
                              onClick={handleInitializeGrading}
                              disabled={initializingGrading}
                            >
                              {initializingGrading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                              Sync Board-Specific Grading (CBSE/ICSE)
                            </Button>
                            <div className="space-y-2">
                              {/* Example of a policy item, would be a separate component/logic in full version */}
                              {[
                                  { label: 'A+', range: '91-100', color: 'bg-emerald-500' },
                                  { label: 'A', range: '81-90', color: 'bg-emerald-400' },
                                  { label: 'B', range: '71-80', color: 'bg-primary' },
                                  { label: 'C', range: '33-70', color: 'bg-orange-500' },
                                  { label: 'F', range: '0-32', color: 'bg-destructive' },
                              ].map(p => (
                                  <div key={p.label} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl border border-border/50">
                                      <div className="flex items-center gap-3">
                                          <div className={`w-2.5 h-2.5 rounded-full ${p.color}`} />
                                          <span className="font-semibold text-foreground text-sm">{p.label}</span>
                                      </div>
                                      <span className="text-xs font-mono font-medium text-muted-foreground">{p.range}%</span>
                                  </div>
                              ))}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="hall-tickets" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-none shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Generate Hall Tickets</CardTitle>
                  <CardDescription>Assign roll numbers and room locations automatically.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Select Exam</Label>
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
                    <Label>Class (Optional filter)</Label>
                    <ClassSelect value={targetClassID} onSelect={(v) => { setTargetClassID(v); setTargetSectionID(""); }} />
                  </div>
                  <div className="space-y-2">
                    <Label>Section (Optional filter)</Label>
                    <SectionSelect classId={targetClassID} value={targetSectionID} onSelect={setTargetSectionID} />
                  </div>
                  <div className="space-y-2">
                    <Label>Roll Number Prefix</Label>
                    <Input placeholder="e.g. FIN-A" value={rollPrefix} onChange={(e) => setRollPrefix(e.target.value)} />
                  </div>
                  <Button className="w-full h-11 mt-2" onClick={handleGenerateTickets} disabled={generating || !selectedExamID}>
                    {generating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    <Printer className="w-4 h-4 mr-2" />
                    Batch Generate Tickets
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold tracking-tight">Generated Hall Tickets</h2>
                <Badge variant="secondary" className="font-mono">
                  {fetchingTickets ? "Syncing..." : `${hallTickets.length} Issued`}
                </Badge>
              </div>
              <div className="bg-background rounded-xl border overflow-hidden shadow-sm">
                <table className="w-full text-left text-sm border-collapse">
                  <thead>
                    <tr className="bg-muted/50 border-b">
                      <th className="p-4 font-semibold text-muted-foreground w-1/3">Student</th>
                      <th className="p-4 font-semibold text-muted-foreground">Roll Number</th>
                      <th className="p-4 font-semibold text-muted-foreground">Hall/Seat</th>
                      <th className="p-4 font-semibold text-muted-foreground text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hallTickets.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-12 text-center">
                          <Printer className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                          <p className="text-sm text-muted-foreground font-medium">No hall tickets issued yet for this exam.</p>
                        </td>
                      </tr>
                    ) : (
                      hallTickets.map(ticket => (
                        <tr key={ticket.student_id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                          <td className="p-4">
                            <div className="font-semibold text-foreground">{ticket.student_name}</div>
                          </td>
                          <td className="p-4">
                            <Badge variant="outline" className="font-mono text-muted-foreground">{ticket.roll_number}</Badge>
                          </td>
                          <td className="p-4 font-medium text-muted-foreground">
                            {ticket.hall_number} / <span className="text-foreground">{ticket.seat_number}</span>
                          </td>
                          <td className="p-4 text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary" onClick={() => handleDownloadPDF(ticket.student_id)}>
                              <Download className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </TabsContent>
        </Tabs>
    </div>
  )
}

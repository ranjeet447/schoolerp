"use client"

import { useState, useEffect } from "react"
import { 
  Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, 
  Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Tabs, TabsContent, TabsList, TabsTrigger, Switch
} from "@schoolerp/ui"
import { Calendar, Loader2, Plus, ShieldCheck, Lock, Unlock, FileText, History, ListChecks } from "lucide-react"
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

export default function AdminExamsPage() {
  const [exams, setExams] = useState<ExamRow[]>([])
  const [years, setYears] = useState<YearRow[]>([])
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [examSubjects, setExamSubjects] = useState<ExamSubjectRow[]>([])
  const [papers, setPapers] = useState<PaperRow[]>([])
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

  // Paper Form
  const [uploadingPaper, setUploadingPaper] = useState(false)
  const [pExamID, setPExamID] = useState("")
  const [pSubjectID, setPSubjectID] = useState("")
  const [pSetName, setPSetName] = useState("Set A")
  const [pFilePath, setPFilePath] = useState("")
  const [pIsEncrypted, setPIsEncrypted] = useState(true)
  const [pUnlockAt, setPUnlockAt] = useState("")
  const [pIsPrevious, setPIsPrevious] = useState(false)

  useEffect(() => {
    fetchInitialData()
    fetchPapers()
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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Examination Management</h1>
          <p className="text-muted-foreground font-medium">Schedule exams, manage sets, and publish results.</p>
        </div>
      </div>

      <Tabs defaultValue="management" className="space-y-6">
        <TabsList className="bg-muted/50 p-1">
          <TabsTrigger value="management" className="gap-2">
            <ListChecks className="w-4 h-4" /> Exam Management
          </TabsTrigger>
          <TabsTrigger value="papers" className="gap-2">
            <ShieldCheck className="w-4 h-4" /> Secure Paper Vault
          </TabsTrigger>
          <TabsTrigger value="grading" className="gap-2">
            <History className="w-4 h-4" /> Grading & Aggregates
          </TabsTrigger>
        </TabsList>

        <TabsContent value="management" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Schedule New Exam</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleCreate} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Exam Name</Label>
                      <Input 
                        placeholder="e.g. Mid-Term 2025" 
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        className="bg-white"
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Academic Year</Label>
                      <Select value={newAYID} onValueChange={setNewAYID}>
                        <SelectTrigger className="bg-white">
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
                        <Input type="date" value={newStartDate} onChange={(e) => setNewStartDate(e.target.value)} className="bg-white" />
                      </div>
                      <div className="space-y-2">
                        <Label>End Date</Label>
                        <Input type="date" value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)} className="bg-white" />
                      </div>
                    </div>
                    <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700" disabled={creating || loading}>
                      {creating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <Plus className="w-4 h-4 mr-2" />
                      Create Exam
                    </Button>
                  </form>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-lg">Assign Subjects</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddSubject} className="space-y-3">
                    <div className="space-y-2">
                      <Label>Select Exam</Label>
                      <Select value={selectedExamID} onValueChange={setSelectedExamID}>
                        <SelectTrigger className="bg-white">
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
                        <SelectTrigger className="bg-white">
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
                      <div className="space-y-1">
                        <Label className="text-xs">Max Marks</Label>
                        <Input type="number" value={maxMarks} onChange={(e) => setMaxMarks(e.target.value)} placeholder="Max marks" className="bg-white" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Exam Date</Label>
                        <Input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="bg-white" />
                      </div>
                    </div>
                    <Button type="submit" variant="outline" className="w-full" disabled={addingSubject || !selectedExamID || !subjectID}>
                      {addingSubject && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Add Subject
                    </Button>
                  </form>

                  {selectedExamID && examSubjects.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-[300px] overflow-auto pr-2">
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Assigned Subjects</p>
                      {examSubjects.map((item) => (
                        <div key={`${item.subject_id}-${item.subject_name}`} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                          <div>
                            <div className="font-bold text-sm">{item.subject_name}</div>
                            <div className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter">
                                {item.exam_date ? new Date(item.exam_date).toLocaleDateString() : "No Date"}
                            </div>
                          </div>
                          <Badge variant="outline" className="bg-white">{item.max_marks} M</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-xl font-bold bg-gradient-to-r from-slate-900 to-slate-500 bg-clip-text text-transparent">Planned Exams</h2>
                <Badge variant="secondary">{exams.length} Total</Badge>
              </div>
              <div className="grid grid-cols-1 gap-4">
                {loading ? (
                  <div className="flex items-center justify-center p-12 bg-white/50 rounded-2xl border border-dashed">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : exams.length === 0 ? (
                  <div className="text-center p-12 bg-white/50 rounded-2xl border border-dashed">
                    <Calendar className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400 font-medium">No exams scheduled yet.</p>
                  </div>
                ) : exams.map(exam => (
                  <Card key={exam.id} className="group hover:ring-2 hover:ring-indigo-100 transition-all border-none shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                      <div className="flex">
                        <div className={`w-2 ${exam.status === 'published' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                        <div className="p-5 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="font-black text-xl text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{exam.name}</h3>
                            <div className="flex items-center gap-4 text-xs font-bold text-slate-400 uppercase tracking-widest">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5" />
                                {exam.start_date || "TBD"} — {exam.end_date || "TBD"}
                              </div>
                              <span className="text-slate-200">•</span>
                              <div className="flex items-center gap-1.5 capitalize">
                                <div className={`w-1.5 h-1.5 rounded-full ${exam.status === 'published' ? 'bg-emerald-500' : 'bg-amber-400'}`} />
                                {exam.status}
                              </div>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setSelectedExamID(exam.id)} className="font-bold text-xs uppercase tracking-wider">Manage Subjects</Button>
                            <Button className={`${exam.status === 'published' ? 'bg-emerald-50/50 text-emerald-600 hover:bg-emerald-100' : 'bg-indigo-600 text-white hover:bg-indigo-700'} font-bold transition-all px-6`} disabled={exam.status === "published" || publishingExamID === exam.id} onClick={() => handlePublish(exam.id)}>
                              {publishingExamID === exam.id ? "Publishing..." : exam.status === "published" ? "Published" : "Publish Results"}
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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
              <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm sticky top-6">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Lock className="w-5 h-5 text-indigo-500" /> Secure Paper Deposit
                  </CardTitle>
                  <CardDescription>Upload question paper sets with time-based locking.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUploadPaper} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Target Exam (Optional)</Label>
                      <Select value={pExamID} onValueChange={setPExamID}>
                        <SelectTrigger className="bg-white">
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
                        <SelectTrigger className="bg-white">
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
                            <Input value={pSetName} onChange={(e) => setPSetName(e.target.value)} placeholder="e.g. Set A" className="bg-white" />
                        </div>
                        <div className="space-y-2">
                            <Label>Unlock At</Label>
                            <Input type="datetime-local" value={pUnlockAt} onChange={(e) => setPUnlockAt(e.target.value)} className="bg-white" />
                        </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Storage Path / URL</Label>
                      <Input 
                        placeholder="s3://archives/math-set-a.pdf" 
                        value={pFilePath}
                        onChange={(e) => setPFilePath(e.target.value)}
                        className="bg-white"
                        required 
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-indigo-50/50 border border-indigo-100">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-bold">Encrypted Storage</Label>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">AES-256 enabled</p>
                        </div>
                        <Switch checked={pIsEncrypted} onCheckedChange={setPIsEncrypted} />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                        <div className="space-y-0.5">
                            <Label className="text-sm font-bold">Previous Year Paper</Label>
                            <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Add to visible archive</p>
                        </div>
                        <Switch checked={pIsPrevious} onCheckedChange={setPIsPrevious} />
                    </div>
                    <Button type="submit" className="w-full bg-slate-900 hover:bg-black font-bold h-12 rounded-xl mt-4" disabled={uploadingPaper}>
                      {uploadingPaper && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      <ShieldCheck className="w-5 h-5 mr-2" />
                      Deposit to Vault
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold">Paper Repository</h2>
                <Badge variant="outline" className="font-bold tracking-widest uppercase text-[10px] px-3">Secure Vault Active</Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {papers.length === 0 ? (
                  <div className="col-span-2 text-center p-12 bg-white/50 rounded-2xl border border-dashed border-slate-200">
                    <FileText className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400 font-medium italic">Vault is empty.</p>
                  </div>
                ) : papers.map(paper => (
                  <Card key={paper.id} className="border-none shadow-sm group hover:ring-2 hover:ring-indigo-100 transition-all overflow-hidden bg-white/80">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase text-indigo-500 tracking-wider font-mono">{paper.set_name}</span>
                            {paper.is_previous_year && <Badge className="text-[8px] h-4 bg-amber-500 text-white border-none uppercase">Archive</Badge>}
                          </div>
                          <h3 className="font-bold text-lg text-slate-900 line-clamp-1 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{paper.subject_name}</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" /> {paper.exam_name}
                          </p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-xl group-hover:bg-indigo-50 transition-colors">
                            {paper.is_encrypted ? <Lock className="w-5 h-5 text-indigo-400" /> : <Unlock className="w-5 h-5 text-slate-300" />}
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex flex-col">
                            <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">Locked Until</span>
                            <span className="text-xs font-bold text-slate-600 font-mono italic">{paper.unlock_at || "Released"}</span>
                        </div>
                        <Button variant="outline" size="sm" className="h-8 text-xs font-black uppercase tracking-widest px-4 hover:bg-slate-900 hover:text-white transition-all border-slate-200" onClick={() => window.open(paper.file_path)}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-500" /> Report Card Aggregates
                </CardTitle>
                <CardDescription>Run weighted aggregate calculation after all subject marks are entered and exams are published.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 text-sm text-indigo-900 font-medium">
                    This will process all marks entries for the selected academic year based on your defined weightage rules (e.g., Mid-Term: 40%, Finals: 60%).
                </div>
                <div className="space-y-2">
                  <Label>Academic Year</Label>
                  <Select value={newAYID} onValueChange={setNewAYID}>
                    <SelectTrigger className="bg-white">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>
                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year.id} value={year.id}>{year.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 h-14 rounded-2xl font-black text-lg shadow-lg shadow-indigo-100" onClick={handleCalculate} disabled={calculating || !newAYID}>
                  {calculating && <Loader2 className="w-6 h-6 mr-3 animate-spin" />}
                  Calculate Final Aggregates
                </Button>
              </CardContent>
            </Card>

            <div className="space-y-6">
                <Card className="border-none shadow-lg bg-white/50 backdrop-blur-sm">
                    <CardHeader>
                        <CardTitle className="text-lg">Grading Policy</CardTitle>
                        <CardDescription>Define how percentage maps to grade labels.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {/* Example of a policy item, would be a separate component/logic in full version */}
                            {[
                                { label: 'A+', range: '91-100', color: 'bg-emerald-500' },
                                { label: 'A', range: '81-90', color: 'bg-emerald-400' },
                                { label: 'B', range: '71-80', color: 'bg-indigo-400' },
                                { label: 'C', range: '33-70', color: 'bg-amber-400' },
                                { label: 'F', range: '0-32', color: 'bg-red-500' },
                            ].map(p => (
                                <div key={p.label} className="flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${p.color}`} />
                                        <span className="font-bold text-slate-700">{p.label}</span>
                                    </div>
                                    <span className="text-xs font-black text-slate-400 font-mono">{p.range}%</span>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

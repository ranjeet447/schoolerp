"use client"

import { useEffect, useState } from "react"
import { 
  ChevronLeft, 
  Loader2, 
  Plus, 
  FileText, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  Users,
  Search,
  ExternalLink,
  MessageSquare
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Separator,
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { useAuth } from "@/components/auth-provider"
import { toast } from "sonner"

type HomeworkClassSectionOption = {
  id: string
  label: string
}

type HomeworkSubjectOption = {
  id: string
  name: string
}

type Submission = {
  id: string
  student_id: string
  student_name: string
  status: string
  attachment_url: string
  remarks: string
  teacher_feedback: string
  submitted_at: string
}

export default function TeacherHomeworkPage() {
  const { user } = useAuth()
  const [classSectionID, setClassSectionID] = useState("")
  const [subjectID, setSubjectID] = useState("")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [dueDate, setDueDate] = useState("")
  const [homework, setHomework] = useState<any[]>([])
  const [classSections, setClassSections] = useState<HomeworkClassSectionOption[]>([])
  const [subjects, setSubjects] = useState<HomeworkSubjectOption[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [activeTab, setActiveTab] = useState("history")

  // Submission Management
  const [selectedHw, setSelectedHw] = useState<any | null>(null)
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loadingSubmissions, setLoadingSubmissions] = useState(false)
  const [gradingSub, setGradingSub] = useState<Submission | null>(null)
  const [feedback, setFeedback] = useState("")
  const [gradeStatus, setGradeStatus] = useState("checked")

  const fetchOptions = async () => {
    try {
      const url = user?.id ? `/teacher/homework/options?teacher_id=${user.id}` : "/teacher/homework/options"
      const res = await apiClient(url)
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to load homework options")
      }

      const payload = await res.json()
      const sections = Array.isArray(payload?.class_sections) ? payload.class_sections : []
      const subjectRows = Array.isArray(payload?.subjects) ? payload.subjects : []

      setClassSections(sections)
      setSubjects(subjectRows)

      if (sections.length > 0) {
        setClassSectionID((current) => current || String(sections[0].id || ""))
      }
      if (subjectRows.length > 0) {
        setSubjectID((current) => current || String(subjectRows[0].id || ""))
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load homework options")
      setClassSections([])
      setSubjects([])
    }
  }

  const fetchHomework = async (sectionID: string) => {
    if (!sectionID) {
      setHomework([])
      return
    }
    setFetching(true)
    try {
      const res = await apiClient(`/teacher/homework/section/${encodeURIComponent(sectionID)}`)
      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to load homework")
      }
      const payload = await res.json()
      setHomework(Array.isArray(payload) ? payload : payload?.data || [])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to load homework")
      setHomework([])
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    if (user?.id) fetchOptions()
  }, [user?.id])

  useEffect(() => {
    if (classSectionID) fetchHomework(classSectionID)
  }, [classSectionID])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!classSectionID || !subjectID || !title || !dueDate) {
      toast.error("Class section, subject, title and due date are required")
      return
    }

    setLoading(true)
    try {
      const res = await apiClient("/teacher/homework", {
        method: "POST",
        body: JSON.stringify({
          class_section_id: classSectionID,
          subject_id: subjectID,
          title,
          description,
          due_date: `${dueDate}T00:00:00Z`,
          attachments: [],
        }),
      })

      if (!res.ok) {
        const msg = await res.text()
        throw new Error(msg || "Failed to create homework")
      }

      setTitle("")
      setDescription("")
      setDueDate("")
      toast.success("Homework posted")
      await fetchHomework(classSectionID)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to create homework")
    } finally {
      setLoading(false)
    }
  }

  const fetchSubmissions = async (hwID: string) => {
    setLoadingSubmissions(true)
    try {
      const res = await apiClient(`/teacher/homework/${hwID}/submissions`)
      if (res.ok) {
        setSubmissions(await res.json())
      }
    } catch (e) {
      toast.error("Failed to load submissions")
    } finally {
      setLoadingSubmissions(false)
    }
  }

  const handleGrade = async () => {
    if (!gradingSub) return
    try {
      const res = await apiClient(`/teacher/homework/submissions/${gradingSub.id}/grade`, {
        method: "POST",
        body: JSON.stringify({ status: gradeStatus, feedback })
      })
      if (res.ok) {
        toast.success("Submission graded")
        setGradingSub(null)
        setFeedback("")
        fetchSubmissions(selectedHw.id)
      }
    } catch (e) {
      toast.error("Failed to grade submission")
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Homework & Assignments</h1>
          <p className="text-sm text-muted-foreground">Manage tasks, review submissions and provide feedback.</p>
        </div>
        <div className="flex gap-2">
          {classSections.length > 0 && (
            <Select value={classSectionID} onValueChange={setClassSectionID}>
              <SelectTrigger className="w-[200px] h-9">
                <SelectValue placeholder="Display Section" />
              </SelectTrigger>
              <SelectContent>
                {classSections.map((item) => (
                  <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="bg-muted/50 p-1 mb-6">
          <TabsTrigger value="history" className="gap-2"><Clock className="h-4 w-4" /> Recent Work</TabsTrigger>
          <TabsTrigger value="create" className="gap-2"><Plus className="h-4 w-4" /> Post New Task</TabsTrigger>
        </TabsList>

        <TabsContent value="create">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Create Homework</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Class Section</Label>
                      <Select value={classSectionID} onValueChange={setClassSectionID}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select section" />
                        </SelectTrigger>
                        <SelectContent>
                          {classSections.map((item) => (
                            <SelectItem key={item.id} value={item.id}>{item.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs uppercase font-bold text-muted-foreground">Subject</Label>
                      <Select value={subjectID} onValueChange={setSubjectID}>
                        <SelectTrigger className="h-9">
                          <SelectValue placeholder="Select subject" />
                        </SelectTrigger>
                        <SelectContent>
                          {subjects.map((item) => (
                            <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Work Title</Label>
                    <Input placeholder="e.g. Chapter 4 Exercise 1.2" value={title} onChange={(e) => setTitle(e.target.value)} required className="h-9" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Instructions</Label>
                    <Textarea placeholder="Detail out what students need to do..." value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[120px]" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase font-bold text-muted-foreground">Deadline</Label>
                    <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} required className="h-9" />
                  </div>
                  <Button type="submit" className="w-full gap-2" disabled={loading}>
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Plus className="h-4 w-4" /> Publish Homework</>}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          {fetching ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Fetching records...</p>
            </div>
          ) : homework.length === 0 ? (
            <div className="text-center py-20 bg-muted/20 border-2 border-dashed rounded-xl text-muted-foreground">
               <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
               <p className="font-medium">No homework records found</p>
               <p className="text-xs mt-1">Select a section to view its history or post new work.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {homework.map((item) => (
                <Card key={String(item.id)} className="overflow-hidden group hover:border-primary transition-all">
                  <CardHeader className="pb-3 border-b bg-muted/10">
                    <div className="flex justify-between items-start">
                       <Badge variant="outline" className="bg-background text-[10px]">{String(item.subject_name || 'Subject')}</Badge>
                       <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                         <Clock className="h-3 w-3" /> Due: {new Date(item.due_date).toLocaleDateString()}
                       </span>
                    </div>
                    <CardTitle className="text-base mt-2 line-clamp-1">{String(item.title)}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-4 space-y-4">
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[32px]">{String(item.description || "No instructions provided.")}</p>
                    
                    <Separator className="opacity-50" />
                    
                    <div className="flex items-center justify-between pt-1">
                       <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Users className="h-3.5 w-3.5" />
                          <span className="font-medium">Recent Submissions</span>
                       </div>
                       <Button 
                         variant="secondary" 
                         size="sm" 
                         className="h-7 text-[10px] px-3 gap-1.5"
                         onClick={() => {
                            setSelectedHw(item)
                            fetchSubmissions(item.id)
                         }}
                       >
                         <Search className="h-3 w-3" /> Review
                       </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Submissions Dialog */}
      <Dialog open={!!selectedHw} onOpenChange={(open) => !open && setSelectedHw(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <div className="flex justify-between items-start gap-4">
              <div>
                <DialogTitle className="text-xl">{selectedHw?.title}</DialogTitle>
                <div className="flex items-center gap-2 mt-1.5">
                   <Badge variant="outline" className="text-[10px]">{selectedHw?.subject_name}</Badge>
                   <span className="text-[10px] text-muted-foreground">Due: {selectedHw && new Date(selectedHw.due_date).toLocaleDateString()}</span>
                </div>
              </div>
              <Badge className="bg-primary/10 text-primary border-primary/20">{submissions.length} Submissions</Badge>
            </div>
            <Separator className="mt-6" />
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 pt-2">
            {loadingSubmissions ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3">
                 <Loader2 className="h-8 w-8 animate-spin text-primary" />
                 <p className="text-xs text-muted-foreground">Loading submissions...</p>
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed rounded-lg bg-muted/5">
                 <Users className="h-10 w-10 mx-auto mb-2 opacity-10" />
                 <p className="text-sm font-medium">No submissions yet</p>
                 <p className="text-[10px] text-muted-foreground">Students haven't uploaded any work for this task.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent border-none">
                    <TableHead className="text-[10px] uppercase font-bold h-10">Student</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold h-10">Status</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold h-10">Submitted On</TableHead>
                    <TableHead className="text-[10px] uppercase font-bold h-10 text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id} className="group">
                      <TableCell className="font-medium text-sm">{sub.student_name}</TableCell>
                      <TableCell>
                        <Badge variant={sub.status === 'checked' ? 'outline' : 'secondary'} className={`text-[10px] ${sub.status === 'checked' ? 'text-green-600 bg-green-50 border-green-100' : ''}`}>
                          {sub.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(sub.submitted_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 text-[10px] gap-1.5 hover:bg-primary/5 hover:text-primary"
                          onClick={() => {
                            setGradingSub(sub)
                            setGradeStatus(sub.status || 'checked')
                            setFeedback(sub.teacher_feedback || "")
                          }}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Grade
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Grading Dialog */}
      <Dialog open={!!gradingSub} onOpenChange={(open) => !open && setGradingSub(null)}>
        <DialogContent className="max-w-md">
           <DialogHeader>
              <DialogTitle>Grade Submission</DialogTitle>
              <p className="text-xs text-muted-foreground mt-1">Reviewing work for <span className="font-bold text-foreground">{gradingSub?.student_name}</span></p>
           </DialogHeader>
           
           <div className="space-y-4 py-4">
              {gradingSub?.attachment_url && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-between">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded bg-blue-600 flex items-center justify-center text-white">
                         <FileText className="h-4 w-4" />
                      </div>
                      <span className="text-xs font-medium text-blue-800">Student Attachment</span>
                   </div>
                   <Button asChild variant="outline" size="sm" className="h-7 text-[10px] bg-white">
                      <a href={gradingSub.attachment_url} target="_blank" rel="noreferrer" className="flex items-center gap-1">
                        View <ExternalLink className="h-3 w-3" />
                      </a>
                   </Button>
                </div>
              )}

              <div className="p-3 bg-muted/30 rounded-lg text-[11px] italic text-muted-foreground border">
                 <span className="font-bold block mb-1 not-italic text-[10px] text-foreground uppercase">Student Remarks:</span>
                 {gradingSub?.remarks || "No remarks provided."}
              </div>

              <Separator />

              <div className="space-y-3">
                 <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Evaluation Status</Label>
                    <Select value={gradeStatus} onValueChange={setGradeStatus}>
                       <SelectTrigger className="h-9">
                          <SelectValue />
                       </SelectTrigger>
                       <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="checked">Checked / Completed</SelectItem>
                          <SelectItem value="resubmit">Needs Resubmission</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-1.5">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">Feedback / Comments</Label>
                    <Textarea 
                      placeholder="Great work! Please focus on..." 
                      value={feedback} 
                      onChange={e => setFeedback(e.target.value)}
                      className="min-h-[100px] text-xs"
                    />
                 </div>
              </div>
           </div>

           <DialogFooter>
              <Button variant="ghost" size="sm" className="text-xs" onClick={() => setGradingSub(null)}>Cancel</Button>
              <Button size="sm" className="text-xs gap-2" onClick={handleGrade}>
                <CheckCircle2 className="h-4 w-4" /> Save Evaluation
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import React, { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import {
  BookOpen,
  MessageSquare,
  ClipboardCheck,
  Plus,
  Calendar,
  Filter,
  Users,
  AlertTriangle,
  Send,
  Loader2,
  CheckCircle2,
  Search,
  Clock
} from "lucide-react"
import { 
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Input,
  Textarea,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch
} from "@schoolerp/ui"
import { format } from "date-fns"

export default function DiaryPage() {
  const [activeTab, setActiveTab] = useState("homework")
  
  // Modals
  const [newPostOpen, setNewPostOpen] = useState(false)
  const [newRemarkOpen, setNewRemarkOpen] = useState(false)
  
  // Data
  const [posts, setPosts] = useState([
    { id: "1", type: "homework", class: "X - A", subject: "Mathematics", content: "Complete Ex 4.2 all problems in notebook.", date: new Date().toISOString(), req_ack: true, ack_count: 24, total_students: 40 },
    { id: "2", type: "classwork", class: "X - A", subject: "Science", content: "Chapter 3 notes discussed and dictated.", date: new Date().toISOString(), req_ack: false, ack_count: 0, total_students: 40 },
  ])
  
  const [remarks, setRemarks] = useState<any[]>([])
  const [loadingRemarks, setLoadingRemarks] = useState(false)

  // Student Search for Remark
  const [studentQuery, setStudentQuery] = useState("")
  const [students, setStudents] = useState<any[]>([])
  const [selectedStudent, setSelectedStudent] = useState<any>(null)

  // Form states
  const [processing, setProcessing] = useState(false)
  const [remarkForm, setRemarkForm] = useState({
    category: "behavior",
    text: "",
    requiresAck: true
  })

  // State specifically for Add Remark Modal student search
  const [modalStudentQuery, setModalStudentQuery] = useState("")
  const [modalStudents, setModalStudents] = useState<any[]>([])
  const [modalSelectedStudent, setModalSelectedStudent] = useState<any>(null)

  // Load initial data (real search)
  useEffect(() => {
    if (studentQuery.length > 1) {
      const timer = setTimeout(async () => {
        try {
          const res = await apiClient(`/admin/students?query=${encodeURIComponent(studentQuery)}&limit=10`)
          if (res.ok) {
            const data = await res.json()
            setStudents(data || [])
          }
        } catch (err) {
          console.error("Failed to fetch students", err)
        }
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setStudents([])
    }
  }, [studentQuery])

  // Search logic for Modal
  useEffect(() => {
    if (modalStudentQuery.length > 1) {
      const timer = setTimeout(async () => {
        try {
          const res = await apiClient(`/admin/students?query=${encodeURIComponent(modalStudentQuery)}&limit=10`)
          if (res.ok) {
            const data = await res.json()
            setModalStudents(data || [])
          }
        } catch (err) {
          console.error("Failed to fetch modal students", err)
        }
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setModalStudents([])
    }
  }, [modalStudentQuery])

  useEffect(() => {
    if (activeTab === 'remarks' && selectedStudent) {
      fetchRemarks(selectedStudent.id)
    }
  }, [activeTab, selectedStudent])

  const fetchRemarks = async (studentId: string) => {
    setLoadingRemarks(true)
    try {
      const res = await apiClient(`/admin/students/${studentId}/remarks`)
      if (res.ok) {
        const data = await res.json()
        setRemarks(data || [])
      }
    } catch (err) {
      toast.error("Failed to fetch remarks")
    } finally {
      setLoadingRemarks(false)
    }
  }

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    setTimeout(() => {
      toast.success("Homework posted successfully")
      setNewPostOpen(false)
      setProcessing(false)
    }, 600)
  }

  const handleAddRemark = async (e: React.FormEvent) => {
    e.preventDefault()
    setProcessing(true)
    try {
      const targetStudent = modalSelectedStudent || selectedStudent
      
      if (!targetStudent) {
         toast.error("Please select a student")
         setProcessing(false)
         return
      }

      const res = await apiClient("/admin/remarks", {
        method: "POST",
        body: JSON.stringify({
          student_id: targetStudent.id,
          category: remarkForm.category,
          remark_text: remarkForm.text,
          requires_ack: remarkForm.requiresAck
        })
      })

      if (res.ok) {
        toast.success("Remark added and parent notified")
        setNewRemarkOpen(false)
        setRemarkForm({ category: "behavior", text: "", requiresAck: true })
        setModalSelectedStudent(null)
        setModalStudentQuery("")
        if (selectedStudent && selectedStudent.id === targetStudent.id) {
           fetchRemarks(selectedStudent.id)
        }
      } else {
        toast.error("Failed to add remark")
      }
    } catch (err) {
      toast.error("An error occurred")
    } finally {
      setProcessing(false)
    }
  }


  return (
    <div className="space-y-6 pb-10 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Teacher Diary</h1>
          <p className="text-muted-foreground font-medium text-sm mt-1">Manage classwork, homework, and student remarks.</p>
        </div>
        <div className="flex gap-2">
           <Button onClick={() => activeTab === 'homework' ? setNewPostOpen(true) : setNewRemarkOpen(true)}>
             <Plus className="h-4 w-4 mr-2" />
             {activeTab === 'homework' ? 'Post Homework' : 'Add Remark'}
           </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted p-1 rounded-2xl">
          <TabsTrigger value="homework" className="rounded-xl px-6 gap-2"><BookOpen className="h-4 w-4"/> Homework & Classwork</TabsTrigger>
          <TabsTrigger value="remarks" className="rounded-xl px-6 gap-2"><MessageSquare className="h-4 w-4"/> Student Remarks</TabsTrigger>
        </TabsList>

        <TabsContent value="homework" className="space-y-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All My Classes</SelectItem>
                <SelectItem value="xa">Class X - A</SelectItem>
                <SelectItem value="xb">Class X - B</SelectItem>
              </SelectContent>
            </Select>
            <Select defaultValue="all">
              <SelectTrigger className="w-[180px] bg-card">
                <SelectValue placeholder="All Subjects" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                <SelectItem value="math">Mathematics</SelectItem>
                <SelectItem value="sci">Science</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {posts.map(post => (
              <Card key={post.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3 border-b border-border/50">
                   <div className="flex justify-between items-start">
                     <div className="space-y-1">
                        <div className="text-xs font-bold uppercase tracking-wider text-primary bg-primary/10 inline-block px-2 py-0.5 rounded-sm">
                          {post.type}
                        </div>
                        <CardTitle className="text-lg">{post.subject}</CardTitle>
                        <CardDescription>{post.class}</CardDescription>
                     </div>
                     <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        {format(new Date(post.date), "dd MMM")}
                     </span>
                   </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-4">
                  <p className="text-sm font-medium text-foreground">{post.content}</p>
                  
                  {post.req_ack && (
                    <div className="bg-muted/30 p-3 rounded-xl border flex items-center justify-between">
                       <div className="flex items-center text-sm font-medium">
                         <ClipboardCheck className="h-4 w-4 mr-2 text-indigo-500" />
                         Parent Acks
                       </div>
                       <div className="text-sm font-bold">
                         <span className={post.ack_count === post.total_students ? "text-emerald-600" : "text-amber-600"}>
                           {post.ack_count}
                         </span>
                         <span className="text-muted-foreground shrink-0 mx-1">/</span>
                         <span className="text-muted-foreground">{post.total_students}</span>
                       </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="remarks" className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search student for view remarks..." 
              className="pl-9 bg-card rounded-xl"
              value={studentQuery}
              onChange={(e) => setStudentQuery(e.target.value)}
            />
            {students.length > 0 && studentQuery.length > 1 && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-card border rounded-2xl shadow-2xl z-50 overflow-hidden">
                {students.map(s => (
                  <button
                    key={s.id}
                    className="w-full px-4 py-3 text-left hover:bg-muted flex justify-between items-center transition-colors"
                    onClick={() => {
                      setSelectedStudent(s)
                      setStudentQuery("")
                      setStudents([])
                    }}
                  >
                    <div>
                      <div className="font-bold text-foreground">{s.full_name}</div>
                      <div className="text-xs text-muted-foreground uppercase tracking-widest">{s.admission_number} • {s.section_name}</div>
                    </div>
                    <Plus className="h-4 w-4 text-primary" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {selectedStudent && (
             <div className="flex items-center gap-4 bg-primary/5 border border-primary/20 p-4 rounded-3xl animate-in fade-in slide-in-from-top-2">
                <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xl">
                  {selectedStudent.full_name[0]}
                </div>
                <div className="flex-1">
                   <div className="text-sm font-black uppercase tracking-widest text-primary">Active Student</div>
                   <div className="flex items-center gap-2">
                      <h2 className="text-xl font-black">{selectedStudent.full_name}</h2>
                      <span className="text-xs font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{selectedStudent.admission_number}</span>
                   </div>
                </div>
                <Button variant="ghost" size="sm" className="rounded-full text-muted-foreground hover:text-destructive" onClick={() => setSelectedStudent(null)}>
                  Change
                </Button>
             </div>
          )}


          <div className="space-y-4">
            {loadingRemarks ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-4">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="font-medium">Loading student remarks...</p>
              </div>
            ) : !selectedStudent ? (
              <div className="flex flex-col items-center justify-center py-24 bg-muted/20 border-2 border-dashed rounded-[2rem] text-muted-foreground">
                 <Search className="h-12 w-12 mb-4 opacity-20" />
                 <p className="text-xl font-bold italic">Search and select a student to view remarks</p>
              </div>
            ) : remarks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24 bg-muted/20 border-2 border-dashed rounded-[2rem] text-muted-foreground">
                 <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                 <p className="text-xl font-bold italic">No remarks found for {selectedStudent.full_name}</p>
                 <Button variant="outline" className="mt-4 rounded-full" onClick={() => setNewRemarkOpen(true)}>
                   <Plus className="h-4 w-4 mr-2" /> Add First Remark
                 </Button>
              </div>
            ) : (
              remarks.map(remark => (
                <div key={remark.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border rounded-2xl hover:border-primary/30 transition-colors gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${remark.category === 'appreciation' ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                      {remark.category === 'appreciation' ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">{selectedStudent.full_name}</h3>
                      <p className="text-sm text-foreground mt-1 font-medium italic">"{remark.remark_text}"</p>
                      <div className="flex items-center gap-3 mt-2 text-xs font-medium text-muted-foreground">
                        <span className="flex items-center"><Calendar className="h-3 w-3 mr-1" /> {format(new Date(remark.created_at), "dd MMM yyyy")}</span>
                        <span className="flex items-center capitalize"><Filter className="h-3 w-3 mr-1" /> {remark.category}</span>
                        <span className="flex items-center"><Users className="h-3 w-3 mr-1" /> By {remark.posted_by_name}</span>
                      </div>
                    </div>
                  </div>
                  
                  {remark.requires_ack && (
                     <div className="sm:text-right flex flex-row sm:flex-col items-center sm:items-end gap-2 bg-muted/30 sm:bg-transparent p-3 sm:p-0 rounded-xl">
                        <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Parent Reply</div>
                        {remark.is_acknowledged ? (
                           <div className="text-sm font-bold text-emerald-600 flex items-center bg-emerald-500/10 px-2.5 py-1 rounded-md">
                             <CheckCircle2 className="h-4 w-4 mr-1.5" /> Seen & Signed
                           </div>
                        ) : (
                           <div className="text-sm font-bold text-amber-600 flex items-center bg-amber-500/10 px-2.5 py-1 rounded-md">
                             <Clock className="h-4 w-4 mr-1.5" /> Pending
                           </div>
                        )}
                     </div>
                  )}
                </div>
              ))
            )}
          </div>

        </TabsContent>
      </Tabs>

      {/* Post Homework Modal */}
      <Dialog open={newPostOpen} onOpenChange={setNewPostOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleCreatePost}>
            <DialogHeader>
              <DialogTitle>Post to Diary</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Class & Section</Label>
                  <Select defaultValue="xa">
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="xa">X - A</SelectItem>
                      <SelectItem value="xb">X - B</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Select defaultValue="math">
                    <SelectTrigger><SelectValue/></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="math">Mathematics</SelectItem>
                      <SelectItem value="sci">Science</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Type</Label>
                <Select defaultValue="hw">
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="hw">Homework</SelectItem>
                    <SelectItem value="cw">Classwork</SelectItem>
                    <SelectItem value="notice">General Notice</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Details</Label>
                <Textarea 
                  placeholder="Type homework or notes here..." 
                  className="h-24 resize-none" 
                  required
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t mt-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold">Require Acknowledgement</Label>
                  <p className="text-xs text-muted-foreground">Parents must sign digitally</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewPostOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={processing}>
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Send className="h-4 w-4 mr-2"/>}
                Post to Students
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Remark Modal */}
      <Dialog open={newRemarkOpen} onOpenChange={setNewRemarkOpen}>
         <DialogContent className="sm:max-w-[500px]">
          <form onSubmit={handleAddRemark}>
            <DialogHeader>
              <DialogTitle>Add Student Remark</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Student Search</Label>
                {modalSelectedStudent ? (
                  <div className="flex items-center justify-between p-3 bg-primary/5 border border-primary/20 rounded-xl">
                    <div>
                      <div className="font-bold">{modalSelectedStudent.full_name}</div>
                      <div className="text-xs text-muted-foreground">{modalSelectedStudent.admission_number} • {modalSelectedStudent.section_name}</div>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => setModalSelectedStudent(null)}>Change</Button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input 
                      placeholder="Type student name or admission number..." 
                      value={modalStudentQuery}
                      onChange={(e) => setModalStudentQuery(e.target.value)}
                      required={!modalSelectedStudent}
                    />
                    {modalStudents.length > 0 && modalStudentQuery.length > 1 && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-card border rounded-xl shadow-xl z-[60] overflow-hidden">
                        {modalStudents.map(s => (
                          <button
                            key={s.id}
                            type="button"
                            className="w-full px-4 py-2 text-left hover:bg-muted flex justify-between items-center border-b last:border-0"
                            onClick={() => {
                              setModalSelectedStudent(s)
                              setModalStudentQuery("")
                              setModalStudents([])
                            }}
                          >
                            <div>
                              <div className="font-medium">{s.full_name}</div>
                              <div className="text-xs text-muted-foreground">{s.admission_number} • {s.section_name}</div>
                            </div>
                            <Plus className="h-3 w-3" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Remark Category</Label>
                <Select 
                  value={remarkForm.category} 
                  onValueChange={(val) => setRemarkForm({...remarkForm, category: val})}
                >
                  <SelectTrigger><SelectValue/></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="behavior">Behavioral Issue</SelectItem>
                    <SelectItem value="academic">Academic Concern</SelectItem>
                    <SelectItem value="appreciation">Appreciation / Award</SelectItem>
                    <SelectItem value="medical">Medical Detail</SelectItem>
                    <SelectItem value="compliance">Disciplinary Action</SelectItem>
                  </SelectContent>
                </Select>

              </div>

              <div className="space-y-2">
                <Label>Remark Description</Label>
                <Textarea 
                  placeholder="Describe the incident or feedback..." 
                  className="h-24 resize-none rounded-xl" 
                  value={remarkForm.text}
                  onChange={(e) => setRemarkForm({...remarkForm, text: e.target.value})}
                  required
                />

              </div>

              <div className="flex items-center justify-between pt-2 border-t mt-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-bold">Notify Parent & Request Signature</Label>
                  <p className="text-xs text-muted-foreground">Will send push notification</p>
                </div>
                <Switch 
                  checked={remarkForm.requiresAck} 
                  onCheckedChange={(val) => setRemarkForm({...remarkForm, requiresAck: val})} 
                />

              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setNewRemarkOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={processing} className="bg-primary">
                {processing ? <Loader2 className="h-4 w-4 animate-spin mr-2"/> : <Send className="h-4 w-4 mr-2"/>}
                Save & Notify
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

"use client"

import { useState, useEffect, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"
import { 
  Users, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Loader2,
  ChevronLeft,
  Search,
  Check,
  Zap,
  UserCheck,
  HandMetal,
  Clock3,
  BookOpen,
  LayoutGrid,
  ClipboardList,
  Printer,
  Send,
  MessageSquare
} from "lucide-react"
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  Switch,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Textarea
} from "@schoolerp/ui"

type ClassSectionOption = {
  id: string
  class_name: string
  name: string
  label: string
}

type StudentEntry = {
  id: string
  name: string
  rollNumber: string
  status: "present" | "absent" | "late" | "half_day" | "on_leave"
  remarks: string
}

type TimetableSlot = {
  id: string
  period_name: string
  start_time: string
  end_time: string
  subject: string
  subject_id: string
  class_section: string
  class_section_id: string
  room: string
  is_substitution: boolean
  sub_remarks: string
}

function AttendanceContent() {
  const searchParams = useSearchParams()
  const initialSectionID = searchParams.get("section_id") || ""
  
  const [classSectionID, setClassSectionID] = useState(initialSectionID)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [students, setStudents] = useState<StudentEntry[]>([])
  const [classSections, setClassSections] = useState<ClassSectionOption[]>([])
  const [schedule, setSchedule] = useState<TimetableSlot[]>([])
  const [selectedPeriod, setSelectedPeriod] = useState<TimetableSlot | null>(null)
  const [mode, setMode] = useState<"daily" | "period">("daily")
  const [loading, setLoading] = useState(false)
  const [loadingSchedule, setLoadingSchedule] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

  // Flash Remark State
  const [isRemarkModalOpen, setIsRemarkModalOpen] = useState(false)
  const [remarkingStudent, setRemarkingStudent] = useState<StudentEntry | null>(null)
  const [flashRemarkForm, setFlashRemarkForm] = useState({
    category: "behavior",
    text: "",
    requiresAck: true
  })

  useEffect(() => {
    fetchClassSections()
    fetchSchedule()
  }, [])

  useEffect(() => {
    if (mode === "daily" && classSectionID) {
      fetchSession()
    } else if (mode === "period" && selectedPeriod) {
      fetchPeriodSession()
    }
  }, [classSectionID, selectedPeriod, date, mode])

  const fetchSchedule = async () => {
    setLoadingSchedule(true)
    try {
      const res = await apiClient(`/teacher/schedule/teacher-daily?date=${date}`)
      if (res.ok) {
        const data = await res.json()
        setSchedule(Array.isArray(data) ? data : [])
      }
    } catch (err) {
      toast.error("Failed to load schedule")
    } finally {
      setLoadingSchedule(false)
    }
  }

  const fetchClassSections = async () => {
    try {
      const res = await apiClient("/teacher/attendance/class-sections")
      if (res.ok) {
        const data = await res.json()
        const rows = Array.isArray(data) ? data : []
        setClassSections(rows)
        if (rows.length > 0 && !classSectionID) {
          setClassSectionID(String(rows[0].id))
        }
      }
    } catch (err) {
      toast.error("Failed to load class sections")
    }
  }

  const fetchSession = async () => {
    setLoading(true)
    try {
      const res = await apiClient(`/teacher/attendance/sessions?class_section_id=${classSectionID}&date=${date}`)
      if (res.ok) {
        const data = await res.json()
        const entries = data.entries.map((e: any) => ({
          id: e.student_id,
          name: e.student_name,
          rollNumber: e.roll_number,
          status: e.status || "present",
          remarks: e.remarks || ""
        }))
        setStudents(entries)
      }
    } catch (err) {
      toast.error("Failed to load students")
    } finally {
      setLoading(false)
    }
  }

  const fetchPeriodSession = async () => {
    if (!selectedPeriod) return
    setLoading(true)
    try {
      const periodNum = schedule.findIndex(s => s.id === selectedPeriod.id) + 1
      const res = await apiClient(`/teacher/period-attendance?class_section_id=${selectedPeriod.class_section_id}&date=${date}&period=${periodNum}`)
      if (res.ok) {
        const data = await res.json()
        if (data) {
           const mapped = data.entries.map((e: any) => ({
             id: e.student_id,
             name: e.student_name || "Student",
             rollNumber: "",
             status: e.status,
             remarks: e.remarks
           }))
           setStudents(mapped)
        } else {
           const sRes = await apiClient(`/teacher/attendance/sessions?class_section_id=${selectedPeriod.class_section_id}&date=${date}`)
           if (sRes.ok) {
             const sData = await sRes.json()
             setStudents(sData.entries.map((e: any) => ({
               id: e.student_id,
               name: e.student_name,
               rollNumber: e.roll_number,
               status: "present",
               remarks: ""
             })))
           }
        }
      }
    } catch (err) {
      toast.error("Failed to load period attendance")
    } finally {
      setLoading(false)
    }
  }

  const toggleStatus = (studentId: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const statuses: StudentEntry["status"][] = ["present", "absent", "late", "half_day"]
        const currentIndex = statuses.indexOf(s.status as any)
        const nextStatus = statuses[(currentIndex + 1) % statuses.length]
        return { ...s, status: nextStatus }
      }
      return s
    }))
  }

  const setStatus = (studentId: string, status: StudentEntry["status"]) => {
    setStudents(prev => prev.map(s => (s.id === studentId ? { ...s, status } : s)))
  }

  const markAll = (status: "present" | "absent") => {
    setStudents(prev => prev.map(s => ({ ...s, status })))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const endpoint = mode === "daily" ? "/teacher/attendance/mark" : "/teacher/period-attendance"
      const payload = mode === "daily" ? {
        class_section_id: classSectionID,
        date,
        entries: students.map(s => ({
          student_id: s.id,
          status: s.status,
          remarks: s.remarks
        }))
      } : {
        class_section_id: selectedPeriod?.class_section_id,
        date,
        period_number: schedule.findIndex(s => s.id === selectedPeriod?.id) + 1,
        subject_id: selectedPeriod?.subject_id || "",
        entries: students.map(s => ({
          student_id: s.id,
          status: s.status,
          remarks: s.remarks
        }))
      }

      const res = await apiClient(endpoint, {
        method: "POST",
        body: JSON.stringify(payload)
      })
      if (res.ok) {
        toast.success("Attendance synced successfully")
        if (mode === "daily") fetchSession()
        else fetchPeriodSession()
      } else {
        const msg = await res.text()
        toast.error(msg || "Failed to mark attendance")
      }
    } catch (err) {
      toast.error("Network error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleSubmitFlashRemark = async () => {
    if (!remarkingStudent || !flashRemarkForm.text.trim()) return
    setSubmitting(true)
    try {
      const res = await apiClient("/teacher/remarks", {
        method: "POST",
        body: JSON.stringify({
          student_id: remarkingStudent.id,
          category: flashRemarkForm.category,
          remark_text: flashRemarkForm.text,
          requires_ack: flashRemarkForm.requiresAck
        })
      })
      if (res.ok) {
        toast.success(`Remark posted for ${remarkingStudent.name}`)
        setFlashRemarkForm({ ...flashRemarkForm, text: "" })
        setIsRemarkModalOpen(false)
      }
    } catch (err) {
      toast.error("Failed to post remark")
    } finally {
      setSubmitting(false)
    }
  }

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.rollNumber.includes(searchQuery)
  )

  const absenteesCount = students.filter(s => s.status === "absent").length

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-8 rounded-[2.5rem] border border-emerald-50 shadow-sm">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => window.history.back()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-0.5 font-black uppercase text-[10px] tracking-widest">Attendance Module</Badge>
          </div>
          <div className="flex items-center gap-4">
            <h1 className="text-4xl font-black text-slate-900 font-outfit">Smart Attendance</h1>
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
               <Button 
                variant={mode === 'daily' ? 'default' : 'ghost'} 
                size="sm" 
                className={`rounded-xl font-bold px-4 ${mode === 'daily' ? 'bg-slate-900' : 'text-slate-500'}`}
                onClick={() => setMode('daily')}
               >
                 Daily
               </Button>
               <Button 
                variant={mode === 'period' ? 'default' : 'ghost'} 
                size="sm" 
                className={`rounded-xl font-bold px-4 ${mode === 'period' ? 'bg-slate-900' : 'text-slate-500'}`}
                onClick={() => setMode('period')}
               >
                 Period
               </Button>
            </div>
          </div>
          <p className="text-slate-500 font-medium mt-1">
            {mode === 'daily' ? 'General register for the entire day.' : 'Subject-specific marking for individual periods.'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end px-4 border-r border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Absentees</p>
             <p className={`text-2xl font-black ${absenteesCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{absenteesCount}</p>
          </div>
          <Button size="lg" className="rounded-2xl bg-slate-900 hover:bg-slate-800 font-black px-8 py-6 h-auto shadow-xl gap-2 transition-all active:scale-95" onClick={handleSubmit} disabled={submitting || students.length === 0}>
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserCheck className="h-5 w-5" />}
            Sync {mode === 'daily' ? 'Register' : 'Period'}
          </Button>
        </div>
      </div>

      {mode === 'period' && (
        <div className="relative">
          <div className="flex items-baseline justify-between mb-4">
            <h3 className="text-lg font-black font-outfit text-slate-800 uppercase tracking-tight flex items-center gap-2">
              <Clock3 className="h-5 w-5 text-emerald-500" /> Today&apos;s Schedule
            </h3>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select a period to start marking</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 mask-fade-right">
            {loadingSchedule ? (
              Array.from({length: 5}).map((_, i) => (
                <div key={i} className="min-w-[200px] h-24 rounded-3xl bg-slate-100 animate-pulse" />
              ))
            ) : schedule.map((slot) => {
              const rotate = (slot.id.charCodeAt(0) % 2) - 1
              const isActive = selectedPeriod?.id === slot.id
              return (
                <button
                  key={slot.id}
                  onClick={() => setSelectedPeriod(slot)}
                  className={`min-w-[240px] p-5 rounded-[2.5rem] text-left transition-all relative overflow-hidden group border-2 ${isActive ? 'bg-slate-900 border-slate-900 scale-105 shadow-xl -translate-y-1' : 'bg-white border-slate-100 hover:border-emerald-200 shadow-sm'}`}
                  style={{ transform: `rotate(${isActive ? 0 : rotate}deg)` }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <Badge className={`px-2 py-0.5 rounded-lg border-none text-[9px] font-black uppercase tracking-wider ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
                      {slot.period_name}
                    </Badge>
                    <span className={`text-[10px] font-bold ${isActive ? 'text-slate-400' : 'text-slate-400'}`}>
                      {slot.start_time} - {slot.end_time}
                    </span>
                  </div>
                  <h4 className={`text-base font-black truncate leading-tight ${isActive ? 'text-white' : 'text-slate-900'}`}>{slot.subject}</h4>
                  <p className={`text-xs font-bold mt-1 ${isActive ? 'text-slate-400' : 'text-slate-500'}`}>{slot.class_section}</p>
                  
                  {isActive && (
                    <div className="absolute -right-4 -bottom-4 opacity-10">
                       <Zap className="h-20 w-20 text-white fill-white" />
                    </div>
                  )}
                </button>
              )
            })}
            {!loadingSchedule && schedule.length === 0 && (
              <div className="w-full py-8 text-center text-slate-400 font-medium bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 grayscale opacity-60">
                You have no scheduled classes for today.
              </div>
            )}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Controls */}
        <div className="space-y-6">
          {mode === 'daily' && (
            <Card className="rounded-[2rem] border-emerald-100 overflow-hidden shadow-sm">
              <CardHeader className="bg-emerald-50/50 p-6 border-b border-emerald-100">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-emerald-800">Parameters</CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Section</label>
                  <Select value={classSectionID} onValueChange={setClassSectionID}>
                    <SelectTrigger className="rounded-xl border-emerald-100 focus:ring-emerald-500">
                      <SelectValue placeholder="Selection..." />
                    </SelectTrigger>
                    <SelectContent>
                      {classSections.map((item) => (
                        <SelectItem key={item.id} value={item.id}>{item.label || `${item.class_name} - ${item.name}`}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Date</label>
                  <div className="relative">
                    <input
                      type="date"
                      className="w-full bg-white border border-emerald-100 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {mode === 'period' && (
             <Card className="rounded-[2rem] border-slate-100 overflow-hidden shadow-sm">
                <CardHeader className="bg-slate-50 p-6 border-b border-slate-100 text-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Marking For</p>
                   <h2 className="text-xl font-black text-slate-900">{selectedPeriod ? selectedPeriod.subject : 'No Period'}</h2>
                   <p className="text-xs font-bold text-slate-500">{selectedPeriod ? selectedPeriod.class_section : '---'}</p>
                </CardHeader>
                <CardContent className="p-6">
                   <div className="space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selected Date</label>
                     <p className="text-sm font-black text-slate-700">{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                   </div>
                </CardContent>
             </Card>
          )}

          <Card className="rounded-[2rem] border-slate-100 shadow-sm overflow-hidden bg-slate-900 text-white">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-black font-outfit flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-400 fill-amber-400" /> Bulk Actions
              </h3>
              <div className="grid grid-cols-1 gap-3">
                <Button className="w-full bg-white/10 hover:bg-white/20 border-none text-white font-bold h-12 rounded-xl justify-start gap-3" onClick={() => markAll('present')}>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" /> All Present
                </Button>
                <Button className="w-full bg-white/10 hover:bg-white/20 border-none text-white font-bold h-12 rounded-xl justify-start gap-3" onClick={() => markAll('absent')}>
                  <XCircle className="h-5 w-5 text-rose-400" /> All Absent
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Student List */}
        <div className="lg:col-span-3 space-y-4">
          <div className="flex items-center gap-4 bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
            <Search className="h-5 w-5 text-slate-300 ml-2" />
            <input 
              placeholder="Search by name or roll number..." 
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-full py-20 flex flex-col items-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
                <p className="text-slate-400 font-medium">Synchronizing roster...</p>
              </div>
            ) : filteredStudents.map((student) => {
              const statusColors: Record<StudentEntry["status"], string> = {
                present: "bg-white border-slate-100",
                absent: "bg-rose-50 border-rose-100",
                late: "bg-amber-50 border-amber-100",
                half_day: "bg-indigo-50 border-indigo-100",
                on_leave: "bg-slate-100 border-slate-200"
              }
              const badgeColors: Record<StudentEntry["status"], string> = {
                present: "bg-emerald-500/10 text-emerald-600",
                absent: "bg-rose-500 text-white",
                late: "bg-amber-500 text-white",
                half_day: "bg-indigo-500 text-white",
                on_leave: "bg-slate-500 text-white"
              }
              
              const isPresent = student.status === "present"
              return (
                <div 
                  key={student.id} 
                  className={`group relative p-4 pl-6 rounded-3xl border touch-none select-none flex items-center justify-between transition-all active:scale-[0.98] ${statusColors[student.status] || 'bg-white'}`}
                  onClick={() => toggleStatus(student.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm transition-colors ${isPresent ? 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500' : 'bg-white/50 text-slate-600'}`}>
                      {student.rollNumber || "00"}
                    </div>
                    <div>
                      <h4 className={`font-black tracking-tight ${isPresent ? 'text-slate-900 underline decoration-slate-200 underline-offset-4' : 'text-slate-800'}`}>{student.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge className={`border-none px-2 py-0 text-[10px] font-black uppercase tracking-wider ${badgeColors[student.status]}`}>
                          {student.status.replace('_', ' ')}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${isPresent ? 'bg-slate-50 text-slate-200 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-white/80 shadow-sm'}`}>
                      {student.status === 'present' && <Check className="h-5 w-5" />}
                      {student.status === 'absent' && <XCircle className="h-5 w-5 text-rose-500" />}
                      {student.status === 'late' && <Clock className="h-5 w-5 text-amber-500" />}
                      {student.status === 'half_day' && <Clock3 className="h-5 w-5 text-indigo-500" />}
                    </div>
                    
                    <div className="hidden sm:flex items-center gap-1">
                       <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-8 w-8 hover:bg-emerald-100" 
                          title="Quick Remark" 
                          onClick={(e) => { 
                            e.stopPropagation(); 
                            setRemarkingStudent(student);
                            setIsRemarkModalOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4 text-emerald-500" />
                        </Button>
                      <Select value={student.status} onValueChange={(val) => setStatus(student.id, val as any)}>
                         <SelectTrigger onClick={(e) => e.stopPropagation()} className="h-8 w-8 p-0 rounded-lg border-none bg-transparent hover:bg-slate-200/50 flex items-center justify-center">
                            <LayoutGrid className="h-3 w-3 text-slate-400" />
                         </SelectTrigger>
                         <SelectContent>
                            <SelectItem value="present">Present</SelectItem>
                            <SelectItem value="absent">Absent</SelectItem>
                            <SelectItem value="late">Late</SelectItem>
                            <SelectItem value="half_day">Half Day</SelectItem>
                            <SelectItem value="on_leave">On Leave</SelectItem>
                         </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          
          {!loading && filteredStudents.length === 0 && (
             <div className="bg-slate-50 rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-200">
                <Users className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                <p className="text-slate-400 font-medium font-outfit">No students matching your search.</p>
             </div>
          )}
        </div>
      </div>

      <Dialog open={isRemarkModalOpen} onOpenChange={setIsRemarkModalOpen}>
        <DialogContent className="max-w-xl rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
           <div className="bg-slate-900 p-8 text-white relative">
              <DialogHeader>
                <DialogTitle className="text-2xl font-black font-outfit uppercase tracking-tight">Flash Remark</DialogTitle>
                <div className="flex items-center gap-2 mt-2">
                   <Badge className="bg-emerald-500 text-slate-900 border-none font-black px-2 py-0.5 text-[10px] tracking-widest uppercase">{remarkingStudent?.name}</Badge>
                   <span className="text-slate-400 text-xs font-medium italic">Post-marking observation</span>
                </div>
              </DialogHeader>
           </div>
           
           <div className="p-8 space-y-6 bg-white">
              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                <div className="grid grid-cols-3 gap-2">
                   {["behavior", "academic", "achievement"].map(cat => (
                     <button
                      key={cat}
                      onClick={() => setFlashRemarkForm({...flashRemarkForm, category: cat})}
                      className={`py-2 px-3 rounded-xl transition-all border-2 text-[10px] font-black uppercase tracking-widest ${flashRemarkForm.category === cat ? 'bg-slate-900 border-slate-900 text-white' : 'bg-slate-50 border-transparent hover:border-slate-200 text-slate-500'}`}
                     >
                        {cat}
                     </button>
                   ))}
                </div>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observational Insight</label>
                <Textarea 
                  placeholder="Quick observation..." 
                  className="min-h-[100px] rounded-2xl border-slate-100 focus:ring-emerald-500 p-4 text-sm font-medium"
                  value={flashRemarkForm.text}
                  onChange={(e) => setFlashRemarkForm({...flashRemarkForm, text: e.target.value})}
                />
              </div>
           </div>

           <DialogFooter className="p-6 bg-slate-50 border-t border-slate-100 flex-row gap-4 items-center justify-between">
              <div className="flex items-center gap-2">
                 <input 
                  type="checkbox" 
                  id="req-ack-flash" 
                  className="h-4 w-4 rounded-lg border-emerald-500 text-emerald-500" 
                  checked={flashRemarkForm.requiresAck}
                  onChange={(e) => setFlashRemarkForm({...flashRemarkForm, requiresAck: e.target.checked})}
                 />
                 <label htmlFor="req-ack-flash" className="text-[10px] font-black text-slate-500 uppercase tracking-widest cursor-pointer">Req. Parent Ack</label>
              </div>
              <Button 
                className="rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black px-8 h-12 shadow-md gap-2"
                disabled={submitting || !flashRemarkForm.text.trim()}
                onClick={handleSubmitFlashRemark}
              >
                 {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                 Post Remark
              </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function TeacherAttendancePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AttendanceContent />
    </Suspense>
  )
}

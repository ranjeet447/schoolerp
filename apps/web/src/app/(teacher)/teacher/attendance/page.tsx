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
  HandMetal
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
  SelectValue
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
  status: "present" | "absent" | "late" | "halfday"
  remarks: string
}

function AttendanceContent() {
  const searchParams = useSearchParams()
  const initialSectionID = searchParams.get("section_id") || ""
  
  const [classSectionID, setClassSectionID] = useState(initialSectionID)
  const [date, setDate] = useState(new Date().toISOString().split("T")[0])
  const [students, setStudents] = useState<StudentEntry[]>([])
  const [classSections, setClassSections] = useState<ClassSectionOption[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")

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
        // Default everyone to 'present' if it's a new session, or use existing status
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

  const toggleStatus = (studentId: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const nextStatus = s.status === "present" ? "absent" : "present"
        return { ...s, status: nextStatus as any }
      }
      return s
    }))
  }

  const markAll = (status: "present" | "absent") => {
    setStudents(prev => prev.map(s => ({ ...s, status })))
  }

  const handleSubmit = async () => {
    setSubmitting(true)
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
        toast.success("Attendance synced successfully")
        fetchSession()
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

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.rollNumber.includes(searchQuery)
  )

  const absenteesCount = students.filter(s => s.status === "absent").length

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-white p-8 rounded-[2.5rem] border border-emerald-50 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full" onClick={() => window.history.back()}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none px-3 py-0.5 font-black uppercase text-[10px] tracking-widest">Marking Module</Badge>
          </div>
          <h1 className="text-4xl font-black text-slate-900 font-outfit">Smart Attendance</h1>
          <p className="text-slate-500 font-medium mt-1">Efficient register management with one-tap marking.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end px-4 border-r border-slate-100">
             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Absentees</p>
             <p className={`text-2xl font-black ${absenteesCount > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>{absenteesCount}</p>
          </div>
          <Button size="lg" className="rounded-2xl bg-slate-900 hover:bg-slate-800 font-black px-8 py-6 h-auto shadow-xl gap-2 transition-all active:scale-95" onClick={handleSubmit} disabled={submitting || students.length === 0}>
            {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <UserCheck className="h-5 w-5" />}
            Sync Register
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Controls */}
        <div className="space-y-6">
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
              const isPresent = student.status === "present"
              return (
                <div 
                  key={student.id} 
                  className={`group relative p-4 pl-6 rounded-3xl border touch-none select-none flex items-center justify-between transition-all active:scale-[0.98] ${isPresent ? 'bg-white border-slate-100' : 'bg-rose-50 border-rose-100'}`}
                  onClick={() => toggleStatus(student.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`h-12 w-12 rounded-2xl flex items-center justify-center font-black text-sm transition-colors ${isPresent ? 'bg-slate-50 text-slate-400 group-hover:bg-emerald-50 group-hover:text-emerald-500' : 'bg-rose-100 text-rose-600'}`}>
                      {student.rollNumber || "00"}
                    </div>
                    <div>
                      <h4 className={`font-black tracking-tight ${isPresent ? 'text-slate-900 underline decoration-slate-200 underline-offset-4' : 'text-rose-900 group-hover:line-through'}`}>{student.name}</h4>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge className={`border-none px-2 py-0 text-[9px] font-black uppercase tracking-wider ${isPresent ? 'bg-emerald-500/10 text-emerald-600' : 'bg-rose-500 text-white'}`}>
                          {student.status === 'present' ? 'Present' : 'Absent'}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <div className={`h-10 w-10 rounded-2xl flex items-center justify-center transition-all ${isPresent ? 'bg-slate-50 text-slate-200 group-hover:bg-emerald-500 group-hover:text-white' : 'bg-rose-500 text-white shadow-lg shadow-rose-200'}`}>
                    {isPresent ? <Check className="h-5 w-5" /> : <HandMetal className="h-5 w-5" />}
                  </div>

                  {/* Desktop Status Select for flexibility */}
                  <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity hidden sm:block">
                     {/* Could add a dropdown here for Late/Half-day if needed */}
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

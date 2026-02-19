"use client"

import { useEffect, useState } from "react"
import { apiClient } from "@/lib/api-client"
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
  Avatar,
  AvatarFallback
} from "@schoolerp/ui"
import { Plus, Trash2, GraduationCap, BookOpen } from "lucide-react"
import { toast } from "sonner"

type Teacher = {
  id: string
  full_name: string
  employee_code: string
  department: string
}

type Subject = {
  id: string
  name: string
  code: string
}

type Specialization = {
  id: string
  teacher_id: string
  subject_id: string
  subject_name: string
}

export default function SpecializationsPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [specs, setSpecs] = useState<Specialization[]>([])
  const [loading, setLoading] = useState(true)

  // Assignment State
  const [selectedTeacher, setSelectedTeacher] = useState("")
  const [selectedSubject, setSelectedSubject] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [tRes, sRes, spRes] = await Promise.all([
      apiClient("/hrms/employees?limit=100"), // Ideally filter by dept=Teaching
      apiClient("/academics/subjects"),
      apiClient("/hrms/staff/specializations")
    ])

    if (tRes.ok) {
      const allEmps: Teacher[] = await tRes.json()
      setTeachers(allEmps.filter(e => e.department === "Teaching"))
    }
    if (sRes.ok) setSubjects(await sRes.json())
    if (spRes.ok) setSpecs(await spRes.json())
    
    setLoading(false)
  }

  const handleAssign = async () => {
    if (!selectedTeacher || !selectedSubject) {
      toast.error("Select both teacher and subject")
      return
    }

    // Check duplicate
    if (specs.some(s => s.teacher_id === selectedTeacher && s.subject_id === selectedSubject)) {
      toast.error("Subject already assigned to this teacher")
      return
    }

    try {
      const res = await apiClient("/hrms/staff/specializations", {
        method: "POST",
        body: JSON.stringify({
          teacher_id: selectedTeacher,
          subject_id: selectedSubject
        })
      })

      if (res.ok) {
        toast.success("Assigned Successfully")
        fetchData() // Refresh list
        setSelectedSubject("")
      } else {
        toast.error("Failed to assign")
      }
    } catch (e) {
      toast.error("Error assigning subject")
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Teacher Specializations</h1>
        <p className="text-slate-400 font-medium">Map subjects to teachers based on their expertise.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Assignment Panel */}
        <Card className="bg-slate-900/50 border-white/5 rounded-3xl h-fit">
          <CardHeader>
            <CardTitle>Assign Subject</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Teacher</label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                    <SelectContent>
                        {teachers.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.full_name} ({t.employee_code})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Subject</label>
                <Select value={selectedSubject} onValueChange={setSelectedSubject}>
                    <SelectTrigger><SelectValue placeholder="Select Subject" /></SelectTrigger>
                    <SelectContent>
                        {subjects.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.name} ({s.code})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button onClick={handleAssign} className="w-full bg-indigo-600 hover:bg-indigo-500 mt-4">
                <Plus className="h-4 w-4 mr-2" /> Assign
            </Button>
          </CardContent>
        </Card>

        {/* List Panel */}
        <Card className="bg-slate-900/50 border-white/5 rounded-3xl md:col-span-2">
            <CardHeader>
                <CardTitle>Current Assignments</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-10 text-slate-500">Loading...</div>
                ) : (
                    <div className="space-y-4">
                        {teachers.map(teacher => {
                            const teacherSpecs = specs.filter(s => s.teacher_id === teacher.id)
                            if (teacherSpecs.length === 0) return null

                            return (
                                <div key={teacher.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-white/10">
                                            <AvatarFallback className="bg-indigo-500/20 text-indigo-300 font-bold">
                                                {teacher.full_name.substring(0,2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <p className="font-bold text-white">{teacher.full_name}</p>
                                            <p className="text-xs text-slate-400">{teacher.employee_code}</p>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2 justify-end max-w-md">
                                        {teacherSpecs.map(spec => (
                                            <Badge key={spec.id} variant="secondary" className="bg-slate-800 text-slate-300 gap-2 pr-1">
                                                {spec.subject_name || "Unknown"}
                                                {/* <Button variant="ghost" size="icon" className="h-4 w-4 p-0 hover:text-red-400 rounded-full"><Trash2 className="h-3 w-3" /></Button> */}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                        {teachers.every(t => !specs.some(s => s.teacher_id === t.id)) && (
                            <div className="text-center py-10 text-slate-500">No specializations assigned yet.</div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  )
}

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
  Avatar,
  AvatarFallback,
  Badge
} from "@schoolerp/ui"
import { Plus, UserCheck, School, Loader2 } from "lucide-react"
import { toast } from "sonner"

type Teacher = {
  id: string
  full_name: string
  employee_code: string
  department: string
}

type ClassSection = {
  id: string
  label: string
}

type Assignment = {
  id: string
  class_section_id: string
  teacher_id: string
  teacher_name: string
  academic_year_id: string
  class_name: string
  section_name: string
}

export default function ClassTeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [sections, setSections] = useState<ClassSection[]>([])
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)

  // Assignment State
  const [selectedSection, setSelectedSection] = useState("")
  const [selectedTeacher, setSelectedTeacher] = useState("")

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    setLoading(true)
    const [tRes, optsRes, aRes] = await Promise.all([
      apiClient("/hrms/employees?limit=100"), 
      apiClient("/academics/homework/options"), // Quick way to get sections
      apiClient("/hrms/staff/class-teachers")
    ])

    if (tRes.ok) {
      const allEmps: Teacher[] = await tRes.json()
      setTeachers(allEmps.filter(e => e.department === "Teaching"))
    }
    if (optsRes.ok) {
        const opts = await optsRes.json()
        setSections(opts.class_sections)
    }
    if (aRes.ok) setAssignments(await aRes.json())
    
    setLoading(false)
  }

  const handleAssign = async () => {
    if (!selectedTeacher || !selectedSection) {
      toast.error("Select both teacher and class section")
      return
    }

    // Check if section already assigned
    const existing = assignments.find(a => a.class_section_id === selectedSection)
    if (existing) {
        if (!confirm(`Class ${existing.class_name} ${existing.section_name} is already assigned to ${existing.teacher_name}. Reassign?`)) {
            return
        }
    }

    try {
      const res = await apiClient("/hrms/staff/class-teachers", {
        method: "POST",
        body: JSON.stringify({
          class_section_id: selectedSection,
          teacher_id: selectedTeacher,
          remarks: "Assigned via Admin UI"
        })
      })

      if (res.ok) {
        toast.success("Class Teacher Assigned")
        fetchData()
        setSelectedSection("")
        setSelectedTeacher("")
      } else {
        const err = await res.text()
        toast.error(err)
      }
    } catch (e) {
      toast.error("Error assigning class teacher")
    }
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-3xl font-black text-white tracking-tight">Class Teacher Assignments</h1>
        <p className="text-slate-400 font-medium">Designate a primary mentor for each class section.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Assignment Panel */}
        <Card className="bg-slate-900/50 border-white/5 rounded-3xl h-fit">
          <CardHeader>
            <CardTitle>Assign Class Teacher</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Class Section</label>
                <Select value={selectedSection} onValueChange={setSelectedSection}>
                    <SelectTrigger><SelectValue placeholder="Select Class" /></SelectTrigger>
                    <SelectContent>
                        {sections.map(s => (
                            <SelectItem key={s.id} value={s.id}>{s.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
             <div className="space-y-2">
                <label className="text-sm font-medium text-slate-400">Teacher</label>
                <Select value={selectedTeacher} onValueChange={setSelectedTeacher}>
                    <SelectTrigger><SelectValue placeholder="Select Teacher" /></SelectTrigger>
                    <SelectContent>
                        {teachers.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.full_name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
            <Button disabled={loading} onClick={handleAssign} className="w-full bg-indigo-600 hover:bg-indigo-500 mt-4">
                {loading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <UserCheck className="h-4 w-4 mr-2" />} Assign
            </Button>
          </CardContent>
        </Card>

        {/* List Panel */}
        <Card className="bg-slate-900/50 border-white/5 rounded-3xl md:col-span-2">
            <CardHeader>
                <CardTitle>Class Allocations</CardTitle>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-10 text-slate-500">Loading...</div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {sections.map(section => {
                            const assignment = assignments.find(a => a.class_section_id === section.id)
                            
                            return (
                                <div key={section.id} className={`p-4 rounded-xl border flex items-center justify-between ${assignment ? 'bg-indigo-500/5 border-indigo-500/20' : 'bg-white/5 border-white/5'}`}>
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-lg ${assignment ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-800 text-slate-500'}`}>
                                            <School className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-white">{section.label}</p>
                                            <p className="text-xs text-slate-400">{assignment ? 'Assigned' : 'Unassigned'}</p>
                                        </div>
                                    </div>

                                    {assignment ? (
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-indigo-300">{assignment.teacher_name}</p>
                                            <p className="text-xs text-indigo-400/60">Class Teacher</p>
                                        </div>
                                    ) : (
                                        <Badge variant="outline" className="text-slate-500 border-slate-500/20 bg-transparent">
                                            Vacant
                                        </Badge>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  )
}

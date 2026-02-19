"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardDescription, CardHeader, CardTitle, 
  Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Badge, Checkbox, Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@schoolerp/ui"
import { Users, Loader2, GraduationCap, ArrowRight, Filter, Search, ShieldAlert } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

type StudentRow = {
  id: string
  full_name: string
  admission_no: string
  class_id: string
  class_name: string
  section_id: string
  section_name: string
  status: string
  aggregate?: number
  is_eligible?: boolean
}

type ClassRow = { id: string; name: string }
type SectionRow = { id: string; name: string; class_id: string }
type YearRow = { id: string; name: string }

export default function PromotionManagerPage() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [sections, setSections] = useState<SectionRow[]>([])
  const [years, setYears] = useState<YearRow[]>([])
  
  const [loading, setLoading] = useState(true)
  const [promoting, setPromoting] = useState(false)
  
  const [sourceAY, setSourceAY] = useState("")
  const [targetAY, setTargetAY] = useState("")
  const [sourceClass, setSourceClass] = useState("")
  const [sourceSection, setSourceSection] = useState("")
  const [targetClass, setTargetClass] = useState("")
  const [targetSection, setTargetSection] = useState("")
  
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchMetadata()
  }, [])

  useEffect(() => {
    if (sourceAY && sourceClass) {
      fetchStudents()
    }
  }, [sourceAY, sourceClass, sourceSection])

  const fetchMetadata = async () => {
    setLoading(true)
    try {
      const [yearsRes, classesRes, sectionsRes] = await Promise.all([
        apiClient("/admin/academic-structure/academic-years"),
        apiClient("/admin/academic-structure/classes"),
        apiClient("/admin/academic-structure/sections"),
      ])
      
      if (yearsRes.ok) setYears(await yearsRes.json())
      if (classesRes.ok) setClasses(await classesRes.json())
      if (sectionsRes.ok) setSections(await sectionsRes.json())
    } catch (err) {
      toast.error("Failed to load school structure")
    } finally {
      setLoading(false)
    }
  }

  const fetchStudents = async () => {
    setLoading(true)
    try {
      // Mocking the aggregate and eligibility for now 
      // In a real scenario, we'd fetch from a service that calculates this
      const res = await apiClient(`/admin/students?class_id=${sourceClass}${sourceSection ? `&section_id=${sourceSection}` : ""}`)
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.data || []
        setStudents(list.map((s: any) => ({
          ...s,
          aggregate: Math.floor(Math.random() * 40) + 60, // Mock
          is_eligible: true // Mock
        })))
      }
    } catch (err) {
      toast.error("Failed to load students")
    } finally {
      setLoading(false)
    }
  }

  const handlePromote = async () => {
    if (selectedStudents.length === 0) {
      toast.error("Select students to promote")
      return
    }
    if (!targetAY || !targetClass || !targetSection) {
      toast.error("Select destination academic year, class, and section")
      return
    }

    setPromoting(true)
    try {
      // Multi-student promotion loop
      const promises = selectedStudents.map(id => 
        apiClient("/admin/promotions/apply", {
          method: "POST",
          body: JSON.stringify({
            student_id: id,
            from_academic_year_id: sourceAY,
            to_academic_year_id: targetAY,
            from_section_id: sourceSection || undefined,
            to_section_id: targetSection,
            status: "promoted",
            remarks: "Batch promotion via Promotion Manager"
          })
        })
      )
      
      await Promise.all(promises)
      toast.success(`${selectedStudents.length} students promoted successfully`)
      setSelectedStudents([])
      fetchStudents()
    } catch (err) {
      toast.error("Failed to complete batch promotion")
    } finally {
      setPromoting(false)
    }
  }

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([])
    } else {
      setSelectedStudents(filteredStudents.map(s => s.id))
    }
  }

  const filteredStudents = students.filter(s => 
    s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    s.admission_no.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900 uppercase italic">Promotion Manager</h1>
          <p className="text-muted-foreground font-medium">Manage student graduation and academic transitions.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                <GraduationCap className="w-6 h-6" />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 border-none shadow-xl bg-white/50 backdrop-blur-md h-fit sticky top-6">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400">Control Panel</CardTitle>
            <CardDescription className="text-xs font-bold">Configure source and destination.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
               <div className="p-3 rounded-2xl bg-slate-900 text-white space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Filter className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Source Context</span>
                  </div>
                  <div className="space-y-3">
                    <Select value={sourceAY} onValueChange={setSourceAY}>
                        <SelectTrigger className="bg-slate-800 border-none h-11 rounded-xl text-xs font-bold">
                            <SelectValue placeholder="Academic Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={sourceClass} onValueChange={setSourceClass}>
                        <SelectTrigger className="bg-slate-800 border-none h-11 rounded-xl text-xs font-bold">
                            <SelectValue placeholder="Current Class" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={sourceSection} onValueChange={setSourceSection}>
                        <SelectTrigger className="bg-slate-800 border-none h-11 rounded-xl text-xs font-bold">
                            <SelectValue placeholder="Section (Opt)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="none">All Sections</SelectItem>
                            {sections.filter(s => s.class_id === sourceClass).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
               </div>

               <div className="flex justify-center">
                    <ArrowRight className="w-6 h-6 text-slate-300 rotate-90 lg:rotate-0" />
               </div>

               <div className="p-3 rounded-2xl bg-indigo-600 text-white space-y-3 shadow-lg shadow-indigo-100">
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="w-3.5 h-3.5 text-indigo-200" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Destination</span>
                  </div>
                  <div className="space-y-3">
                    <Select value={targetAY} onValueChange={setTargetAY}>
                        <SelectTrigger className="bg-indigo-700 border-none h-11 rounded-xl text-xs font-bold">
                            <SelectValue placeholder="Next Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={targetClass} onValueChange={setTargetClass}>
                        <SelectTrigger className="bg-indigo-700 border-none h-11 rounded-xl text-xs font-bold">
                            <SelectValue placeholder="Target Class" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={targetSection} onValueChange={setTargetSection}>
                        <SelectTrigger className="bg-indigo-700 border-none h-11 rounded-xl text-xs font-bold">
                            <SelectValue placeholder="Target Section" />
                        </SelectTrigger>
                        <SelectContent>
                            {sections.filter(s => s.class_id === targetClass).map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
               </div>
            </div>

            <Button className="w-full bg-slate-900 hover:bg-black h-14 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 shadow-xl shadow-slate-100" onClick={handlePromote} disabled={promoting || selectedStudents.length === 0}>
                {promoting ? <Loader2 className="w-5 h-5 animate-spin" /> : <GraduationCap className="w-5 h-5" />}
                Promote {selectedStudents.length || ""} Selected
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <Card className="border-none shadow-sm bg-white overflow-hidden">
            <div className="p-4 border-b border-slate-50 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                        placeholder="Search students..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 border-slate-100 rounded-xl bg-slate-50/50"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-7 text-[10px] font-black uppercase tracking-widest">{filteredStudents.length} Found</Badge>
                </div>
            </div>
            <Table>
                <TableHeader className="bg-slate-50">
                    <TableRow>
                        <TableHead className="w-[50px]">
                            <Checkbox 
                                checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0} 
                                onCheckedChange={toggleSelectAll} 
                            />
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Student</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Admission No</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Current Class/Sec</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest">Eligibility</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-right">Aggregate</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">Loading student roster...</TableCell>
                        </TableRow>
                    ) : filteredStudents.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-32 text-center text-slate-400 italic">No students match current filters.</TableCell>
                        </TableRow>
                    ) : filteredStudents.map(s => (
                        <TableRow key={s.id} className="hover:bg-slate-50/50 transition-colors">
                            <TableCell>
                                <Checkbox 
                                    checked={selectedStudents.includes(s.id)} 
                                    onCheckedChange={(checked) => {
                                        if (checked) setSelectedStudents([...selectedStudents, s.id])
                                        else setSelectedStudents(selectedStudents.filter(id => id !== s.id))
                                    }} 
                                />
                            </TableCell>
                            <TableCell>
                                <div className="font-bold text-slate-900">{s.full_name}</div>
                            </TableCell>
                            <TableCell className="font-mono text-xs font-bold text-slate-500">{s.admission_no}</TableCell>
                            <TableCell>
                                <div className="text-xs font-medium text-slate-600">
                                    {s.class_name} — {s.section_name}
                                </div>
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${s.is_eligible ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${s.is_eligible ? 'text-emerald-600' : 'text-red-600'}`}>
                                        {s.is_eligible ? 'Qualified' : 'Requires Review'}
                                    </span>
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Badge className={`${s.aggregate && s.aggregate >= 75 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} border-none font-black font-mono`}>
                                    {s.aggregate}%
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </Card>

          <Card className="border-none bg-indigo-50 border-indigo-100 p-4">
            <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-indigo-500 mt-0.5" />
                <div className="space-y-1">
                    <h4 className="text-sm font-black text-indigo-900 uppercase tracking-tight">Bulk Promotion Safety Guard</h4>
                    <p className="text-xs text-indigo-700 leading-relaxed font-medium">
                        Promoting students will move their primary academic record to the new year and target class/section. This action is recorded in the <strong>Promotion Audit Vault</strong>. Ensure all dues are cleared and final marks are published before batch transition.
                    </p>
                </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}

"use client"

import { useState, useEffect } from "react"
import { 
  Button, Card, CardContent, CardDescription, CardHeader, CardTitle, 
  Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
  Badge, Checkbox, Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@schoolerp/ui"
import { Loader2, GraduationCap, ArrowRight, Filter, Search, ShieldAlert } from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

type StudentRow = {
  id: string
  full_name: string
  admission_number: string
  class_id: string
  class_name: string
  section_id: string
  section_name: string
  status: string
}

type ClassRow = { id: string; name: string }
type SectionRow = { id: string; name: string; class_id: string }
type YearRow = { id: string; name: string }

export default function PromotionManagerPage() {
  const [students, setStudents] = useState<StudentRow[]>([])
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [sourceSections, setSourceSections] = useState<SectionRow[]>([])
  const [targetSections, setTargetSections] = useState<SectionRow[]>([])
  const [years, setYears] = useState<YearRow[]>([])
  
  const [loading, setLoading] = useState(true)
  const [promoting, setPromoting] = useState(false)
  
  const [sourceAY, setSourceAY] = useState("")
  const [targetAY, setTargetAY] = useState("")
  const [sourceClass, setSourceClass] = useState("")
  const [sourceSection, setSourceSection] = useState("all")
  const [targetClass, setTargetClass] = useState("")
  const [targetSection, setTargetSection] = useState("")
  
  const [selectedStudents, setSelectedStudents] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    fetchMetadata()
  }, [])

  useEffect(() => {
    if (sourceClass) {
      fetchStudents()
    }
  }, [sourceClass, sourceSection])

  useEffect(() => {
    if (sourceClass) {
      void fetchSectionsByClass(sourceClass, "source")
    } else {
      setSourceSections([])
    }
  }, [sourceClass])

  useEffect(() => {
    if (targetClass) {
      void fetchSectionsByClass(targetClass, "target")
    } else {
      setTargetSections([])
    }
  }, [targetClass])

  const fetchMetadata = async () => {
    setLoading(true)
    try {
      const [yearsRes, classesRes] = await Promise.all([
        apiClient("/admin/academic-structure/academic-years"),
        apiClient("/admin/academic-structure/classes"),
      ])
      
      if (yearsRes.ok) {
        const yearRows = await yearsRes.json()
        const list = Array.isArray(yearRows) ? yearRows : []
        setYears(list)
        if (list.length > 0) {
          const firstYear = list[0]
          setSourceAY(firstYear.id)
          setTargetAY(firstYear.id)
        }
      }
      if (classesRes.ok) setClasses(await classesRes.json())
    } catch (err) {
      toast.error("Failed to load school structure")
    } finally {
      setLoading(false)
    }
  }

  const fetchSectionsByClass = async (classId: string, mode: "source" | "target") => {
    try {
      const res = await apiClient(`/admin/academic-structure/classes/${classId}/sections`)
      const rows = res.ok ? await res.json() : []
      const list = Array.isArray(rows) ? rows : []
      if (mode === "source") setSourceSections(list)
      else setTargetSections(list)
    } catch {
      if (mode === "source") setSourceSections([])
      else setTargetSections([])
    }
  }

  const fetchStudents = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/admin/students?limit=500")
      if (res.ok) {
        const data = await res.json()
        const list = Array.isArray(data) ? data : data.data || []
        const normalized = list.map((s: any) => ({
          id: s.id,
          full_name: s.full_name || "",
          admission_number: s.admission_number || s.admission_no || "",
          class_id: s.class_id || "",
          class_name: s.class_name || "",
          section_id: s.section_id || "",
          section_name: s.section_name || "",
          status: s.status?.String || s.status || "unknown",
        })) as StudentRow[]
        const filtered = normalized.filter((s) => {
          if (sourceClass && s.class_id !== sourceClass) return false
          if (sourceSection && sourceSection !== "all" && s.section_id !== sourceSection) return false
          return true
        })
        setStudents(filtered)
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
            from_section_id: sourceSection === "all" ? undefined : sourceSection,
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
    s.admission_number.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground uppercase italic">Promotion Manager</h1>
          <p className="text-muted-foreground font-medium">Manage student graduation and academic transitions.</p>
        </div>
        <div className="flex items-center gap-3">
            <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-sm border border-primary/20">
                <GraduationCap className="w-6 h-6" />
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <Card className="lg:col-span-1 border-border/50 shadow-sm bg-card h-fit sticky top-6">
          <CardHeader>
            <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground">Control Panel</CardTitle>
            <CardDescription className="text-xs font-bold text-muted-foreground">Configure source and destination.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
               <div className="p-3 rounded-2xl bg-muted border border-border/50 text-foreground space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Filter className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Source Context</span>
                  </div>
                  <div className="space-y-3">
                    <Select value={sourceAY} onValueChange={setSourceAY}>
                        <SelectTrigger className="bg-background border-none h-11 rounded-xl text-xs font-bold">
                            <SelectValue placeholder="Academic Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={sourceClass} onValueChange={(v) => { setSourceClass(v); setSourceSection("all") }}>
                        <SelectTrigger className="bg-background border-none h-11 rounded-xl text-xs font-bold">
                            <SelectValue placeholder="Current Class" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={sourceSection} onValueChange={setSourceSection}>
                        <SelectTrigger className="bg-background border-none h-11 rounded-xl text-xs font-bold">
                            <SelectValue placeholder="Section (Opt)" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sections</SelectItem>
                            {sourceSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
               </div>

               <div className="flex justify-center">
                    <ArrowRight className="w-6 h-6 text-muted-foreground rotate-90 lg:rotate-0" />
               </div>

               <div className="p-3 rounded-2xl bg-primary text-primary-foreground space-y-3 shadow-lg shadow-primary/20">
                  <div className="flex items-center gap-2 mb-1">
                    <GraduationCap className="w-3.5 h-3.5 text-primary-foreground/70" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Destination</span>
                  </div>
                  <div className="space-y-3">
                    <Select value={targetAY} onValueChange={setTargetAY}>
                        <SelectTrigger className="bg-background/20 hover:bg-background/30 border-none h-11 rounded-xl text-xs font-bold text-primary-foreground">
                            <SelectValue placeholder="Next Year" />
                        </SelectTrigger>
                        <SelectContent>
                            {years.map(y => <SelectItem key={y.id} value={y.id}>{y.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={targetClass} onValueChange={(v) => { setTargetClass(v); setTargetSection("") }}>
                        <SelectTrigger className="bg-background/20 hover:bg-background/30 border-none h-11 rounded-xl text-xs font-bold text-primary-foreground">
                            <SelectValue placeholder="Target Class" />
                        </SelectTrigger>
                        <SelectContent>
                            {classes.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    <Select value={targetSection} onValueChange={setTargetSection}>
                        <SelectTrigger className="bg-background/20 hover:bg-background/30 border-none h-11 rounded-xl text-xs font-bold text-primary-foreground">
                            <SelectValue placeholder="Target Section" />
                        </SelectTrigger>
                        <SelectContent>
                            {targetSections.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                  </div>
               </div>
            </div>

            <Button className="w-full bg-foreground hover:bg-foreground/90 text-background h-14 rounded-2xl font-black uppercase tracking-widest flex items-center gap-2 shadow-sm" onClick={handlePromote} disabled={promoting || selectedStudents.length === 0}>
                {promoting ? <Loader2 className="w-5 h-5 animate-spin" /> : <GraduationCap className="w-5 h-5" />}
                Promote {selectedStudents.length || ""} Selected
            </Button>
          </CardContent>
        </Card>

        <div className="lg:col-span-3 space-y-4">
          <Card className="border border-border/50 shadow-sm bg-card overflow-hidden">
            <div className="p-4 border-b border-border/50 flex items-center justify-between gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input 
                        placeholder="Search students..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 h-10 border-border/50 rounded-xl bg-background"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="h-7 text-[10px] font-black uppercase tracking-widest">{filteredStudents.length} Found</Badge>
                </div>
            </div>
            <Table>
                <TableHeader className="bg-muted/50">
                    <TableRow className="border-border/50">
                        <TableHead className="w-[50px]">
                            <Checkbox 
                                checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0} 
                                onCheckedChange={toggleSelectAll} 
                            />
                        </TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Student</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Admission No</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Current Class/Sec</TableHead>
                        <TableHead className="text-[10px] font-black uppercase tracking-widest text-right text-muted-foreground">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border/50">
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">Loading student roster...</TableCell>
                        </TableRow>
                    ) : filteredStudents.length === 0 ? (
                        <TableRow>
                            <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">No students match current filters.</TableCell>
                        </TableRow>
                    ) : filteredStudents.map(s => (
                        <TableRow key={s.id} className="hover:bg-muted/30 transition-colors border-none">
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
                                <div className="font-bold text-foreground">{s.full_name}</div>
                            </TableCell>
                            <TableCell className="font-mono text-xs font-bold text-muted-foreground">{s.admission_number}</TableCell>
                            <TableCell>
                                <div className="text-xs font-medium text-muted-foreground">
                                    {s.class_name} — {s.section_name}
                                </div>
                            </TableCell>
                            <TableCell className="text-right">
                                <Badge className={`${s.status === "active" ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'} border-none font-black`}>
                                    {s.status}
                                </Badge>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </Card>

          <Card className="border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-primary mt-0.5" />
                <div className="space-y-1">
                    <h4 className="text-sm font-black text-primary uppercase tracking-tight">Bulk Promotion Safety Guard</h4>
                    <p className="text-xs text-primary/80 leading-relaxed font-medium">
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

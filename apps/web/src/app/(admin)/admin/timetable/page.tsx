"use client"

import { useEffect, useMemo, useState } from "react"
import {
  Badge,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { 
  CalendarDays, 
  Loader2, 
  RefreshCw, 
  Trash2, 
  Clock, 
  Layers, 
  Users as UsersIcon, 
  Plus,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Search,
  UserX,
  UserPlus,
  Check
} from "lucide-react"
import { ClassSelect } from "@/components/ui/class-select"
import { SectionSelect } from "@/components/ui/section-select"
import { TeacherSelect } from "@/components/ui/teacher-select"
import { SubjectSelect } from "@/components/ui/subject-select"
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  Textarea
} from "@schoolerp/ui"
import { toast } from "sonner"

// Types for Relational Scheduling
interface Variant {
  id: string
  name: string
  is_active: boolean
  start_date: string
  end_date: string
}

interface Period {
  id: string
  variant_id: string
  period_name: string
  start_time: string
  end_time: string
  is_break: boolean
  sort_order: number
}

interface TimetableEntry {
  id: string
  variant_id: string
  period_id: string
  day_of_week: number
  section_id: string
  subject_id: string
  teacher_id: string
  room_number: string
  subject_name?: string
  teacher_name?: string
  period_name?: string
  start_time?: string
  end_time?: string
}

interface ClassRow { id: unknown; name: string }
interface SectionRow { id: unknown; name: string }
interface SubjectRow { id: unknown; name: string }
interface UserRow { id: unknown; full_name: string; role_code: string }

const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]

const uuidValue = (value: unknown) => {
  if (typeof value === "string") return value
  if (value && typeof value === "object" && "Bytes" in value) {
    const bytes = (value as { Bytes?: unknown }).Bytes
    if (Array.isArray(bytes)) return bytes.map(b => b.toString(16).padStart(2, '0')).join('')
  }
  return ""
}

export default function TimetablePage() {
  const [activeTab, setActiveTab] = useState("overview")
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState("")

  // Master Data
  const [classes, setClasses] = useState<ClassRow[]>([])
  const [sections, setSections] = useState<SectionRow[]>([])
  const [subjects, setSubjects] = useState<SubjectRow[]>([])
  const [teachers, setTeachers] = useState<UserRow[]>([])

  // Scheduling Data
  const [variants, setVariants] = useState<Variant[]>([])
  const [selectedVariantID, setSelectedVariantID] = useState("")
  const [periods, setPeriods] = useState<Period[]>([])
  const [entries, setEntries] = useState<TimetableEntry[]>([])
  const [selectedClassID, setSelectedClassID] = useState("")
  const [selectedSectionID, setSelectedSectionID] = useState("")

  // Substitution Portal State
  const [absentTeachers, setAbsentTeachers] = useState<any[]>([])
  const [selectedAbsentTeacher, setSelectedAbsentTeacher] = useState<any | null>(null)
  const [teacherLessons, setTeacherLessons] = useState<any[]>([])
  const [selectedLesson, setSelectedLesson] = useState<any | null>(null)
  const [suggestedSubstitutes, setSuggestedSubstitutes] = useState<any[]>([])
  const [loadingSubs, setLoadingSubs] = useState(false)
  const [submittingAbsence, setSubmittingAbsence] = useState(false)
  const [submittingSub, setSubmittingSub] = useState(false)
  const [absenceReason, setAbsenceReason] = useState("")
  const [selectedTeacherForAbsence, setSelectedTeacherForAbsence] = useState("")
  const [searchDate, setSearchDate] = useState(new Date().toISOString().split('T')[0])

  const activeVariant = useMemo(() => variants.find(v => v.id === selectedVariantID), [variants, selectedVariantID])

  const loadMasterData = async () => {
    try {
      const [classesRes, subjectsRes, usersRes] = await Promise.all([
        apiClient("/admin/academic-structure/classes"),
        apiClient("/admin/academic-structure/subjects"),
        apiClient("/admin/roles/users"),
      ])
      
      const classesData = await classesRes.json()
      const subjectsData = await subjectsRes.json()
      const usersData = await usersRes.json()

      setClasses(Array.isArray(classesData) ? classesData : [])
      setSubjects(Array.isArray(subjectsData) ? subjectsData : [])
      setTeachers(Array.isArray(usersData) ? usersData.filter((u: any) => u.role_code === 'teacher') : [])
    } catch (err) {
      console.error("Failed to load master data", err)
    }
  }

  const loadSchedulingData = async () => {
    try {
      const variantsRes = await apiClient("/admin/schedule/variants")
      if (!variantsRes.ok) throw new Error("Failed to load variants")
      const variantsData = await variantsRes.json()
      setVariants(variantsData || [])

      if (variantsData && variantsData.length > 0) {
        const defaultVariant = variantsData.find((v: Variant) => v.is_active) || variantsData[0]
        setSelectedVariantID(defaultVariant.id)
        await loadVariantDetails(defaultVariant.id)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Load error")
    }
  }

  const loadVariantDetails = async (variantID: string) => {
    if (!variantID) return
    try {
      const [periodsRes, entriesRes] = await Promise.all([
        apiClient(`/admin/schedule/periods?variant_id=${variantID}`),
        selectedSectionID 
          ? apiClient(`/admin/schedule/timetable?variant_id=${variantID}&section_id=${selectedSectionID}`)
          : Promise.resolve({ ok: true, json: () => Promise.resolve([]) } as any)
      ])

      if (periodsRes.ok) setPeriods(await periodsRes.json())
      if (entriesRes.ok) setEntries(await entriesRes.json())
    } catch (err) {
      console.error("Failed to load variant details", err)
    }
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      await Promise.all([loadMasterData(), loadSchedulingData()])
      setLoading(false)
    }
    init()
  }, [])

  useEffect(() => {
    if (selectedVariantID) {
      loadVariantDetails(selectedVariantID)
    }
  }, [selectedVariantID, selectedSectionID])

  useEffect(() => {
    if (activeTab === 'substitutions') {
       fetchAbsentTeachers()
    }
  }, [activeTab, searchDate])

  useEffect(() => {
    if (selectedAbsentTeacher) {
      fetchTeacherLessons(selectedAbsentTeacher.id)
    }
  }, [selectedAbsentTeacher, searchDate])

  const fetchAbsentTeachers = async () => {
    try {
      const res = await apiClient(`/admin/schedule/substitutions/absences?date=${searchDate}`)
      if (res.ok) setAbsentTeachers(await res.json())
    } catch (err) {
      toast.error("Failed to load absent teachers")
    }
  }

  const fetchTeacherLessons = async (teacherID: string) => {
    try {
      const res = await apiClient(`/admin/schedule/substitutions/teacher-lessons/${teacherID}?date=${searchDate}`)
      if (res.ok) setTeacherLessons(await res.json())
    } catch (err) {
      toast.error("Failed to load lessons")
    }
  }

  const fetchFreeTeachers = async (periodID: string) => {
    setLoadingSubs(true)
    try {
      const res = await apiClient(`/admin/schedule/substitutions/free-teachers?date=${searchDate}&period_id=${periodID}`)
      if (res.ok) setSuggestedSubstitutes(await res.json())
    } catch (err) {
      toast.error("Failed to load free teachers")
    } finally {
      setLoadingSubs(false)
    }
  }

  const handleMarkAbsent = async () => {
    if (!selectedTeacherForAbsence) return
    setSubmittingAbsence(true)
    try {
      const res = await apiClient("/admin/schedule/substitutions/absences", {
        method: "POST",
        body: JSON.stringify({
          teacher_id: selectedTeacherForAbsence,
          date: searchDate,
          reason: absenceReason
        })
      })
      if (res.ok) {
        toast.success("Absence recorded")
        fetchAbsentTeachers()
        setSelectedTeacherForAbsence("")
        setAbsenceReason("")
      }
    } catch (err) {
      toast.error("Failed to record absence")
    } finally {
      setSubmittingAbsence(false)
    }
  }

  const handleAssignSub = async (subTeacherID: string) => {
    if (!selectedLesson) return
    setSubmittingSub(true)
    try {
      const res = await apiClient("/admin/schedule/substitutions", {
        method: "POST",
        body: JSON.stringify({
          date: searchDate,
          entry_id: selectedLesson.id,
          substitute_teacher_id: subTeacherID,
          remarks: "Automated suggestion"
        })
      })
      if (res.ok) {
        toast.success("Substitution assigned")
        fetchTeacherLessons(selectedAbsentTeacher.id)
        setSelectedLesson(null)
      }
    } catch (err) {
      toast.error("Assignment failed")
    } finally {
      setSubmittingSub(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Initializing Command Center...</p>
      </div>
    )
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Schedule Command Center
          </h1>
          <p className="text-muted-foreground mt-1">
            Dynamic relational scheduling with seasonal variants and substitution logic.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => loadSchedulingData()} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} /> Sync
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="mr-2 h-4 w-4" /> Quick Build
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="flex items-center justify-between border-b pb-4 mb-4">
          <TabsList className="bg-muted/50 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-background">
              <CalendarDays className="mr-2 h-4 w-4" /> Grid Builder
            </TabsTrigger>
            <TabsTrigger value="variants" className="data-[state=active]:bg-background">
              <Layers className="mr-2 h-4 w-4" /> Variants
            </TabsTrigger>
            <TabsTrigger value="periods" className="data-[state=active]:bg-background">
              <Clock className="mr-2 h-4 w-4" /> Time Slots
            </TabsTrigger>
            <TabsTrigger value="substitutions" className="data-[state=active]:bg-background text-red-500 data-[state=active]:text-red-600">
              <UsersIcon className="mr-2 h-4 w-4" /> Daily Subs
            </TabsTrigger>
          </TabsList>

          {activeTab === 'overview' && (
            <div className="flex items-center gap-4">
              <Select value={selectedVariantID} onValueChange={setSelectedVariantID}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="Select Variant" />
                </SelectTrigger>
                <SelectContent>
                  {variants.map(v => (
                    <SelectItem key={v.id} value={v.id}>{v.name} {v.is_active && "(Active)"}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="w-[180px]">
                <ClassSelect 
                  value={selectedClassID} 
                  onSelect={(v) => { setSelectedClassID(v); setSelectedSectionID(""); }} 
                  placeholder="Select Class"
                  className="h-9"
                />
              </div>

              <div className="w-[180px]">
                 <SectionSelect 
                   value={selectedSectionID} 
                   onSelect={setSelectedSectionID} 
                   classId={selectedClassID}
                   disabled={!selectedClassID}
                   placeholder="Select Section"
                   className="h-9"
                 />
              </div>
            </div>
          )}
        </div>

        <TabsContent value="overview" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-3 space-y-6">
              <Card className="border-none shadow-sm bg-muted/30">
                <CardContent className="p-0 overflow-x-auto">
                  <Table>
                    <TableHeader className="bg-background/80 backdrop-blur-sm sticky top-0 z-10">
                      <TableRow>
                        <TableHead className="w-[120px]">Period</TableHead>
                        {WEEKDAYS.map(day => (
                          <TableHead key={day} className="text-center font-bold">{day}</TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {periods.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="h-60 text-center">
                            <div className="flex flex-col items-center justify-center text-muted-foreground">
                              <AlertCircle className="h-10 w-10 mb-2 opacity-20" />
                              <p>No periods defined for this variant.</p>
                              <Button variant="link" onClick={() => setActiveTab('periods')}>Configure Slots first</Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        periods.map(p => (
                          <TableRow key={p.id} className={p.is_break ? "bg-muted/50 transition-colors" : "transition-colors hover:bg-primary/5"}>
                            <TableCell className="font-medium p-4">
                              <div className="flex flex-col">
                                <span className="text-sm">{p.period_name}</span>
                                <span className="text-[10px] text-muted-foreground uppercase">{p.start_time} - {p.end_time}</span>
                                {p.is_break && <Badge variant="outline" className="mt-1 text-[9px] w-fit">BREAK</Badge>}
                              </div>
                            </TableCell>
                            {WEEKDAYS.map((day, idx) => {
                              const entry = entries.find(e => e.period_id === p.id && e.day_of_week === (idx + 1))
                              return (
                                <TableCell key={day} className="p-2 border-l first:border-l-0">
                                  {entry ? (
                                    <div className="group relative rounded-md border bg-background p-3 shadow-sm hover:shadow-md transition-all border-l-4 border-l-primary">
                                      <div className="text-xs font-bold leading-none mb-1">{entry.subject_name}</div>
                                      <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        <UsersIcon className="h-3 w-3" /> {entry.teacher_name}
                                      </div>
                                      <Button 
                                        variant="ghost" 
                                        size="icon" 
                                        className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-50 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    </div>
                                  ) : !p.is_break ? (
                                    <div className="flex items-center justify-center p-4 rounded-md border-2 border-dashed border-muted transition-colors hover:border-primary/50 hover:bg-primary/5 cursor-pointer">
                                      <Plus className="h-4 w-4 text-muted-foreground/50" />
                                    </div>
                                  ) : (
                                    <div className="h-12 w-full" />
                                  )}
                                </TableCell>
                              )
                            })}
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-primary/20 shadow-lg overflow-hidden">
                <CardHeader className="bg-primary/5 pb-4">
                  <CardTitle className="text-sm">Subject Drag-Source</CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-2">
                  <p className="text-[11px] text-muted-foreground mb-3">Drag these into the grid to assign periods.</p>
                  {subjects.slice(0, 10).map(s => (
                    <div key={uuidValue(s.id)} className="flex items-center justify-between p-2 rounded border bg-background hover:border-primary cursor-grab transition-colors active:cursor-grabbing group">
                      <span className="text-xs font-medium">{s.name}</span>
                      <ChevronRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  ))}
                  <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">View all subjects</Button>
                </CardContent>
              </Card>

              <Card className="bg-orange-50/30 border-orange-200">
                <CardContent className="p-4 flex gap-3">
                  <AlertCircle className="h-5 w-5 text-orange-500 shrink-0" />
                  <div>
                    <h4 className="text-xs font-bold text-orange-700">Conflict Detector</h4>
                    <p className="text-[10px] text-orange-600 mt-1">Assignments will be automatically checked for teacher/room collisions.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="variants">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-dashed border-2 flex flex-col items-center justify-center p-10 bg-muted/5">
              <Plus className="h-10 w-10 text-muted-foreground mb-4" />
              <h3 className="font-bold">Create New Variant</h3>
              <p className="text-xs text-muted-foreground text-center mt-2 max-w-[200px]">Define a new set of timings for Summer, Winter or Exams.</p>
              <Button size="sm" className="mt-4">Define Variant</Button>
            </Card>
            {variants.map(v => (
              <Card key={v.id} className={v.is_active ? "border-primary" : ""}>
                <CardHeader className="flex flex-row items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {v.name}
                      {v.is_active && <Badge className="bg-green-500 hover:bg-green-600">Active</Badge>}
                    </CardTitle>
                    <p className="text-[10px] text-muted-foreground mt-1 tracking-tight">ID: {v.id.slice(0, 8)}...</p>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Status</span>
                    <span className={v.is_active ? "text-green-600 font-bold" : "text-muted-foreground"}>{v.is_active ? 'Live' : 'Draft'}</span>
                  </div>
                  <div className="pt-4 flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1 h-8">Edit</Button>
                    <Button variant="ghost" size="sm" className="h-8 text-red-500 hover:text-red-600">Delete</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="periods">
           <Card>
             <CardHeader className="flex flex-row items-center justify-between">
               <div>
                <CardTitle>Time Slot Management</CardTitle>
                <p className="text-sm text-muted-foreground">Configuring for variant: <span className="font-bold text-primary">{activeVariant?.name || 'Loading...'}</span></p>
               </div>
               <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Add Period</Button>
             </CardHeader>
             <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Order</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Start Time</TableHead>
                      <TableHead>End Time</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="text-right">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {periods.map(p => (
                      <TableRow key={p.id}>
                        <TableCell className="font-mono text-xs text-muted-foreground">#{p.sort_order}</TableCell>
                        <TableCell className="font-medium">{p.period_name}</TableCell>
                        <TableCell>{p.start_time}</TableCell>
                        <TableCell>{p.end_time}</TableCell>
                        <TableCell>{p.is_break ? <Badge variant="secondary">Break</Badge> : <Badge variant="outline">Lecture</Badge>}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
             </CardContent>
           </Card>
        </TabsContent>

        <TabsContent value="substitutions">
          <Card className="border-red-100 bg-red-50/10 rounded-[2rem] overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-red-600 font-black font-outfit uppercase tracking-tight">
                <UsersIcon className="h-5 w-5" /> Substitution Portal
              </CardTitle>
              <div className="flex items-center gap-4">
                 <input 
                  type="date" 
                  value={searchDate} 
                  onChange={(e) => setSearchDate(e.target.value)}
                  className="bg-white border-red-100 rounded-xl px-4 py-2 text-sm font-bold focus:ring-2 focus:ring-red-500 focus:outline-none h-10 shadow-sm"
                 />
                 <Dialog>
                   <DialogTrigger asChild>
                      <Button className="bg-red-600 hover:bg-red-700 text-white font-black rounded-xl h-10 gap-2 shadow-lg shadow-red-100">
                        <UserX className="h-4 w-4" /> Log Absence
                      </Button>
                   </DialogTrigger>
                   <DialogContent className="rounded-[2.5rem] p-8">
                      <DialogHeader>
                        <DialogTitle className="text-2xl font-black font-outfit">Identity Absentee</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 pt-4">
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Select Teacher</Label>
                          <TeacherSelect 
                            value={selectedTeacherForAbsence} 
                            onSelect={setSelectedTeacherForAbsence}
                            className="rounded-2xl h-12"
                            placeholder="Select faculty member..."
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Reason (Optional)</Label>
                          <Textarea 
                            placeholder="Sick leave, Personal work, etc." 
                            className="rounded-2xl resize-none h-24"
                            value={absenceReason}
                            onChange={(e) => setAbsenceReason(e.target.value)}
                          />
                        </div>
                        <Button 
                          className="w-full h-14 bg-foreground hover:bg-foreground/90 text-background rounded-2xl font-black text-lg gap-2"
                          onClick={handleMarkAbsent}
                          disabled={submittingAbsence || !selectedTeacherForAbsence}
                        >
                          {submittingAbsence ? <Loader2 className="animate-spin h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                          Confirm Absence
                        </Button>
                      </div>
                   </DialogContent>
                 </Dialog>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Absent Teachers List */}
                  <div className="space-y-4">
                    <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" /> Absent Today
                    </h3>
                    <div className="space-y-3">
                      {absentTeachers.length === 0 ? (
                        <div className="p-12 text-center border-2 border-dashed border-red-100 rounded-[2rem] bg-background/50">
                           <CheckCircle2 className="h-10 w-10 text-emerald-200 mx-auto mb-2" />
                           <p className="text-xs font-bold text-muted-foreground">All faculty present.</p>
                        </div>
                      ) : absentTeachers.map(at => (
                        <div 
                          key={at.id}
                          onClick={() => setSelectedAbsentTeacher(at)}
                          className={`group relative p-4 pl-6 rounded-3xl border touch-none select-none flex items-center justify-between transition-all cursor-pointer ${selectedAbsentTeacher?.id === at.id ? 'bg-primary border-primary text-primary-foreground shadow-sm' : 'bg-card border-border/50 hover:border-border'}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-sm ${selectedAbsentTeacher?.id === at.id ? 'bg-primary-foreground/20' : 'bg-red-50/50 text-red-600'}`}>
                              {at.name.split(' ').map((n: string) => n[0]).join('')}
                            </div>
                            <div>
                              <p className={`text-sm font-black ${selectedAbsentTeacher?.id === at.id ? 'text-primary-foreground' : 'text-foreground'}`}>{at.name}</p>
                              <p className={`text-[10px] font-bold ${selectedAbsentTeacher?.id === at.id ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>{at.reason || 'No reason provided'}</p>
                            </div>
                          </div>
                          {selectedAbsentTeacher?.id === at.id && <ChevronRight className="h-5 w-5 text-primary-foreground" />}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Teacher Lessons requiring sub */}
                  <div className="lg:col-span-2 space-y-6">
                     {selectedAbsentTeacher ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-right-4 duration-500">
                         <div className="space-y-4">
                            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                               <RefreshCw className="h-4 w-4" /> Identify Slots
                            </h3>
                            <div className="space-y-3">
                               {teacherLessons.map(lesson => (
                                 <div 
                                  key={lesson.id}
                                  onClick={() => {
                                    setSelectedLesson(lesson)
                                    fetchFreeTeachers(lesson.period_id)
                                  }}
                                  className={`p-5 rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden group ${selectedLesson?.id === lesson.id ? 'border-primary bg-primary/5 shadow-sm' : 'bg-card border-border/50 hover:border-primary/30'}`}
                                 >
                                    <div className="flex justify-between items-start mb-2">
                                      <Badge variant="outline" className="text-[10px] font-black border-border">{lesson.period_name}</Badge>
                                      <span className="text-[10px] font-bold text-muted-foreground">{lesson.start_time} - {lesson.end_time}</span>
                                    </div>
                                    <h4 className="text-base font-black text-foreground">{lesson.subject}</h4>
                                    <p className="text-xs font-bold text-muted-foreground">{lesson.class_section}</p>
                                    
                                    {lesson.substitute_name && (
                                       <div className="mt-3 pt-3 border-t border-border/50 flex items-center gap-2">
                                          <div className="h-5 w-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                                             <Check className="h-3 w-3" />
                                          </div>
                                          <span className="text-[10px] font-black text-emerald-600 uppercase">Sub: {lesson.substitute_name}</span>
                                       </div>
                                    )}
                                 </div>
                               ))}
                            </div>
                         </div>

                         <div className="space-y-4">
                            <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                               <UserPlus className="h-4 w-4" /> Suggestions
                            </h3>
                            <div className="space-y-3">
                               {!selectedLesson ? (
                                  <div className="p-12 text-center rounded-[2rem] border-2 border-dashed border-border/50 bg-muted/30 grayscale opacity-40">
                                     <UsersIcon className="h-10 w-10 mx-auto mb-2 text-muted-foreground" />
                                     <p className="text-xs font-bold text-muted-foreground">Select a slot to see free faculty.</p>
                                  </div>
                               ) : loadingSubs ? (
                                  <div className="p-12 text-center">
                                     <Loader2 className="h-10 w-10 animate-spin mx-auto text-primary" />
                                  </div>
                               ) : suggestedSubstitutes.length === 0 ? (
                                  <div className="p-8 text-center bg-amber-50 rounded-3xl border border-amber-100">
                                     <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                                     <p className="text-xs font-bold text-amber-800 uppercase tracking-widest">No Free Teachers</p>
                                     <p className="text-[10px] text-amber-600 mt-1">Every faculty member is busy in this period.</p>
                                  </div>
                               ) : suggestedSubstitutes.map(sub => (
                                  <div key={sub.id} className="p-4 rounded-3xl bg-card border border-border/50 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                                     <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-2xl bg-muted flex items-center justify-center font-black group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                                           {sub.name[0]}
                                        </div>
                                        <div>
                                           <p className="text-sm font-black text-foreground">{sub.name}</p>
                                           <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Available</p>
                                        </div>
                                     </div>
                                     <Button 
                                      size="sm" 
                                      className="h-9 rounded-xl font-bold bg-foreground text-background hover:bg-foreground/90"
                                      onClick={() => handleAssignSub(sub.id)}
                                      disabled={submittingSub}
                                     >
                                        Assign
                                     </Button>
                                  </div>
                               ))}
                            </div>
                         </div>
                      </div>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center p-20 grayscale opacity-40">
                         <div className="p-10 rounded-full bg-muted">
                            <UsersIcon className="h-20 w-20 text-muted-foreground" />
                         </div>
                         <h3 className="mt-6 text-xl font-black text-foreground">Portal Standby</h3>
                         <p className="text-muted-foreground font-medium">Select an absent teacher to start the workflow.</p>
                      </div>
                    )}
                  </div>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

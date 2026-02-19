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
  ChevronRight
} from "lucide-react"

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
  const [selectedSectionID, setSelectedSectionID] = useState("")

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

              <Select value={selectedSectionID} onValueChange={setSelectedSectionID}>
                <SelectTrigger className="w-[180px] h-9">
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map(c => (
                    <SelectItem key={uuidValue(c.id)} value={uuidValue(c.id)} disabled>-- {c.name} --</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
                    <span className={v.is_active ? "text-green-600 font-bold" : "text-slate-500"}>{v.is_active ? 'Live' : 'Draft'}</span>
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
          <Card className="border-red-100 bg-red-50/10">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-red-600">
                <UsersIcon className="h-5 w-5" /> Today's Substitution Portal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <Label>1. Identify Absent Teacher</Label>
                    <div className="rounded-lg border bg-background p-4 flex items-center justify-between transition-colors hover:border-red-300 cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">JD</div>
                        <div>
                          <p className="text-sm font-bold">John Doe</p>
                          <p className="text-xs text-muted-foreground">Mathematics Dept.</p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-red-500 border-red-200">On Leave</Badge>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Label>2. Suggested Substitutes</Label>
                    <div className="space-y-2">
                       <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Free Teachers in Period 3 (Current)</p>
                       <div className="rounded-lg border bg-background p-4 flex items-center justify-between border-green-200">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="text-sm font-bold">Jane Smith</p>
                              <p className="text-xs text-muted-foreground">History Dept. (Free Slot)</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" className="h-8">Assign</Button>
                       </div>
                    </div>
                  </div>
               </div>

               <div className="pt-6 border-t">
                  <h4 className="text-sm font-bold mb-4">Pending Substitution Log</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Absent Teacher</TableHead>
                        <TableHead>Period</TableHead>
                        <TableHead>Class/Sec</TableHead>
                        <TableHead>Substitute</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="text-xs">Ranjeet Kumar</TableCell>
                        <TableCell className="text-xs">Period 1</TableCell>
                        <TableCell className="text-xs">10 - B</TableCell>
                        <TableCell className="text-xs font-bold text-green-600">Amit Shah</TableCell>
                        <TableCell><Badge variant="outline">Confirmed</Badge></TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
               </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

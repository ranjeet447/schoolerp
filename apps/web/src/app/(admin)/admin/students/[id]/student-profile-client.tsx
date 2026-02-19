"use client";

import { useEffect, useState } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { 
  ChevronLeft, 
  Loader2, 
  ShieldCheck, 
  HeartPulse, 
  Medal, 
  FileText, 
  Plus, 
  Trash2, 
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Search,
  Filter,
  MoreVertical,
  ChevronRight,
  Info,
  Clock,
  Lock,
  FileDown,
  ShieldAlert
} from "lucide-react"
import { 
  Button, 
  Input, 
  Label, 
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
  StudentProfileCard,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue,
  Textarea
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"
import { StudentPickupCode } from "@/components/safety/student-pickup-code"

// Types
interface BehavioralLog {
  id: string
  type: 'merit' | 'demerit' | 'info'
  category: string
  points: number
  remarks: string
  incident_date: string
  created_by_name?: string
}

interface DisciplineIncident {
  id: string
  category: string
  title: string
  description: string
  action_taken: string
  status: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  incident_date: string
  reporter_name?: string
}

interface HealthRecord {
  blood_group: string
  allergies: string[]
  vaccinations: string[]
  medical_conditions: string
  height_cm: number
  weight_kg: number
}

interface StudentDocument {
  id: string
  document_type: string
  file_name: string
  file_url: string
  status: 'pending' | 'verified' | 'rejected'
}

interface Student360 {
  profile: any
  behavior: BehavioralLog[]
  incidents: DisciplineIncident[]
  health: HealthRecord | null
  documents: StudentDocument[]
  finances: {
    total_due: number
    paid: number
    balance: number
    last_payment_date: string | null
  }
  academics: {
    attendance_percentage: number
    latest_exam_avg: number
    subject_performance: { subject: string; score: number }[]
    attendance_trends: { month: string; percent: number }[]
  }
  guardians: {
    name: string
    phone: string
    email: string
    relationship: string
    is_primary: boolean
  }[]
  pickups: {
    id: string
    pickup_at: string
    name: string
    relationship: string
    notes: string
    auth_name: string
  }[]
  pickup_auths: {
    id: string
    name: string
    relationship: string
    phone: string
    photo_url?: string
    is_active: boolean
  }[]
  reading_logs?: any[]
}

export default function StudentProfileClient({ id }: { id: string }) {
  const [data, setData] = useState<Student360 | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Pickup Dialog State
  const [isLogPickupOpen, setIsLogPickupOpen] = useState(false)
  const [pickupForm, setPickupForm] = useState({
    auth_id: "",
    picked_up_by_name: "",
    relationship: "",
    notes: ""
  })
  const [isLogging, setIsLogging] = useState(false)

  // Admin Notes State
  const [adminNotes, setAdminNotes] = useState<any[]>([])
  const [isNotesLoading, setIsNotesLoading] = useState(false)
  const [newNote, setNewNote] = useState({ content: "" })

  // Reading Logs State
  const [readingLogs, setReadingLogs] = useState<any[]>([])
  const [isReadingLoading, setIsReadingLoading] = useState(false)
  const [isUpdateProgressOpen, setIsUpdateProgressOpen] = useState(false)
  const [allBooks, setAllBooks] = useState<any[]>([])
  const [logForm_reading, setLogForm_reading] = useState({
    book_id: "",
    status: "reading",
    current_page: 0,
    total_pages: 100,
    notes: "",
    rating: 5
  })

  // Form States
  const [logForm, setLogForm] = useState({ type: 'merit', category: 'General', points: 0, remarks: '' })
  const [healthForm, setHealthForm] = useState<HealthRecord>({ 
    blood_group: '', 
    allergies: [], 
    vaccinations: [], 
    medical_conditions: '', 
    height_cm: 0, 
    weight_kg: 0 
  })

  const fetch360Data = async () => {
    try {
      const res = await apiClient(`/admin/students/${id}/360`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
        if (result.health) setHealthForm(result.health)
      } else {
        setError("Failed to load 360 profile")
      }
    } catch (e) {
      setError("Network error")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetch360Data()
  }, [id])

  const submitBehavioralLog = async () => {
    try {
      const res = await apiClient(`/admin/students/${id}/360/behavior`, {
        method: "POST",
        body: JSON.stringify(logForm)
      })
      if (res.ok) {
        setLogForm({ type: 'merit', category: 'General', points: 0, remarks: '' })
        fetch360Data()
      }
    } catch (e) { console.error(e) }
  }

  const updateHealth = async () => {
    try {
      const res = await apiClient(`/admin/students/${id}/360/health`, {
        method: "POST",
        body: JSON.stringify(healthForm)
      })
      if (res.ok) fetch360Data()
    } catch (e) { console.error(e) }
  }

  const logPickup = async () => {
    if (!pickupForm.picked_up_by_name) return
    setIsLogging(true)
    try {
      await apiClient(`/safety/pickups/events`, {
        method: 'POST',
        body: JSON.stringify({
          student_id: id,
          ...pickupForm
        })
      })
      // Refresh data
      const response = await apiClient(`/admin/students/${id}/360`)
      const resData = await response.json()
      setData(resData)
      setIsLogPickupOpen(false)
      setPickupForm({ auth_id: "", picked_up_by_name: "", relationship: "", notes: "" })
    } catch (err) {
      console.error(err)
    } finally {
      setIsLogging(false)
    }
  }

  const handleExportPDF = async () => {
    try {
      const response = await apiClient(`/admin/students/${id}/360/export`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `portfolio_${id}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      console.error("Export failed", err)
    }
  }

  const fetchAdminNotes = async () => {
    setIsNotesLoading(true)
    try {
      const response = await apiClient(`/admin/sis/students/${id}/confidential-notes`)
      const notes = await response.json()
      setAdminNotes(notes)
    } catch (err) {
      console.error("Failed to fetch notes", err)
    } finally {
      setIsNotesLoading(false)
    }
  }

  const saveAdminNote = async () => {
    if (!newNote.content) return
    try {
      await apiClient(`/admin/sis/students/${id}/confidential-notes`, {
        method: 'POST',
        body: JSON.stringify(newNote)
      })
      setNewNote({ content: "" })
      fetchAdminNotes()
    } catch (err) {
      console.error("Failed to save note", err)
    }
  }

  const fetchAllBooks = async () => {
    try {
      const res = await apiClient("/library/books")
      const books = await res.json()
      setAllBooks(books)
    } catch (e) { console.error(e) }
  }

  const saveReadingLog = async () => {
    try {
      await apiClient(`/library/reading-progress`, {
        method: 'POST',
        body: JSON.stringify({
          student_id: id,
          ...logForm_reading
        })
      })
      setIsUpdateProgressOpen(false)
      fetchReadingLogs()
    } catch (e) { console.error(e) }
  }

  const fetchReadingLogs = async () => {
    setIsReadingLoading(true)
    try {
      const response = await apiClient(`/library/reading-progress/${id}`)
      const logs = await response.json()
      setReadingLogs(logs)
    } catch (err) {
      console.error("Failed to fetch reading logs", err)
    } finally {
      setIsReadingLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="text-muted-foreground animate-pulse">Aggregating 360° Profile...</p>
      </div>
    )
  }

  if (!data) return <div>{error || "Student not found"}</div>

  const totalPoints = data.behavior.reduce((acc, log) => acc + (log.type === 'merit' ? log.points : -log.points), 0)

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="icon">
            <Link href="/admin/students">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div className="flex flex-col">
            <h1 className="text-3xl font-bold tracking-tight">Student 360°</h1>
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-bold mt-1">Holistic View & Governance</p>
          </div>
        </div>
        <div className="flex gap-2">
           <Badge variant="outline" className={`px-4 py-1.5 text-sm font-bold ${totalPoints >= 0 ? 'text-green-600 border-green-200 bg-green-50' : 'text-red-600 border-red-200 bg-red-50'}`}>
             <Medal className="mr-2 h-4 w-4" /> Behavioral Rank: {totalPoints} pts
           </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <StudentProfileCard student={data.profile} />
          
          <Card className="bg-primary/5 border-primary/20 shadow-none">
            <CardHeader className="pb-2">
              <CardTitle className="text-xs uppercase font-bold text-primary">Financial Snap</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                 <div className="flex justify-between items-center">
                    <span className="text-xs text-muted-foreground font-medium">Outsdanding</span>
                    <span className="text-sm font-bold text-red-600">₹{data.finances.balance}</span>
                 </div>
                 <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary" 
                      style={{ width: `${(data.finances.paid / data.finances.total_due) * 100}%` }} 
                    />
                 </div>
                 <p className="text-[10px] text-muted-foreground text-center">Paid: ₹{data.finances.paid} of ₹{data.finances.total_due}</p>
                 <Button variant="outline" size="sm" className="w-full text-xs h-8">View Statement</Button>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-3">
            <Tabs defaultValue="insights" className="w-full">
              <TabsList className="flex flex-wrap h-auto bg-slate-50/50 p-1 border border-slate-200">
                <TabsTrigger value="insights" className="gap-2"><TrendingUp className="h-4 w-4" /> Insights</TabsTrigger>
                <TabsTrigger value="overview" className="gap-2"><Search className="h-4 w-4" /> 360° Profile</TabsTrigger>
                <TabsTrigger value="academics" className="gap-2"><Medal className="h-4 w-4" /> Academics</TabsTrigger>
                <TabsTrigger value="health" className="gap-2"><HeartPulse className="h-4 w-4" /> Health</TabsTrigger>
                <TabsTrigger value="documents" className="gap-2"><FileText className="h-4 w-4" /> Vault</TabsTrigger>
                <TabsTrigger value="pickups" className="gap-2"><Clock className="h-4 w-4" /> Pickups</TabsTrigger>
                <TabsTrigger value="reading" onClick={fetchReadingLogs} className="gap-2"><FileText className="h-4 w-4" /> Reading Journal</TabsTrigger>
                <TabsTrigger value="admin-notes" onClick={fetchAdminNotes} className="gap-2 font-bold text-amber-600"><Lock className="h-4 w-4" /> Admin Notes</TabsTrigger>
                <TabsTrigger value="guardians">Relations</TabsTrigger>
              </TabsList>

            <TabsContent value="insights" className="mt-6">
                <div className="flex justify-end mb-4">
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleExportPDF}>
                    <FileDown className="h-4 w-4" /> Export Portfolio PDF
                  </Button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                   <Card className="md:col-span-2">
                      <CardHeader>
                         <CardTitle className="text-sm font-bold">Academic Performance Trend</CardTitle>
                      </CardHeader>
                      <CardContent>
                         <div className="h-[200px] flex items-end gap-2 px-4 pb-8 border-b">
                            {data.academics.attendance_trends.map((t, idx) => (
                               <div key={idx} className="flex-1 flex flex-col items-center gap-2 group cursor-pointer">
                                  <div 
                                    className="w-full bg-primary/20 rounded-t-sm transition-all hover:bg-primary/40 relative" 
                                    style={{ height: `${t.percent}%` }}
                                  >
                                     <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold opacity-0 group-hover:opacity-100">{t.percent}%</div>
                                  </div>
                                  <span className="text-[10px] text-muted-foreground font-medium">{t.month}</span>
                               </div>
                            ))}
                         </div>
                         <div className="grid grid-cols-2 gap-4 mt-6">
                            <div className="p-3 rounded-lg border bg-slate-50/50">
                               <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Total Attendance</p>
                               <p className="text-xl font-black text-primary">{data.academics.attendance_percentage}%</p>
                            </div>
                            <div className="p-3 rounded-lg border bg-slate-50/50">
                               <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Exam Average</p>
                               <p className="text-xl font-black text-blue-600">{data.academics.latest_exam_avg}%</p>
                            </div>
                         </div>
                      </CardContent>
                   </Card>

                   <div className="space-y-6">
                      <Card>
                         <CardHeader>
                            <CardTitle className="text-sm font-bold">Behavioral Summary</CardTitle>
                         </CardHeader>
                         <CardContent>
                            <div className="space-y-4">
                               <div className="flex items-center justify-between">
                                  <span className="text-xs">Merit Points</span>
                                  <span className="text-xs font-bold text-green-600">+{data.behavior.filter(l => l.type === 'merit').reduce((acc, l) => acc + l.points, 0)}</span>
                               </div>
                               <div className="flex items-center justify-between">
                                  <span className="text-xs">Demerit Points</span>
                                  <span className="text-xs font-bold text-red-600">-{data.behavior.filter(l => l.type === 'demerit').reduce((acc, l) => acc + (l.points || 0), 0)}</span>
                               </div>
                               <div className="pt-2 border-t flex items-center justify-between">
                                  <span className="text-xs font-bold">Net Standing</span>
                                  <Badge className={data.behavior.reduce((acc, l) => acc + (l.type === 'merit' ? l.points : -(l.points || 0)), 0) >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}>
                                     {data.behavior.reduce((acc, l) => acc + (l.type === 'merit' ? l.points : -(l.points || 0)), 0)} pts
                                  </Badge>
                               </div>
                            </div>
                         </CardContent>
                      </Card>

                      <Card>
                         <CardHeader>
                            <CardTitle className="text-sm font-bold">Health & Status</CardTitle>
                         </CardHeader>
                         <CardContent>
                            <div className="space-y-2">
                               <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Blood Group</span>
                                  <span className="font-bold">{data.health?.blood_group || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">Financial Status</span>
                                  <Badge variant={data.finances.balance > 0 ? "destructive" : "outline"} className="text-[8px] h-4">
                                    {data.finances.balance > 0 ? "Due" : "Cleared"}
                                  </Badge>
                                </div>
                            </div>
                         </CardContent>
                      </Card>
                   </div>
                </div>
            </TabsContent>

            <TabsContent value="overview" className="mt-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-blue-50/30 border-blue-100">
                    <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-blue-600 font-bold">Attendance</CardTitle></CardHeader>
                    <CardContent>
                       <div className="text-3xl font-bold text-blue-700">{data.academics.attendance_percentage.toFixed(1)}%</div>
                       <p className="text-[10px] text-blue-600/70 mt-1">Current Academic Session</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-purple-50/30 border-purple-100">
                    <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-purple-600 font-bold">Latest Exam</CardTitle></CardHeader>
                    <CardContent>
                       <div className="text-3xl font-bold text-purple-700">{data.academics.latest_exam_avg.toFixed(1)}%</div>
                       <p className="text-[10px] text-purple-600/70 mt-1">Weighted Subject Average</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-orange-50/30 border-orange-100">
                    <CardHeader className="pb-2"><CardTitle className="text-xs uppercase text-orange-600 font-bold">Behavior</CardTitle></CardHeader>
                    <CardContent>
                       <div className="text-3xl font-bold text-orange-700">{totalPoints}</div>
                       <p className="text-[10px] text-orange-600/70 mt-1">Merit / Demerit Balance</p>
                    </CardContent>
                  </Card>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card>
                    <CardHeader><CardTitle className="text-sm">Health Summary</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                      {data.health ? (
                        <>
                          <div className="flex items-center gap-3">
                             <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">{data.health.blood_group || '?'}</div>
                             <div>
                               <p className="text-sm font-bold">Blood Group</p>
                               <p className="text-[10px] text-muted-foreground">Certified Medical Profile</p>
                             </div>
                          </div>
                          <div className="space-y-1">
                             <p className="text-xs font-medium">Critical Allergies:</p>
                             <div className="flex flex-wrap gap-1">
                                {data.health.allergies.length > 0 ? data.health.allergies.map(a => <Badge key={a} variant="secondary" className="text-[9px]">{a}</Badge>) : <span className="text-[10px] text-muted-foreground italic">None reported</span>}
                             </div>
                          </div>
                        </>
                      ) : <p className="text-xs text-muted-foreground italic">No health records on file.</p>}
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader><CardTitle className="text-sm">Quick Contacts</CardTitle></CardHeader>
                    <CardContent className="space-y-4">
                       <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                          <div>
                             <p className="text-xs font-bold">{data.profile.parent_name || 'Primary Guardian'}</p>
                             <p className="text-[10px] text-muted-foreground">{data.profile.parent_phone || 'N/A'}</p>
                          </div>
                          <Button size="sm" variant="ghost" className="h-8 text-[10px]">Call</Button>
                       </div>
                    </CardContent>
                  </Card>
               </div>
            </TabsContent>

            <TabsContent value="academics" className="mt-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Examination Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                       {data.academics.subject_performance.length > 0 ? (
                         <div className="space-y-4">
                           {data.academics.subject_performance.map((s, idx) => (
                             <div key={idx} className="space-y-1.5">
                               <div className="flex justify-between text-[10px] font-bold uppercase text-muted-foreground">
                                 <span>{s.subject}</span>
                                 <span>{s.score.toFixed(0)}%</span>
                               </div>
                               <motion.div 
                                 initial={{ width: 0 }}
                                 animate={{ width: `${s.score}%` }}
                                 transition={{ duration: 1, delay: idx * 0.1 }}
                                 className={`h-1.5 w-full bg-slate-100 rounded-full overflow-hidden ${
                                   s.score >= 80 ? 'bg-green-500' : 
                                   s.score >= 60 ? 'bg-primary' : 
                                   s.score >= 40 ? 'bg-amber-500' : 'bg-red-500'
                                 }`}
                               />
                             </div>
                           ))}
                         </div>
                       ) : (
                         <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-lg bg-muted/5 opacity-40">
                            <TrendingUp className="h-8 w-8 mb-2" />
                            <p className="text-[10px] font-medium">No exam data available</p>
                         </div>
                       )}
                    </CardContent>
                  </Card>
 
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Attendance Trends</CardTitle>
                    </CardHeader>
                    <CardContent>
                       {data.academics.attendance_trends.length > 0 ? (
                         <div className="h-[180px] w-full mt-2 relative flex items-end justify-between gap-2 px-2">
                            {/* Simple Bar Chart for Trends */}
                            {[...data.academics.attendance_trends].reverse().map((t, idx) => (
                              <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                                <motion.div 
                                  initial={{ height: 0 }}
                                  animate={{ height: `${t.percent}%` }}
                                  className="w-full bg-primary/20 hover:bg-primary transition-colors rounded-t-sm relative"
                                >
                                  <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[8px] px-1.5 py-0.5 rounded pointer-events-none">
                                    {t.percent.toFixed(0)}%
                                  </div>
                                </motion.div>
                                <span className="text-[9px] font-bold text-muted-foreground uppercase">{t.month}</span>
                              </div>
                            ))}
                         </div>
                       ) : (
                         <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed rounded-lg bg-muted/5 opacity-40">
                            <Clock className="h-8 w-8 mb-2" />
                            <p className="text-[10px] font-medium">No attendance history</p>
                         </div>
                       )}
                    </CardContent>
                  </Card>
               </div>
            </TabsContent>

            <TabsContent value="behavior" className="mt-6 space-y-6">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-1 space-y-4">
                     <Card className="border-primary/20 bg-primary/5">
                        <CardHeader><CardTitle className="text-sm">Log New Incident</CardTitle></CardHeader>
                        <CardContent className="space-y-3">
                           <div>
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Type</Label>
                              <Select value={logForm.type} onValueChange={(v: any) => setLogForm({...logForm, type: v})}>
                                 <SelectTrigger className="h-8 text-xs">
                                    <SelectValue />
                                 </SelectTrigger>
                                 <SelectContent>
                                    <SelectItem value="merit">Merit (Positive)</SelectItem>
                                    <SelectItem value="demerit">Demerit (Negative)</SelectItem>
                                    <SelectItem value="info">Info / Neutral</SelectItem>
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="grid grid-cols-2 gap-2">
                             <div>
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Category</Label>
                                <Input className="h-8 text-xs" value={logForm.category} onChange={e => setLogForm({...logForm, category: e.target.value})} placeholder="e.g. Discipline" />
                             </div>
                             <div>
                                <Label className="text-[10px] uppercase font-bold text-muted-foreground">Points</Label>
                                <Input type="number" className="h-8 text-xs" value={logForm.points} onChange={e => setLogForm({...logForm, points: parseInt(e.target.value)})} />
                             </div>
                           </div>
                           <div>
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground">Remarks</Label>
                              <Textarea className="text-xs min-h-[80px]" value={logForm.remarks} onChange={e => setLogForm({...logForm, remarks: e.target.value})} placeholder="Incident details..." />
                           </div>
                           <Button className="w-full h-8 text-xs" onClick={submitBehavioralLog}><Plus className="mr-2 h-3 w-3" /> Record Entry</Button>
                        </CardContent>
                     </Card>
                  </div>
                  <div className="lg:col-span-2 space-y-6">
                     {/* Formal Incidents */}
                     {data.incidents.length > 0 && (
                        <div className="space-y-3">
                           <h3 className="text-xs font-bold uppercase text-red-600 tracking-wider mb-2">Formal Disciplinary Incidents</h3>
                           {data.incidents.map(inc => (
                              <div key={inc.id} className={`p-4 rounded-lg border bg-white shadow-sm flex gap-4 border-l-4 ${
                                 inc.severity === 'critical' ? 'border-l-red-600' :
                                 inc.severity === 'high' ? 'border-l-orange-500' :
                                 inc.severity === 'medium' ? 'border-l-amber-400' : 'border-l-slate-300'
                              }`}>
                                 <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                       <div className="flex items-center gap-2">
                                          <span className="text-sm font-bold">{inc.title}</span>
                                          <Badge variant="outline" className={`text-[9px] uppercase ${
                                             inc.severity === 'critical' ? 'bg-red-50 text-red-700 border-red-200' :
                                             inc.severity === 'high' ? 'bg-orange-50 text-orange-700 border-orange-200' :
                                             'bg-slate-50 text-slate-700'
                                          }`}>
                                             {inc.severity}
                                          </Badge>
                                       </div>
                                       <span className="text-[10px] text-muted-foreground">{new Date(inc.incident_date).toLocaleDateString()}</span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1">{inc.description}</p>
                                    {inc.action_taken && (
                                       <div className="mt-2 p-2 bg-slate-50 rounded border border-slate-100 text-[10px]">
                                          <span className="font-bold">Action Taken:</span> {inc.action_taken}
                                       </div>
                                    )}
                                    <div className="mt-3 flex items-center justify-between">
                                       <span className="text-[9px] text-muted-foreground font-medium">By: {inc.reporter_name || 'System'}</span>
                                       <Badge className="text-[8px] h-4">{inc.status}</Badge>
                                    </div>
                                 </div>
                              </div>
                           ))}
                        </div>
                     )}

                     {/* Merit/Demerit Log */}
                     <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase text-slate-600 tracking-wider mb-2">Merit & Behavioral Log</h3>
                        {data.behavior.length === 0 ? (
                           <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/10 text-muted-foreground">
                              <Info className="h-8 w-8 mb-2 opacity-20" />
                              <p className="text-sm font-medium">Clean Record</p>
                              <p className="text-[10px]">No behavioral anecdotes logged yet.</p>
                           </div>
                        ) : data.behavior.map(log => (
                           <div key={log.id} className={`p-4 rounded-lg border flex gap-4 transition-all hover:bg-muted/5 ${log.type === 'merit' ? 'border-l-4 border-l-green-500' : log.type === 'demerit' ? 'border-l-4 border-l-red-500' : 'border-l-4 border-l-blue-500'}`}>
                              <div className="flex-1">
                                 <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                       <span className="text-xs font-bold">{log.category}</span>
                                       <Badge variant="outline" className={`text-[9px] uppercase ${log.type === 'merit' ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                                          {log.type === 'merit' ? '+' : '-'}{log.points} pts
                                       </Badge>
                                    </div>
                                    <span className="text-[10px] text-muted-foreground">{new Date(log.incident_date).toLocaleDateString()}</span>
                                 </div>
                                 <p className="text-[11px] text-muted-foreground mt-1">{log.remarks}</p>
                                 <div className="mt-3 flex items-center gap-2">
                                    <div className="h-4 w-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold">
                                       {log.created_by_name?.split(' ').map(n=>n[0]).join('') || 'AD'}
                                    </div>
                                    <span className="text-[9px] text-muted-foreground">Logged by: {log.created_by_name || 'Admin'}</span>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="health" className="mt-6">
                <Card>
                  <CardHeader><CardTitle>Medical Profile</CardTitle></CardHeader>
                  <CardContent className="space-y-8">
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-4">
                           <div>
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Blood Group</Label>
                              <Select value={healthForm.blood_group} onValueChange={v => setHealthForm({...healthForm, blood_group: v})}>
                                 <SelectTrigger className="h-9">
                                    <SelectValue placeholder="Select group" />
                                 </SelectTrigger>
                                 <SelectContent>
                                    {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <SelectItem key={bg} value={bg}>{bg}</SelectItem>)}
                                 </SelectContent>
                              </Select>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                              <div>
                                 <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Height (cm)</Label>
                                 <Input type="number" step="0.1" value={healthForm.height_cm} onChange={e => setHealthForm({...healthForm, height_cm: parseFloat(e.target.value)})} />
                              </div>
                              <div>
                                 <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Weight (kg)</Label>
                                 <Input type="number" step="0.1" value={healthForm.weight_kg} onChange={e => setHealthForm({...healthForm, weight_kg: parseFloat(e.target.value)})} />
                              </div>
                           </div>
                        </div>

                        <div className="md:col-span-2 space-y-4">
                           <div>
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Allergies (Comma separated)</Label>
                              <Input 
                                 placeholder="e.g. Peanuts, Latex" 
                                 value={healthForm.allergies.join(', ')} 
                                 onChange={e => setHealthForm({...healthForm, allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean)})} 
                              />
                           </div>
                           <div>
                              <Label className="text-[10px] uppercase font-bold text-muted-foreground mb-1 block">Other Medical Conditions</Label>
                              <Textarea 
                                 placeholder="Ongoing medications, surgery history etc." 
                                 className="min-h-[100px]"
                                 value={healthForm.medical_conditions}
                                 onChange={e => setHealthForm({...healthForm, medical_conditions: e.target.value})}
                              />
                           </div>
                        </div>
                     </div>
                     <div className="flex justify-end pt-4 border-t">
                        <Button onClick={updateHealth} className="gap-2">
                           Update Health Record
                        </Button>
                     </div>
                  </CardContent>
                </Card>
            </TabsContent>

            <TabsContent value="admin-notes" className="mt-6">
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="md:col-span-2">
                     <CardHeader>
                        <CardTitle>Internal Staff Notes</CardTitle>
                     </CardHeader>
                     <CardContent>
                        <div className="space-y-6">
                           {isNotesLoading ? (
                              <div className="flex justify-center p-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
                           ) : adminNotes.length === 0 ? (
                              <p className="text-center text-muted-foreground italic py-8">No internal notes found.</p>
                           ) : (
                               adminNotes.map((n: any) => (
                                 <div key={n.id} className="p-4 rounded-lg border bg-slate-50 relative group">
                                    <div className="flex justify-between items-start mb-2">
                                       <span className="text-[10px] font-bold uppercase text-primary bg-primary/10 px-1.5 py-0.5 rounded">
                                          {n.created_by || "Staff"}
                                       </span>
                                       <span className="text-[10px] text-muted-foreground">
                                          {n.created_at}
                                       </span>
                                    </div>
                                    <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
                                       {n.content}
                                    </p>
                                    <div className="flex items-center gap-1 mt-2 text-[10px] text-amber-600 font-bold uppercase">
                                       <ShieldAlert className="h-3 w-3" /> Encrypted at Rest
                                    </div>
                                 </div>
                              ))
                           )}
                        </div>
                     </CardContent>
                  </Card>

                   <Card>
                     <CardHeader>
                        <CardTitle className="text-sm font-bold">Add Confidential Note</CardTitle>
                     </CardHeader>
                     <CardContent className="space-y-4">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-bold uppercase">Note Content</Label>
                           <Textarea 
                              value={newNote.content}
                              onChange={e => setNewNote({...newNote, content: e.target.value})}
                              placeholder="Enter sensitive details here..."
                              className="min-h-[120px] text-xs"
                           />
                        </div>
                        <div className="flex items-center gap-2">
                           <ShieldAlert className="h-4 w-4 text-amber-600" />
                           <span className="text-xs text-amber-600 font-bold uppercase">Auto-Encrypted</span>
                        </div>
                        <Button className="w-full" onClick={saveAdminNote} disabled={!newNote.content}>
                           Save Internal Note
                        </Button>
                        <p className="text-[10px] text-muted-foreground italic leading-tight">
                           Confidential notes are only visible to administrators and principal. All content is stored with AES-GCM encryption.
                        </p>
                     </CardContent>
                  </Card>
               </div>
            </TabsContent>

            <TabsContent value="reading" className="mt-6">
               <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                     <CardTitle>Library Reading Journal</CardTitle>
                     <Button size="sm" variant="outline" className="gap-2 h-8 text-[10px]" onClick={() => {
                        fetchAllBooks()
                        setIsUpdateProgressOpen(true)
                     }}>
                        <TrendingUp className="h-3 w-3" /> Update Progress
                     </Button>
                  </CardHeader>
                  <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {isReadingLoading ? (
                           <div className="col-span-full py-10 flex justify-center"><Loader2 className="h-6 w-6 animate-spin" /></div>
                        ) : readingLogs.length === 0 ? (
                           <div className="col-span-full py-12 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                              <Info className="h-8 w-8 mb-2 opacity-20" />
                              <p className="text-sm font-medium">Journal Empty</p>
                              <p className="text-[10px]">No reading progress recorded for this student.</p>
                           </div>
                        ) : readingLogs.map((log: any) => (
                           <div key={log.id} className="p-4 rounded-lg border bg-background flex gap-4">
                              <div className="h-16 w-12 bg-slate-100 rounded overflow-hidden flex-shrink-0">
                                 {log.cover_image_url ? (
                                    <img src={log.cover_image_url} alt={log.book_title} className="h-full w-full object-cover" />
                                 ) : (
                                    <div className="h-full w-full flex items-center justify-center text-slate-400 text-[8px] font-bold uppercase p-1 text-center">No Cover</div>
                                 )}
                              </div>
                              <div className="flex-1 min-w-0">
                                 <p className="text-xs font-bold truncate">{log.book_title}</p>
                                 <div className="flex items-center gap-2 mt-1">
                                    <Badge className={`text-[8px] h-3.5 ${log.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'}`}>
                                       {log.status.toUpperCase()}
                                    </Badge>
                                    <span className="text-[10px] text-muted-foreground">Page {log.current_page} of {log.total_pages}</span>
                                 </div>
                                 <div className="mt-2 w-full h-1 bg-slate-100 rounded-full overflow-hidden">
                                    <div 
                                       className="h-full bg-primary" 
                                       style={{ width: `${(log.current_page / log.total_pages) * 100}%` }}
                                    />
                                 </div>
                                 {log.notes && <p className="text-[10px] text-muted-foreground mt-2 line-clamp-1 italic">"{log.notes}"</p>}
                              </div>
                           </div>
                        ))}
                     </div>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="documents" className="mt-6">
               <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                     <CardTitle>Document Vault</CardTitle>
                     <Button size="sm" className="gap-2"><Plus className="h-4 w-4" /> Upload Document</Button>
                  </CardHeader>
                  <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                         {data.documents.length === 0 ? (
                            <div className="col-span-full py-20 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                               <FileText className="h-10 w-10 mb-2 opacity-20" />
                               <p className="text-sm font-medium">Vault is Empty</p>
                               <p className="text-[10px]">No verification documents uploaded yet.</p>
                            </div>
                         ) : data.documents.map(doc => (
                            <div key={doc.id} className="p-4 rounded-lg border bg-background group hover:border-primary transition-colors">
                               <div className="flex items-start justify-between mb-3">
                                  <div className="h-10 w-10 rounded bg-blue-50 flex items-center justify-center text-blue-600">
                                     <FileText className="h-6 w-6" />
                                  </div>
                                  <Badge variant={doc.status === 'verified' ? 'outline' : 'secondary'} className={`text-[9px] uppercase ${doc.status === 'verified' ? 'text-green-600 border-green-200 bg-green-50' : ''}`}>
                                     {doc.status}
                                  </Badge>
                               </div>
                               <p className="text-xs font-bold truncate" title={doc.file_name}>{doc.file_name}</p>
                               <p className="text-[10px] text-muted-foreground uppercase mt-1 tracking-tight">{doc.document_type}</p>
                               <div className="mt-4 flex gap-2">
                                  <Button variant="outline" size="sm" className="flex-1 h-7 text-[10px]">View</Button>
                                  <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 opacity-0 group-hover:opacity-100"><Trash2 className="h-3 w-3" /></Button>
                               </div>
                            </div>
                         ))}
                      </div>
                   </CardContent>
                </Card>
             </TabsContent>

            <TabsContent value="pickups" className="mt-6 space-y-6">
               <StudentPickupCode studentId={id} />
               
               <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                     <CardTitle>Pickup History</CardTitle>
                     <Button size="sm" className="gap-2" onClick={() => setIsLogPickupOpen(true)}><Plus className="h-4 w-4" /> Log Pickup</Button>
                  </CardHeader>
                  <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-muted/50">
                            <TableHead className="text-xs font-bold uppercase">Date & Time</TableHead>
                            <TableHead className="text-xs font-bold uppercase">Picked Up By</TableHead>
                            <TableHead className="text-xs font-bold uppercase">Authorized Person</TableHead>
                            <TableHead className="text-xs font-bold uppercase">Notes</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {data.pickups.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="h-24 text-center text-muted-foreground italic">
                                No pickup events recorded yet.
                              </TableCell>
                            </TableRow>
                          ) : data.pickups.map((p) => (
                            <TableRow key={p.id}>
                              <TableCell className="text-xs font-medium">
                                {new Date(p.pickup_at).toLocaleString()}
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="text-xs font-bold">{p.name}</span>
                                  <span className="text-[10px] text-muted-foreground uppercase">{p.relationship}</span>
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="text-[10px]">
                                  {p.auth_name || "Emergency/Other"}
                                </Badge>
                              </TableCell>
                              <TableCell className="text-xs text-muted-foreground max-w-md truncate">
                                {p.notes}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                  </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="guardians" className="mt-6">
               <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                     <CardTitle>Family & Relations</CardTitle>
                     <Button size="sm" variant="outline" className="gap-2 h-8 text-[10px]"><Plus className="h-3 w-3" /> Link Guardian</Button>
                  </CardHeader>
                  <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         {data.guardians.length === 0 ? (
                            <div className="col-span-full py-16 border-2 border-dashed rounded-lg flex flex-col items-center justify-center text-muted-foreground bg-muted/5">
                               <p className="text-sm font-medium">No linked guardians</p>
                               <p className="text-[10px]">Add parents or legal guardians to this student.</p>
                            </div>
                         ) : data.guardians.map((g, idx) => (
                            <div key={idx} className={`p-4 rounded-xl border bg-background flex items-start gap-4 transition-all hover:shadow-sm ${g.is_primary ? 'border-primary/50 bg-primary/5' : ''}`}>
                               <div className={`h-10 w-10 rounded-full flex items-center justify-center font-bold text-xs ${g.is_primary ? 'bg-primary text-white' : 'bg-slate-100 text-slate-600'}`}>
                                  {g.name.split(' ').map(n => n[0]).join('')}
                               </div>
                               <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1">
                                     <p className="text-xs font-bold truncate">{g.name}</p>
                                     {g.is_primary && <Badge className="text-[8px] h-3.5 px-1 bg-primary">Primary</Badge>}
                                  </div>
                                  <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tighter mb-2">{g.relationship}</p>
                                  <div className="space-y-1">
                                     <div className="flex items-center gap-2 text-[10px] text-slate-600">
                                        <div className="h-3.5 w-3.5 rounded-full bg-slate-100 flex items-center justify-center"><Info className="h-2 w-2" /></div>
                                        {g.phone || 'No phone'}
                                     </div>
                                     <div className="flex items-center gap-2 text-[10px] text-slate-600">
                                        <div className="h-3.5 w-3.5 rounded-full bg-slate-100 flex items-center justify-center"><FileText className="h-2 w-2" /></div>
                                        {g.email || 'No email'}
                                     </div>
                                  </div>
                               </div>
                               <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground"><ChevronRight className="h-4 w-4" /></Button>
                            </div>
                         ))}
                      </div>
                  </CardContent>
               </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <Dialog open={isLogPickupOpen} onOpenChange={setIsLogPickupOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Log Student Pickup</DialogTitle>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label>Select Authorized Person (Optional)</Label>
              <Select 
                onValueChange={(val) => {
                  const auth = data.pickup_auths.find(a => a.id === val)
                  if (auth) {
                    setPickupForm({
                      ...pickupForm,
                      auth_id: auth.id,
                      picked_up_by_name: auth.name,
                      relationship: auth.relationship
                    })
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose from authorized list" />
                </SelectTrigger>
                <SelectContent>
                  {data.pickup_auths.map(auth => (
                    <SelectItem key={auth.id} value={auth.id}>
                      {auth.name} ({auth.relationship})
                    </SelectItem>
                  ))}
                  <SelectItem value="none">Other / Emergency</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Picked Up By Name *</Label>
                <Input 
                  value={pickupForm.picked_up_by_name}
                  onChange={e => setPickupForm({...pickupForm, picked_up_by_name: e.target.value})}
                  placeholder="Full Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Relationship *</Label>
                <Input 
                  value={pickupForm.relationship}
                  onChange={e => setPickupForm({...pickupForm, relationship: e.target.value})}
                  placeholder="e.g. Father, Uncle"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Internal Notes / Remarks</Label>
              <Textarea 
                value={pickupForm.notes}
                onChange={e => setPickupForm({...pickupForm, notes: e.target.value})}
                placeholder="Any special remarks..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsLogPickupOpen(false)}>Cancel</Button>
            <Button onClick={logPickup} disabled={isLogging || !pickupForm.picked_up_by_name}>
              {isLogging ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Confirm & Log Pickup
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isUpdateProgressOpen} onOpenChange={setIsUpdateProgressOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Reading Progress</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Select Book</Label>
              <Select value={logForm_reading.book_id} onValueChange={v => setLogForm_reading({...logForm_reading, book_id: v})}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a book..." />
                </SelectTrigger>
                <SelectContent>
                  {allBooks.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={logForm_reading.status} onValueChange={v => setLogForm_reading({...logForm_reading, status: v})}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="reading">Currently Reading</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Rating (1-5)</Label>
                <Input type="number" min="1" max="5" value={logForm_reading.rating} onChange={e => setLogForm_reading({...logForm_reading, rating: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Current Page</Label>
                <Input type="number" value={logForm_reading.current_page} onChange={e => setLogForm_reading({...logForm_reading, current_page: parseInt(e.target.value)})} />
              </div>
              <div className="space-y-2">
                <Label>Total Pages</Label>
                <Input type="number" value={logForm_reading.total_pages} onChange={e => setLogForm_reading({...logForm_reading, total_pages: parseInt(e.target.value)})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Reflections / Notes</Label>
              <Textarea 
                placeholder="What did you learn today?"
                value={logForm_reading.notes}
                onChange={e => setLogForm_reading({...logForm_reading, notes: e.target.value})}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsUpdateProgressOpen(false)}>Cancel</Button>
            <Button onClick={saveReadingLog}>Update Journal</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

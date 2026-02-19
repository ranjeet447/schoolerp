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
  Clock
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea
} from "@schoolerp/ui"
import { apiClient } from "@/lib/api-client"

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
}

export default function StudentProfileClient({ id }: { id: string }) {
  const [data, setData] = useState<Student360 | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

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
          <Tabs defaultValue="behavior" className="w-full">
            <TabsList className="grid grid-cols-6 w-full bg-muted/50 p-1">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="behavior" className="gap-2"><ShieldCheck className="h-4 w-4" /> Behavior</TabsTrigger>
              <TabsTrigger value="academics" className="gap-2"><Medal className="h-4 w-4" /> Academics</TabsTrigger>
              <TabsTrigger value="health" className="gap-2"><HeartPulse className="h-4 w-4" /> Health</TabsTrigger>
              <TabsTrigger value="documents" className="gap-2"><FileText className="h-4 w-4" /> Vault</TabsTrigger>
              <TabsTrigger value="guardians">Relations</TabsTrigger>
            </TabsList>

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
                  <div className="lg:col-span-2">
                     <div className="space-y-3">
                        {data.behavior.length === 0 ? (
                           <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-lg bg-muted/10 text-muted-foreground">
                              <Info className="h-8 w-8 mb-2 opacity-20" />
                              <p className="text-sm font-medium">Clean Record</p>
                              <p className="text-[10px]">No behavioral incidents logged for this student yet.</p>
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
                                    <div className="h-4 w-4 rounded-full bg-slate-200 flex items-center justify-center text-[8px] font-bold">JD</div>
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
    </div>
  )
}

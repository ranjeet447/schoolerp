"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardHeader, CardTitle, 
  Button, Input, Badge, Textarea
} from "@schoolerp/ui"
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Plus, 
  Radio,
  RefreshCcw,
  ShieldAlert,
  Megaphone,
  ArrowRight,
  ShieldCheck,
  TrendingUp
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { format } from "date-fns"
import { toast } from "sonner"

export default function IncidentManagementPage() {
  const [incidents, setIncidents] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  
  // New Incident Form State
  const [title, setTitle] = useState("")
  const [severity, setSeverity] = useState("minor")
  const [description, setDescription] = useState("")

  useEffect(() => {
    fetchIncidents()
  }, [])

  const fetchIncidents = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/admin/platform/incidents?limit=20")
      if (res.ok) {
        const data = await res.json()
        setIncidents(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch incidents", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateIncident = async () => {
    if (!title || !description) return toast.error("Please fill all fields")
    
    try {
      const res = await apiClient("/admin/platform/incidents", {
        method: "POST",
        body: JSON.stringify({
          title,
          severity,
          description,
          status: "investigating"
        })
      })
      if (res.ok) {
        toast.success("Incident reported and broadcasted")
        setIsCreating(false)
        setTitle("")
        setDescription("")
        fetchIncidents()
      }
    } catch (error) {
      toast.error("Failed to report incident")
    }
  }

  const resolveIncident = async (id: string) => {
    try {
      const res = await apiClient(`/admin/platform/incidents/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "resolved" })
      })
      if (res.ok) {
        toast.success("Incident resolved")
        fetchIncidents()
      }
    } catch (error) {
      toast.error("Failed to resolve incident")
    }
  }

  const activeIncidents = incidents.filter(i => i.status !== 'resolved')

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground italic uppercase">Health <span className="text-primary">& Ops</span></h1>
          <p className="text-muted-foreground font-medium mt-1">Manage system-wide incidents and maintenance schedules.</p>
        </div>
        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => fetchIncidents()} 
            className="rounded-2xl font-bold h-12 px-6 gap-2 border-primary/20"
          >
             <RefreshCcw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} /> Refresh
          </Button>
          <Button 
            className="rounded-2xl font-bold h-12 px-6 gap-2 shadow-lg shadow-primary/20"
            onClick={() => setIsCreating(true)}
          >
            <Plus className="w-5 h-5" /> Report Incident
          </Button>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-emerald-500/10 border-none rounded-3xl p-6 relative overflow-hidden group">
           <div className="relative z-10 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-200">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Global Status</p>
                <div className="text-xl font-black text-emerald-700">All Systems Operational</div>
              </div>
           </div>
           <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
              <Activity className="w-20 h-20 -mr-4 -mt-4 text-emerald-500" />
           </div>
        </Card>

        <Card className="bg-amber-500/10 border-none rounded-3xl p-6 relative overflow-hidden">
           <div className="relative z-10 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-amber-500 flex items-center justify-center text-white shadow-lg shadow-amber-200">
                <Radio className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Active Incidents</p>
                <div className="text-xl font-black text-amber-700">{activeIncidents.length} Pending Actions</div>
              </div>
           </div>
        </Card>

        <Card className="bg-slate-900 border-none rounded-3xl p-6 relative overflow-hidden text-white">
           <div className="relative z-10 flex items-center gap-4">
              <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center text-white">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Uptime last 30d</p>
                <div className="text-xl font-black text-white">99.98% High Availability</div>
              </div>
           </div>
        </Card>
      </div>

      {isCreating && (
        <Card className="bg-white border-2 border-primary/20 rounded-[2.5rem] p-8 shadow-xl shadow-primary/5">
          <CardHeader className="p-0 mb-6">
            <CardTitle className="text-2xl font-black uppercase italic tracking-tight flex items-center gap-3">
              <ShieldAlert className="w-6 h-6 text-primary" /> Create Emergency Broadcast
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Incident Headline</label>
                   <Input 
                    placeholder="e.g. Latency issues in Payment Gateway" 
                    className="h-12 rounded-xl bg-muted/50 border-none"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                   />
                </div>
                <div className="space-y-2">
                   <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Severity Level</label>
                   <select 
                    className="w-full h-12 rounded-xl bg-muted/50 border-none px-4 text-sm font-bold appearance-none outline-none"
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                   >
                     <option value="minor">Minor Degradation</option>
                     <option value="major">Major Outage</option>
                     <option value="critical">Critical (Hard Down)</option>
                     <option value="maintenance">Scheduled Maintenance</option>
                   </select>
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest ml-1">Public Update / Description</label>
                <Textarea 
                  placeholder="Explain the situation and estimated time for fix..." 
                  className="rounded-2xl min-h-[120px] bg-muted/50 border-none p-4"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
             </div>
             <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={() => setIsCreating(false)} className="rounded-xl font-bold">Cancel</Button>
                <Button onClick={handleCreateIncident} className="rounded-xl font-black uppercase tracking-widest px-8 shadow-lg shadow-primary/20">Launch Broadcast</Button>
             </div>
          </CardContent>
        </Card>
      )}

      {/* Incident List */}
      <div className="space-y-6">
         <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <TrendingUp className="h-3 w-3" /> Historical Timeline
         </h2>
         
         {loading ? (
            <div className="py-20 text-center">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            </div>
         ) : incidents.length === 0 ? (
            <div className="py-20 text-center bg-muted/10 rounded-[2.5rem] border-2 border-dashed border-border/50 text-muted-foreground italic font-medium">
               Peaceful systems. No incidents on record.
            </div>
         ) : (
            <div className="grid grid-cols-1 gap-6">
               {incidents.map((incident) => (
                  <Card key={incident.id} className={`bg-card border-none rounded-[2.5rem] shadow-sm hover:shadow-md transition-all overflow-hidden relative ${incident.status === 'resolved' ? 'grayscale opacity-80' : ''}`}>
                     <div className="p-8">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                           <div className="flex items-center gap-4">
                              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shadow-lg ${
                                 incident.severity === 'critical' || incident.severity === 'major' ? 'bg-rose-500 text-white shadow-rose-200' :
                                 incident.severity === 'minor' ? 'bg-amber-500 text-white shadow-amber-200' :
                                 'bg-blue-500 text-white shadow-blue-200'
                              }`}>
                                 <AlertTriangle className="h-6 w-6" />
                              </div>
                              <div>
                                 <h4 className="text-xl font-black text-foreground">{incident.title}</h4>
                           <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest flex items-center gap-1 mt-1">
                                    <Clock className="w-2.5 h-2.5" /> Filed {format(new Date(incident.created_at || new Date()), 'PPp')}
                                 </p>
                              </div>
                           </div>
                           <div className="flex items-center gap-3">
                              <Badge className={`font-black uppercase tracking-tighter text-[10px] px-3 py-1 ${
                                 incident.status === 'resolved' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'
                              }`}>
                                 {incident.status}
                              </Badge>
                              {incident.status !== 'resolved' && (
                                 <Button 
                                    size="sm" 
                                    variant="outline" 
                                    className="rounded-xl border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/5 font-bold"
                                    onClick={() => resolveIncident(incident.id)}
                                 >
                                    Mark Resolved
                                 </Button>
                              )}
                           </div>
                        </div>
                        <p className="text-sm text-foreground/80 leading-relaxed font-medium mb-6">{incident.description}</p>
                        
                        <div className="flex items-center gap-2 p-4 bg-muted/20 rounded-2xl border border-border/50 border-dashed">
                           <Megaphone className="h-4 w-4 text-primary" />
                           <span className="text-[10px] font-black uppercase text-muted-foreground">Broadcasted to: </span>
                           <span className="text-[10px] font-bold text-foreground bg-primary/10 px-2 py-0.5 rounded-full">All Tenants</span>
                           <span className="text-[10px] font-bold text-foreground bg-primary/10 px-2 py-0.5 rounded-full">Support Portal</span>
                        </div>
                     </div>
                  </Card>
               ))}
            </div>
         )}
      </div>
    </div>
  )
}

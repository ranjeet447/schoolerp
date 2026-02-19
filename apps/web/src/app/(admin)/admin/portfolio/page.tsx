"use client"

import { useState, useEffect } from "react"
import { 
  Card, CardContent, CardDescription, CardHeader, CardTitle,
  Button, Badge, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@schoolerp/ui"
import { 
  LayoutDashboard, TrendingUp, TrendingDown, DollarSign, 
  Users, Building2, Wallet, ArrowUpRight, Receipt, Activity
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { toast } from "sonner"

interface GroupFinancialData {
  total_collected: number
  total_pending: number
  total_salaries: number
  total_purchases: number
}

interface GroupMember {
  tenant_id: string
  tenant_name: string
}

export default function PortfolioDashboard() {
  const [loading, setLoading] = useState(true)
  const [groups, setGroups] = useState<any[]>([])
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [financials, setFinancials] = useState<GroupFinancialData | null>(null)
  const [members, setMembers] = useState<GroupMember[]>([])

  useEffect(() => {
    loadGroups()
  }, [])

  useEffect(() => {
    if (selectedGroup) {
      loadGroupDetails(selectedGroup)
    }
  }, [selectedGroup])

  const loadGroups = async () => {
    try {
      const res = await apiClient("/admin/portfolio/groups")
      if (!res.ok) throw new Error("Failed to load groups")
      const data = await res.json()
      setGroups(data)
      if (data.length > 0) setSelectedGroup(data[0].id)
    } catch (err) {
      toast.error("Error loading portfolio groups")
    } finally {
      setLoading(false)
    }
  }

  const loadGroupDetails = async (groupId: string) => {
    setLoading(true)
    try {
      const [finRes, memRes] = await Promise.all([
        apiClient(`/admin/portfolio/groups/${groupId}/financial-analytics`),
        apiClient(`/admin/portfolio/groups/${groupId}/members`)
      ])

      const finData = await finRes.json()
      const memData = await memRes.json()

      setFinancials(finData)
      setMembers(memData)
    } catch (err) {
      toast.error("Error loading group details")
    } finally {
      setLoading(false)
    }
  }

  const kpis = [
    {
      title: "Total Collections",
      value: financials?.total_collected || 0,
      icon: Wallet,
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      description: "Aggregated fee receipts across campuses"
    },
    {
      title: "Pending Dues",
      value: financials?.total_pending || 0,
      icon: Receipt,
      color: "text-amber-600",
      bg: "bg-amber-50",
      description: "Outstanding balances from students"
    },
    {
      title: "Operational Costs",
      value: (financials?.total_salaries || 0) + (financials?.total_purchases || 0),
      icon: TrendingDown,
      color: "text-rose-600",
      bg: "bg-rose-50",
      description: "Salaries + Purchase Orders"
    },
    {
      title: "Active Campuses",
      value: members.length,
      icon: Building2,
      color: "text-indigo-600",
      bg: "bg-indigo-50",
      description: "Institutions under this portfolio"
    }
  ]

  if (loading && !groups.length) {
    return <div className="p-8">Loading Portfolio Dashboard...</div>
  }

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-10 h-10 text-indigo-600" />
            Portfolio Command
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Cross-campus intelligence and group performance metrics.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <select 
             value={selectedGroup || ""} 
             onChange={(e) => setSelectedGroup(e.target.value)}
             className="h-11 px-4 rounded-xl border-slate-200 bg-white shadow-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
           >
             {groups.map(g => (
               <option key={g.id} value={g.id}>{g.name}</option>
             ))}
           </select>
           <Button className="h-11 rounded-xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 font-bold">
             Management Consolidated
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-none shadow-xl shadow-slate-100/50 hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-300 group overflow-hidden">
             <div className={`h-1.5 w-full ${kpi.bg.replace('bg-', 'bg-')}`} />
             <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-600 transition-colors">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color} transition-transform group-hover:scale-110 duration-500`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
             </CardHeader>
             <CardContent>
                <div className="text-3xl font-black text-slate-900 tabular-nums">
                  {i === 3 ? kpi.value : `₹${kpi.value.toLocaleString('en-IN')}`}
                </div>
                <p className="text-xs text-slate-400 mt-2 font-bold leading-relaxed">{kpi.description}</p>
             </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-xl shadow-slate-100/50 overflow-hidden">
          <CardHeader className="bg-slate-50/30 border-b border-slate-50">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-slate-800">Campus Distribution</CardTitle>
                <CardDescription className="font-medium">Direct performance mapping by institution.</CardDescription>
              </div>
              <Badge className="bg-white text-indigo-600 border-indigo-100 shadow-sm font-bold">Live Aggregation</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="border-slate-100 hover:bg-transparent">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest py-4 pl-8">Institution</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest">Health</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.tenant_id} className="border-slate-50 group transition-colors hover:bg-indigo-50/30">
                    <TableCell className="font-bold py-6 pl-8 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-black text-slate-400 group-hover:bg-indigo-100 group-hover:text-indigo-600 transition-all">
                         {member.tenant_name[0]}
                       </div>
                       {member.tenant_name}
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                         <div className="h-2 w-24 bg-slate-100 rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500 w-[85%]" />
                         </div>
                         <span className="text-[10px] font-black text-emerald-600 uppercase tracking-tighter">Optimal</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <Button variant="ghost" size="sm" className="font-black text-xs uppercase tracking-widest text-indigo-600 hover:bg-indigo-50">
                         Audit
                         <ArrowUpRight className="w-3.5 h-3.5 ml-2" />
                       </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <div className="space-y-8">
           <Card className="border-none shadow-xl shadow-indigo-600/5 bg-indigo-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 p-8 opacity-10 transform translate-x-4 -translate-y-4">
                <Activity className="w-48 h-48" />
              </div>
              <CardHeader>
                <CardTitle className="text-lg font-black uppercase tracking-widest text-indigo-100">Quick Insights</CardTitle>
                <CardDescription className="text-indigo-200 font-medium">AI-driven summary of anomalies.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 relative z-10">
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <p className="text-sm font-bold leading-relaxed">Collection is up <span className="text-emerald-300">12%</span> compared to last quarter across all campuses.</p>
                </div>
                <div className="p-4 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/10">
                  <p className="text-sm font-bold leading-relaxed">Inventory costs in <span className="text-amber-300">North Branch</span> are higher than average.</p>
                </div>
                <Button variant="secondary" className="w-full h-11 rounded-xl font-bold bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg shadow-black/10">
                   Generate Full Report
                </Button>
              </CardContent>
           </Card>

           <Card className="border-none shadow-xl shadow-slate-100/50">
              <CardHeader>
                <CardTitle className="text-lg font-black text-slate-800">Portfolio Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Users className="w-5 h-5 text-indigo-500" />
                       <span className="text-sm font-bold text-slate-600">Student Capacity</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">82%</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[82%]" />
                 </div>

                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Building2 className="w-5 h-5 text-indigo-500" />
                       <span className="text-sm font-bold text-slate-600">Infrastructure Health</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">95%</span>
                 </div>
                 <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 w-[95%]" />
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  )
}

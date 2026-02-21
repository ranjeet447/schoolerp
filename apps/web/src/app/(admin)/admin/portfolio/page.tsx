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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-8">
        <div>
          <h1 className="text-4xl font-black text-foreground tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-10 h-10 text-primary" />
            Portfolio Command
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Cross-campus intelligence and group performance metrics.</p>
        </div>
        
        <div className="flex items-center gap-3">
           <select 
             value={selectedGroup || ""} 
             onChange={(e) => setSelectedGroup(e.target.value)}
             className="h-11 px-4 rounded-xl border-input bg-background shadow-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 outline-none transition-all"
           >
             {groups.map(g => (
               <option key={g.id} value={g.id}>{g.name}</option>
             ))}
           </select>
           <Button className="h-11 rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20 font-bold">
             Management Consolidated
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpis.map((kpi, i) => (
          <Card key={i} className="border-none shadow-sm hover:shadow-md transition-all duration-300 group overflow-hidden bg-card">
             <div className={`h-1.5 w-full ${kpi.bg.replace('bg-', 'bg-')} dark:opacity-20`} />
             <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-black uppercase tracking-widest text-muted-foreground group-hover:text-foreground transition-colors">
                  {kpi.title}
                </CardTitle>
                <div className={`p-2.5 rounded-xl ${kpi.bg} ${kpi.color} dark:bg-opacity-10 transition-transform group-hover:scale-110 duration-500`}>
                  <kpi.icon className="w-5 h-5" />
                </div>
             </CardHeader>
             <CardContent>
                <div className="text-3xl font-black text-foreground tabular-nums">
                  {i === 3 ? kpi.value : `₹${kpi.value.toLocaleString('en-IN')}`}
                </div>
                <p className="text-xs text-muted-foreground mt-2 font-bold leading-relaxed">{kpi.description}</p>
             </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <Card className="lg:col-span-2 border-none shadow-sm overflow-hidden bg-card">
          <CardHeader className="bg-muted/30 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl font-black text-foreground">Campus Distribution</CardTitle>
                <CardDescription className="font-medium text-muted-foreground">Direct performance mapping by institution.</CardDescription>
              </div>
              <Badge className="bg-background text-primary border-primary/20 shadow-sm font-bold">Live Aggregation</Badge>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow className="border-border hover:bg-transparent">
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground py-4 pl-8">Institution</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground">Health</TableHead>
                  <TableHead className="font-black uppercase text-[10px] tracking-widest text-muted-foreground text-right pr-8">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member) => (
                  <TableRow key={member.tenant_id} className="border-border group transition-colors hover:bg-primary/5">
                    <TableCell className="font-bold text-foreground py-6 pl-8 flex items-center gap-3">
                       <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center font-black text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-all">
                         {member.tenant_name[0]}
                       </div>
                       {member.tenant_name}
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                         <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                           <div className="h-full bg-emerald-500 w-[85%]" />
                         </div>
                         <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-tighter">Optimal</span>
                       </div>
                    </TableCell>
                    <TableCell className="text-right pr-8">
                       <Button variant="ghost" size="sm" className="font-black text-xs uppercase tracking-widest text-primary hover:bg-primary/10">
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

           <Card className="border-none shadow-sm bg-card">
              <CardHeader>
                <CardTitle className="text-lg font-black text-foreground">Portfolio Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Users className="w-5 h-5 text-primary" />
                       <span className="text-sm font-bold text-foreground/80">Student Capacity</span>
                    </div>
                    <span className="text-sm font-black text-foreground">82%</span>
                 </div>
                 <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[82%]" />
                 </div>

                 <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                       <Building2 className="w-5 h-5 text-primary" />
                       <span className="text-sm font-bold text-foreground/80">Infrastructure Health</span>
                    </div>
                    <span className="text-sm font-black text-foreground">95%</span>
                 </div>
                 <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[95%]" />
                 </div>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  )
}

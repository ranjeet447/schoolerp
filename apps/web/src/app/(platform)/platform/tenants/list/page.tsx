"use client"

import { useState, useEffect } from "react"
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
  Button, Input, Card, CardContent, CardHeader, CardTitle,
  Badge, Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@schoolerp/ui"
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  ShieldCheck, 
  UserCircle, 
  PauseCircle, 
  PlayCircle,
  Building2,
  ExternalLink,
  ChevronLeft,
  Loader2
} from "lucide-react"
import { apiClient } from "@/lib/api-client"
import { format } from "date-fns"
import { toast } from "sonner"
import Link from "next/link"

export default function TenantListPage() {
  const [tenants, setTenants] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    fetchTenants()
  }, [])

  const fetchTenants = async () => {
    setLoading(true)
    try {
      const res = await apiClient("/admin/platform/tenants?limit=100")
      if (res.ok) {
        const data = await res.json()
        setTenants(Array.isArray(data) ? data : [])
      }
    } catch (error) {
      console.error("Failed to fetch tenants", error)
      toast.error("Could not load tenant directory")
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateStatus = async (tenantId: string, currentStatus: string) => {
    const newStatus = currentStatus === "suspended" ? "active" : "suspended"
    setActionLoading(tenantId)
    try {
      const res = await apiClient(`/admin/platform/tenants/${tenantId}/lifecycle`, {
        method: "POST",
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        toast.success(`Tenant ${newStatus === "suspended" ? "suspended" : "reactivated"} successfully`)
        setTenants(prev => prev.map(t => t.id === tenantId ? { ...t, lifecycle_status: newStatus } : t))
      }
    } catch (error) {
      toast.error("Failed to update tenant status")
    } finally {
      setActionLoading(null)
    }
  }

  const handleImpersonate = async (tenantId: string) => {
    setActionLoading(`impersonate-${tenantId}`)
    try {
      const res = await apiClient(`/admin/platform/tenants/${tenantId}/impersonate`, {
        method: "POST"
      })
      if (res.ok) {
        const data = await res.json()
        toast.success("Impersonation session created")
        // Typically would redirect to /admin/dashboard with a cookie/header set
        window.location.href = "/admin/dashboard"
      }
    } catch (error) {
      toast.error("Impersonation failed")
    } finally {
      setActionLoading(null)
    }
  }

  const filteredTenants = tenants.filter(t => {
    const matchesSearch = (t.name || "").toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.subdomain || "").toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || t.lifecycle_status === statusFilter
    return matchesSearch && matchesStatus
  })

  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
           <Link href="/platform/tenants" className="text-xs font-black text-muted-foreground uppercase flex items-center gap-1 mb-2 hover:text-primary transition-colors">
            <ChevronLeft className="h-3 w-3" /> Back to Overview
          </Link>
          <h1 className="text-4xl font-black tracking-tight text-foreground italic uppercase">School <span className="text-primary">Directory</span></h1>
          <p className="text-muted-foreground font-medium mt-1">Manage institutional lifecycles and administrative access.</p>
        </div>
        <Link href="/platform/tenants/new">
          <Button className="rounded-2xl font-bold h-12 px-6 gap-2">
            <Building2 className="w-5 h-5" /> Onboard New School
          </Button>
        </Link>
      </div>

      <Card className="bg-card border-border/50 rounded-3xl overflow-hidden shadow-sm">
        <CardHeader className="border-b border-border/50 bg-muted/20 px-8 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
             <div className="relative w-full md:w-96">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by school name or subdomain..."
                  className="bg-muted/50 border-border/50 pl-10 h-11 rounded-xl focus:ring-1 focus:ring-primary/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                 <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[160px] h-11 rounded-xl bg-muted/50 border-border/50">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All States</SelectItem>
                      <SelectItem value="active">Active / Live</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="trialing">In Trial</SelectItem>
                      <SelectItem value="onboarding">Onboarding</SelectItem>
                    </SelectContent>
                  </Select>
                 </div>
              </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-muted/50 border-b border-border/50">
              <TableRow className="border-none">
                <TableHead className="text-muted-foreground font-black tracking-tighter uppercase px-8 py-4">Institution</TableHead>
                <TableHead className="text-muted-foreground font-black tracking-tighter uppercase">Subdomain</TableHead>
                <TableHead className="text-muted-foreground font-black tracking-tighter uppercase">Plan</TableHead>
                <TableHead className="text-muted-foreground font-black tracking-tighter uppercase">Joined</TableHead>
                <TableHead className="text-muted-foreground font-black tracking-tighter uppercase text-center">Lifecycle</TableHead>
                <TableHead className="text-right px-8">Remote Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-border/50">
              {loading ? (
                <TableRow>
                   <TableCell colSpan={6} className="text-center py-20 text-muted-foreground">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                    Syncing global school directory...
                  </TableCell>
                </TableRow>
              ) : filteredTenants.length === 0 ? (
                <TableRow>
                   <TableCell colSpan={6} className="text-center py-20 text-muted-foreground px-8 italic">
                    No schools found matching your search.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTenants.map((tenant) => (
                  <TableRow key={tenant.id} className="border-none hover:bg-muted/30 transition-colors group">
                    <TableCell className="px-8 py-5">
                      <div className="flex flex-col">
                        <span className="font-black text-foreground group-hover:text-primary transition-colors">{tenant.name}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">ID: {tenant.id.slice(0, 8)}...</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                         <span className="text-xs font-bold text-foreground">{tenant.subdomain}</span>
                         <span className="text-[10px] text-muted-foreground">.schoolerp.com</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-black text-[10px] uppercase italic tracking-wider">
                        {tenant.plan_code || "Enterprise"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs font-bold text-muted-foreground">
                      {tenant.created_at ? format(new Date(tenant.created_at), 'MMM yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-center">
                       <Badge className={`font-black uppercase tracking-tighter text-[9px] ${
                          tenant.lifecycle_status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 
                          tenant.lifecycle_status === 'suspended' ? 'bg-rose-500/10 text-rose-500' :
                          'bg-amber-500/10 text-amber-500'
                       }`}>
                         {tenant.lifecycle_status || 'active'}
                       </Badge>
                    </TableCell>
                    <TableCell className="text-right px-8">
                       <div className="flex items-center justify-end gap-2">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl h-9 px-4 font-bold border-indigo-500/20 text-indigo-500 hover:bg-indigo-500/5 gap-2"
                            onClick={() => handleImpersonate(tenant.id)}
                            disabled={actionLoading === `impersonate-${tenant.id}`}
                          >
                             {actionLoading === `impersonate-${tenant.id}` ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                             ) : (
                                <UserCircle className="h-4 w-4" />
                             )}
                             Impersonate
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className={`rounded-xl h-9 w-9 ${tenant.lifecycle_status === 'suspended' ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-rose-500 hover:bg-rose-500/10'}`}
                            onClick={() => handleUpdateStatus(tenant.id, tenant.lifecycle_status)}
                            disabled={actionLoading === tenant.id}
                            title={tenant.lifecycle_status === 'suspended' ? 'Reactivate Tenant' : 'Suspend Tenant'}
                          >
                             {actionLoading === tenant.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                             ) : tenant.lifecycle_status === 'suspended' ? (
                                <PlayCircle className="h-4 w-4" />
                             ) : (
                                <PauseCircle className="h-4 w-4" />
                             )}
                          </Button>
                       </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

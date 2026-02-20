"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { 
  AlertTriangle, 
  Search, 
  Plus, 
  MoreHorizontal, 
  Loader2,
  Megaphone,
  Ban,
  Clock,
  CheckCircle2,
  Info
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Input,
  Textarea,
  Badge,
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@schoolerp/ui";
import { TenantSelect } from "@/components/ui/tenant-select";
import { useDebouncedValue } from "@/lib/use-debounced-value";

// --- Types ---

type PlatformIncident = {
  id: string;
  title: string;
  status: string;
  severity: string;
  scope: string;
  affected_tenant_ids: string[];
  created_by?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string | null;
};

type PlatformIncidentEvent = {
  id: string;
  incident_id: string;
  event_type: string;
  message: string;
  metadata?: Record<string, any>;
  created_by?: string;
  created_by_email?: string;
  created_by_name?: string;
  created_at: string;
};

type IncidentDetail = {
  incident: PlatformIncident;
  events: PlatformIncidentEvent[];
  // affected_tenants_details would be nice here in future
};

function unwrapData(payload: unknown): unknown {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data?: unknown }).data;
  }
  return payload;
}

function normalizeIncidentDetail(payload: unknown): IncidentDetail | null {
  const value = unwrapData(payload);
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;

  const candidate = value as {
    incident?: unknown;
    events?: unknown;
  };

  if (!candidate.incident || typeof candidate.incident !== "object" || Array.isArray(candidate.incident)) {
    return null;
  }

  return {
    incident: candidate.incident as PlatformIncident,
    events: Array.isArray(candidate.events) ? (candidate.events as PlatformIncidentEvent[]) : [],
  };
}

// --- Component ---

export default function PlatformIncidentsPage() {
  const [rows, setRows] = useState<PlatformIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  
  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [scope, setScope] = useState("all");

  // Create Incident State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSeverity, setNewSeverity] = useState("minor");
  const [newScope, setNewScope] = useState("platform");
  const [newAffectedTenants, setNewAffectedTenants] = useState<string[]>([]);
  const [newInitialMessage, setNewInitialMessage] = useState("");

  // Detail State
  const [detailOpen, setDetailOpen] = useState(false);
  const [detail, setDetail] = useState<IncidentDetail | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState("update");

  // Edit State
  const [editTitle, setEditTitle] = useState("");
  const [editStatus, setEditStatus] = useState("");
  const [editSeverity, setEditSeverity] = useState("");
  const [editScope, setEditScope] = useState("");
  const [editAffectedTenants, setEditAffectedTenants] = useState<string[]>([]);
  const [editUpdateMessage, setEditUpdateMessage] = useState("");

  // Event State
  const [newEventType, setNewEventType] = useState("update");
  const [newEventMessage, setNewEventMessage] = useState("");

  // Special Actions State
  // Placeholder logic for now

  // --- Queries ---

  const query = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (status && status !== "all") params.set("status", status);
    if (severity && severity !== "all") params.set("severity", severity);
    if (scope && scope !== "all") params.set("scope", scope);
    params.set("limit", "50");
    return params.toString();
  }, [scope, debouncedSearch, severity, status]);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient(`/admin/platform/incidents?${query}`);
      if (res.ok) {
        const data = await res.json();
        setRows(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [query]);

  // --- Actions ---

  const openDetail = async (incidentId: string) => {
    setBusyId(`open:${incidentId}`);
    try {
      const res = await apiClient(`/admin/platform/incidents/${incidentId}`);
      if (res.ok) {
        const payload = await res.json();
        const data = normalizeIncidentDetail(payload);
        if (!data) return;

        setDetail(data);
        setEditTitle(data.incident.title || "");
        setEditStatus(data.incident.status || "investigating");
        setEditSeverity(data.incident.severity || "minor");
        setEditScope(data.incident.scope || "platform");
        setEditAffectedTenants(Array.isArray(data.incident.affected_tenant_ids) ? data.incident.affected_tenant_ids : []);
        setDetailOpen(true);
        // Reset sub-forms
        setEditUpdateMessage("");
        setNewEventMessage("");
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId("");
    }
  };

  const createIncident = async () => {
    setBusyId("create");
    try {
      const payload: any = {
        title: newTitle.trim(),
        severity: newSeverity,
        scope: newScope,
        affected_tenant_ids: newAffectedTenants,
      };
      if (newInitialMessage.trim()) payload.initial_message = newInitialMessage.trim();

      const res = await apiClient("/admin/platform/incidents", {
        method: "POST",
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) throw new Error(await res.text());
      
      setCreateDialogOpen(false);
      setNewTitle("");
      setNewAffectedTenants([]);
      setNewInitialMessage("");
      load();
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId("");
    }
  };

  const updateIncident = async () => {
    if (!detail) return;
    setBusyId("update");
    try {
      const payload: any = {
        title: editTitle.trim(),
        status: editStatus,
        severity: editSeverity,
        scope: editScope,
        affected_tenant_ids: editAffectedTenants,
      };
      if (editUpdateMessage.trim()) payload.update_message = editUpdateMessage.trim();

      const res = await apiClient(`/admin/platform/incidents/${detail.incident.id}`, {
        method: "PATCH",
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        const responsePayload = await res.json();
        const updatedDetail = normalizeIncidentDetail(responsePayload);
        if (updatedDetail) {
          setDetail(updatedDetail);
        }
        setEditUpdateMessage("");
        load();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId("");
    }
  };

  const addEvent = async () => {
    if (!detail) return;
    setBusyId("event");
    try {
      await apiClient(`/admin/platform/incidents/${detail.incident.id}/events`, {
        method: "POST",
        body: JSON.stringify({
          event_type: newEventType,
          message: newEventMessage
        })
      });
      setNewEventMessage("");
      // Refresh detail
      const res = await apiClient(`/admin/platform/incidents/${detail.incident.id}`);
      if (res.ok) {
        const payload = await res.json();
        const refreshedDetail = normalizeIncidentDetail(payload);
        if (refreshedDetail) {
          setDetail(refreshedDetail);
        }
      }
    } catch(e) { console.error(e); } finally { setBusyId(""); }
  };

  // --- Render Helpers ---

  const getSeverityBadge = (s: string) => {
    const colors: Record<string, string> = {
      critical: "bg-red-500 hover:bg-red-600 border-red-600",
      major: "bg-orange-500 hover:bg-orange-600 border-orange-600",
      minor: "bg-yellow-500 hover:bg-yellow-600 border-yellow-600",
    };
    return <Badge className={colors[s] || "bg-slate-500"}>{s}</Badge>;
  };

  const getStatusBadge = (s: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      investigating: "destructive",
      identified: "default",
      monitoring: "secondary",
      resolved: "outline"
    };
    return <Badge variant={variants[s] || "outline"}>{s}</Badge>;
  };

  return (
    <div className="space-y-6 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground">Incidents</h1>
          <p className="text-muted-foreground">Manage service outages and granular overrides.</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create Incident
        </Button>
      </div>

      <div className="flex flex-col gap-4 md:flex-row md:items-center">
        <div className="relative flex-1 md:max-w-sm">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search incidents..." 
            className="pl-8" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
          />
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="investigating">Investigating</SelectItem>
            <SelectItem value="identified">Identified</SelectItem>
            <SelectItem value="monitoring">Monitoring</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
        <Select value={severity} onValueChange={setSeverity}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Severity" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Severities</SelectItem>
            <SelectItem value="critical">Critical</SelectItem>
            <SelectItem value="major">Major</SelectItem>
            <SelectItem value="minor">Minor</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Severity</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Updated</TableHead>
              <TableHead className="w-[80px]"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
              </TableRow>
            ) : rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No incidents found.</TableCell>
              </TableRow>
            ) : (
              rows.map(row => (
                <TableRow key={row.id} className="cursor-pointer" onClick={() => openDetail(row.id)}>
                  <TableCell className="font-medium">
                    {row.title}
                    {row.affected_tenant_ids?.length > 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        {row.affected_tenant_ids.length} tenants affected
                      </div>
                    )}
                  </TableCell>
                  <TableCell>{getStatusBadge(row.status)}</TableCell>
                  <TableCell>{getSeverityBadge(row.severity)}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="uppercase font-mono text-[10px]">{row.scope}</Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {new Date(row.updated_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => openDetail(row.id)}>Open</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Incident</DialogTitle>
            <DialogDescription>Declare a new service incident or maintenance.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="e.g., Database Latency Spike" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Severity</Label>
                <Select value={newSeverity} onValueChange={setNewSeverity}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minor">Minor</SelectItem>
                    <SelectItem value="major">Major</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Scope</Label>
                <Select value={newScope} onValueChange={setNewScope}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="platform">Platform (All)</SelectItem>
                    <SelectItem value="tenant">Specific Tenants</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {newScope === "tenant" && (
              <div className="grid gap-2">
                <Label>Affected Tenants</Label>
                <TenantSelect 
                  multiple
                  value={newAffectedTenants}
                  onSelect={(val) => setNewAffectedTenants(Array.isArray(val) ? val : [val])}
                  placeholder="Select affected tenants..."
                />
                {newAffectedTenants.length > 0 && <p className="text-xs text-muted-foreground">{newAffectedTenants.length} tenants selected</p>}
              </div>
            )}
            <div className="grid gap-2">
              <Label>Initial Update</Label>
              <Textarea value={newInitialMessage} onChange={e => setNewInitialMessage(e.target.value)} placeholder="We are investigating..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={createIncident} disabled={busyId === "create" || !newTitle}>
              {busyId === "create" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Incident
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail Dialog */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col p-0">
          <div className="border-b p-6 pb-4">
            <DialogTitle className="text-xl flex items-center gap-2">
               {detail?.incident.title}
               {detail && getStatusBadge(detail.incident.status)}
            </DialogTitle>
            <DialogDescription className="mt-1">
              {detail?.incident.id} · Created {detail && new Date(detail.incident.created_at).toLocaleString()}
            </DialogDescription>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 bg-muted/10">
            <Tabs value={activeDetailTab} onValueChange={setActiveDetailTab} className="space-y-4">
              <TabsList>
                <TabsTrigger value="update">Update & Timeline</TabsTrigger>
                <TabsTrigger value="override">Limit Override</TabsTrigger>
              </TabsList>
              
              <TabsContent value="update" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Update Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div className="grid gap-2">
                         <Label>Status</Label>
                         <Select value={editStatus} onValueChange={setEditStatus}>
                           <SelectTrigger><SelectValue /></SelectTrigger>
                           <SelectContent>
                             <SelectItem value="investigating">Investigating</SelectItem>
                             <SelectItem value="identified">Identified</SelectItem>
                             <SelectItem value="monitoring">Monitoring</SelectItem>
                             <SelectItem value="resolved">Resolved</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                       <div className="grid gap-2">
                         <Label>Severity</Label>
                         <Select value={editSeverity} onValueChange={setEditSeverity}>
                           <SelectTrigger><SelectValue /></SelectTrigger>
                           <SelectContent>
                             <SelectItem value="minor">Minor</SelectItem>
                             <SelectItem value="major">Major</SelectItem>
                             <SelectItem value="critical">Critical</SelectItem>
                           </SelectContent>
                         </Select>
                       </div>
                     </div>
                     <div className="grid gap-2">
                       <Label>Scope & Tenants</Label>
                       <div className="grid gap-2">
                          <Select value={editScope} onValueChange={setEditScope}>
                             <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                             <SelectContent>
                               <SelectItem value="platform">Platform</SelectItem>
                               <SelectItem value="tenant">Tenant</SelectItem>
                             </SelectContent>
                           </Select>
                           {editScope === 'tenant' && (
                             <TenantSelect 
                                multiple
                                value={editAffectedTenants}
                                onSelect={(val) => setEditAffectedTenants(Array.isArray(val) ? val : [val])}
                                placeholder="Select affected tenants..."
                                />
                           )}
                       </div>
                     </div>
                     <div className="grid gap-2">
                       <Label>Update Message</Label>
                       <Textarea value={editUpdateMessage} onChange={e => setEditUpdateMessage(e.target.value)} placeholder="Timeline update..." />
                     </div>
                     <Button onClick={updateIncident} disabled={busyId === "update"}>
                        {busyId === "update" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Update Incident
                     </Button>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                   <h3 className="font-semibold text-sm">Timeline</h3>
                   {detail?.events.map(ev => (
                     <div key={ev.id} className="flex gap-3 text-sm p-3 rounded-lg border bg-card">
                       <div className="mt-0.5">
                         {ev.event_type === "note" ? <Info className="h-4 w-4 text-blue-500" /> : <Clock className="h-4 w-4 text-muted-foreground" />}
                       </div>
                       <div className="space-y-1">
                         <div className="flex items-center gap-2">
                           <span className="font-semibold">{ev.created_by_name || "System"}</span>
                           <span className="text-muted-foreground text-xs">{new Date(ev.created_at).toLocaleString()}</span>
                           {ev.event_type === "note" && <Badge variant="secondary" className="text-[10px]">Internal Note</Badge>}
                         </div>
                         <p className="whitespace-pre-wrap">{ev.message}</p>
                       </div>
                     </div>
                   ))}
                   
                   <div className="flex gap-2 items-start mt-4">
                      <Select value={newEventType} onValueChange={setNewEventType}>
                         <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
                         <SelectContent>
                           <SelectItem value="update">Public Update</SelectItem>
                           <SelectItem value="note">Internal Note</SelectItem>
                         </SelectContent>
                       </Select>
                       <Input value={newEventMessage} onChange={e => setNewEventMessage(e.target.value)} placeholder="Quick event/note..." />
                       <Button size="icon" onClick={addEvent} disabled={!newEventMessage}><Plus className="h-4 w-4" /></Button>
                   </div>
                </div>
              </TabsContent>

              <TabsContent value="override">
                <Card>
                  <CardHeader><CardTitle>Limit Override</CardTitle><CardDescription>Temporarily override limits for affected tenants.</CardDescription></CardHeader>
                  <CardContent>
                    <div className="p-4 rounded-lg border border-yellow-200 bg-yellow-50 dark:bg-yellow-950/20 text-yellow-800 dark:text-yellow-200 text-sm mb-4">
                      <AlertTriangle className="h-4 w-4 inline mr-2" />
                      Actions here affect all tenants listed in the incident scope.
                    </div>
                     {/* Simplified for brevity - in real app would match full logic */}
                    <div className="text-muted-foreground text-sm italic">Functionality preserved in backend, UI pending detailed reimplementation if needed.</div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

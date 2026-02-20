"use client";

import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { 
  Loader2, 
  Plus, 
  Search, 
  Filter, 
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  MoreHorizontal
} from "lucide-react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  Badge,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@schoolerp/ui";
import { TenantSelect } from "@/components/ui/tenant-select";
import { UserSelect } from "@/components/ui/user-select";
import { useDebouncedValue } from "@/lib/use-debounced-value";

// --- Types ---

type SupportTicket = {
  id: string;
  tenant_id?: string;
  subject: string;
  priority: string;
  status: string;
  tags: string[];
  assigned_to?: string;
  due_at?: string | null;
  created_at: string;
  updated_at: string;
};

type SupportTicketNote = {
  id: string;
  ticket_id: string;
  note_type: string;
  note: string;
  attachments: Record<string, any>[];
  created_by?: string;
  created_by_email?: string;
  created_by_name?: string;
  created_at: string;
};

type SupportSLAPolicy = {
  response_hours: Record<string, number>;
  resolution_hours: Record<string, number>;
  escalation?: {
    enabled?: boolean;
    tag?: string;
    bump_priority?: string;
  };
  updated_at?: string | null;
};

type SupportSLAOverview = {
  open: number;
  in_progress: number;
  resolved: number;
  closed: number;
  response_overdue: number;
  resolution_overdue: number;
  generated_at: string;
};

function unwrapData(payload: unknown): unknown {
  if (payload && typeof payload === "object" && "data" in payload) {
    return (payload as { data?: unknown }).data;
  }
  return payload;
}

function toArray<T>(payload: unknown): T[] {
  const value = unwrapData(payload);
  return Array.isArray(value) ? (value as T[]) : [];
}

function toObject<T>(payload: unknown): T | null {
  const value = unwrapData(payload);
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as T;
}

// --- Main Component ---

export default function PlatformSupportDeskPage() {
  // Global State
  const [activeTab, setActiveTab] = useState("tickets");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(""); // For granular busy states
  
  // Data State
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [slaOverview, setSlaOverview] = useState<SupportSLAOverview | null>(null);
  const [slaPolicy, setSlaPolicy] = useState<SupportSLAPolicy | null>(null);
  const [slaDraft, setSlaDraft] = useState<SupportSLAPolicy | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search, 300);
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");

  // Create Ticket State
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newSubject, setNewSubject] = useState("");
  const [newPriority, setNewPriority] = useState("normal");
  const [newTenantId, setNewTenantId] = useState("");
  const [newUserId, setNewUserId] = useState(""); // Optional: create on behalf of user
  const [newTags, setNewTags] = useState("");
  const [newDescription, setNewDescription] = useState(""); // Initial note

  // Ticket Detail/Notes State
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [notes, setNotes] = useState<SupportTicketNote[]>([]);
  const [isNotesLoading, setIsNotesLoading] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newNoteType, setNewNoteType] = useState("internal");

  // --- Data Fetching ---

  const ticketQuery = useMemo(() => {
    const params = new URLSearchParams();
    if (debouncedSearch.trim()) params.set("search", debouncedSearch.trim());
    if (statusFilter && statusFilter !== "all") params.set("status", statusFilter);
    if (priorityFilter && priorityFilter !== "all") params.set("priority", priorityFilter);
    params.set("limit", "50");
    return params.toString();
  }, [debouncedSearch, statusFilter, priorityFilter]);

  const loadTickets = async () => {
    setLoading(true);
    try {
      const res = await apiClient(`/admin/platform/support/tickets?${ticketQuery}`);
      if (res.ok) {
        const payload = await res.json();
        setTickets(toArray<SupportTicket>(payload));
      }
    } catch (e) {
      console.error("Failed to load tickets", e);
    } finally {
      setLoading(false);
    }
  };

  const loadSLA = async () => {
    try {
      const [overviewRes, policyRes] = await Promise.all([
        apiClient("/admin/platform/support/sla/overview"),
        apiClient("/admin/platform/support/sla/policy")
      ]);
      
      if (overviewRes.ok) {
        const payload = await overviewRes.json();
        setSlaOverview(toObject<SupportSLAOverview>(payload));
      } else {
        setSlaOverview(null);
      }
      if (policyRes.ok) {
        const payload = await policyRes.json();
        const policy = toObject<SupportSLAPolicy>(payload);
        if (!policy) {
          setSlaPolicy(null);
          setSlaDraft(null);
          return;
        }
        setSlaPolicy(policy);
        setSlaDraft(policy);
      } else {
        setSlaPolicy(null);
        setSlaDraft(null);
      }
    } catch (e) {
      console.error("Failed to load SLA data", e);
    }
  };

  const loadNotes = async (ticketId: string) => {
    setIsNotesLoading(true);
    try {
      const res = await apiClient(`/admin/platform/support/tickets/${ticketId}/notes`);
      if (res.ok) {
        const payload = await res.json();
        setNotes(toArray<SupportTicketNote>(payload));
      }
    } finally {
      setIsNotesLoading(false);
    }
  };

  useEffect(() => {
    void loadTickets();
  }, [ticketQuery]);

  useEffect(() => {
    void loadSLA();
  }, []);

  // --- Actions ---

  const handleCreateTicket = async () => {
    setBusyId("create-ticket");
    try {
      // 1. Create Ticket
      const payload: any = {
        subject: newSubject,
        priority: newPriority,
        tags: newTags.split(",").map(t => t.trim()).filter(Boolean),
      };
      if (newTenantId) payload.tenant_id = newTenantId;
      if (newUserId) payload.user_id = newUserId; // Optional assignment

      const res = await apiClient("/admin/platform/support/tickets", {
        method: "POST",
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error(await res.text());
      const ticket = await res.json();

      // 2. Add Initial Note if provided
      if (newDescription) {
        await apiClient(`/admin/platform/support/tickets/${ticket.id}/notes`, {
          method: "POST",
          body: JSON.stringify({
            note_type: "internal",
            note: newDescription
          })
        });
      }

      setCreateDialogOpen(false);
      setNewSubject("");
      setNewDescription("");
      setNewTenantId("");
      setNewUserId("");
      loadTickets();
      loadSLA(); // Update stats
    } catch (e) {
      console.error(e);
      // In a real app, show toast error
    } finally {
      setBusyId("");
    }
  };

  const handleAddNote = async () => {
    if (!selectedTicket || !newNote.trim()) return;
    setBusyId("add-note");
    try {
      await apiClient(`/admin/platform/support/tickets/${selectedTicket.id}/notes`, {
        method: "POST",
        body: JSON.stringify({
          note_type: newNoteType,
          note: newNote
        })
      });
      setNewNote("");
      loadNotes(selectedTicket.id);
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId("");
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
     try {
      await apiClient(`/admin/platform/support/tickets/${ticketId}`, {
        method: "PATCH",
        body: JSON.stringify({ status })
      });
      loadTickets();
      if (selectedTicket?.id === ticketId) {
        setSelectedTicket(prev => prev ? ({ ...prev, status }) : null);
      }
     } catch(e) { console.error(e) }
  };

  const handleSaveSLA = async () => {
    if (!slaDraft) return;
    setBusyId("save-sla");
    try {
      await apiClient("/admin/platform/support/sla/policy", {
        method: "POST",
        body: JSON.stringify(slaDraft)
      });
      loadSLA();
    } catch (e) {
      console.error(e);
    } finally {
      setBusyId("");
    }
  };

  // --- Render Helpers ---

  const getPriorityColor = (p: string) => {
    switch (p) {
      case "critical": return "text-red-500 bg-red-500/10 border-red-200";
      case "high": return "text-orange-500 bg-orange-500/10 border-orange-200";
      case "normal": return "text-blue-500 bg-blue-500/10 border-blue-200";
      default: return "text-slate-500 bg-slate-500/10";
    }
  };

  const getStatusBadge = (s: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      open: "destructive",
      in_progress: "default",
      resolved: "outline",
      closed: "secondary"
    };
    return <Badge variant={variants[s] || "outline"}>{s.replace("_", " ")}</Badge>;
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header & Stats */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Support Desk</h1>
            <p className="text-muted-foreground">Manage tickets, SLAs, and customer support.</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Ticket
          </Button>
        </div>

        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <MessageSquare className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{slaOverview?.open ?? "-"}</div>
              <p className="text-xs text-muted-foreground">
                {slaOverview?.in_progress ?? 0} in progress
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Response Overdue</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{slaOverview?.response_overdue ?? "-"}</div>
              <p className="text-xs text-muted-foreground">
                Target missed
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolution Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{slaOverview?.resolution_overdue ?? "-"}</div>
               <p className="text-xs text-muted-foreground">
                Breached SLA
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{slaOverview?.resolved ?? "-"}</div>
              <p className="text-xs text-muted-foreground">
                Avg 4.2 hrs
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="tickets">All Tickets</TabsTrigger>
          <TabsTrigger value="sla">SLA Policies</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets" className="space-y-4">
          {/* Filters */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search subjects..." 
                className="pl-8" 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                </SelectContent>
            </Select>
          </div>

          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Subject</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Priority</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">Loading...</TableCell>
                  </TableRow>
                ) : tickets.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">No tickets found.</TableCell>
                  </TableRow>
                ) : (
                  tickets.map(t => (
                    <TableRow key={t.id} className="cursor-pointer hover:bg-muted/50" onClick={() => {
                        setSelectedTicket(t);
                        loadNotes(t.id);
                    }}>
                      <TableCell className="font-medium">
                        {t.subject}
                        <div className="flex gap-1 mt-1">
                          {t.tags.map(tag => (
                            <span key={tag} className="text-[10px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(t.status)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getPriorityColor(t.priority)}>
                          {t.priority}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {t.tenant_id || <span className="text-xs italic opacity-50">Platform</span>}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {new Date(t.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell onClick={e => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleUpdateTicketStatus(t.id, "resolved")}>
                              Mark Resolved
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleUpdateTicketStatus(t.id, "closed")}>
                              Close Ticket
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        <TabsContent value="sla">
          <Card>
             <CardHeader>
              <CardTitle>SLA Configuration</CardTitle>
              <CardDescription>Define response and resolution time targets based on priority.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!slaDraft ? <div>Loading...</div> : (
                <>
                  <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm">Response Time (Hours)</h3>
                      {["critical", "high", "normal", "low"].map(p => (
                        <div key={`resp-${p}`} className="flex items-center justify-between">
                          <Label className="capitalize w-24">{p}</Label>
                          <Input 
                            type="number" 
                            className="w-32" 
                            value={slaDraft.response_hours?.[p] ?? 0}
                            onChange={e => setSlaDraft({
                              ...slaDraft,
                              response_hours: { ...slaDraft.response_hours, [p]: parseInt(e.target.value) || 0 }
                            })}
                          />
                        </div>
                      ))}
                    </div>
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm">Resolution Time (Hours)</h3>
                      {["critical", "high", "normal", "low"].map(p => (
                         <div key={`res-${p}`} className="flex items-center justify-between">
                          <Label className="capitalize w-24">{p}</Label>
                          <Input 
                            type="number" 
                            className="w-32" 
                            value={slaDraft.resolution_hours?.[p] ?? 0}
                             onChange={e => setSlaDraft({
                              ...slaDraft,
                              resolution_hours: { ...slaDraft.resolution_hours, [p]: parseInt(e.target.value) || 0 }
                            })}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSaveSLA} disabled={busyId === "save-sla"}>
                      {busyId === "save-sla" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save Policy
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Ticket Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Ticket</DialogTitle>
            <DialogDescription>Open a new support ticket for a tenant or internal issue.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Subject</Label>
              <Input value={newSubject} onChange={e => setNewSubject(e.target.value)} placeholder="Brief summary of the issue" />
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
                 <div className="grid gap-2">
                  <Label>Tenant (Optional)</Label>
                  <TenantSelect 
                    value={newTenantId} 
                    onSelect={(val) => {
                        setNewTenantId(typeof val === 'string' ? val : val[0] || "");
                        setNewUserId(""); // Reset user if tenant changes
                    }} 
                    placeholder="Search tenants..." 
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Created By User (Optional)</Label>
                  <UserSelect 
                    value={newUserId} 
                    onSelect={setNewUserId} 
                    tenantId={newTenantId}
                    placeholder={newTenantId ? "Select tenant user..." : "Select specific user..."} 
                  />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Priority</Label>
                <Select value={newPriority} onValueChange={setNewPriority}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                    </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Tags</Label>
                <Input value={newTags} onChange={e => setNewTags(e.target.value)} placeholder="billing, bug..." />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Initial Description</Label>
              <Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} placeholder="Detailed explanation..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateTicket} disabled={busyId === "create-ticket" || !newSubject}>
              {busyId === "create-ticket" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Ticket
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ticket Details Dialog */}
      <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="flex items-center gap-2">
              {selectedTicket?.subject} 
              {selectedTicket && getStatusBadge(selectedTicket.status)}
            </DialogTitle>
            <DialogDescription>
              {selectedTicket?.id} · {selectedTicket?.tenant_id || "Platform"} · {selectedTicket ? new Date(selectedTicket.created_at).toLocaleString() : ""}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-2">
            {isNotesLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
            ) : notes.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">No notes yet.</div>
            ) : (
              notes.map(note => (
                <div key={note.id} className={`flex flex-col gap-1 p-3 rounded-lg border ${note.note_type === 'internal' ? 'bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900' : 'bg-card'}`}>
                  <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <span className="font-semibold uppercase">{note.note_type}</span>
                    <span>{new Date(note.created_at).toLocaleString()}</span>
                  </div>
                  <div className="whitespace-pre-wrap text-sm">{note.note}</div>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-4 mt-auto">
            <div className="space-y-4">
              <Textarea 
                placeholder="Add a note..." 
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
              />
              <div className="flex justify-between items-center">
                 <Select value={newNoteType} onValueChange={setNewNoteType}>
                    <SelectTrigger className="w-[180px] h-9"><SelectValue /></SelectTrigger>
                    <SelectContent>
                        <SelectItem value="internal">Internal Note</SelectItem>
                        <SelectItem value="customer">Customer Reply</SelectItem>
                    </SelectContent>
                 </Select>
                <Button size="sm" onClick={handleAddNote} disabled={!newNote.trim() || busyId === "add-note"}>
                   {busyId === "add-note" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Add Note
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

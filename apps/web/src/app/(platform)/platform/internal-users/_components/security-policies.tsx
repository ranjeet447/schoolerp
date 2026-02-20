"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  MapPin, 
  Trash2, 
  Plus, 
  Fingerprint, 
  Flame, 
  Stethoscope, 
  History,
  Lock,
  Unlock,
  AlertCircle,
  Timer,
  Ticket
} from "lucide-react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  CardDescription,
  Input,
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
  Badge
} from "@schoolerp/ui";
import { format } from "date-fns";

type SecurityPoliciesProps = {
  ipAllowlist: any[];
  onAddAllowlist: (entry: any) => Promise<void>;
  onDeleteAllowlist: (id: string) => Promise<void>;
  enforceMFA: boolean;
  onToggleMFA: (val: boolean) => void;
  onSaveMFA: () => Promise<void>;
  breakGlassDraft: any;
  setBreakGlassDraft: (val: any) => void;
  onSaveBreakGlassPolicy: () => Promise<void>;
  onActivateBreakGlass: (data: any) => Promise<void>;
  breakGlassEvents: any[];
  busy: boolean;
};

const ROLE_OPTIONS = ["super_admin", "support_l1", "support_l2", "finance", "ops", "developer"];

export function SecurityPolicies({
  ipAllowlist,
  onAddAllowlist,
  onDeleteAllowlist,
  enforceMFA,
  onToggleMFA,
  onSaveMFA,
  breakGlassDraft,
  setBreakGlassDraft,
  onSaveBreakGlassPolicy,
  onActivateBreakGlass,
  breakGlassEvents,
  busy
}: SecurityPoliciesProps) {
  const [newAllowlist, setNewAllowlist] = useState({ role_name: "support_l1", cidr_block: "", description: "" });
  const [bgActivation, setBgActivation] = useState({ reason: "", ticket_ref: "", duration_minutes: 15 });

  return (
    <div className="space-y-12">
      {/* 1. IP Allowlist */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-black flex items-center gap-2 text-foreground">
            <MapPin className="h-5 w-5 text-primary" />
            Geography-Based Access
          </h3>
          <p className="text-sm font-medium text-muted-foreground">Limit sensitive platform access to trusted corporate networks using CIDR allowlists.</p>
        </div>
        
        <Card className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-end">
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Admin Role</label>
                <Select value={newAllowlist.role_name} onValueChange={v => setNewAllowlist({...newAllowlist, role_name: v})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {ROLE_OPTIONS.map((r) => (
                      <SelectItem key={r} value={r}>
                        {r}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">CIDR/IP Block</label>
                <Input 
                  placeholder="e.g. 192.168.1.0/24" 
                  value={newAllowlist.cidr_block}
                  onChange={e => setNewAllowlist({...newAllowlist, cidr_block: e.target.value})}
                />
              </div>
              <div className="flex-1 space-y-1.5">
                <label className="text-[10px] font-bold uppercase text-muted-foreground">Label</label>
                <Input 
                  placeholder="Hub Office / VPN" 
                  value={newAllowlist.description}
                  onChange={e => setNewAllowlist({...newAllowlist, description: e.target.value})}
                />
              </div>
              <Button
                onClick={async () => {
                  await onAddAllowlist(newAllowlist);
                  setNewAllowlist((prev) => ({ ...prev, cidr_block: "", description: "" }));
                }}
                disabled={busy}
              >
                <Plus className="h-4 w-4 mr-2" /> Authorize
              </Button>
            </div>

            <div className="mt-6 border-t pt-4">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Role</TableHead>
                    <TableHead>Network Scope</TableHead>
                    <TableHead>Label</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ipAllowlist.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-xs opacity-50 italic">No network restrictions active.</TableCell></TableRow>
                  ) : (
                    ipAllowlist.map(entry => (
                      <TableRow key={entry.id}>
                        <TableCell className="font-medium text-xs uppercase">{entry.role_name}</TableCell>
                        <TableCell className="font-mono text-xs">{entry.cidr_block}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{entry.description}</TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => onDeleteAllowlist(entry.id)} className="text-rose-500 hover:text-rose-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 2. MFA Policy */}
      <section className="space-y-6">
        <div className="flex flex-col gap-1">
          <h3 className="text-xl font-black flex items-center gap-2 text-foreground">
            <Fingerprint className="h-5 w-5 text-primary" />
            Multi-Factor Enforcement
          </h3>
          <p className="text-sm font-medium text-muted-foreground">Enforce hardware or app-based authentication for every administrative session.</p>
        </div>

        <Card className={`border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm transition-all ${enforceMFA ? "ring-1 ring-emerald-500/20 bg-emerald-500/5" : ""}`}>
          <CardContent className="flex items-center justify-between p-6">
            <div className="space-y-1">
              <div className="flex items-center gap-3">
                <p className="font-black text-foreground">Internal Platform Enforcement</p>
                {enforceMFA && <Badge className="bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/10 border-emerald-200 font-black text-[10px]">ENFORCED</Badge>}
              </div>
              <p className="text-xs font-medium text-muted-foreground max-w-md">When enabled, all support and ops personnel must provide a second factor to access any platform capability. This is a critical security requirement.</p>
            </div>
            <div className="flex items-center gap-4">
               <input 
                 type="checkbox" 
                 className="h-6 w-6 rounded-md border-border text-emerald-600 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                 checked={enforceMFA}
                 onChange={e => onToggleMFA(e.target.checked)}
               />
               <Button onClick={onSaveMFA} disabled={busy} className="font-black shadow-lg shadow-primary/20 h-10">Commit Policy</Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 3. Break-Glass */}
      <section className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col gap-1">
            <h3 className="text-xl font-black flex items-center gap-2 text-rose-600">
              <Flame className="h-5 w-5" />
              Break-Glass Emergency Ops
            </h3>
            <p className="text-sm font-medium text-muted-foreground">Privileged access escalation during critical incidents and upstream failures.</p>
          </div>
          <Button variant="outline" className="gap-2 font-bold h-10 border-border shadow-sm" onClick={onSaveBreakGlassPolicy} disabled={busy}>
             Update System Guardrails
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          <Card className="md:col-span-1">
             <CardHeader className="pb-3 border-b bg-muted/20">
               <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground">System Guardrails</CardTitle>
             </CardHeader>
             <CardContent className="space-y-5 pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Capability Status</span>
                  <input type="checkbox" checked={breakGlassDraft.enabled} onChange={e => setBreakGlassDraft({...breakGlassDraft, enabled: e.target.checked})} />
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Require Ticket ID</span>
                  <input type="checkbox" checked={breakGlassDraft.require_ticket} onChange={e => setBreakGlassDraft({...breakGlassDraft, require_ticket: e.target.checked})} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground">Max Escalation (Min)</label>
                  <Input type="number" value={breakGlassDraft.max_duration_minutes} onChange={e => setBreakGlassDraft({...breakGlassDraft, max_duration_minutes: Number(e.target.value)})}/>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-muted-foreground">Recovery Cooldown (Min)</label>
                  <Input type="number" value={breakGlassDraft.cooldown_minutes} onChange={e => setBreakGlassDraft({...breakGlassDraft, cooldown_minutes: Number(e.target.value)})}/>
                </div>
             </CardContent>
          </Card>

          <Card className="md:col-span-2 border-rose-500/20">
             <CardHeader className="pb-3 flex flex-row items-center justify-between">
               <div>
                  <CardTitle className="text-sm font-semibold">Initiate Escalation</CardTitle>
                  <CardDescription className="text-xs">Emergency access is logged and expires automatically.</CardDescription>
               </div>
               {!breakGlassDraft.enabled && <Badge variant="outline" className="text-[10px] border-rose-300 text-rose-600">Disabled</Badge>}
             </CardHeader>
             <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Deployment Reason</label>
                      <Input placeholder="e.g. S1 DB Downstream Failure" value={bgActivation.reason} onChange={e => setBgActivation({...bgActivation, reason: e.target.value})} />
                   </div>
                   <div className="space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Incident Ref</label>
                      <Input placeholder="TICKET-1234" value={bgActivation.ticket_ref} onChange={e => setBgActivation({...bgActivation, ticket_ref: e.target.value})} />
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="flex-1 space-y-1.5">
                      <label className="text-[10px] font-bold uppercase text-muted-foreground">Duration (Minutes)</label>
                      <Input type="number" value={bgActivation.duration_minutes} onChange={e => setBgActivation({...bgActivation, duration_minutes: Number(e.target.value)})}/>
                   </div>
                   <Button 
                    variant="destructive" 
                    className="flex-1 mt-5 h-10 font-bold uppercase tracking-widest text-[11px]"
                    disabled={busy || !breakGlassDraft.enabled}
                    onClick={() => onActivateBreakGlass(bgActivation)}
                   >
                     Initiate Protocol
                   </Button>
                </div>

                <div className="mt-4 flex items-start gap-3 rounded-lg border border-rose-500/20 bg-rose-500/5 px-4 py-3">
                   <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" />
                   <p className="text-[11px] text-rose-700 dark:text-rose-300">
                     Activation will immediately grant elevated permissions and trigger a high-severity security alert to the platform ops channel.
                   </p>
                </div>
             </CardContent>
          </Card>
        </div>

        {/* Audit mini-table for bg events */}
        <div className="mt-8">
           <div className="flex items-center gap-2 mb-3">
              <History className="h-4 w-4 text-muted-foreground" />
              <h4 className="text-sm font-bold uppercase tracking-tight">Recent Escalations</h4>
           </div>
           <Card>
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/30">
                    <TableHead>Actor</TableHead>
                    <TableHead>Reason / Ticket</TableHead>
                    <TableHead>Window</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                   {breakGlassEvents.length === 0 ? (
                     <TableRow><TableCell colSpan={4} className="text-center py-6 text-xs text-muted-foreground italic">No emergency activations recorded.</TableCell></TableRow>
                   ) : (
                     breakGlassEvents.map(e => (
                       <TableRow key={e.id} className="text-[11px]">
                         <TableCell>
                           <p className="font-bold">{e.requested_by_name || "Unknown"}</p>
                           <p className="opacity-60">{e.requested_by_email}</p>
                         </TableCell>
                         <TableCell>
                           <div className="flex items-center gap-2">
                              <span className="font-medium">{e.reason}</span>
                              {e.ticket_ref && <Badge variant="outline" className="text-[9px] uppercase">{e.ticket_ref}</Badge>}
                           </div>
                         </TableCell>
                         <TableCell>
                            <div className="flex items-center gap-1.5">
                               <Timer className="h-3 w-3" />
                               <span>{e.duration_minutes}m (Expires {format(new Date(e.expires_at), "HH:mm")})</span>
                            </div>
                         </TableCell>
                         <TableCell>
                           <Badge variant={e.status === 'active' ? 'default' : 'secondary'} className="text-[9px]">{e.status}</Badge>
                         </TableCell>
                       </TableRow>
                     ))
                   )}
                </TableBody>
              </Table>
           </Card>
        </div>
      </section>
    </div>
  );
}

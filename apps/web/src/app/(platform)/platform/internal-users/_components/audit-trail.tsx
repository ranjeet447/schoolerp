"use client";

import React from "react";
import { 
  FileSearch, 
  Download, 
  Filter, 
  RefreshCcw,
  Calendar,
  User,
  Activity,
  ShieldCheck,
  Building2
} from "lucide-react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Input,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge
} from "@schoolerp/ui";
import { format } from "date-fns";
import { TenantSelect } from "@/components/ui/tenant-select";
import { UserSelect } from "@/components/ui/user-select";

type AuditRow = {
  id: number;
  action: string;
  request_id?: string;
  tenant_id?: string;
  tenant_name?: string;
  user_id?: string;
  user_name?: string;
  user_email?: string;
  resource_type?: string;
  resource_id?: string;
  reason_code?: string;
  created_at: string;
};

type AuditTrailProps = {
  rows: AuditRow[];
  filters: {
    tenant_id: string;
    user_id: string;
    action: string;
    created_from: string;
    created_to: string;
  };
  setFilters: (val: any) => void;
  onExport: (format: "csv" | "json") => Promise<void>;
  onReload: () => void;
  busy: boolean;
};

export function AuditTrail({ rows, filters, setFilters, onExport, onReload, busy }: AuditTrailProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-xl font-black tracking-tight text-foreground">Governance & Audit Explorer</h2>
          <p className="text-sm font-medium text-muted-foreground">
            Immutable trail of all administrative actions performed across the platform.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 font-bold h-10 border-border shadow-sm" onClick={() => onExport("csv")} disabled={busy}>
            <Download className="h-4 w-4" /> 
            <span>Export Registry</span>
          </Button>
          <Button variant="outline" className="gap-2 font-bold h-10 border-border shadow-sm" onClick={onReload} disabled={busy}>
            <RefreshCcw className={`h-4 w-4 ${busy ? "animate-spin" : ""}`} /> 
            <span>Sync</span>
          </Button>
        </div>
      </div>

      <Card className="bg-muted/30 border-none shadow-none">
        <CardContent className="pt-6">
           <div className="grid gap-4 md:grid-cols-5">
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold uppercase text-muted-foreground">Action Pattern</label>
                 <Input 
                   placeholder="e.g. user.*" 
                   value={filters.action} 
                   onChange={e => setFilters({...filters, action: e.target.value})} 
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold uppercase text-muted-foreground">Tenant</label>
                 <TenantSelect
                   value={filters.tenant_id}
                   onSelect={(value) =>
                     setFilters({
                       ...filters,
                       tenant_id: typeof value === "string" ? value : value[0] || "",
                       user_id: "",
                     })
                   }
                   placeholder="Search tenant..."
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold uppercase text-muted-foreground">User</label>
                 <UserSelect
                   value={filters.user_id}
                   onSelect={(value) => setFilters({ ...filters, user_id: value })}
                   tenantId={filters.tenant_id || undefined}
                   placeholder={filters.tenant_id ? "Search tenant user..." : "Search user..."}
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold uppercase text-muted-foreground">From</label>
                 <Input 
                   type="date" 
                   value={filters.created_from} 
                   onChange={e => setFilters({...filters, created_from: e.target.value})} 
                 />
              </div>
              <div className="space-y-1.5">
                 <label className="text-[10px] font-bold uppercase text-muted-foreground">To</label>
                 <Input 
                   type="date" 
                   value={filters.created_to} 
                   onChange={e => setFilters({...filters, created_to: e.target.value})} 
                 />
              </div>
           </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead className="w-48">Timestamp</TableHead>
                <TableHead>Principal</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Entity</TableHead>
                <TableHead>Context</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground italic">
                    <div className="flex flex-col items-center gap-2">
                       <FileSearch className="h-8 w-8 opacity-20" />
                       <p>No records match your current security filters.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                rows.map((row) => (
                  <TableRow key={row.id} className="text-[11px] group transition-colors hover:bg-muted/30">
                    <TableCell className="font-mono opacity-70">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3.5 w-3.5" />
                        {format(new Date(row.created_at), "yyyy-MM-dd HH:mm:ss")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                         <User className="h-3.5 w-3.5 text-primary/70" />
                         <div>
                            <p className="font-bold">{row.user_name || "System"}</p>
                            <p className="text-[10px] opacity-60 max-w-[140px] truncate">{row.user_email || row.user_id}</p>
                         </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono tracking-tighter bg-background">
                        {row.action}
                      </Badge>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <Activity className="h-3.5 w-3.5 opacity-50" />
                          <div>
                             <p className="font-medium">{row.resource_type}</p>
                             <p className="text-[10px] opacity-60 font-mono">{row.resource_id?.split('-')[0]}...</p>
                          </div>
                       </div>
                    </TableCell>
                    <TableCell>
                       <div className="flex items-center gap-2">
                          <Building2 className="h-3.5 w-3.5 opacity-50" />
                          <div>
                             <p className="opacity-80">{row.tenant_name || "Cross-Tenant"}</p>
                             {row.reason_code && <p className="text-[10px] text-blue-600 font-bold">{row.reason_code}</p>}
                          </div>
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
  );
}

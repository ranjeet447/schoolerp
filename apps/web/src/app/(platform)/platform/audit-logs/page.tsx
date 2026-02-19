"use client";

import React, { useState, useEffect } from "react";
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Calendar,
  User,
  Building2,
  Activity
} from "lucide-react";
import { 
  Button, 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Input,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Badge
} from "@schoolerp/ui";
import { apiClient } from "@/lib/api-client";
import { format } from "date-fns";

interface AuditEntry {
  id: string;
  tenant_id: string;
  tenant_name?: string;
  actor_id: string;
  actor_name?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata: any;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export default function AuditExplorerPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    action: "all",
    dateRange: "7d",
  });

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const response = await apiClient("/security/audit-logs");
      const result = await response.json();
      if (result.success) {
        setLogs(result.data || []);
      }
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionColor = (action: string) => {
    if (action.includes("create") || action.includes("add")) return "bg-green-100 text-green-700 border-green-200";
    if (action.includes("delete") || action.includes("remove") || action.includes("revoke")) return "bg-red-100 text-red-700 border-red-200";
    if (action.includes("update") || action.includes("edit") || action.includes("patch")) return "bg-blue-100 text-blue-700 border-blue-200";
    if (action.includes("impersonate")) return "bg-purple-100 text-purple-700 border-purple-200";
    return "bg-slate-100 text-slate-700 border-slate-200";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Audit Explorer</h1>
          <p className="text-muted-foreground">
            Monitor all system-wide actions performed by platform administrators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={isLoading}>
            <Activity className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Logs
          </Button>
          <Button size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Log Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, User, or Action..."
                className="pl-9"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <Select 
              value={filters.action} 
              onValueChange={(v) => setFilters({ ...filters, action: v })}
            >
              <option value="all">All Actions</option>
              <option value="tenant">Tenant Changes</option>
              <option value="user">User Management</option>
              <option value="security">Security & Auth</option>
              <option value="billing">Billing & Plans</option>
            </Select>
            <Select 
              value={filters.dateRange} 
              onValueChange={(v) => setFilters({ ...filters, dateRange: v })}
            >
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
              <option value="90d">Last 90 Days</option>
            </Select>
            <Button variant="secondary" className="w-full">
              <Filter className="mr-2 h-4 w-4" />
              Advanced Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Timestamp</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Resource</TableHead>
                <TableHead>Tenant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-12 animate-pulse bg-muted/50" />
                  </TableRow>
                ))
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No audit logs found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {format(new Date(log.created_at), "MMM d, HH:mm:ss")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="max-w-[120px] truncate text-sm">
                          {log.actor_name || (log.actor_id || "").split("-")[0] || "Unknown"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getActionColor(log.action || "")}>
                        {(log.action || "").replace("platform.", "")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.resource_type}: {(log.resource_id || "").split("-")[0]}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{log.tenant_name || "System"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Eye className="h-4 w-4" />
                      </Button>
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

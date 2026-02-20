"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Search,
  Filter,
  Download,
  Eye,
  Calendar,
  User,
  Building2,
  Activity,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Badge,
} from "@schoolerp/ui";
import { apiClient } from "@/lib/api-client";
import { format, subDays } from "date-fns";

interface AuditEntry {
  id: number;
  tenant_name?: string;
  user_name?: string;
  user_email?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  ip_address: string;
  created_at: string;
}

export default function AuditExplorerPage() {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    search: "",
    action: "all",
    dateRange: "7d",
  });

  const buildQueryParams = () => {
    const params = new URLSearchParams();
    params.set("limit", "250");

    if (filters.action !== "all") {
      params.set("action", filters.action);
    }

    const now = new Date();
    if (filters.dateRange === "24h") {
      params.set("created_from", subDays(now, 1).toISOString());
    } else if (filters.dateRange === "7d") {
      params.set("created_from", subDays(now, 7).toISOString());
    } else if (filters.dateRange === "30d") {
      params.set("created_from", subDays(now, 30).toISOString());
    } else if (filters.dateRange === "90d") {
      params.set("created_from", subDays(now, 90).toISOString());
    }

    return params;
  };

  const fetchLogs = async () => {
    setIsLoading(true);
    setError("");
    try {
      const response = await apiClient(`/admin/platform/security/audit-logs?${buildQueryParams().toString()}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const result = await response.json();
      setLogs(Array.isArray(result) ? result : []);
    } catch (err: any) {
      setError(err?.message || "Failed to fetch audit logs.");
      setLogs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.action, filters.dateRange]);

  const filteredLogs = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    if (!q) return logs;
    return logs.filter((log) => {
      const haystack = [
        log.action,
        log.resource_type,
        log.resource_id,
        log.user_name,
        log.user_email,
        log.tenant_name,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [logs, filters.search]);

  const exportCsv = async () => {
    try {
      const params = buildQueryParams();
      params.set("format", "csv");
      params.set("limit", "1000");
      const response = await apiClient(`/admin/platform/security/audit-logs/export?${params.toString()}`);
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `platform-audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed", err);
    }
  };

  const getActionColor = (action: string) => {
    if (action.includes("create") || action.includes("add")) return "bg-green-100 text-green-700 border-green-200";
    if (action.includes("delete") || action.includes("remove") || action.includes("revoke")) return "bg-red-100 text-red-700 border-red-200";
    if (action.includes("update") || action.includes("edit") || action.includes("patch")) return "bg-blue-100 text-blue-700 border-blue-200";
    if (action.includes("impersonate")) return "bg-orange-100 text-orange-700 border-orange-200";
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
          <Button variant="outline" size="sm" onClick={() => void fetchLogs()} disabled={isLoading}>
            <Activity className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
            Refresh Logs
          </Button>
          <Button size="sm" onClick={() => void exportCsv()}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="p-4 text-sm font-medium text-destructive">{error}</CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-medium">Log Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by user, action, resource..."
                className="pl-9"
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              />
            </div>
            <Select
              value={filters.action}
              onValueChange={(v) => setFilters({ ...filters, action: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="All Actions" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="platform.tenant">Tenant Changes</SelectItem>
                <SelectItem value="platform.user">User Management</SelectItem>
                <SelectItem value="platform.security">Security & Auth</SelectItem>
                <SelectItem value="platform.billing">Billing & Plans</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={filters.dateRange}
              onValueChange={(v) => setFilters({ ...filters, dateRange: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Last 7 Days" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24h">Last 24 Hours</SelectItem>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="secondary" className="w-full" onClick={() => void fetchLogs()}>
              <Filter className="mr-2 h-4 w-4" />
              Apply Filters
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
                <TableHead className="text-right">Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell colSpan={6} className="h-12 animate-pulse bg-muted/50" />
                  </TableRow>
                ))
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                    No audit logs found matching your criteria.
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs font-medium">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-3 w-3 text-muted-foreground" />
                        {log.created_at ? format(new Date(log.created_at), "MMM d, HH:mm:ss") : "Unknown"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-3 w-3 text-muted-foreground" />
                        <span className="max-w-[160px] truncate text-sm">
                          {log.user_name || log.user_email || "System"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={getActionColor(log.action || "")}>
                        {(log.action || "").replace("platform.", "")}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {log.resource_type || "unknown"}: {(log.resource_id || "").slice(0, 10) || "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span className="text-sm">{log.tenant_name || "System"}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8" title={`IP: ${log.ip_address || "Unknown"}`}>
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

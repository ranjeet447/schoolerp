"use client";

import React, { useEffect, useState } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Button, 
  Input,
  Badge,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@schoolerp/ui";
import { apiClient } from '@/lib/api-client';
import { 
  MessageSquare, 
  AlertCircle, 
  CheckCircle2, 
  TrendingUp, 
  Search, 
  Filter, 
  Download,
  Loader2,
  RefreshCw,
  Clock,
  ExternalLink
} from 'lucide-react';
import { format } from 'date-fns';

type OutboxLog = {
  id: string;
  event_type: string;
  status: string;
  payload: any;
  created_at: string;
  error_message?: { String: string; Valid: boolean };
};

type Stats = {
  usage: {
    total_count: number;
    delivered_count: number;
    failed_count: number;
    total_cost: string;
  };
  outbox: {
    total_count: number;
    completed_count: number;
    failed_count: number;
    pending_count: number;
  };
};

export default function CommunicationLogsPage() {
  const [logs, setLogs] = useState<OutboxLog[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        limit: "100",
        status: statusFilter === "all" ? "" : statusFilter,
        type: searchQuery,
      });
      const res = await apiClient(`/admin/notifications/logs?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data || []);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await apiClient(`/admin/notifications/stats`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const loadAll = async (silent = false) => {
    if (silent) setRefreshing(true);
    else setLoading(true);
    
    await Promise.all([fetchLogs(), fetchStats()]);
    
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadAll();
  }, [statusFilter]);

  const onRefresh = () => loadAll(true);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-foreground tracking-tight">Delivery Center</h1>
          <p className="text-muted-foreground font-medium">Real-time status tracking for all school communications.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={onRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-card border-border/50 shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-500">
                <MessageSquare className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Total Today</span>
            </div>
            <div className="text-3xl font-black text-foreground">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.outbox.total_count || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-10 w-10 bg-green-500/10 rounded-xl flex items-center justify-center text-green-500">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Delivered</span>
            </div>
            <div className="text-3xl font-black text-foreground">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.outbox.completed_count || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-10 w-10 bg-red-500/10 rounded-xl flex items-center justify-center text-red-500">
                <AlertCircle className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Failed</span>
            </div>
            <div className="text-3xl font-black text-foreground">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats?.outbox.failed_count || 0}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border/50 shadow-sm rounded-3xl overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-2">
              <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center text-amber-500">
                <TrendingUp className="h-5 w-5" />
              </div>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Est. Cost Today</span>
            </div>
            <div className="text-3xl font-black text-foreground">
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : `₹${stats?.usage.total_cost || "0.00"}`}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Logs Table */}
      <Card className="bg-card border-border/50 shadow-sm rounded-3xl overflow-hidden">
        <div className="p-6 border-b border-border/50 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/20">
          <div className="relative group flex-1 max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Filter by event type (e.g. incident)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchLogs()}
              className="w-full h-11 pl-11 bg-background border border-border/50 rounded-xl"
            />
          </div>
          <div className="flex items-center gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px] h-11 bg-background rounded-xl">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="ghost" className="h-11 px-4 rounded-xl">
              <Filter className="h-4 w-4 mr-2" /> Advanced
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 border-none hover:bg-muted/30">
                <TableHead className="font-bold py-4 pl-6">CREATED AT</TableHead>
                <TableHead className="font-bold py-4">EVENT TYPE</TableHead>
                <TableHead className="font-bold py-4">STATUS</TableHead>
                <TableHead className="font-bold py-4">RETRY</TableHead>
                <TableHead className="font-bold py-4 pr-6 text-right">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center">
                    <div className="flex items-center justify-center gap-2 text-muted-foreground">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Loading delivery logs...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    No logs found for the selected criteria.
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id} className="group hover:bg-muted/30 border-border/40">
                    <TableCell className="pl-6 py-4">
                      <div className="flex flex-col">
                        <span className="font-semibold text-foreground">
                          {format(new Date(log.created_at), 'dd MMM yyyy')}
                        </span>
                        <span className="text-[10px] text-muted-foreground font-bold flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(log.created_at), 'hh:mm a')}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-muted capitalize font-bold text-[10px] tracking-tight py-0.5">
                        {log.event_type.replace(/[\._]/g, ' ')}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {log.status === 'completed' && <CheckCircle2 className="h-4 w-4 text-green-500" />}
                        {log.status === 'failed' && <AlertCircle className="h-4 w-4 text-red-500" />}
                        {log.status === 'pending' && <Loader2 className="h-4 w-4 text-amber-500 animate-spin" />}
                        <span className={`text-sm font-bold capitalize ${
                          log.status === 'completed' ? 'text-green-600' : 
                          log.status === 'failed' ? 'text-red-600' : 'text-amber-600'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                      {log.error_message?.Valid && (
                        <p className="text-[10px] text-red-500 font-medium max-w-[200px] truncate mt-0.5">
                          {log.error_message.String}
                        </p>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className="text-sm font-mono bg-muted/50 px-2 py-0.5 rounded border border-border/50">
                        {log.payload?.retry_count || 0}
                      </span>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink className="h-4 w-4 mr-2" /> Detail
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}

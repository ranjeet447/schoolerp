"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import {
  Globe,
  Shield,
  Activity,
  List,
  PlusCircle,
  ShieldCheck,
  Lock,
  RefreshCcw,
  ArrowRight,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Badge,
} from "@schoolerp/ui";

type PlatformWebhook = {
  id: string;
  tenant_id?: string;
  name: string;
  target_url: string;
  events: string[];
  is_active: boolean;
  created_at: string;
};

type IntegrationLog = {
  id: string;
  event_type: string;
  status: string;
  http_status: number;
  created_at: string;
};

type IntegrationHealth = {
  total_last_24h: number;
  success_last_24h: number;
  failure_last_24h: number;
  is_healthy: boolean;
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

export default function PlatformIntegrationsPage() {
  const [webhooks, setWebhooks] = useState<PlatformWebhook[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [health, setHealth] = useState<IntegrationHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    setError("");
    try {
      const [wRes, lRes, hRes] = await Promise.all([
        apiClient("/admin/platform/integrations/webhooks"),
        apiClient("/admin/platform/integrations/logs?limit=20"),
        apiClient("/admin/platform/integrations/health"),
      ]);

      if (wRes.ok) {
        setWebhooks(toArray<PlatformWebhook>(await wRes.json()));
      } else {
        setWebhooks([]);
      }

      if (lRes.ok) {
        setLogs(toArray<IntegrationLog>(await lRes.json()));
      } else {
        setLogs([]);
      }

      if (hRes.ok) {
        const payload = await hRes.json();
        setHealth(payload as IntegrationHealth);
      } else {
        setHealth(null);
      }
    } catch {
      setError("Failed to load integrations data.");
      setWebhooks([]);
      setLogs([]);
      setHealth(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

  const successRate = useMemo(() => {
    if (!health || !health.total_last_24h) return 0;
    return Math.round((health.success_last_24h / health.total_last_24h) * 100);
  }, [health]);

  const recentStatusRows = useMemo(
    () => logs.slice(0, 6).map((l) => ({ ...l, failed: (l.status || "").toLowerCase() !== "delivered" })),
    [logs],
  );

  if (loading && webhooks.length === 0) return <div className="p-6">Loading integrations...</div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4">
        <Link href="/platform/integrations" className="flex items-center text-xs font-black text-primary hover:underline gap-1 uppercase tracking-widest">
          <ArrowRight className="h-3 w-3 rotate-180" />
          Back to System Connectivity
        </Link>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Integrations & API</h1>
            <p className="mt-1 text-lg text-muted-foreground font-medium">Manage platform-wide webhooks and monitor external service integrations.</p>
          </div>
          <Button className="gap-2 font-black shadow-lg shadow-primary/20 h-11">
            <PlusCircle className="h-4 w-4" />
            <span>New Webhook</span>
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-red-200 bg-red-50/40">
          <CardContent className="p-4 text-sm text-red-700">{error}</CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="webhooks" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="webhooks" className="gap-2">
            <Globe className="h-4 w-4" />
            Webhooks
          </TabsTrigger>
          <TabsTrigger value="logs" className="gap-2">
            <List className="h-4 w-4" />
            Activity Logs
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <ShieldCheck className="h-4 w-4" />
            Security & Health
          </TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-blue-500" />
                Platform Webhooks
              </CardTitle>
              <CardDescription>Configure URLs to receive real-time notifications for platform events.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Name</th>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Endpoint</th>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Events</th>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {webhooks.length === 0 ? (
                      <tr>
                        <td className="px-6 py-8 text-center text-muted-foreground" colSpan={4}>No platform webhooks configured.</td>
                      </tr>
                    ) : (
                      webhooks.map((w) => (
                        <tr key={w.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-6 py-4 font-medium">{w.name}</td>
                          <td className="px-6 py-4 font-mono text-xs truncate max-w-[250px]">{w.target_url}</td>
                          <td className="px-6 py-4">
                            <div className="flex flex-wrap gap-1">
                              {(Array.isArray(w.events) ? w.events : []).slice(0, 3).map((ev) => (
                                <Badge key={ev} variant="outline" className="text-[10px] break-all">{ev}</Badge>
                              ))}
                              {(Array.isArray(w.events) ? w.events.length : 0) > 3 && (
                                <span className="text-[10px] text-muted-foreground">
                                  +{(Array.isArray(w.events) ? w.events.length : 0) - 3}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge className={w.is_active ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20" : "bg-red-500/10 text-red-700"}>
                              {w.is_active ? "Active" : "Paused"}
                            </Badge>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <List className="h-5 w-5 text-indigo-500" />
                  Recent Integration Logs
                </CardTitle>
                <CardDescription>Monitoring payload delivery and external API responses.</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => void fetchData()} className="gap-2">
                <RefreshCcw className="h-3 w-3" />
                Refresh
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-muted text-muted-foreground">
                    <tr>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Event</th>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">HTTP</th>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.length === 0 ? (
                      <tr>
                        <td className="px-6 py-8 text-center text-muted-foreground" colSpan={4}>No integration logs found.</td>
                      </tr>
                    ) : (
                      logs.map((l) => {
                        const delivered = (l.status || "").toLowerCase() === "delivered";
                        return (
                          <tr key={l.id} className="hover:bg-accent/30 transition-colors">
                            <td className="px-6 py-4 font-medium">{l.event_type}</td>
                            <td className="px-6 py-4">
                              <Badge variant="outline" className={delivered ? "text-emerald-600 border-emerald-200" : "text-red-600 border-red-200"}>
                                {(l.status || "unknown").toUpperCase()}
                              </Badge>
                            </td>
                            <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{l.http_status || 0}</td>
                            <td className="px-6 py-4 text-xs text-muted-foreground">
                              {l.created_at ? new Date(l.created_at).toLocaleString() : "N/A"}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-500" />
                  Integration Health
                </CardTitle>
                <CardDescription>Computed from integration event delivery in the last 24 hours.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="divide-y divide-border rounded-lg border">
                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Total Events (24h)</p>
                      <p className="text-xs text-muted-foreground">All outgoing integration events</p>
                    </div>
                    <Badge>{health?.total_last_24h ?? 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Delivered (24h)</p>
                      <p className="text-xs text-muted-foreground">Successful delivery attempts</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-700">{health?.success_last_24h ?? 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Failed (24h)</p>
                      <p className="text-xs text-muted-foreground">Events requiring retry or investigation</p>
                    </div>
                    <Badge className="bg-red-500/10 text-red-700">{health?.failure_last_24h ?? 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Success Rate</p>
                      <p className="text-xs text-muted-foreground">Delivery ratio over the same window</p>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-700">{successRate}%</Badge>
                  </div>
                </div>
                <Button variant="outline" className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50">
                  <Lock className="h-4 w-4" />
                  Rotate Global API Master Keys
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-emerald-500" />
                  Recent Delivery Health
                </CardTitle>
                <CardDescription>Latest webhook event statuses from integration logs.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentStatusRows.length === 0 ? (
                  <div className="text-sm text-muted-foreground">No recent delivery activity found.</div>
                ) : (
                  recentStatusRows.map((row) => (
                    <div key={row.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span className="text-sm font-medium truncate pr-2">{row.event_type}</span>
                      <div className="flex items-center gap-2">
                        <span className={row.failed ? "text-[10px] text-red-600 font-bold" : "text-[10px] text-emerald-600 font-bold"}>
                          {(row.status || "unknown").toUpperCase()}
                        </span>
                        <span className={row.failed ? "h-2 w-2 rounded-full bg-red-500" : "h-2 w-2 rounded-full bg-emerald-500"}></span>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

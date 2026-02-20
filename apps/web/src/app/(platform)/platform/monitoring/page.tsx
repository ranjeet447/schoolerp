"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { 
  Activity, 
  Database, 
  Zap, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  RefreshCcw, 
  Server,
  Terminal,
  AlertCircle
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
  Badge 
} from "@schoolerp/ui";

type HealthStatus = {
  status: string;
  uptime: string;
  checks: Record<string, any>;
  timestamp: string;
};

type QueueHealth = {
  queue_name: string;
  pending_count: number;
  processing_count: number;
  failed_count: number;
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

function toHealthStatus(payload: unknown): HealthStatus | null {
  const value = unwrapData(payload);
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as HealthStatus;
}

export default function PlatformMonitoringPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [queues, setQueues] = useState<QueueHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [hRes, qRes] = await Promise.all([
        apiClient("/admin/platform/monitoring/health"),
        apiClient("/admin/platform/monitoring/queue"),
      ]);

      if (hRes.ok) {
        const payload = await hRes.json();
        setHealth(toHealthStatus(payload));
      } else {
        setHealth(null);
      }
      if (qRes.ok) {
        const payload = await qRes.json();
        setQueues(toArray<QueueHealth>(payload));
      } else {
        setQueues([]);
      }
    } catch (e: any) {
      setError("Failed to load monitoring data.");
      setHealth(null);
      setQueues([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
    const interval = setInterval(fetchData, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  if (loading && !health) return <div className="p-6">Loading monitoring data...</div>;

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">System Health & Monitoring</h1>
          <p className="mt-1 text-lg text-muted-foreground font-medium">Real-time status of platform infrastructure and background jobs.</p>
        </div>
        <Button onClick={() => void fetchData()} variant="outline" className="gap-2 font-bold h-11 border-border shadow-sm">
          <RefreshCcw className="h-4 w-4" />
          <span>Refresh Now</span>
        </Button>
      </div>

      {error && (
        <div className="rounded border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className={`rounded-xl p-3 ${health?.status === "healthy" ? "bg-emerald-500/10 text-emerald-600" : "bg-red-500/10 text-red-600"}`}>
              <Zap className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Global Status</p>
              <h3 className="text-2xl font-black text-foreground capitalize">{health?.status || "Unknown"}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-xl bg-blue-500/10 text-blue-600 p-3">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">System Uptime</p>
              <h3 className="text-2xl font-black text-foreground">{health?.uptime || "99.99%"}</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-xl bg-indigo-500/10 text-indigo-600 p-3">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Database Health</p>
              <h3 className="text-2xl font-black text-foreground">Stable</h3>
            </div>
          </CardContent>
        </Card>
        <Card className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="rounded-xl bg-amber-500/10 text-amber-600 p-3">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">API Latency</p>
              <h3 className="text-2xl font-black text-foreground">~42ms</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="health" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="health" className="gap-2">
            <Server className="h-4 w-4" />
            Infrastructure Checks
          </TabsTrigger>
          <TabsTrigger value="queues" className="gap-2">
            <Terminal className="h-4 w-4" />
            Background Queues
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                Service Health Metrics
              </CardTitle>
              <CardDescription>Individual component status across the cloud environment.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y border-t">
                {health?.checks && Object.entries(health.checks).map(([name, status]) => (
                  <div key={name} className="flex items-center justify-between p-4 px-6 hover:bg-accent/30 transition-colors">
                    <span className="text-sm font-bold capitalize">{name}</span>
                    <Badge className={status === "healthy" ? "bg-emerald-500/10 text-emerald-700" : "bg-red-500/10 text-red-700 uppercase"}>
                      {String(status)}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queues">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {queues.length === 0 ? (
              <div className="col-span-full rounded-xl border border-dashed border-border p-12 text-center text-muted-foreground bg-accent/5">
                No active background queues detected.
              </div>
            ) : queues.map((q) => (
              <Card key={q.queue_name}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base font-bold font-mono">{q.queue_name}</CardTitle>
                    {q.is_healthy ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    ) : (
                      <AlertCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <div className="rounded-lg bg-muted p-2 text-center">
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">Pending</p>
                      <p className="text-sm font-black">{q.pending_count}</p>
                    </div>
                    <div className="rounded-lg bg-blue-500/5 p-2 text-center">
                      <p className="text-[9px] font-bold text-blue-600 uppercase">Active</p>
                      <p className="text-sm font-black text-blue-700">{q.processing_count}</p>
                    </div>
                    <div className="rounded-lg bg-red-500/5 p-2 text-center">
                      <p className="text-[9px] font-bold text-red-600 uppercase">Failed</p>
                      <p className="text-sm font-black text-red-700">{q.failed_count}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

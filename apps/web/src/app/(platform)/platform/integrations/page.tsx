"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import {
  Activity,
  Zap,
  ShieldCheck,
  ArrowRight,
  Globe,
  Settings,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Badge,
  Progress,
} from "@schoolerp/ui";

type IntegrationHealth = {
  total_last_24h: number;
  success_last_24h: number;
  failure_last_24h: number;
  is_healthy: boolean;
};

type IntegrationLog = {
  id: string;
  event_type: string;
  status: string;
  http_status: number;
  created_at: string;
};

const INTEGRATION_ACTIONS = [
  {
    title: "Global Webhooks",
    description: "Manage platform-wide event delivery",
    href: "/platform/integrations/manage?tab=webhooks",
    icon: Globe,
  },
  {
    title: "Activity Monitoring",
    description: "Real-time integration request logs",
    href: "/platform/integrations/manage?tab=logs",
    icon: Activity,
  },
  {
    title: "Advanced Config",
    description: "API master keys and security policy",
    href: "/platform/integrations/manage?tab=security",
    icon: Settings,
  },
];

export default function IntegrationsDashboard() {
  const [health, setHealth] = useState<IntegrationHealth | null>(null);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [healthRes, logsRes] = await Promise.all([
        apiClient("/admin/platform/integrations/health"),
        apiClient("/admin/platform/integrations/logs?limit=10"),
      ]);

      if (!healthRes.ok) {
        throw new Error("Failed to load integration health.");
      }
      const healthData = await healthRes.json();
      setHealth(healthData);

      if (logsRes.ok) {
        const logRows = await logsRes.json();
        setLogs(Array.isArray(logRows) ? logRows : []);
      } else {
        setLogs([]);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load integration dashboard.");
      setHealth(null);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const successRate = useMemo(() => {
    if (!health?.total_last_24h) return 0;
    return Math.min(100, Math.round((health.success_last_24h / health.total_last_24h) * 100));
  }, [health]);

  const healthCards = useMemo(
    () => [
      {
        name: "Delivery Success",
        status: health?.is_healthy ? "Operational" : "Degraded",
        health: successRate,
        icon: Zap,
        color: health?.is_healthy ? "text-emerald-500" : "text-amber-500",
      },
      {
        name: "Total Events (24h)",
        status: `${(health?.total_last_24h || 0).toLocaleString()} events`,
        health: Math.min(100, (health?.total_last_24h || 0) > 0 ? 100 : 0),
        icon: Activity,
        color: "text-blue-500",
      },
      {
        name: "Failed Events (24h)",
        status: `${(health?.failure_last_24h || 0).toLocaleString()} failed`,
        health:
          (health?.total_last_24h || 0) > 0
            ? Math.max(0, 100 - Math.round(((health?.failure_last_24h || 0) / (health?.total_last_24h || 1)) * 100))
            : 100,
        icon: ShieldCheck,
        color: (health?.failure_last_24h || 0) > 0 ? "text-amber-500" : "text-indigo-500",
      },
    ],
    [health, successRate],
  );

  if (loading && !health) {
    return (
      <div className="flex h-[45vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="mt-3 text-sm font-semibold text-muted-foreground">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">System Connectivity</h1>
          <p className="mt-1 text-lg text-muted-foreground font-medium">Platform integration health and API telemetry.</p>
        </div>
        <div className="flex items-center gap-2">
           <Badge className={health?.is_healthy ? "bg-emerald-500/10 text-emerald-600 border-none font-bold" : "bg-amber-500/10 text-amber-700 border-none font-bold"}>
             {health?.is_healthy ? "HEALTHY" : "DEGRADED"}
           </Badge>
           <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => void load()}>
             <RefreshCw className="h-4 w-4" />
           </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-semibold text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={() => void load()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {/* Health Overview */}
      <div className="grid gap-4 md:grid-cols-3">
        {healthCards.map((service) => (
          <Card key={service.name} className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className={`rounded-xl p-2 bg-muted ${service.color}`}>
                  <service.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground">{service.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black uppercase text-muted-foreground/60">{service.status}</span>
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                  </div>
                </div>
                <span className="text-sm font-black text-foreground">{Math.round(service.health)}%</span>
              </div>
              <Progress value={service.health} className="h-1.5 bg-muted" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Access Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {INTEGRATION_ACTIONS.map((action) => (
          <Link key={action.title} href={action.href} className="group">
            <Card className="h-full border-none shadow-sm transition-all duration-200 hover:shadow-md hover:bg-accent/50">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl p-3 bg-primary/10 text-primary">
                      <action.icon className="h-6 w-6" />
                    </div>
                    <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{action.title}</h3>
                    <p className="text-xs text-muted-foreground">{action.description}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Alerts / Events */}
      <div className="grid gap-8 lg:grid-cols-3">
         <Card className="lg:col-span-2 border-none shadow-sm">
           <CardContent className="p-0">
             <div className="flex items-center justify-between p-6 border-b border-border">
               <h3 className="font-black text-foreground uppercase tracking-wider text-xs">Recent API Events</h3>
               <Link href="/platform/integrations/manage?tab=logs" className="text-xs font-bold text-primary hover:underline">View Logs</Link>
             </div>
             {logs.length === 0 ? (
               <div className="space-y-3 p-6">
                 <p className="text-sm text-muted-foreground">No API events yet.</p>
                 <Button size="sm" asChild>
                   <Link href="/platform/integrations/manage?tab=webhooks">Configure webhooks</Link>
                 </Button>
               </div>
             ) : (
               <div className="divide-y divide-border">
                 {logs.map((log) => {
                   const success = (log.status || "").toLowerCase() === "delivered";
                   return (
                     <div key={log.id} className={`flex items-center justify-between p-4 transition-colors ${success ? "hover:bg-muted/30" : "bg-amber-500/5"}`}>
                       <div className="flex items-center gap-3">
                         {success ? (
                           <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                         ) : (
                           <AlertCircle className="h-4 w-4 text-amber-500" />
                         )}
                         <div>
                           <p className="text-sm font-bold text-foreground">
                             {success ? "Delivered" : "Delivery issue"}: {log.event_type || "unknown.event"}
                           </p>
                           <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                             HTTP {log.http_status || 0} • {(log.status || "unknown").toUpperCase()}
                           </p>
                         </div>
                       </div>
                       <span className="text-[10px] font-bold text-muted-foreground">
                         {log.created_at ? new Date(log.created_at).toLocaleString() : "Unknown date"}
                       </span>
                     </div>
                   );
                 })}
               </div>
             )}
           </CardContent>
         </Card>

         <Card className="border-none shadow-sm bg-indigo-600 text-white overflow-hidden relative group">
           <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.2),transparent)] pointer-events-none" />
           <CardContent className="p-8 h-full flex flex-col justify-between">
             <div className="space-y-4">
               <Zap className="h-10 w-10 text-white/50" />
               <h3 className="text-2xl font-black leading-tight">Developer API Reference</h3>
               <p className="text-indigo-100 text-sm leading-relaxed">
                 Access technical documentation for platform-level API integration and event schemas.
               </p>
             </div>
             <Button variant="secondary" className="w-full mt-8 font-bold border-none transition-transform group-hover:scale-[1.02]">
               Open API Docs
             </Button>
           </CardContent>
         </Card>
      </div>
    </div>
  );
}

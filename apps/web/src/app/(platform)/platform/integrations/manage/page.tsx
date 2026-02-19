import Link from "next/link";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { 
  Link as LinkIcon, 
  Globe, 
  Shield, 
  Activity, 
  List, 
  PlusCircle, 
  ShieldCheck, 
  Zap,
  Lock,
  RefreshCcw,
  ArrowRight
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
  integration_name: string;
  direction: string;
  status_code: number;
  success: boolean;
  duration_ms: number;
  created_at: string;
};

export default function PlatformIntegrationsPage() {
  const [webhooks, setWebhooks] = useState<PlatformWebhook[]>([]);
  const [logs, setLogs] = useState<IntegrationLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = async () => {
    setLoading(true);
    try {
      const [wRes, lRes] = await Promise.all([
        apiClient("/admin/platform/integrations/webhooks"),
        apiClient("/admin/platform/integrations/logs?limit=20"),
      ]);

      if (wRes.ok) setWebhooks(await wRes.json());
      if (lRes.ok) setLogs(await lRes.json());
    } catch (e: any) {
      setError("Failed to load integrations data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchData();
  }, []);

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
                              {w.events.slice(0, 3).map(ev => (
                                <Badge key={ev} variant="outline" className="text-[10px] break-all">{ev}</Badge>
                              ))}
                              {w.events.length > 3 && <span className="text-[10px] text-muted-foreground">+{w.events.length - 3}</span>}
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
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Integration</th>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Status</th>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Latency</th>
                      <th className="px-6 py-3 font-semibold uppercase tracking-wider text-[10px]">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs.length === 0 ? (
                      <tr>
                        <td className="px-6 py-8 text-center text-muted-foreground" colSpan={4}>No integration logs found.</td>
                      </tr>
                    ) : (
                      logs.map((l) => (
                        <tr key={l.id} className="hover:bg-accent/30 transition-colors">
                          <td className="px-6 py-4 font-medium">{l.integration_name}</td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={l.success ? "text-emerald-600 border-emerald-200" : "text-red-600 border-red-200"}>
                              {l.status_code} {l.success ? "OK" : "Error"}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-muted-foreground font-mono text-xs">{l.duration_ms}ms</td>
                          <td className="px-6 py-4 text-xs text-muted-foreground">
                            {new Date(l.created_at).toLocaleString()}
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

        <TabsContent value="security" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="h-5 w-5 text-amber-500" />
                  API Security Controls
                </CardTitle>
                <CardDescription>Global security policies and rate limits.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="divide-y divide-border rounded-lg border">
                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">Global API Rate Limit</p>
                      <p className="text-xs text-muted-foreground">Requests per minute per tenant</p>
                    </div>
                    <Badge>2000 req/min</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">IP Blocklist Enforcement</p>
                      <p className="text-xs text-muted-foreground">Filtering malicious traffic</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-700">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="space-y-0.5">
                      <p className="text-sm font-medium">TLS Enforcement</p>
                      <p className="text-xs text-muted-foreground">Force HTTPS only for all API calls</p>
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-700">Enabled</Badge>
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
                  External Service Health
                </CardTitle>
                <CardDescription>Connectivity status of platform dependencies.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm font-medium">Payment Gateway (Razorpay)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-600 font-bold">OPERATIONAL</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm font-medium">Email Service (AWS SES)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-600 font-bold">OPERATIONAL</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm font-medium">WhatsApp (Meta API)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-600 font-bold">OPERATIONAL</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm font-medium">Secondary Gateway (Stripe)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-600 font-bold">OPERATIONAL</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-md border px-3 py-2">
                    <span className="text-sm font-medium">Push Notification (FCM)</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-600 font-bold">OPERATIONAL</span>
                      <span className="h-2 w-2 rounded-full bg-emerald-500"></span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

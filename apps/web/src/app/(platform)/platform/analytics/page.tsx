"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api-client";
import {
  TrendingUp,
  Users,
  CreditCard,
  Building2,
  ArrowUpRight,
  Filter,
  Download,
  BarChart3,
  Map as MapIcon,
  PieChart,
  Calendar,
  RefreshCcw,
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
} from "@schoolerp/ui";

type PlatformSummary = {
  active_tenants: number;
  total_students: number;
  total_employees: number;
};

type BillingOverview = {
  mrr: number;
  churn_rate_percent: number;
  plan_mix: Array<{ plan_code: string; count: number }>;
};

type PlatformTenant = {
  id: string;
  name: string;
  region?: string;
  lifecycle_status?: string;
  plan_code?: string;
  created_at: string;
};

type AnalyticsSnapshot = {
  id: string;
  metric_value: number;
  snapshot_date: string;
};

export default function PlatformAnalyticsPage() {
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [billing, setBilling] = useState<BillingOverview | null>(null);
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [snapshots, setSnapshots] = useState<AnalyticsSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, billingRes, tenantsRes, snapshotsRes] = await Promise.all([
        apiClient("/admin/platform/summary"),
        apiClient("/admin/platform/billing/overview"),
        apiClient("/admin/platform/tenants?limit=200"),
        apiClient("/admin/platform/analytics/metrics?metric=revenue&days=30"),
      ]);

      if (!summaryRes.ok || !billingRes.ok || !tenantsRes.ok) {
        throw new Error("Failed to load analytics overview.");
      }

      setSummary(await summaryRes.json());
      setBilling(await billingRes.json());

      const tenantRows = await tenantsRes.json();
      setTenants(Array.isArray(tenantRows) ? tenantRows : []);

      if (snapshotsRes.ok) {
        const snapshotRows = await snapshotsRes.json();
        setSnapshots(Array.isArray(snapshotRows) ? snapshotRows : []);
      } else {
        setSnapshots([]);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load analytics data.");
      setSummary(null);
      setBilling(null);
      setTenants([]);
      setSnapshots([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(value || 0);

  const growthStats = useMemo(() => {
    const userbase = (summary?.total_students || 0) + (summary?.total_employees || 0);
    return [
      {
        label: "Global MRR",
        value: formatCurrency(billing?.mrr || 0),
        icon: CreditCard,
        hint: "Subscription monthly recurring revenue",
      },
      {
        label: "Active Institutions",
        value: (summary?.active_tenants || 0).toLocaleString(),
        icon: Building2,
        hint: "Tenants currently in active lifecycle",
      },
      {
        label: "Total Userbase",
        value: userbase.toLocaleString(),
        icon: Users,
        hint: "Students and staff combined",
      },
      {
        label: "Ecosystem Churn",
        value: `${(billing?.churn_rate_percent || 0).toFixed(1)}%`,
        icon: TrendingUp,
        hint: "Closed subscriptions this month",
      },
    ];
  }, [summary, billing]);

  const convertedTenants = useMemo(() => {
    return tenants
      .filter((tenant) => {
        const lifecycle = (tenant.lifecycle_status || "").toLowerCase();
        return lifecycle.includes("active") || lifecycle.includes("paid");
      })
      .slice(0, 8);
  }, [tenants]);

  const planContribution = useMemo(() => {
    const mix = billing?.plan_mix || [];
    const total = mix.reduce((acc, item) => acc + (item.count || 0), 0) || 1;
    return mix.map((item) => {
      const share = ((item.count || 0) / total) * 100;
      return {
        planCode: item.plan_code || "unassigned",
        share,
        estimatedMrr: Math.round((billing?.mrr || 0) * (share / 100)),
      };
    });
  }, [billing]);

  const regionalRows = useMemo(() => {
    const grouped = new Map<string, { schools: number; active: number }>();
    tenants.forEach((tenant) => {
      const region = (tenant.region || "Unspecified").trim();
      const bucket = grouped.get(region) || { schools: 0, active: 0 };
      bucket.schools += 1;
      if ((tenant.lifecycle_status || "").toLowerCase().includes("active")) {
        bucket.active += 1;
      }
      grouped.set(region, bucket);
    });

    const totalSchools = tenants.length || 1;
    return Array.from(grouped.entries())
      .map(([region, data]) => ({
        region,
        schools: data.schools,
        active: data.active,
        share: ((data.schools / totalSchools) * 100).toFixed(1),
      }))
      .sort((a, b) => b.schools - a.schools);
  }, [tenants]);

  if (loading && !summary) {
    return (
      <div className="flex h-[45vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="mt-3 text-sm font-semibold text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Platform Intelligence</h1>
          <p className="mt-1 text-lg text-muted-foreground font-medium">Growth trajectories and institution-level performance metrics.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="gap-2 font-bold h-11 border-border shadow-sm">
            <Filter className="h-4 w-4" />
            <span>Filter Metrics</span>
          </Button>
          <Button className="gap-2 font-black shadow-lg shadow-primary/20 h-11" onClick={() => void load()}>
            <RefreshCcw className="h-4 w-4" />
            <span>Refresh Data</span>
          </Button>
        </div>
      </div>

      {error ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-semibold text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={() => void load()} className="gap-2">
              <Download className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <Tabs defaultValue="growth" className="w-full">
        <TabsList className="mb-8 p-1 bg-muted/50 rounded-xl">
          <TabsTrigger value="growth" className="gap-2 rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <TrendingUp className="h-4 w-4" />
            Growth Overview
          </TabsTrigger>
          <TabsTrigger value="revenue" className="gap-2 rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <BarChart3 className="h-4 w-4" />
            Financial Performance
          </TabsTrigger>
          <TabsTrigger value="regional" className="gap-2 rounded-lg font-bold data-[state=active]:bg-background data-[state=active]:shadow-sm">
            <MapIcon className="h-4 w-4" />
            Regional Adoption
          </TabsTrigger>
        </TabsList>

        <TabsContent value="growth" className="space-y-8">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {growthStats.map((stat) => (
              <Card key={stat.label} className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl bg-primary/10 text-primary p-3">
                      <stat.icon className="h-6 w-6" />
                    </div>
                    <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px]">
                      <ArrowUpRight className="h-3 w-3 mr-0.5" />
                      LIVE
                    </Badge>
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                    <h3 className="text-2xl font-black text-foreground">{stat.value}</h3>
                    <p className="text-[10px] text-muted-foreground font-bold mt-1">{stat.hint}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="border-none shadow-sm shadow-black/5 overflow-hidden">
            <div className="flex items-center justify-between p-6 bg-card/50 border-b border-border">
              <div>
                <h3 className="font-black text-foreground uppercase tracking-wider text-xs flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-primary" /> Conversion Pipeline
                </h3>
                <p className="text-[10px] text-muted-foreground font-bold mt-0.5">LATEST TENANTS IN ACTIVE OR PAID LIFECYCLE</p>
              </div>
              <Button asChild variant="ghost" size="sm" className="gap-2 text-primary font-black hover:bg-primary/5">
                <Link href="/platform/tenants/list">
                  View Portfolios <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
            <CardContent className="p-0">
              {convertedTenants.length === 0 ? (
                <div className="space-y-3 p-6">
                  <p className="text-sm text-muted-foreground">No converted tenants yet.</p>
                  <Button size="sm" asChild>
                    <Link href="/platform/tenants/new">Onboard first school</Link>
                  </Button>
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {convertedTenants.map((tenant) => (
                    <div key={tenant.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="h-11 w-11 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-lg">
                          {(tenant.name || "S").slice(0, 1).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-black text-foreground">{tenant.name || "Unnamed school"}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">{tenant.region || "Unspecified region"}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge variant="secondary" className="font-bold text-[10px] px-3">
                          {(tenant.plan_code || "unassigned").toUpperCase()}
                        </Badge>
                        <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px] px-3">ACTIVE</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-8">
          <Card className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
            <CardHeader className="p-6">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-indigo-500" />
                <CardTitle className="text-xl font-black">Plan Contribution</CardTitle>
              </div>
              <CardDescription className="font-medium">Tenant distribution by subscription plan.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-0 space-y-6">
              {planContribution.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">No plan mix data available yet.</p>
                  <Button size="sm" asChild>
                    <Link href="/platform/plans">Review plan catalog</Link>
                  </Button>
                </div>
              ) : (
                planContribution.map((item) => (
                  <div key={item.planCode} className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-bold text-foreground">{item.planCode.toUpperCase()}</span>
                      <span className="font-black text-indigo-600 uppercase tracking-tighter">
                        {item.share.toFixed(1)}% ({formatCurrency(item.estimatedMrr)})
                      </span>
                    </div>
                    <div className="h-3 w-full bg-muted rounded-full overflow-hidden shadow-inner">
                      <div className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700" style={{ width: `${Math.max(3, item.share)}%` }} />
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm shadow-black/5">
            <CardHeader>
              <CardTitle className="text-base font-black">Revenue Snapshots (30 days)</CardTitle>
              <CardDescription>Captured analytics points from platform snapshots.</CardDescription>
            </CardHeader>
            <CardContent>
              {snapshots.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No snapshot data yet. Schedule analytics snapshot jobs to populate this chart.
                </p>
              ) : (
                <div className="space-y-2">
                  {snapshots.slice(-10).map((point) => (
                    <div key={point.id} className="flex items-center justify-between rounded-md border px-3 py-2">
                      <span className="text-xs font-bold text-muted-foreground">
                        {point.snapshot_date ? new Date(point.snapshot_date).toLocaleDateString() : "Unknown date"}
                      </span>
                      <span className="text-sm font-black text-foreground">{formatCurrency(point.metric_value || 0)}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regional" className="space-y-8">
          <Card className="border-none shadow-sm shadow-black/5 overflow-hidden">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between p-6 bg-card/50 border-b border-border">
              <div>
                <CardTitle className="flex items-center gap-2 font-black">
                  <MapIcon className="h-5 w-5 text-primary" /> Regional Penetration
                </CardTitle>
                <CardDescription className="font-medium">Region-wise tenant concentration and active count.</CardDescription>
              </div>
              <Badge variant="outline" className="gap-2 font-black text-muted-foreground border-border px-3 py-1">
                <Calendar className="h-3 w-3" /> LIVE DATA
              </Badge>
            </div>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left">
                  <thead className="bg-muted/50 text-[10px] uppercase font-black tracking-widest text-muted-foreground/60">
                    <tr>
                      <th className="px-8 py-4">Region</th>
                      <th className="px-8 py-4">School Count</th>
                      <th className="px-8 py-4">Active Schools</th>
                      <th className="px-8 py-4">Portfolio Share</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {regionalRows.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-8 text-center text-sm text-muted-foreground">
                          No regional distribution available.
                        </td>
                      </tr>
                    ) : (
                      regionalRows.map((row) => (
                        <tr key={row.region} className="hover:bg-muted/30 transition-colors group">
                          <td className="px-8 py-5">
                            <span className="font-black text-foreground group-hover:text-primary transition-colors">{row.region}</span>
                          </td>
                          <td className="px-8 py-5 font-black text-foreground">{row.schools}</td>
                          <td className="px-8 py-5 font-bold text-muted-foreground">{row.active}</td>
                          <td className="px-8 py-5">
                            <Badge className="bg-emerald-500/10 text-emerald-600 border-none font-black text-[10px]">
                              <ArrowUpRight className="h-3 w-3 mr-1" /> {row.share}%
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
      </Tabs>
    </div>
  );
}

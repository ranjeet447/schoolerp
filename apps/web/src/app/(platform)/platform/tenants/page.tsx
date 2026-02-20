"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import { formatDistanceToNow } from "date-fns";
import {
  Building2,
  Users,
  TrendingUp,
  Plus,
  ArrowRight,
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RefreshCcw,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Badge,
} from "@schoolerp/ui";

type PlatformSummary = {
  total_tenants: number;
  active_tenants: number;
  total_students: number;
  total_collections: number;
};

type PlatformTenant = {
  id: string;
  name: string;
  lifecycle_status?: string;
  created_at: string;
};

const QUICK_ACTIONS = [
  {
    title: "Register New School",
    description: "Onboard a new educational institution",
    href: "/platform/tenants/new",
    icon: Plus,
    variant: "default",
  },
  {
    title: "Manage All Schools",
    description: "View and filter the complete institutional list",
    href: "/platform/tenants/list",
    icon: Building2,
    variant: "outline",
  },
];

export default function TenantsDashboard() {
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [tenants, setTenants] = useState<PlatformTenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [summaryRes, tenantsRes] = await Promise.all([
        apiClient("/admin/platform/summary"),
        apiClient("/admin/platform/tenants?limit=8"),
      ]);

      if (!summaryRes.ok) {
        throw new Error("Failed to fetch tenant summary.");
      }
      const summaryData = await summaryRes.json();
      setSummary(summaryData);

      if (tenantsRes.ok) {
        const tenantRows = await tenantsRes.json();
        setTenants(Array.isArray(tenantRows) ? tenantRows : []);
      } else {
        setTenants([]);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load tenant overview.");
      setSummary(null);
      setTenants([]);
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

  const milestones = useMemo(() => {
    return tenants.slice(0, 5).map((tenant) => {
      const lifecycle = (tenant.lifecycle_status || "").toLowerCase();
      const status =
        lifecycle.includes("active") || lifecycle.includes("live")
          ? "completed"
          : lifecycle.includes("onboard") || lifecycle.includes("trial")
            ? "in-progress"
            : "pending";

      return {
        id: tenant.id,
        title: tenant.name || "Unnamed school",
        status,
        dateLabel: tenant.created_at
          ? formatDistanceToNow(new Date(tenant.created_at), { addSuffix: true })
          : "Unknown date",
      };
    });
  }, [tenants]);

  const newThisMonth = useMemo(() => {
    const now = new Date();
    return tenants.filter((tenant) => {
      const created = new Date(tenant.created_at);
      return created.getMonth() === now.getMonth() && created.getFullYear() === now.getFullYear();
    }).length;
  }, [tenants]);

  const statCards = [
    {
      label: "Total Schools",
      value: (summary?.total_tenants || 0).toLocaleString(),
      subValue: summary ? `+${newThisMonth} this month` : "Waiting for data",
      icon: Building2,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      label: "Active Students",
      value: (summary?.total_students || 0).toLocaleString(),
      subValue: "Across all tenants",
      icon: Users,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
    },
    {
      label: "Global Revenue",
      value: formatCurrency(summary?.total_collections || 0),
      subValue: "Lifetime collections",
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
  ];

  if (loading && !summary) {
    return (
      <div className="flex h-[45vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="mt-3 text-sm font-semibold text-muted-foreground">Loading tenant dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header Section */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Portfolio Overview</h1>
          <p className="mt-1 text-lg text-muted-foreground font-medium">Monitoring the institutional ecosystem at a glance.</p>
        </div>
      </div>

      {/* Stats Grid */}
      {error ? (
        <Card className="border-destructive/20 bg-destructive/5">
          <CardContent className="flex flex-col gap-3 p-5 md:flex-row md:items-center md:justify-between">
            <p className="text-sm font-semibold text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={() => void load()} className="gap-2">
              <RefreshCcw className="h-4 w-4" />
              Retry
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">{stat.label}</p>
                  <h3 className="mt-2 text-2xl font-black text-foreground">{stat.value}</h3>
                  <p className="mt-1 text-xs font-medium text-muted-foreground">{stat.subValue}</p>
                </div>
                <div className={`rounded-xl p-3 ${stat.bg} ${stat.color}`}>
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {QUICK_ACTIONS.map((action) => (
          <Link key={action.title} href={action.href} className="group">
            <Card className="h-full border-none shadow-sm shadow-black/5 transition-all duration-200 hover:shadow-md hover:bg-accent/50">
              <CardContent className="p-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`rounded-xl p-3 bg-primary/10 text-primary`}>
                    <action.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">{action.title}</h3>
                    <p className="text-sm text-muted-foreground">{action.description}</p>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Two Column Layout for Desktop */}
      <div className="grid gap-8 lg:grid-cols-3">
        {/* Recent Milestones */}
        <Card className="lg:col-span-1 border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-foreground uppercase tracking-wider text-xs">Recent Milestones</h3>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="space-y-6">
              {milestones.length === 0 ? (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">No tenant activity yet.</p>
                  <Button size="sm" asChild>
                    <Link href="/platform/tenants/new">Onboard your first school</Link>
                  </Button>
                </div>
              ) : (
                milestones.map((milestone) => (
                  <div key={milestone.id} className="flex items-start gap-3">
                    <div className="mt-1">
                      {milestone.status === "completed" ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : milestone.status === "in-progress" ? (
                        <Clock className="h-4 w-4 text-blue-500" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{milestone.title}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{milestone.dateLabel}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <Button variant="ghost" className="w-full mt-6 text-xs font-bold text-primary" asChild>
              <Link href="/platform/tenants/list">VIEW ALL ACTIVITY</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Feature Teasers / Info */}
        <Card className="lg:col-span-2 border-none shadow-sm shadow-black/5 overflow-hidden group">
          <div className="h-2 w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
          <CardContent className="p-8">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="flex-1 space-y-4">
                <Badge className="bg-primary/10 text-primary border-none font-black text-[10px] px-3 py-1">UPCOMING FEATURES</Badge>
                <h3 className="text-2xl font-black text-foreground leading-tight">Automated Subscription Revenue Recovery</h3>
                <p className="text-muted-foreground leading-relaxed">
                  We're building a new intelligent system to automatically handle failed payments and optimize renewal rates for your school portfolio.
                </p>
                <Button size="lg" className="rounded-full px-8 font-bold shadow-lg shadow-primary/20">
                  Notify on Launch
                </Button>
              </div>
              <div className="hidden md:block relative">
                <div className="absolute -inset-4 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full blur-2xl opacity-20 animate-pulse" />
                <ShieldCheck className="relative h-32 w-32 text-indigo-500/20" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

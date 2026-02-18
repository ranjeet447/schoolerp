"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api-client";
import { 
  Building2, 
  Users, 
  UserSquare2, 
  Receipt, 
  Banknote, 
  ArrowUpRight, 
  History,
  TrendingUp
} from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
  Badge,
  Button
} from "@schoolerp/ui";

type PlatformSummary = {
  total_tenants: number;
  active_tenants: number;
  total_branches: number;
  total_students: number;
  total_employees: number;
  total_receipts: number;
  total_collections: number;
};

function StatCard({ label, value, icon: Icon, description }: { label: string; value: string | number; icon: any; description?: string }) {
  return (
    <Card className="overflow-hidden border-none bg-gradient-to-br from-card to-muted/30 shadow-sm transition-all hover:shadow-md">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
            <p className="mt-1 text-3xl font-extrabold text-foreground">{value}</p>
          </div>
          <div className="rounded-full bg-primary/10 p-3 text-primary">
            <Icon className="h-6 w-6" />
          </div>
        </div>
        {description && (
          <div className="mt-4 flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400">
            <TrendingUp className="h-3 w-3" />
            <span>{description}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function PlatformDashboardPage() {
  const [summary, setSummary] = useState<PlatformSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await apiClient("/admin/platform/summary");
        if (!res.ok) return;
        const data = await res.json();
        setSummary(data);
      } finally {
        setLoading(false);
      }
    };
    void load();
  }, []);

  if (loading) return (
    <div className="flex h-[50vh] flex-col items-center justify-center space-y-4">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      <p className="text-sm font-medium text-muted-foreground">Loading platform intelligence...</p>
    </div>
  );

  if (!summary) return (
    <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-6 text-center">
      <p className="text-destructive font-medium">Unable to load platform summary. Check your backend connection.</p>
    </div>
  );

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <div className="space-y-8 pb-10">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-foreground">SaaS Control Plane</h1>
          <p className="mt-1 text-lg text-muted-foreground">Global monitoring and operations dashboard.</p>
        </div>
        <div className="hidden md:block">
          <Badge variant="outline" className="px-3 py-1 font-mono text-xs">
            Build: Release-v2.1
          </Badge>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard 
          label="SaaS Tenants" 
          value={summary.total_tenants} 
          icon={Building2} 
          description={`${summary.active_tenants} currently active`}
        />
        <StatCard 
          label="Student Population" 
          value={summary.total_students.toLocaleString()} 
          icon={Users} 
          description="Across all jurisdictions"
        />
        <StatCard 
          label="Total Staff" 
          value={summary.total_employees.toLocaleString()} 
          icon={UserSquare2} 
        />
        <StatCard 
          label="Global Revenue" 
          value={formatCurrency(summary.total_collections)} 
          icon={Banknote} 
          description="Lifetime collections"
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <History className="h-5 w-5 text-primary" />
              Platform Intelligence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex h-64 flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted p-10 text-center">
              <p className="text-sm text-muted-foreground">Regional usage distributions and growth metrics will appear here once snapshot data accumulates.</p>
              <Button variant="outline" className="mt-4" size="sm">
                Initialize Regional Scan
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpRight className="h-5 w-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-2">
            {[
              { label: "Onboard New School", href: "/platform/tenants/new" },
              { label: "Review Signup Requests", href: "/platform/signup-requests" },
              { label: "Platform Billing Overviews", href: "/platform/payments" },
              { label: "Audit Global Logs", href: "/platform/audit-logs" }
            ].map((action, i) => (
              <Button key={i} variant="ghost" className="justify-start text-left font-normal" asChild>
                <a href={action.href}>{action.label}</a>
              </Button>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

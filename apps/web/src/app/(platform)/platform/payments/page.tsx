"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import {
  CreditCard,
  TrendingUp,
  FileText,
  Settings,
  ArrowRight,
  DollarSign,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Activity,
  RefreshCcw,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Badge,
} from "@schoolerp/ui";

type PlatformPayment = {
  id: string;
  tenant_name: string;
  receipt_number: string;
  amount_paid: number;
  status: string;
  created_at: string;
};

type BillingOverview = {
  mrr: number;
  active_subscriptions: number;
  trial_subscriptions: number;
  churn_rate_percent: number;
};

const PAYMENT_ACTIONS = [
  {
    title: "Billing Overview",
    description: "Revenue trends and subscription analytics",
    href: "/platform/payments/manage/overview",
    icon: TrendingUp,
  },
  {
    title: "Invoice Management",
    description: "Issue, track, and manage all school invoices",
    href: "/platform/payments/manage/invoices",
    icon: FileText,
  },
  {
    title: "Billing Configuration",
    description: "Tax rules and payment gateway settings",
    href: "/platform/payments/manage/config",
    icon: Settings,
  },
];

export default function PaymentsDashboard() {
  const [overview, setOverview] = useState<BillingOverview | null>(null);
  const [payments, setPayments] = useState<PlatformPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [overviewRes, paymentsRes] = await Promise.all([
        apiClient("/admin/platform/billing/overview"),
        apiClient("/admin/platform/payments?limit=5"),
      ]);

      if (!overviewRes.ok) {
        throw new Error("Failed to load billing overview.");
      }
      const overviewData = await overviewRes.json();
      setOverview(overviewData);

      if (paymentsRes.ok) {
        const paymentRows = await paymentsRes.json();
        setPayments(Array.isArray(paymentRows) ? paymentRows : []);
      } else {
        setPayments([]);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load payment dashboard.");
      setOverview(null);
      setPayments([]);
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

  const billingStats = useMemo(
    () => [
      {
        label: "MRR",
        value: formatCurrency(overview?.mrr || 0),
        change: `${overview?.trial_subscriptions || 0} on trial`,
        trend: "up",
        icon: TrendingUp,
      },
      {
        label: "Active Subs",
        value: (overview?.active_subscriptions || 0).toLocaleString(),
        change: `${overview?.trial_subscriptions || 0} trial`,
        trend: "up",
        icon: Activity,
      },
      {
        label: "Churn Rate",
        value: `${(overview?.churn_rate_percent || 0).toFixed(1)}%`,
        change: (overview?.churn_rate_percent || 0) <= 2 ? "Healthy range" : "Needs attention",
        trend: (overview?.churn_rate_percent || 0) <= 2 ? "down" : "up",
        icon: PieChart,
      },
    ],
    [overview],
  );

  if (loading && !overview) {
    return (
      <div className="flex h-[45vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="mt-3 text-sm font-semibold text-muted-foreground">Loading billing dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Financial Control</h1>
          <p className="mt-1 text-lg text-muted-foreground font-medium">Revenue tracking and subscription life-cycle management.</p>
        </div>
        <Button asChild size="lg" className="shadow-lg shadow-primary/20">
          <Link href="/platform/payments/manage/invoices">
            <DollarSign className="mr-2 h-5 w-5" />
            Quick Invoice
          </Link>
        </Button>
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

      <div className="grid gap-4 md:grid-cols-3">
        {billingStats.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">{stat.label}</p>
                  <h3 className="mt-2 text-2xl font-black text-foreground">{stat.value}</h3>
                  <div className={`mt-1 flex items-center gap-1 text-xs font-bold ${
                    stat.trend === "up" ? "text-emerald-500" : "text-amber-500"
                  }`}>
                    {stat.trend === "up" ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {stat.change}
                  </div>
                </div>
                <div className="rounded-xl p-3 bg-primary/10 text-primary">
                  <stat.icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {PAYMENT_ACTIONS.map((action) => (
          <Link key={action.title} href={action.href} className="group">
            <Card className="h-full border-none shadow-sm shadow-black/5 transition-all duration-200 hover:shadow-md hover:bg-accent/50">
              <CardContent className="p-6">
                <div className="flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div className="rounded-xl p-3 bg-indigo-500/10 text-indigo-500">
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

      {/* Recent Activity Table Teaser */}
      <Card className="border-none shadow-sm shadow-black/5">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-black text-foreground uppercase tracking-wider text-xs">Recent Collections</h3>
          <Link href="/platform/payments/manage/overview" className="text-xs font-bold text-primary hover:underline">View All</Link>
        </div>
        <CardContent className="p-0">
          {payments.length === 0 ? (
            <div className="space-y-3 p-6">
              <p className="text-sm text-muted-foreground">No collections recorded yet.</p>
              <Button size="sm" asChild>
                <Link href="/platform/payments/manage/invoices">Create first invoice</Link>
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black text-[10px]">
                      ₹
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">{payment.tenant_name || "Unknown tenant"}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                        Receipt #{payment.receipt_number || payment.id.slice(0, 8)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black text-foreground">{formatCurrency(payment.amount_paid || 0)}</p>
                    <p className="text-[10px] text-muted-foreground font-bold">
                      {payment.created_at ? new Date(payment.created_at).toLocaleString() : "Unknown date"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

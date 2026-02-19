"use client";

import Link from "next/link";
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
  Activity
} from "lucide-react";
import { 
  Button, 
  Card, 
  CardContent, 
  Badge 
} from "@schoolerp/ui";

const BILLING_STATS = [
  { label: "MRR", value: "₹24.8L", change: "+12.5%", trend: "up", icon: TrendingUp },
  { label: "Active Subs", value: "182", change: "+4", trend: "up", icon: Activity },
  { label: "Churn Rate", value: "1.2%", change: "-0.3%", trend: "down", icon: PieChart },
];

const PAYMENT_ACTIONS = [
  { 
    title: "Billing Overview", 
    description: "Revenue trends and subscription analytics", 
    href: "/platform/payments/manage?tab=overview", 
    icon: TrendingUp,
  },
  { 
    title: "Invoice Management", 
    description: "Issue, track, and manage all school invoices", 
    href: "/platform/payments/manage?tab=invoices", 
    icon: FileText,
  },
  { 
    title: "Billing Configuration", 
    description: "Tax rules and payment gateway settings", 
    href: "/platform/payments/manage?tab=config", 
    icon: Settings,
  },
];

export default function PaymentsDashboard() {
  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Financial Control</h1>
          <p className="mt-1 text-lg text-muted-foreground font-medium">Revenue tracking and subscription life-cycle management.</p>
        </div>
        <Button asChild size="lg" className="shadow-lg shadow-primary/20">
          <Link href="/platform/payments/manage?tab=invoices">
            <DollarSign className="mr-2 h-5 w-5" />
            Quick Invoice
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {BILLING_STATS.map((stat) => (
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
          <Link href="/platform/payments/manage" className="text-xs font-bold text-primary hover:underline">View All</Link>
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 font-black text-[10px]">
                    ₹
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">St. Joseph's School</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Receipt #RCPT-2024-00{i}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-foreground">₹2,45,000</p>
                  <p className="text-[10px] text-muted-foreground font-bold">Today, 2:45 PM</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

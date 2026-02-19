"use client";

import Link from "next/link";
import { 
  Building2, 
  Users, 
  TrendingUp, 
  Plus, 
  ArrowRight, 
  Calendar,
  ShieldCheck,
  CheckCircle2,
  Clock
} from "lucide-react";
import { 
  Button, 
  Card, 
  CardContent, 
  Badge 
} from "@schoolerp/ui";

const STAT_CARDS = [
  { 
    label: "Total Schools", 
    value: "254", 
    subValue: "+12 this month", 
    icon: Building2, 
    color: "text-blue-500",
    bg: "bg-blue-500/10"
  },
  { 
    label: "Active Students", 
    value: "12,450", 
    subValue: "Across all tenants", 
    icon: Users, 
    color: "text-indigo-500",
    bg: "bg-indigo-500/10"
  },
  { 
    label: "Revenue (MTD)", 
    value: "₹45.2L", 
    subValue: "↑ 18.5% from last month", 
    icon: TrendingUp, 
    color: "text-emerald-500",
    bg: "bg-emerald-500/10"
  },
];

const QUICK_ACTIONS = [
  { 
    title: "Register New School", 
    description: "Onboard a new educational institution", 
    href: "/platform/tenants/new", 
    icon: Plus,
    variant: "default"
  },
  { 
    title: "Manage All Schools", 
    description: "View and filter the complete institutional list", 
    href: "/platform/tenants/list", 
    icon: Building2,
    variant: "outline"
  },
];

const RECENT_MILLESTONES = [
  { title: "DPS International Active", date: "2 hours ago", status: "completed" },
  { title: "St. Xavier's Onboarding", date: "5 hours ago", status: "in-progress" },
  { title: "Green Valley Audit", date: "Yesterday", status: "pending" },
];

export default function TenantsDashboard() {
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
      <div className="grid gap-4 sm:grid-cols-3">
        {STAT_CARDS.map((stat) => (
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
              {RECENT_MILLESTONES.map((milestone) => (
                <div key={milestone.title} className="flex items-start gap-3">
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
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">{milestone.date}</p>
                  </div>
                </div>
              ))}
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

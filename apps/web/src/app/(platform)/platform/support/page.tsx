"use client";

import Link from "next/link";
import { 
  LifeBuoy, 
  MessageSquare, 
  Clock, 
  CheckCircle2, 
  ArrowRight,
  ShieldCheck,
  AlertCircle,
  Plus,
  BarChart2,
  Users
} from "lucide-react";
import { 
  Button, 
  Card, 
  CardContent, 
  Badge 
} from "@schoolerp/ui";

const SUPPORT_METRICS = [
  { label: "Active Tickets", value: "24", subValue: "6 critical", icon: MessageSquare, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Wait Time", value: "1.4h", subValue: "Avg response", icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" },
  { label: "Resolution", value: "98.2%", subValue: "SLA compliance", icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
];

const SUPPORT_ACTIONS = [
  { 
    title: "Ticket Management", 
    description: "Respond to inquiries and track support lifecycle", 
    href: "/platform/support/manage?tab=tickets", 
    icon: LifeBuoy,
  },
  { 
    title: "SLA Governance", 
    description: "Define response policies and escalation rules", 
    href: "/platform/support/manage?tab=sla", 
    icon: ShieldCheck,
  },
  { 
    title: "Knowledge Base", 
    description: "Manage documentation and help center articles", 
    href: "/platform/support/kb", 
    icon: BarChart2,
  },
];

export default function SupportDashboard() {
  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Support Desk</h1>
          <p className="mt-1 text-lg text-muted-foreground font-medium">Monitoring platform service levels and user satisfaction.</p>
        </div>
        <Button asChild size="lg" className="shadow-lg shadow-primary/20">
          <Link href="/platform/support/manage?tab=create">
            <Plus className="mr-2 h-5 w-5" />
            New Ticket
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {SUPPORT_METRICS.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
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

      {/* Primary Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {SUPPORT_ACTIONS.map((action) => (
          <Link key={action.title} href={action.href} className="group">
            <Card className="h-full border-none shadow-sm transition-all duration-200 hover:shadow-md hover:bg-accent/50 group-active:scale-[0.98]">
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

      {/* Critical Alerts */}
      <Card className="border-none shadow-sm bg-red-500/5 border border-red-500/10">
        <div className="flex items-center justify-between p-6 border-b border-red-500/10">
          <h3 className="font-black text-red-600 uppercase tracking-wider text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4" /> Priority Escalations
          </h3>
          <Badge variant="outline" className="text-red-600 border-red-200 bg-white dark:bg-slate-900 font-bold">4 OVERDUE</Badge>
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-red-500/10">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 hover:bg-red-500/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-red-500/10 flex items-center justify-center text-red-600">
                    <AlertCircle className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Payment Gateway Connection Failure</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">St. Mary's School · #TKT-942{i}</p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-red-600 text-white border-none text-[10px] font-black">CRITICAL</Badge>
                  <p className="mt-1 text-[10px] text-muted-foreground font-bold italic">Due 2h ago</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

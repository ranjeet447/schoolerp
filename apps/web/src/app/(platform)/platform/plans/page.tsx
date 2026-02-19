"use client";

import Link from "next/link";
import { 
  PackageOpen, 
  Flag, 
  Layers3, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  Zap,
  BarChart,
  Users
} from "lucide-react";
import { 
  Button, 
  Card, 
  CardContent, 
  Badge 
} from "@schoolerp/ui";

const PLAN_DISTRIBUTION = [
  { name: "Starter", icons: PackageOpen, count: 42, color: "text-blue-500", bg: "bg-blue-500/10" },
  { name: "Pro", icons: Zap, count: 124, color: "text-amber-500", bg: "bg-amber-500/10" },
  { name: "Enterprise", icons: ShieldCheck, count: 16, color: "text-indigo-500", bg: "bg-indigo-500/10" },
];

const PLAN_ACTIONS = [
  { 
    title: "Plan Architecture", 
    description: "Define pricing, limits and module bundles", 
    href: "/platform/plans/manage?tab=plans", 
    icon: Layers3,
  },
  { 
    title: "Feature Rollouts", 
    description: "Control flag deployment and cohort targeting", 
    href: "/platform/plans/manage?tab=rollout", 
    icon: Flag,
  },
];

export default function PlansDashboard() {
  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Product Packaging</h1>
          <p className="mt-1 text-lg text-muted-foreground font-medium">Manage service plans, feature flags and rollout cohorts.</p>
        </div>
        <Button asChild size="lg" className="shadow-lg shadow-primary/20">
          <Link href="/platform/plans/manage?tab=plans">
            <Plus className="mr-2 h-5 w-5" />
            Create New Plan
          </Link>
        </Button>
      </div>

      {/* Distribution Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {PLAN_DISTRIBUTION.map((p) => (
          <Card key={p.name} className="border-none shadow-sm shadow-black/5 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">{p.name} Tier</p>
                  <h3 className="mt-2 text-2xl font-black text-foreground">{p.count} <span className="text-sm font-medium text-muted-foreground italic">Schools</span></h3>
                </div>
                <div className={`rounded-xl p-3 ${p.bg} ${p.color}`}>
                  <p.icons className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Access */}
      <div className="grid gap-4 md:grid-cols-2">
        {PLAN_ACTIONS.map((action) => (
          <Link key={action.title} href={action.href} className="group">
            <Card className="h-full border-none shadow-sm shadow-black/5 transition-all duration-200 hover:shadow-md hover:bg-accent/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="rounded-xl p-3 bg-primary/10 text-primary">
                      <action.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-bold text-foreground">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.description}</p>
                    </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Active Rollouts Teaser */}
      <Card className="border-none shadow-sm shadow-black/5">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h3 className="font-black text-foreground uppercase tracking-wider text-xs">Active Feature Rollouts</h3>
          <Link href="/platform/plans/manage?tab=rollout" className="text-xs font-bold text-primary hover:underline">View All</Link>
        </div>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {[
              { key: "beta_transport_v2", target: "50% of Pro", status: "Active" },
              { key: "new_exam_module", target: "All Enterprise", status: "Active" },
            ].map((rollout) => (
              <div key={rollout.key} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-600">
                    <Flag className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">{rollout.key}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">Target: {rollout.target}</p>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px] font-bold text-emerald-600 bg-emerald-500/5 border-emerald-500/20">
                  {rollout.status}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

"use client";

import Link from "next/link";
import { 
  ShieldCheck, 
  Users, 
  Key, 
  Lock, 
  ArrowRight,
  ShieldAlert,
  UserPlus,
  Fingerprint,
  History
} from "lucide-react";
import { 
  Button, 
  Card, 
  CardContent, 
  Badge 
} from "@schoolerp/ui";

const SECURITY_STATS = [
  { label: "Active Admins", value: "12", subValue: "High-level access", icon: ShieldCheck, color: "text-blue-500", bg: "bg-blue-500/10" },
  { label: "Total Staff", value: "48", subValue: "Combined internal roles", icon: Users, color: "text-indigo-500", bg: "bg-indigo-500/10" },
  { label: "Pending Invites", value: "3", subValue: "Awaiting registration", icon: UserPlus, color: "text-amber-500", bg: "bg-amber-500/10" },
];

const ACCESS_ACTIONS = [
  { 
    title: "User Management", 
    description: "Provision and manage administrative users", 
    href: "/platform/internal-users/manage?tab=users", 
    icon: Users,
  },
  { 
    title: "RBAC & Permissions", 
    description: "Define roles and platform access levels", 
    href: "/platform/internal-users/manage?tab=roles", 
    icon: Lock,
  },
  { 
    title: "Audit Trail", 
    description: "Monitor administrative changes and login events", 
    href: "/platform/audit-logs", 
    icon: History,
  },
];

export default function AccessControlDashboard() {
  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Access Governance</h1>
          <p className="mt-1 text-lg text-muted-foreground font-medium">Platform-wide user provisioning and role-based security.</p>
        </div>
        <Button asChild size="lg" className="shadow-lg shadow-primary/20">
          <Link href="/platform/internal-users/manage?tab=invite">
            <UserPlus className="mr-2 h-5 w-5" />
            Invite Admin
          </Link>
        </Button>
      </div>

      {/* Security Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        {SECURITY_STATS.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6 text-center lg:text-left lg:flex lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground/60">{stat.label}</p>
                <h3 className="mt-2 text-3xl font-black text-foreground">{stat.value}</h3>
                <p className="mt-1 text-xs font-medium text-muted-foreground">{stat.subValue}</p>
              </div>
              <div className={`mx-auto mt-4 lg:mt-0 lg:mx-0 rounded-2xl p-4 ${stat.bg} ${stat.color}`}>
                <stat.icon className="h-8 w-8" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Core Actions */}
      <div className="grid gap-4 md:grid-cols-3">
        {ACCESS_ACTIONS.map((action) => (
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

      {/* Security Monitoring */}
      <div className="grid gap-8 lg:grid-cols-3">
        <Card className="lg:col-span-2 border-none shadow-sm">
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h3 className="font-black text-foreground uppercase tracking-wider text-xs">Security Pulse</h3>
            <Fingerprint className="h-4 w-4 text-muted-foreground" />
          </div>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {[
                { event: "New Super Admin Added", user: "ranjeet@dev.com", time: "2h ago", icon: ShieldAlert, color: "text-red-500" },
                { event: "Role 'Support Lead' Modified", user: "admin@erp.com", time: "5h ago", icon: Lock, color: "text-amber-500" },
                { event: "Successful Root Login", user: "system@internal", time: "12h ago", icon: ShieldCheck, color: "text-emerald-500" },
              ].map((log, i) => (
                <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <log.icon className={`h-4 w-4 ${log.color}`} />
                    <div>
                      <p className="text-sm font-bold text-foreground">{log.event}</p>
                      <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">by {log.user}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-muted-foreground">{log.time}</span>
                </div>
              ))}
            </div>
            <Button variant="ghost" className="w-full h-12 rounded-none border-t border-border text-xs font-bold text-primary" asChild>
              <Link href="/platform/audit-logs">VIEW FULL SECURITY LOG</Link>
            </Button>
          </CardContent>
        </Card>

        <Card className="border-none shadow-sm bg-slate-900 text-white overflow-hidden relative group">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <ShieldAlert className="h-32 w-32" />
          </div>
          <CardContent className="p-8 h-full flex flex-col justify-between relative z-10">
            <div className="space-y-4">
              <Badge className="bg-amber-500 text-slate-900 border-none font-black text-[10px] px-2">GOVERNANCE ALERT</Badge>
              <h3 className="text-2xl font-black leading-tight">MFA Enforcement Policy</h3>
              <p className="text-slate-400 text-sm leading-relaxed">
                Platform-wide mandatory Multi-Factor Authentication will be enforced starting next month for all administrative roles.
              </p>
            </div>
            <Button variant="outline" className="w-full mt-8 font-bold border-slate-700 text-white hover:bg-slate-800">
              Configure MFA
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { apiClient } from "@/lib/api-client";
import {
  ShieldCheck,
  Users,
  Lock,
  ArrowRight,
  ShieldAlert,
  UserPlus,
  Fingerprint,
  History,
  RefreshCcw,
} from "lucide-react";
import {
  Button,
  Card,
  CardContent,
  Badge,
} from "@schoolerp/ui";

type PlatformInternalUser = {
  id: string;
  role_code: string;
  is_active: boolean;
};

type PlatformAuditLog = {
  id: number;
  action: string;
  user_name?: string;
  user_email?: string;
  created_at: string;
};

const ACCESS_ACTIONS = [
  {
    title: "User Management",
    description: "Provision and manage administrative users",
    href: "/platform/internal-users/manage/users",
    icon: Users,
  },
  {
    title: "RBAC Matrix",
    description: "Define roles and permission grants for platform teams",
    href: "/platform/internal-users/manage/rbac",
    icon: Lock,
  },
  {
    title: "Security Policies",
    description: "Manage IP allowlists, MFA policy, and break-glass controls",
    href: "/platform/internal-users/manage/security",
    icon: ShieldAlert,
  },
  {
    title: "Audit Trails",
    description: "Monitor administrative changes and authentication events",
    href: "/platform/internal-users/manage/audit",
    icon: History,
  },
];

export default function AccessControlDashboard() {
  const [users, setUsers] = useState<PlatformInternalUser[]>([]);
  const [logs, setLogs] = useState<PlatformAuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const [usersRes, logsRes] = await Promise.all([
        apiClient("/admin/platform/internal-users?limit=200"),
        apiClient("/admin/platform/security/audit-logs?limit=10"),
      ]);

      if (!usersRes.ok) {
        throw new Error("Failed to load internal users.");
      }
      const userRows = await usersRes.json();
      setUsers(Array.isArray(userRows) ? userRows : []);

      if (logsRes.ok) {
        const logRows = await logsRes.json();
        setLogs(Array.isArray(logRows) ? logRows : []);
      } else {
        setLogs([]);
      }
    } catch (e: any) {
      setError(e?.message || "Failed to load access dashboard.");
      setUsers([]);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const securityStats = useMemo(() => {
    const activeAdmins = users.filter((user) => user.is_active && user.role_code === "super_admin").length;
    const inactiveAccounts = users.filter((user) => !user.is_active).length;
    return [
      {
        label: "Active Admins",
        value: activeAdmins.toString(),
        subValue: "High-level access",
        icon: ShieldCheck,
        color: "text-blue-500",
        bg: "bg-blue-500/10",
      },
      {
        label: "Total Staff",
        value: users.length.toString(),
        subValue: "Combined internal roles",
        icon: Users,
        color: "text-indigo-500",
        bg: "bg-indigo-500/10",
      },
      {
        label: "Inactive Accounts",
        value: inactiveAccounts.toString(),
        subValue: "Needs access review",
        icon: UserPlus,
        color: "text-amber-500",
        bg: "bg-amber-500/10",
      },
    ];
  }, [users]);

  const auditPulse = useMemo(() => logs.slice(0, 6), [logs]);

  const getActionVisual = (action: string) => {
    const normalized = (action || "").toLowerCase();
    if (normalized.includes("impersonate") || normalized.includes("revoke")) {
      return { icon: ShieldAlert, color: "text-red-500" };
    }
    if (normalized.includes("role") || normalized.includes("permission")) {
      return { icon: Lock, color: "text-amber-500" };
    }
    if (normalized.includes("login") || normalized.includes("auth")) {
      return { icon: ShieldCheck, color: "text-emerald-500" };
    }
    return { icon: Fingerprint, color: "text-blue-500" };
  };

  if (loading && users.length === 0) {
    return (
      <div className="flex h-[45vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary/30 border-t-primary" />
          <p className="mt-3 text-sm font-semibold text-muted-foreground">Loading access governance...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-4xl">Access Governance</h1>
          <p className="mt-1 text-lg text-muted-foreground font-medium">Platform-wide user provisioning and role-based security.</p>
        </div>
        <Button asChild size="lg" className="shadow-lg shadow-primary/20">
          <Link href="/platform/internal-users/manage/users">
            <UserPlus className="mr-2 h-5 w-5" />
            Invite Admin
          </Link>
        </Button>
      </div>

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

      {/* Security Stats */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {securityStats.map((stat) => (
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
            {auditPulse.length === 0 ? (
              <div className="space-y-3 p-6">
                <p className="text-sm text-muted-foreground">No security events logged yet.</p>
                <Button size="sm" asChild>
                  <Link href="/platform/internal-users/manage/users">Invite first admin</Link>
                </Button>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {auditPulse.map((log) => {
                  const visual = getActionVisual(log.action);
                  return (
                    <div key={log.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        <visual.icon className={`h-4 w-4 ${visual.color}`} />
                        <div>
                          <p className="text-sm font-bold text-foreground">{(log.action || "unknown.action").replaceAll(".", " ")}</p>
                          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                            by {log.user_name || log.user_email || "System"}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {log.created_at ? new Date(log.created_at).toLocaleString() : "Unknown date"}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
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

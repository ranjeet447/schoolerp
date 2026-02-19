"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Ban,
  Building2,
  CreditCard,
  FileText,
  FileCheck2,
  LayoutGrid,
  LifeBuoy,
  KeyRound,
  Layers3,
  Link as LinkIcon,
  LockKeyhole,
  LogOut,
  Megaphone,
  Menu,
  PieChart,
  Settings,
  Search,
  Shield,
  ShieldCheck,
  Scale,
  User,
  Users,
} from "lucide-react";
import { Button } from "@schoolerp/ui";
import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { RBACService } from "@/lib/auth-service";
import { MobileNav } from "./components/mobile-nav";

const NAV_GROUPS = [
  {
    title: "Intelligence",
    items: [
      { href: "/platform/dashboard", label: "Pulse Dashboard", icon: BarChart3, permission: "platform:analytics.read" },
      { href: "/platform/analytics", label: "Revenue Analytics", icon: PieChart, permission: "platform:analytics.read" },
    ],
  },
  {
    title: "Portfolio",
    items: [
      { href: "/platform/tenants", label: "Tenant Dashboard", icon: Building2, permission: "platform:tenants.read" },
      { href: "/platform/plans", label: "Product Dash", icon: Layers3, permission: "platform:plans.read" },
      { href: "/platform/signup-requests", label: "Onboarding Queue", icon: FileCheck2, permission: "platform:tenants.write" },
      { href: "/platform/payments", label: "Billing Dash", icon: CreditCard, permission: "platform:billing.read" },
    ],
  },
  {
    title: "Ops & Support",
    items: [
      { href: "/platform/support", label: "Support Dashboard", icon: LifeBuoy, permission: "platform:support.read" },
      { href: "/platform/incidents", label: "Service Incidents", icon: AlertTriangle, permission: "platform:incidents.read" },
      { href: "/platform/marketing", label: "Communications", icon: Megaphone, permission: "platform:marketing.write" },
    ],
  },
  {
    title: "Infrastructure",
    items: [
      { href: "/platform/integrations", label: "Infra Connectivity", icon: LinkIcon, permission: "platform:integrations.read" },
      { href: "/platform/monitoring", label: "System Telemetry", icon: Activity, permission: "platform:monitoring.read" },
      { href: "/platform/settings", label: "Global Config", icon: Settings, permission: "platform:settings.write" },
    ],
  },
  {
    title: "Security & Trust",
    items: [
      { href: "/platform/users", label: "Global Users", icon: Users, permission: "platform:user.read" },
      { href: "/platform/internal-users", label: "Access Control", icon: ShieldCheck, permission: "platform:user.read" },
      { href: "/platform/security-events", label: "Threat Intel", icon: Shield, permission: "platform:security.read" },
      { href: "/platform/audit-logs", label: "Audit Trails", icon: FileText, permission: "platform:audit.read" },
      { href: "/platform/blocks", label: "Risk Mitigation", icon: Ban, permission: "platform:security.write" },
      { href: "/platform/legal", label: "Legal & Policies", icon: Scale, permission: "platform:settings.write" },
      { href: "/platform/password-policy", label: "Governance", icon: LockKeyhole, permission: "platform:settings.write" },
      { href: "/platform/secrets", label: "Secret Management", icon: KeyRound, permission: "platform:security.write" },
    ],
  },
];

export default function PlatformLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    if (!user?.role) {
      router.replace("/auth/login");
      return;
    }

    if (user.role !== "super_admin") {
      router.replace("/");
    }
  }, [isLoading, router, user?.role]);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="hidden w-72 border-r border-border bg-card md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link
            href="/platform/dashboard"
            className="flex items-center gap-3 font-bold text-primary"
          >
            <Shield className="h-6 w-6" />
            <span>Platform Admin</span>
          </Link>
        </div>

        <nav className="flex-1 overflow-y-auto py-6">
          <div className="space-y-6 px-4">
            {NAV_GROUPS.map((group) => {
              const visibleItems = group.items.filter(
                (item) => !item.permission || RBACService.hasPermission(item.permission)
              );

              if (visibleItems.length === 0) return null;

              return (
                <div key={group.title} className="space-y-2">
                  <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                    {group.title}
                  </h3>
                  <ul className="space-y-1">
                    {visibleItems.map((item) => (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                            pathname === item.href
                              ? "bg-primary/10 text-primary shadow-sm"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          }`}
                        >
                          <item.icon className={`h-4 w-4 ${pathname === item.href ? "text-primary" : "text-muted-foreground/70"}`} />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </nav>

        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/20 bg-primary/10 text-xs font-bold text-primary">
                {user?.name?.[0] || <User className="h-4 w-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-medium text-foreground">{user?.name || "..."}</p>
                <p className="truncate text-xs text-muted-foreground">SaaS Admin</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <Button variant="ghost" size="icon" className="text-foreground md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle className="text-muted-foreground hover:text-foreground" />
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline-block">SchoolERP Platform</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}

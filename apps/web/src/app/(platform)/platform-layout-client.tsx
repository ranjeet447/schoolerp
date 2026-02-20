"use client";

import React, { useEffect, useMemo, useState } from "react";
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
import {
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
} from "@schoolerp/ui";
import { useAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { RBACService } from "@/lib/auth-service";
import { MobileNav } from "./components/mobile-nav";
import { useDebouncedValue } from "@/lib/use-debounced-value";

const NAV_GROUPS = [
  {
    title: "Intelligence",
    items: [
      { href: "/platform/dashboard", label: "Pulse Dashboard", icon: BarChart3, permission: "platform:analytics.read", keywords: ["overview", "kpi", "health"] },
      { href: "/platform/analytics", label: "Revenue Analytics", icon: PieChart, permission: "platform:analytics.read", keywords: ["trend", "finance", "growth"] },
    ],
  },
  {
    title: "Portfolio",
    items: [
      { href: "/platform/tenants", label: "Tenant Dashboard", icon: Building2, permission: "platform:tenants.read", keywords: ["schools", "customers", "accounts"] },
      { href: "/platform/plans", label: "Product Dash", icon: Layers3, permission: "platform:plans.read", keywords: ["pricing", "subscriptions", "plan"] },
      { href: "/platform/signup-requests", label: "Onboarding Queue", icon: FileCheck2, permission: "platform:tenants.write", keywords: ["approval", "prospects", "requests"] },
      { href: "/platform/payments", label: "Billing Dash", icon: CreditCard, permission: "platform:billing.read", keywords: ["invoices", "collections", "refunds"] },
    ],
  },
  {
    title: "Ops & Support",
    items: [
      { href: "/platform/support", label: "Support Dashboard", icon: LifeBuoy, permission: "platform:support.read", keywords: ["tickets", "sla", "desk"] },
      { href: "/platform/incidents", label: "Service Incidents", icon: AlertTriangle, permission: "platform:incidents.read", keywords: ["outage", "status", "postmortem"] },
      { href: "/platform/marketing", label: "Communications", icon: Megaphone, permission: "platform:marketing.write", keywords: ["campaign", "broadcast", "outreach"] },
    ],
  },
  {
    title: "Infrastructure",
    items: [
      { href: "/platform/integrations", label: "Infra Connectivity", icon: LinkIcon, permission: "platform:integrations.read", keywords: ["webhook", "provider", "connectors"] },
      { href: "/platform/monitoring", label: "System Telemetry", icon: Activity, permission: "platform:monitoring.read", keywords: ["observability", "metrics", "uptime"] },
      { href: "/platform/settings", label: "Global Config", icon: Settings, permission: "platform:settings.write", keywords: ["config", "defaults", "system"] },
    ],
  },
  {
    title: "Security & Trust",
    items: [
      { href: "/platform/users", label: "Global Users", icon: Users, permission: "platform:user.read", keywords: ["directory", "impersonation", "identity"] },
      { href: "/platform/internal-users", label: "Access Control", icon: ShieldCheck, permission: "platform:user.read", keywords: ["rbac", "permissions", "roles"] },
      { href: "/platform/security-events", label: "Threat Intel", icon: Shield, permission: "platform:security.read", keywords: ["security", "anomaly", "events"] },
      { href: "/platform/audit-logs", label: "Audit Trails", icon: FileText, permission: "platform:audit.read", keywords: ["history", "forensics", "logs"] },
      { href: "/platform/blocks", label: "Risk Mitigation", icon: Ban, permission: "platform:security.write", keywords: ["block", "freeze", "containment"] },
      { href: "/platform/legal", label: "Legal & Policies", icon: Scale, permission: "platform:settings.write", keywords: ["terms", "privacy", "compliance"] },
      { href: "/platform/password-policy", label: "Governance", icon: LockKeyhole, permission: "platform:settings.write", keywords: ["password", "policy", "controls"] },
      { href: "/platform/secrets", label: "Secret Management", icon: KeyRound, permission: "platform:security.write", keywords: ["keys", "rotation", "credentials"] },
    ],
  },
];

type FeatureNavItem = {
  href: string;
  label: string;
  permission?: string;
  keywords?: string[];
  groupTitle: string;
};

function fuzzyScore(haystack: string, needle: string): number {
  const text = haystack.toLowerCase();
  const query = needle.toLowerCase().trim();
  if (!query) return 1;
  if (text === query) return 1000;
  if (text.startsWith(query)) return 750 - (text.length - query.length);
  if (text.includes(query)) return 500 - Math.max(0, text.indexOf(query));

  let queryIndex = 0;
  let score = 0;
  let streak = 0;
  for (let i = 0; i < text.length && queryIndex < query.length; i++) {
    if (text[i] === query[queryIndex]) {
      queryIndex++;
      streak++;
      score += 14 + streak;
    } else {
      streak = 0;
    }
  }
  if (queryIndex < query.length) return -1;
  return score - (text.length - query.length);
}

export default function PlatformLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featureSearchOpen, setFeatureSearchOpen] = useState(false);
  const [featureSearchQuery, setFeatureSearchQuery] = useState("");
  const debouncedFeatureSearchQuery = useDebouncedValue(featureSearchQuery, 120);

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

  const visibleNavGroups = useMemo(() => {
    return NAV_GROUPS.map((group) => ({
      ...group,
      items: group.items.filter(
        (item) => !item.permission || RBACService.hasPermission(item.permission)
      ),
    })).filter((group) => group.items.length > 0);
  }, []);

  const searchableFeatures = useMemo<FeatureNavItem[]>(() => {
    return visibleNavGroups.flatMap((group) =>
      group.items.map((item) => ({
        href: item.href,
        label: item.label,
        permission: item.permission,
        keywords: item.keywords || [],
        groupTitle: group.title,
      }))
    );
  }, [visibleNavGroups]);

  const featureSearchResults = useMemo(() => {
    const q = debouncedFeatureSearchQuery.trim();
    if (!q) {
      return searchableFeatures.slice(0, 10).map((feature) => ({
        feature,
        score: 0,
      }));
    }

    return searchableFeatures
      .map((feature) => {
        const routeName = feature.href.replace("/platform/", "").replaceAll("/", " ");
        const haystack = `${feature.label} ${feature.groupTitle} ${routeName} ${(feature.keywords || []).join(" ")}`;
        return {
          feature,
          score: fuzzyScore(haystack, q),
        };
      })
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 12);
  }, [debouncedFeatureSearchQuery, searchableFeatures]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setFeatureSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const openFeature = (href: string) => {
    setFeatureSearchOpen(false);
    setFeatureSearchQuery("");
    setMobileMenuOpen(false);
    router.push(href);
  };

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
            {visibleNavGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">
                  {group.title}
                </h3>
                <ul className="space-y-1">
                  {group.items.map((item) => (
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
            ))}
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
          <Button
            variant="ghost"
            size="icon"
            className="text-foreground md:hidden"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open navigation menu"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="outline"
              className="hidden h-9 w-[240px] items-center justify-start gap-2 text-muted-foreground md:flex"
              onClick={() => setFeatureSearchOpen(true)}
            >
              <Search className="h-4 w-4" />
              <span className="text-sm">Search features...</span>
              <span className="ml-auto rounded border border-border px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground/80">
                ⌘K
              </span>
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={() => setFeatureSearchOpen(true)}
              aria-label="Search platform features"
            >
              <Search className="h-4 w-4" />
            </Button>
            <ThemeToggle className="text-muted-foreground hover:text-foreground" />
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline-block">SchoolERP Platform</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-4 pb-24 md:p-6 md:pb-6">{children}</main>
      </div>
      <MobileNav />

      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="w-[92vw] max-w-sm p-0">
          <DialogHeader className="border-b border-border p-4">
            <DialogTitle className="text-base">Platform Navigation</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto p-4">
            <div className="space-y-5">
              {visibleNavGroups.map((group) => (
                <div key={`mobile-${group.title}`} className="space-y-2">
                  <p className="px-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                    {group.title}
                  </p>
                  <ul className="space-y-1">
                    {group.items.map((item) => (
                      <li key={`mobile-${item.href}`}>
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                            pathname === item.href
                              ? "bg-primary/10 text-primary"
                              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                          }`}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="mt-6 border-t border-border pt-4">
              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => {
                  setMobileMenuOpen(false);
                  logout();
                }}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={featureSearchOpen} onOpenChange={setFeatureSearchOpen}>
        <DialogContent className="w-[95vw] max-w-2xl p-0">
          <DialogHeader className="border-b border-border p-4">
            <DialogTitle className="text-base">Global Feature Search</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                autoFocus
                value={featureSearchQuery}
                onChange={(e) => setFeatureSearchQuery(e.target.value)}
                placeholder="Search by feature, page, keyword..."
                className="pl-9"
              />
            </div>

            <div className="mt-4 max-h-[420px] overflow-y-auto">
              {featureSearchResults.length === 0 ? (
                <p className="rounded-lg border border-border bg-muted/20 px-3 py-6 text-center text-sm text-muted-foreground">
                  No matching feature found.
                </p>
              ) : (
                <ul className="space-y-1">
                  {featureSearchResults.map(({ feature }) => (
                    <li key={`feature-search-${feature.href}`}>
                      <button
                        type="button"
                        onClick={() => openFeature(feature.href)}
                        className="flex w-full items-start gap-3 rounded-md px-3 py-2 text-left transition-colors hover:bg-accent"
                      >
                        <LayoutGrid className="mt-0.5 h-4 w-4 text-muted-foreground" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">{feature.label}</p>
                          <p className="truncate text-xs text-muted-foreground">{feature.groupTitle} · {feature.href}</p>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

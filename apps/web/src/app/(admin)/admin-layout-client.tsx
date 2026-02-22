"use client"

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Banknote, 
  CalendarCheck, 
  CalendarDays,
  MessageSquare,
  FileText,
  FileCheck2,
  Printer,
  ClipboardList,
  Settings,
  Menu,
  LogOut,
  User,
  Shield,
  School,
  Sliders,
  Building,
  Clock,
  Upload,
  BookOpen,
  Home,
  CreditCard,
  Layers3,
  X,
  ChevronDown,
  CheckCircle,
} from 'lucide-react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@schoolerp/ui';
import { RBACService } from '@/lib/auth-service';
import { usePathname, useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenant-utils';
import { useAuth } from '@/components/auth-provider';
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { apiClient } from "@/lib/api-client";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
  activePrefixes?: string[];
};

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
  { href: '/admin/diary', label: 'Teacher Diary', icon: BookOpen, permission: 'sis:read' },
  { href: '/admin/reception', label: 'Reception Hub', icon: School, permission: 'sis:read' },
  { href: '/admin/admissions/enquiries', label: 'Admissions', icon: ClipboardList, permission: 'sis:read' },
  { href: '/admin/safety/visitors', label: 'Visitor Logs', icon: Clock, permission: 'safety:read' },
  { href: '/admin/attendance', label: 'Attendance', icon: CalendarCheck, permission: 'attendance:read' },
  { href: '/admin/staff-attendance', label: 'Staff Attendance', icon: Clock, permission: 'attendance:read' },
  { href: '/admin/timetable', label: 'Timetable', icon: CalendarDays, permission: 'attendance:read' },
  { href: '/admin/finance', label: 'Fees & Finance', icon: Banknote, permission: 'fees:read' },
  { href: '/admin/finance/counter', label: 'Fee Counter', icon: Banknote, permission: 'fees:read' },
  { href: '/admin/approvals', label: 'Approvals Inbox', icon: CheckCircle, permission: 'fees:read' },
  { href: '/admin/reports', label: 'Office Reports', icon: Printer, permission: 'fees:read' },
  { href: '/admin/exams', label: 'Exams & Results', icon: GraduationCap, permission: 'exams:read' },
  { href: '/admin/communication', label: 'Communication', icon: MessageSquare, permission: 'notices:read' },
  { href: '/admin/kb', label: 'Knowledgebase', icon: BookOpen, permission: 'notices:read' },
  { href: '/admin/certificates', label: 'TC & Certificates', icon: FileCheck2, permission: 'sis:read' },
  { href: '/admin/notices', label: 'Notices', icon: FileText, permission: 'notices:read' },
  { href: '/admin/houses', label: 'Houses', icon: Shield, permission: 'sis:read' },
  { href: '/admin/custom-fields', label: 'Custom Fields', icon: Sliders, permission: 'tenant:settings:view' },
  { href: '/admin/bulk-import', label: 'Bulk Import', icon: Upload, permission: 'sis:write' },
  { href: '/admin/calendar', label: 'School Calendar', icon: CalendarDays, permission: 'attendance:read' },
  { href: '/admin/hostel', label: 'Hostel Module', icon: Home, permission: 'sis:read' },
  { href: '/admin/id-cards', label: 'Digital ID Cards', icon: CreditCard, permission: 'sis:read' },
  { href: '/admin/learning-resources', label: 'Learning Resources', icon: BookOpen, permission: 'notices:read' },
  { href: '/admin/school-profile', label: 'School Profile', icon: Building, permission: 'tenant:settings:view' },
  { href: '/admin/plan', label: 'Platform Plan', icon: Layers3, permission: 'tenant:settings:view' },
  { href: '/admin/billing', label: 'Platform Billing', icon: CreditCard, permission: 'tenant:settings:view' },
  {
    href: '/admin/settings/users',
    label: 'User & Access',
    icon: Shield,
    permission: 'tenant:users:manage',
    activePrefixes: ['/admin/settings/users', '/admin/settings/roles', '/admin/settings/permissions', '/admin/settings/access'],
  },
  { href: '/admin/settings/onboarding', label: 'School Onboarding', icon: School, permission: 'platform:manage' },
  { href: '/admin/settings/templates', label: 'Smart Alerts', icon: MessageSquare, permission: 'tenant:settings:view' },
  { href: '/admin/settings/gateways', label: 'Gateways', icon: Sliders, permission: 'tenant:settings:view' },
  { href: '/admin/settings/profile', label: 'My Profile', icon: User },
  { href: '/admin/settings/master-data', label: 'Settings', icon: Settings, permission: 'tenant:settings:view' },
];

const NAV_GROUP_ORDER = [
  'Overview',
  'Reception',
  'Academics & Students',
  'Operations',
  'Administration',
] as const;

function isNavItemActive(pathname: string, item: NavItem): boolean {
  if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
    return true;
  }
  if (!item.activePrefixes?.length) return false;
  return item.activePrefixes.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function getNavGroup(href: string): (typeof NAV_GROUP_ORDER)[number] {
  if (href.startsWith('/admin/reception') || href.startsWith('/admin/admissions/enquiries') || href.startsWith('/admin/safety/visitors')) return 'Reception';
  if (href.startsWith('/admin/settings') || href.startsWith('/admin/plan') || href.startsWith('/admin/billing')) return 'Administration';
  if (
    href.startsWith('/admin/students') ||
    href.startsWith('/admin/admissions') ||
    href.startsWith('/admin/attendance') ||
    href.startsWith('/admin/staff-attendance') ||
    href.startsWith('/admin/timetable') ||
    href.startsWith('/admin/exams') ||
    href.startsWith('/admin/certificates') ||
    href.startsWith('/admin/notices') ||
    href.startsWith('/admin/communication') ||
    href.startsWith('/admin/kb') ||
    href.startsWith('/admin/houses') ||
    href.startsWith('/admin/learning-resources')
  ) {
    return 'Academics & Students';
  }
  if (
    href.startsWith('/admin/finance') ||
    href.startsWith('/admin/calendar') ||
    href.startsWith('/admin/hostel') ||
    href.startsWith('/admin/id-cards') ||
    href.startsWith('/admin/school-profile') ||
    href.startsWith('/admin/bulk-import')
  ) {
    return 'Operations';
  }
  return 'Overview';
}

export default function AdminLayoutClient({
  children,
  config
}: {
  children: React.ReactNode;
  config: TenantConfig | null;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [exitingImpersonation, setExitingImpersonation] = useState(false);

  useEffect(() => {
    if (user?.role === 'super_admin') {
      router.replace('/platform/dashboard');
    }
  }, [user?.role, router]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsImpersonating(!!localStorage.getItem("impersonator_auth_token"));
  }, [pathname]);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const exitImpersonation = async () => {
    if (typeof window === "undefined" || exitingImpersonation) return;
    setExitingImpersonation(true);

    const originalToken = localStorage.getItem("impersonator_auth_token") || "";
    if (!originalToken) {
      logout();
      return;
    }

    const originalRole = localStorage.getItem("impersonator_user_role") || "super_admin";
    const originalUserID = localStorage.getItem("impersonator_user_id") || "";
    const originalUserEmail = localStorage.getItem("impersonator_user_email") || "";
    const originalUserName = localStorage.getItem("impersonator_user_name") || "";
    const originalTenantID = localStorage.getItem("impersonator_tenant_id") || "";

    const targetTenantID = localStorage.getItem("impersonation_target_tenant_id") || localStorage.getItem("tenant_id") || "";
    const targetUserID = localStorage.getItem("impersonation_target_user_id") || localStorage.getItem("user_id") || "";
    const targetUserEmail = localStorage.getItem("impersonation_target_user_email") || localStorage.getItem("user_email") || "";
    const startedAt = localStorage.getItem("impersonation_started_at") || "";
    const reason = localStorage.getItem("impersonation_reason") || "manual_exit";

    localStorage.setItem("auth_token", originalToken);
    localStorage.setItem("user_role", originalRole);
    localStorage.setItem("user_id", originalUserID);
    localStorage.setItem("user_email", originalUserEmail);
    localStorage.setItem("user_name", originalUserName);
    localStorage.setItem("tenant_id", originalTenantID);

    localStorage.removeItem("impersonator_auth_token");
    localStorage.removeItem("impersonator_user_role");
    localStorage.removeItem("impersonator_user_id");
    localStorage.removeItem("impersonator_user_email");
    localStorage.removeItem("impersonator_user_name");
    localStorage.removeItem("impersonator_tenant_id");
    localStorage.removeItem("impersonation_started_at");
    localStorage.removeItem("impersonation_reason");
    localStorage.removeItem("impersonation_target_tenant_id");
    localStorage.removeItem("impersonation_target_user_id");
    localStorage.removeItem("impersonation_target_user_email");

    if (targetTenantID) {
      try {
        await apiClient(`/admin/platform/tenants/${targetTenantID}/impersonation-exit`, {
          method: "POST",
          body: JSON.stringify({
            reason: "manual_exit",
            impersonation_notes: reason,
            target_user_id: targetUserID,
            target_user_email: targetUserEmail,
            started_at: startedAt,
          }),
        });
      } catch {
        // Best effort logging only; session restore should still proceed.
      }
    }

    window.location.href = "/platform/dashboard";
  };

  const filteredNavItems = useMemo(
    () => NAV_ITEMS.filter((item) => !item.permission || RBACService.hasPermission(item.permission)),
    []
  );

  const groupedNavItems = useMemo(() => {
    const groups = new Map<string, NavItem[]>();
    for (const item of filteredNavItems) {
      const group = getNavGroup(item.href);
      const existing = groups.get(group) ?? [];
      existing.push(item);
      groups.set(group, existing);
    }
    return NAV_GROUP_ORDER
      .map((title) => ({ title, items: groups.get(title) ?? [] }))
      .filter((group) => group.items.length > 0);
  }, [filteredNavItems]);

  const activeNavLabel = useMemo(() => {
    const match = filteredNavItems.find((item) => isNavItemActive(pathname, item));
    return match?.label ?? "Admin";
  }, [filteredNavItems, pathname]);

  const schoolName = config?.branding?.name_override || config?.name || 'SchoolERP';
  const logoUrl = config?.branding?.logo_url;

  return (
    <div className="flex h-dvh bg-background text-foreground" style={{ 
      //@ts-ignore
      '--primary-color': config?.branding?.primary_color || '#4f46e5' 
    }}>
      {/* Sidebar */}
      <aside className="w-72 border-r border-border bg-card hidden md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-border px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-xl text-indigo-400" style={{ color: config?.branding?.primary_color || undefined }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
            ) : (
              <GraduationCap className="h-6 w-6" />
            )}
            {!config?.white_label && (
              <span>School<span className="text-foreground">ERP</span></span>
            )}
            {config?.white_label && (
              <span className="text-foreground truncate">{schoolName}</span>
            )}
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <div className="space-y-5 px-3">
            {groupedNavItems.map((group) => (
              <div key={group.title} className="space-y-1.5">
                <h3 className="px-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                  {group.title}
                </h3>
                <ul className="space-y-1">
                  {group.items.map((item) => {
                    const isActive = isNavItemActive(pathname, item);
                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-accent text-foreground font-semibold'
                              : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                          }`}
                          style={isActive ? { color: config?.branding?.primary_color || undefined, backgroundColor: `${config?.branding?.primary_color}10` || undefined } : {}}
                        >
                          <item.icon className="h-4 w-4 shrink-0" />
                          <span className="truncate">{item.label}</span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>
        </nav>
        
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            <Link href="/admin/settings/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="h-9 w-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 border border-indigo-500/30" style={{ borderColor: config?.branding?.primary_color ? `${config.branding.primary_color}50` : undefined, color: config?.branding?.primary_color || undefined }}>
                {user?.name?.[0] || <User className="h-4 w-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">{user?.name || 'Loading...'}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{user?.role?.replace('_', ' ') || ''}</p>
              </div>
            </Link>
            <Button 
              variant="ghost"
              size="icon"
              onClick={() => logout()}
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-3 sm:px-4 md:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden text-foreground"
            onClick={() => setMobileMenuOpen(true)}
            aria-label="Open admin navigation"
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{activeNavLabel}</p>
          </div>
          <div className="ml-auto flex items-center gap-2 sm:gap-4">
            {isImpersonating && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={exitImpersonation}
                disabled={exitingImpersonation}
                className="border-amber-600/40 text-xs font-medium text-amber-700 hover:bg-amber-500/10 disabled:opacity-60 dark:border-amber-700 dark:text-amber-200 dark:hover:bg-amber-900/20"
              >
                {exitingImpersonation ? "Exiting..." : "Exit Impersonation"}
              </Button>
            )}
            <ThemeToggle className="text-muted-foreground hover:text-foreground" />
            <span className="hidden text-sm font-medium text-muted-foreground sm:inline-block">{schoolName}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto overflow-x-hidden bg-background p-3 pb-24 text-foreground sm:p-4 sm:pb-24 md:p-6 md:pb-6">
          {children}
        </main>
      </div>

      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="w-[92vw] max-w-sm p-0">
          <DialogHeader className="border-b border-border p-4">
            <DialogTitle className="text-base">Admin Navigation</DialogTitle>
          </DialogHeader>
          <div className="max-h-[72vh] overflow-y-auto p-4">
            <div className="space-y-5">
              {groupedNavItems.map((group) => (
                <div key={`mobile-${group.title}`} className="space-y-1.5">
                  <p className="px-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/70">
                    {group.title}
                  </p>
                  <ul className="space-y-1">
                    {group.items.map((item) => {
                      const isActive = isNavItemActive(pathname, item);
                      return (
                        <li key={`mobile-${item.href}`}>
                          <Link
                            href={item.href}
                            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                              isActive
                                ? 'bg-accent text-foreground'
                                : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground'
                            }`}
                            onClick={() => setMobileMenuOpen(false)}
                            style={isActive ? { color: config?.branding?.primary_color || undefined, backgroundColor: `${config?.branding?.primary_color}10` || undefined } : {}}
                          >
                            <item.icon className="h-4 w-4 shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
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
    </div>
  );
}

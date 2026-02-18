"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  Banknote, 
  CalendarCheck, 
  FileText,
  Settings,
  Menu,
  LogOut,
  User,
  Shield,
  School
} from 'lucide-react';
import { Button } from '@schoolerp/ui';
import { RBACService } from '@/lib/auth-service';
import { usePathname, useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenant-utils';
import { useAuth } from '@/components/auth-provider';
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { apiClient } from "@/lib/api-client";

const NAV_ITEMS = [
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
  { href: '/admin/students', label: 'Students', icon: Users, permission: 'sis:read' },
  { href: '/admin/attendance', label: 'Attendance', icon: CalendarCheck, permission: 'attendance:read' },
  { href: '/admin/finance', label: 'Fees & Finance', icon: Banknote, permission: 'fees:read' },
  { href: '/admin/exams', label: 'Exams & Results', icon: GraduationCap, permission: 'exams:read' },
  { href: '/admin/notices', label: 'Notices', icon: FileText, permission: 'notices:read' },
  { href: '/admin/settings/users', label: 'User Management', icon: Users, permission: 'tenant:users:manage' },
  { href: '/admin/settings/roles', label: 'Roles & Permissions', icon: Shield, permission: 'tenant:roles:manage' },
  { href: '/admin/settings/onboarding', label: 'School Onboarding', icon: School, permission: 'platform:manage' },
  { href: '/admin/settings', label: 'Settings', icon: Settings, permission: 'tenant:settings:view' },
];

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

  const filteredNavItems = NAV_ITEMS.filter(item => 
    !item.permission || RBACService.hasPermission(item.permission)
  );

  const schoolName = config?.branding?.name_override || config?.name || 'SchoolERP';
  const logoUrl = config?.branding?.logo_url;

  return (
    <div className="flex h-screen bg-background text-foreground" style={{ 
      //@ts-ignore
      '--primary-color': config?.branding?.primary_color || '#4f46e5' 
    }}>
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-card hidden md:flex md:flex-col">
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
          <ul className="space-y-1 px-3">
            {filteredNavItems.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === item.href 
                      ? 'bg-accent text-foreground font-semibold' 
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  }`}
                  style={pathname === item.href ? { color: config?.branding?.primary_color || undefined, backgroundColor: `${config?.branding?.primary_color}10` || undefined } : {}}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="border-t border-border p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 border border-indigo-500/30" style={{ borderColor: config?.branding?.primary_color ? `${config.branding.primary_color}50` : undefined, color: config?.branding?.primary_color || undefined }}>
                {user?.name?.[0] || <User className="h-4 w-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-foreground truncate">{user?.name || 'Loading...'}</p>
                <p className="text-xs text-muted-foreground truncate capitalize">{user?.role?.replace('_', ' ') || ''}</p>
              </div>
            </div>
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
        <header className="flex h-16 items-center justify-between border-b border-border bg-card px-6">
          <Button variant="ghost" size="icon" className="md:hidden text-foreground">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto flex items-center gap-4">
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
            <span className="text-sm text-muted-foreground font-medium">{schoolName}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-background text-foreground">
          {children}
        </main>
      </div>
    </div>
  );
}

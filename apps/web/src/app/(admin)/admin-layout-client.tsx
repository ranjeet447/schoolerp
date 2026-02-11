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
import { usePathname } from 'next/navigation';
import { TenantConfig } from '@/lib/tenant-utils';
import { useAuth } from '@/components/auth-provider';

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

  const filteredNavItems = NAV_ITEMS.filter(item => 
    !item.permission || RBACService.hasPermission(item.permission)
  );

  const schoolName = config?.branding?.name_override || config?.name || 'SchoolERP';
  const logoUrl = config?.branding?.logo_url;

  return (
    <div className="flex h-screen bg-slate-900" style={{ 
      //@ts-ignore
      '--primary-color': config?.branding?.primary_color || '#4f46e5' 
    }}>
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-800 bg-slate-900 hidden md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <Link href="/admin/dashboard" className="flex items-center gap-2 font-bold text-xl text-indigo-400" style={{ color: config?.branding?.primary_color || undefined }}>
            {logoUrl ? (
              <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
            ) : (
              <GraduationCap className="h-6 w-6" />
            )}
            {!config?.white_label && (
              <span>School<span className="text-white">ERP</span></span>
            )}
            {config?.white_label && (
              <span className="text-white truncate">{schoolName}</span>
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
                      ? 'bg-indigo-500/10 text-indigo-400 font-bold' 
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
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
        
        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-indigo-500/20 flex items-center justify-center text-xs font-bold text-indigo-400 border border-indigo-500/30" style={{ borderColor: config?.branding?.primary_color ? `${config.branding.primary_color}50` : undefined, color: config?.branding?.primary_color || undefined }}>
                {user?.name?.[0] || <User className="h-4 w-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-white truncate">{user?.name || 'Loading...'}</p>
                <p className="text-xs text-slate-500 truncate capitalize">{user?.role?.replace('_', ' ') || ''}</p>
              </div>
            </div>
            <button 
              onClick={() => logout()}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
          <Button variant="ghost" size="icon" className="md:hidden text-white">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-slate-400 font-medium">{schoolName}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-slate-950 text-slate-100">
          {children}
        </main>
      </div>
    </div>
  );
}

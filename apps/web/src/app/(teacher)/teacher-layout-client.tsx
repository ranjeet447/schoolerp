"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  GraduationCap, 
  Settings,
  Menu,
  LogOut,
  User,
  FileText,
  BookOpen
} from 'lucide-react';
import { Button } from '@schoolerp/ui';
import { RBACService } from '@/lib/auth-service';
import { usePathname } from 'next/navigation';
import { TenantConfig } from '@/lib/tenant-utils';

const NAV_ITEMS = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
  { href: '/teacher/attendance', label: 'Mark Attendance', icon: CalendarCheck, permission: 'attendance:write' },
  { href: '/teacher/exams/marks', label: 'Enter Marks', icon: GraduationCap, permission: 'exams:write' },
  { href: '/teacher/students', label: 'My Students', icon: Users, permission: 'sis:read' },
  { href: '/teacher/notices', label: 'Notices', icon: FileText, permission: 'notices:read' },
  { href: '/teacher/curriculum', label: 'Curriculum', icon: BookOpen, permission: 'sis:read' },
  { href: '/teacher/settings', label: 'Settings', icon: Settings },
];

export default function TeacherLayoutClient({
  children,
  config
}: {
  children: React.ReactNode;
  config: TenantConfig | null;
}) {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    setUser(RBACService.getCurrentUser());
  }, []);

  const filteredNavItems = NAV_ITEMS.filter(item => 
    !item.permission || RBACService.hasPermission(item.permission)
  );

  const schoolName = config?.branding?.name_override || config?.name || 'TeacherOS';
  const logoUrl = config?.branding?.logo_url;
  const primaryColor = config?.branding?.primary_color || '#10b981'; // Emerald 600

  return (
    <div className="flex h-screen bg-emerald-50/20" style={{ 
      //@ts-ignore
      '--primary-color': primaryColor 
    }}>
      {/* Sidebar */}
      <aside className="w-64 border-r border-emerald-100 bg-white hidden md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-emerald-100 px-6">
          <Link href="/teacher/dashboard" className="flex items-center gap-2 font-bold text-xl" style={{ color: primaryColor }}>
            {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
            ) : (
                <GraduationCap className="h-6 w-6" />
            )}
            {!config?.white_label ? (
                <span>Teacher<span className="text-slate-900">OS</span></span>
            ) : (
                <span className="text-slate-900 truncate">{schoolName}</span>
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
                      ? 'bg-emerald-50 text-emerald-600 font-bold' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                  style={pathname === item.href ? { color: primaryColor, backgroundColor: `${primaryColor}10` } : {}}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="border-t border-emerald-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600 border border-emerald-200" style={{ color: primaryColor, backgroundColor: `${primaryColor}20`, borderColor: `${primaryColor}30` }}>
                {user?.name?.[0] || <User className="h-4 w-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Loading...'}</p>
                <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.replace('_', ' ') || ''}</p>
              </div>
            </div>
            <button 
              onClick={() => RBACService.logout()}
              className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-emerald-100 bg-white px-6">
          <Button variant="ghost" size="icon" className="md:hidden text-slate-600">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-slate-400 font-medium">{schoolName}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}

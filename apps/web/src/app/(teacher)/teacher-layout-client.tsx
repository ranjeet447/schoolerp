"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  CalendarCheck, 
  GraduationCap, 
  Menu,
  LogOut,
  User,
  FileText,
  BookOpen,
  CalendarDays,
  MessageSquare
} from 'lucide-react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@schoolerp/ui';
import { RBACService, isPlatformUser } from '@/lib/auth-service';
import { usePathname, useRouter } from 'next/navigation';
import { TenantConfig } from '@/lib/tenant-utils';
import { useAuth } from '@/components/auth-provider';
import { apiClient } from '@/lib/api-client';

const NAV_ITEMS = [
  { href: '/teacher/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
  { href: '/teacher/attendance', label: 'Mark Attendance', icon: CalendarCheck, permission: 'attendance:write' },
  { href: '/teacher/timetable', label: 'My Timetable', icon: CalendarDays, permission: 'academics:read' },
  { href: '/teacher/homework', label: 'Homework', icon: BookOpen, permission: 'sis:read' },
  { href: '/teacher/remarks', label: 'Remarks', icon: MessageSquare, permission: 'sis:write' },
  { href: '/teacher/leaves', label: 'My Leaves', icon: FileText, permission: 'hrms:read' },
  { href: '/teacher/kb', label: 'Knowledgebase', icon: BookOpen, permission: 'sis:read' },
  { href: '/teacher/exams/marks', label: 'Enter Marks', icon: GraduationCap, permission: 'exams:write' },
  { href: '/teacher/notices', label: 'Notices', icon: FileText, permission: 'notices:read' },
  { href: '/teacher/profile', label: 'My Profile', icon: User },
];

export default function TeacherLayoutClient({
  children,
  config
}: {
  children: React.ReactNode;
  config: TenantConfig | null;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [kbVisible, setKbVisible] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isPlatformUser(user?.role)) {
      router.replace('/platform/dashboard');
    }
  }, [user?.role, router]);

  useEffect(() => {
    let active = true;
    const probeKnowledgebase = async () => {
      try {
        const res = await apiClient("/kb/facets");
        if (active) {
          setKbVisible(res.ok);
        }
      } catch {
        if (active) {
          setKbVisible(false);
        }
      }
    };
    probeKnowledgebase();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const filteredNavItems = NAV_ITEMS.filter(item => {
    if (item.href === "/teacher/kb" && !kbVisible) {
      return false;
    }
    return !item.permission || RBACService.hasPermission(item.permission);
  });

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
            <Link href="/teacher/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="h-9 w-9 rounded-full bg-emerald-100 flex items-center justify-center text-xs font-bold text-emerald-600 border border-emerald-200" style={{ color: primaryColor, backgroundColor: `${primaryColor}20`, borderColor: `${primaryColor}30` }}>
                {user?.name?.[0] || <User className="h-4 w-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Loading...'}</p>
                <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.replace('_', ' ') || ''}</p>
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
        <header className="flex h-16 items-center justify-between border-b border-emerald-100 bg-white px-6">
          <Button 
            variant="ghost" 
            size="icon" 
            className="md:hidden text-slate-600"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-slate-400 font-medium">{schoolName}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-white pb-24 md:pb-6">
          {children}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-emerald-100 flex items-center justify-around px-2 z-40">
        <Link 
          href="/teacher/dashboard" 
          className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname === '/teacher/dashboard' ? 'text-emerald-600' : 'text-slate-400'}`}
          style={pathname === '/teacher/dashboard' ? { color: primaryColor } : {}}
        >
          <LayoutDashboard className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
        </Link>
        <Link 
          href="/teacher/attendance" 
          className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname.startsWith('/teacher/attendance') ? 'text-emerald-600' : 'text-slate-400'}`}
          style={pathname.startsWith('/teacher/attendance') ? { color: primaryColor } : {}}
        >
          <CalendarCheck className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Attend</span>
        </Link>
        <Link 
          href="/teacher/homework" 
          className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname.startsWith('/teacher/homework') ? 'text-emerald-600' : 'text-slate-400'}`}
          style={pathname.startsWith('/teacher/homework') ? { color: primaryColor } : {}}
        >
          <BookOpen className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Works</span>
        </Link>
        <Link 
          href="/teacher/notices" 
          className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname.startsWith('/teacher/notices') ? 'text-emerald-600' : 'text-slate-400'}`}
          style={pathname.startsWith('/teacher/notices') ? { color: primaryColor } : {}}
        >
          <FileText className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">Notices</span>
        </Link>
        <button 
          onClick={() => setMobileMenuOpen(true)}
          className={`flex flex-col items-center gap-1 min-w-[64px] ${mobileMenuOpen ? 'text-emerald-600' : 'text-slate-400'}`}
          style={mobileMenuOpen ? { color: primaryColor } : {}}
        >
          <Menu className="h-5 w-5" />
          <span className="text-[10px] font-bold uppercase tracking-tighter">More</span>
        </button>
      </div>

      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="w-[92vw] max-w-sm p-0">
          <DialogHeader className="border-b border-slate-100 p-4">
            <DialogTitle className="text-base">Teacher Navigation</DialogTitle>
          </DialogHeader>
          <div className="max-h-[72vh] overflow-y-auto p-4">
            <ul className="space-y-1">
              {filteredNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={`mobile-${item.href}`}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                        isActive
                          ? 'bg-emerald-50 text-emerald-600'
                          : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                      }`}
                      onClick={() => setMobileMenuOpen(false)}
                      style={isActive ? { color: primaryColor, backgroundColor: `${primaryColor}10` } : {}}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span className="truncate">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            <div className="mt-6 border-t border-slate-100 pt-4">
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

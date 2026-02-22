"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  Banknote, 
  Menu,
  GraduationCap,
  LogOut,
  User,
  MessageSquare,
  FileText,
  BookOpen,
  Calendar
} from 'lucide-react';
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@schoolerp/ui';
import { RBACService } from '@/lib/auth-service';
import { usePathname } from 'next/navigation';
import { TenantConfig } from '@/lib/tenant-utils';
import { useAuth } from '@/components/auth-provider';
import { apiClient } from '@/lib/api-client';
import { Home, BookOpen as BookIcon, GraduationCap as ResultsIcon, FileText as NoticesIcon } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/student/homework', label: 'Homework', icon: BookOpen },
  { href: '/student/attendance', label: 'Attendance', icon: Calendar },
  { href: '/student/results', label: 'Exam Results', icon: GraduationCap },
  { href: '/student/notices', label: 'Notices', icon: FileText },
  { href: '/student/profile', label: 'My Profile', icon: User },
];

export default function StudentLayoutClient({
  children,
  config
}: {
  children: React.ReactNode;
  config: TenantConfig | null;
}) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  const schoolName = config?.branding?.name_override || config?.name || 'Demo International School';
  const logoUrl = config?.branding?.logo_url;
  const primaryColor = config?.branding?.primary_color || '#4f46e5'; // Indigo 600 default for students

  return (
    <div className="flex h-screen bg-slate-50" style={{ 
      //@ts-ignore
      '--primary-color': primaryColor 
    }}>
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white hidden md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <Link href="/student/dashboard" className="flex items-center gap-2 font-bold text-xl" style={{ color: primaryColor }}>
            {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
            ) : (
                <GraduationCap className="h-6 w-6" />
            )}
            {!config?.white_label ? (
                <span>Student<span className="text-slate-900">Hub</span></span>
            ) : (
                <span className="text-slate-900 truncate">{schoolName}</span>
            )}
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    pathname === item.href 
                      ? 'bg-indigo-50 text-indigo-600 font-bold' 
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
        
        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center justify-between">
            <Link href="/student/profile" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-600 border border-indigo-200" style={{ color: primaryColor, backgroundColor: `${primaryColor}20`, borderColor: `${primaryColor}30` }}>
                {user?.name?.[0] || <User className="h-4 w-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Loading...'}</p>
                <p className="text-xs text-slate-400 truncate capitalize">Student</p>
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
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
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
        <main className="flex-1 overflow-y-auto p-6 pb-24 md:pb-6">
          {children}
        </main>
        
        {/* Mobile Bottom Navigation */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-white border-t border-slate-200 flex items-center justify-around px-2 z-40">
          <Link 
            href="/student/dashboard" 
            className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname === '/student/dashboard' ? 'text-indigo-600' : 'text-slate-400'}`}
            style={pathname === '/student/dashboard' ? { color: primaryColor } : {}}
          >
            <Home className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Home</span>
          </Link>
          <Link 
            href="/student/homework" 
            className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname.startsWith('/student/homework') ? 'text-indigo-600' : 'text-slate-400'}`}
            style={pathname.startsWith('/student/homework') ? { color: primaryColor } : {}}
          >
            <BookIcon className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Tasks</span>
          </Link>
          <Link 
            href="/student/results" 
            className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname.startsWith('/student/results') ? 'text-indigo-600' : 'text-slate-400'}`}
            style={pathname.startsWith('/student/results') ? { color: primaryColor } : {}}
          >
            <ResultsIcon className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">Grades</span>
          </Link>
          <Link 
            href="/student/notices" 
            className={`flex flex-col items-center gap-1 min-w-[64px] ${pathname.startsWith('/student/notices') ? 'text-indigo-600' : 'text-slate-400'}`}
            style={pathname.startsWith('/student/notices') ? { color: primaryColor } : {}}
          >
            <NoticesIcon className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">News</span>
          </Link>
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center gap-1 min-w-[64px] ${mobileMenuOpen ? 'text-indigo-600' : 'text-slate-400'}`}
            style={mobileMenuOpen ? { color: primaryColor } : {}}
          >
            <Menu className="h-5 w-5" />
            <span className="text-[10px] font-bold uppercase tracking-tighter">More</span>
          </button>
        </div>
      </div>

      <Dialog open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <DialogContent className="w-[92vw] max-w-sm p-0">
          <DialogHeader className="border-b border-slate-200 p-4">
            <DialogTitle className="text-base">Student Navigation</DialogTitle>
          </DialogHeader>
          <div className="max-h-[72vh] overflow-y-auto p-4">
            <ul className="space-y-1">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <li key={`mobile-${item.href}`}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-600'
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
            <div className="mt-6 border-t border-slate-200 pt-4">
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

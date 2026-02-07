import React from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Users, 
  CalendarCheck, 
  Banknote, 
  Settings,
  Menu,
  GraduationCap
} from 'lucide-react';
import { Button } from '@schoolerp/ui';

const NAV_ITEMS = [
  { href: '/parent/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/parent/children', label: 'My Children', icon: Users },
  { href: '/parent/attendance', label: 'Attendance', icon: CalendarCheck },
  { href: '/parent/fees', label: 'Fees & Payments', icon: Banknote },
  { href: '/parent/settings', label: 'Settings', icon: Settings },
];

export default function ParentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen bg-muted/10">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-background hidden md:flex md:flex-col">
        <div className="flex h-16 items-center border-b px-6">
          <Link href="/parent/dashboard" className="flex items-center gap-2 font-bold text-xl text-primary">
            <GraduationCap className="h-6 w-6" />
            <span>Parent Portal</span>
          </Link>
        </div>
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-3">
            {NAV_ITEMS.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        <div className="border-t p-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary">
              MK
            </div>
            <div>
              <p className="text-sm font-medium">Mary Kay</p>
              <p className="text-xs text-muted-foreground">Parent</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b bg-background px-6">
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Springfield High School</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

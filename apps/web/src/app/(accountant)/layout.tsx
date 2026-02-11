"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Banknote, 
  FileText,
  Settings,
  Menu,
  LogOut,
  User,
  CreditCard,
  PieChart
} from 'lucide-react';
import { Button } from '@schoolerp/ui';
import { RBACService } from '@/lib/auth-service';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/accountant/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
  { href: '/accountant/fees', label: 'Fee Collection', icon: Banknote, permission: 'fees:collect' },
  { href: '/accountant/expenses', label: 'Expenses', icon: CreditCard, permission: 'finance:write' },
  { href: '/accountant/reports', label: 'Financial Reports', icon: PieChart, permission: 'finance:read' },
  { href: '/accountant/notices', label: 'Notices', icon: FileText, permission: 'notices:read' },
  { href: '/accountant/settings', label: 'Settings', icon: Settings },
];

export default function AccountantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<any>(null);
  const pathname = usePathname();

  useEffect(() => {
    setUser(RBACService.getCurrentUser());
  }, []);

  const filteredNavItems = NAV_ITEMS.filter(item => 
    !item.permission || RBACService.hasPermission(item.permission)
  );

  return (
    <div className="flex h-screen bg-amber-50/20">
      {/* Sidebar */}
      <aside className="w-64 border-r border-amber-100 bg-white hidden md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-amber-100 px-6">
          <Link href="/accountant/dashboard" className="flex items-center gap-2 font-bold text-xl text-amber-600">
            <Banknote className="h-6 w-6" />
            <span>Accountant<span className="text-slate-900">Pro</span></span>
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
                      ? 'bg-amber-50 text-amber-600' 
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="border-t border-amber-100 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-600 border border-amber-200">
                {user?.name?.[0] || <User className="h-4 w-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Loading...'}</p>
                <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.replace('_', ' ') || ''}</p>
              </div>
            </div>
            <button 
              onClick={() => RBACService.logout()}
              className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-amber-100 bg-white px-6">
          <Button variant="ghost" size="icon" className="md:hidden text-slate-600">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-slate-400 font-medium">Demo International School</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-white">
          {children}
        </main>
      </div>
    </div>
  );
}

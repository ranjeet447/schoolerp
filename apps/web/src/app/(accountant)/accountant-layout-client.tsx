"use client"

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  Banknote, 
  Menu,
  GraduationCap,
  LogOut,
  User,
  CreditCard
} from 'lucide-react';
import { Button } from '@schoolerp/ui';
import { RBACService } from '@/lib/auth-service';
import { usePathname } from 'next/navigation';
import { TenantConfig } from '@/lib/tenant-utils';
import { useAuth } from '@/components/auth-provider';

const NAV_ITEMS = [
  { href: '/accountant/dashboard', label: 'Dashboard', icon: LayoutDashboard, permission: 'dashboard:view' },
  { href: '/accountant/fees', label: 'Fee Collection', icon: Banknote, permission: 'fees:write' },
  { href: '/accountant/payments', label: 'Payments & Receipts', icon: CreditCard, permission: 'fees:write' },
];

export default function AccountantLayoutClient({
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

  const schoolName = config?.branding?.name_override || config?.name || 'AccountantOS';
  const logoUrl = config?.branding?.logo_url;
  const primaryColor = config?.branding?.primary_color || '#4f46e5'; // Indigo 600

  return (
    <div className="flex h-screen bg-slate-50" style={{ 
      //@ts-ignore
      '--primary-color': primaryColor 
    }}>
      {/* Sidebar */}
      <aside className="w-64 border-r border-slate-200 bg-white hidden md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <Link href="/accountant/dashboard" className="flex items-center gap-2 font-bold text-xl" style={{ color: primaryColor }}>
            {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-8 w-8 object-contain" />
            ) : (
                <GraduationCap className="h-6 w-6" />
            )}
            {!config?.white_label ? (
                <span>Accountant<span className="text-slate-900">Portal</span></span>
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
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 border border-slate-200" style={{ color: primaryColor, backgroundColor: `${primaryColor}20`, borderColor: `${primaryColor}30` }}>
                {user?.name?.[0] || <User className="h-4 w-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium text-slate-900 truncate">{user?.name || 'Loading...'}</p>
                <p className="text-xs text-slate-400 truncate capitalize">{user?.role?.replace('_', ' ') || ''}</p>
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
        <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-6">
          <Button variant="ghost" size="icon" className="md:hidden text-slate-600">
            <Menu className="h-5 w-5" />
          </Button>
          <div className="ml-auto flex items-center gap-4">
            <span className="text-sm text-slate-400 font-medium">{schoolName}</span>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          {children}
        </main>
      </div>
    </div>
  );
}

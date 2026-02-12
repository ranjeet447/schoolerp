"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  Building2,
  CreditCard,
  LogOut,
  Menu,
  Shield,
  User,
} from "lucide-react";
import { Button } from "@schoolerp/ui";
import { useAuth } from "@/components/auth-provider";

const NAV_ITEMS = [
  { href: "/platform/dashboard", label: "Platform Dashboard", icon: BarChart3 },
  { href: "/platform/tenants", label: "Schools & Branches", icon: Building2 },
  { href: "/platform/payments", label: "Platform Payments", icon: CreditCard },
];

export default function PlatformLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout, isLoading } = useAuth();

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

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100">
      <aside className="hidden w-72 border-r border-slate-800 bg-slate-900 md:flex md:flex-col">
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <Link
            href="/platform/dashboard"
            className="flex items-center gap-3 font-bold text-cyan-400"
          >
            <Shield className="h-6 w-6" />
            <span>Platform Admin</span>
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
                      ? "bg-cyan-500/10 text-cyan-300"
                      : "text-slate-400 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="border-t border-slate-800 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="flex h-9 w-9 items-center justify-center rounded-full border border-cyan-500/30 bg-cyan-500/20 text-xs font-bold text-cyan-300">
                {user?.name?.[0] || <User className="h-4 w-4" />}
              </div>
              <div className="overflow-hidden">
                <p className="truncate text-sm font-medium text-white">{user?.name || "..."}</p>
                <p className="truncate text-xs text-slate-400">SaaS Admin</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
              title="Logout"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900 px-6">
          <Button variant="ghost" size="icon" className="text-white md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
          <span className="ml-auto text-sm font-medium text-slate-400">SchoolERP Platform</span>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}

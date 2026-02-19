"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  BarChart3, 
  Building2, 
  LifeBuoy, 
  Link as LinkIcon, 
  ShieldCheck 
} from "lucide-react";

const MOBILE_NAV_ITEMS = [
  { href: "/platform/dashboard", label: "Intel", icon: BarChart3 },
  { href: "/platform/tenants", label: "Portfolio", icon: Building2 },
  { href: "/platform/support", label: "Support", icon: LifeBuoy },
  { href: "/platform/integrations", label: "Infra", icon: LinkIcon },
  { href: "/platform/internal-users", label: "Security", icon: ShieldCheck },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex h-16 items-center border-t border-border bg-card md:hidden">
      <div className="grid h-full w-full grid-cols-5">
        {MOBILE_NAV_ITEMS.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center gap-1 transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <item.icon className={`h-5 w-5 ${isActive ? "text-primary" : "text-muted-foreground/70"}`} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

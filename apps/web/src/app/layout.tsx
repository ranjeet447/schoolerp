import type { Metadata } from "next";
import Script from "next/script";
import "@schoolerp/ui/styles.css";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth-provider";
import { OfflineDetector } from "@/components/offline-detector";
import { Providers } from "@/components/providers";
import { RouteTitleSync } from "@/components/route-title-sync";

export const metadata: Metadata = {
  title: {
    default: "SchoolERP",
    template: "%s | SchoolERP",
  },
  description: "Enterprise School Management Operating System",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
  },
};

import { getLocale } from 'next-intl/server';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale} suppressHydrationWarning>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <RouteTitleSync />
        <Script id="theme-init" strategy="beforeInteractive">
          {`
(() => {
  try {
    const key = "schoolerp_theme";
    const value = localStorage.getItem(key);
    const theme = value === "dark" || value === "light" ? value : "light";
    if (theme === "dark") document.documentElement.classList.add("dark");
    else document.documentElement.classList.remove("dark");
  } catch (_) {}
})();
          `}
        </Script>
        <Providers>
          <AuthProvider>
            <OfflineDetector>
              {children}
            </OfflineDetector>
            <Toaster />
          </AuthProvider>
        </Providers>
      </body>
    </html>
  );
}

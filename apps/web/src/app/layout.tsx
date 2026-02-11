import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@schoolerp/ui/styles.css";
import "./globals.css";
import { Toaster } from "sonner";
import { AuthProvider } from "@/components/auth-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "School ERP",
  description: "Enterprise School Management Operating System",
};

import { getLocale } from 'next-intl/server';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <body className={inter.className}>
        <AuthProvider>
          {children}
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

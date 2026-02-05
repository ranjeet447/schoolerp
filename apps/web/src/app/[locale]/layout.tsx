import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "@schoolerp/ui/styles.css";
import "./globals.css";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "School ERP",
  description: "Enterprise School Management Operating System",
};

export default function RootLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  return (
    <html lang={locale}>
      <body className={inter.className}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

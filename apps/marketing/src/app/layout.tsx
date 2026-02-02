import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Navbar, Footer } from "@schoolerp/ui";
import "@schoolerp/ui/styles.css";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "School ERP - Modern Education Operating System",
  description: "Comprehensive platform for academics, finance, and campus safety.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className} suppressHydrationWarning>
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}

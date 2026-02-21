import type { Metadata } from "next";
import Script from "next/script";
import { Navbar, Footer, OrganizationSchema } from "@schoolerp/ui";
import "@schoolerp/ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://schoolerp.com"),
  title: "School ERP - Modern Education Operating System for Indian Schools",
  description: "Comprehensive platform for academics, finance, and campus safety. Fast fee counters, instant parent updates, and inspection-ready reports with zero manual typing.",
  openGraph: {
    title: "School ERP - Modern Education Operating System",
    description: "All-in-one platform for academics, finance, safety, operations, communication, and automation.",
    url: "https://schoolerp.com",
    siteName: "School ERP",
    images: [
      {
        url: "https://schoolerp.com/og-hero.png",
        width: 1200,
        height: 630,
        alt: "School ERP product overview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "School ERP - Modern Education Operating System",
    description: "All-in-one platform for modern Indian schools.",
    images: ["https://schoolerp.com/og-hero.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const analyticsId = process.env.NEXT_PUBLIC_ANALYTICS_ID;

  return (
    <html lang="en" suppressHydrationWarning>
      <body className="relative overflow-x-hidden antialiased" suppressHydrationWarning>
        {analyticsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${analyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="gtag-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${analyticsId}');
              `}
            </Script>
          </>
        )}
        <OrganizationSchema />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}

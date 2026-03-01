import type { Metadata } from "next";
import Script from "next/script";
import { Navbar, Footer, OrganizationSchema, SoftwareApplicationSchema, WebSiteSchema } from "@schoolerp/ui";
import "@schoolerp/ui/styles.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://schoolerp.com"),
  title: {
    default: "School ERP - Modern Education Operating System for Indian Schools",
    template: "%s | School ERP"
  },
  description: "School ERP software for Indian schools with online fee collection & dues management, parent app communication, attendance management (biometric-ready), and exam results/report cards.",
  keywords: [
    "school fee management software",
    "school fee collection software",
    "fee collection software for schools",
    "parent communication app for schools",
    "parent portal for schools",
    "school attendance management system",
    "biometric attendance for schools",
    "exam management software for schools",
    "report card software for schools",
    "school ERP software India"
  ],
  authors: [{ name: "School ERP Team" }],
  creator: "School ERP",
  publisher: "School ERP",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: "/favicon.png",
    shortcut: "/favicon.png",
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "School ERP - Modern Education Operating System",
    description: "School ERP for fee collection, parent app updates, attendance management, and exam/report card workflows.",
    url: "https://schoolerp.com",
    siteName: "School ERP",
    images: [
      {
        url: "/og-hero.png",
        width: 1200,
        height: 630,
        alt: "School ERP product overview",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "School ERP - Modern Education Operating System",
    description: "School ERP for fee collection, parent app communication, attendance and exams for Indian schools.",
    images: ["/og-hero.png"],
    creator: "@schoolerp",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
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
        <SoftwareApplicationSchema 
          name="School ERP" 
          description="School ERP software for online fee collection, parent communication, attendance management, and exam report cards."
        />
        <WebSiteSchema />
        <OrganizationSchema />
        <Navbar />
        {children}
        <Footer />
      </body>
    </html>
  );
}

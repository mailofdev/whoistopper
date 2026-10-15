import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import { AppStatus } from "@/components/layout/mobile-nav";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { site, siteUrl } from "@/config/site";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl()),
  title: { default: site.name, template: `%s · ${site.name}` },
  description: site.description,
  applicationName: site.name,
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: site.themeColor,
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en-IN" data-scroll-behavior="smooth" className={`${geistSans.variable} ${geistMono.variable} h-full`} suppressHydrationWarning>
      <body className="flex min-h-full flex-col antialiased">
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute -left-16 top-10 h-56 w-56 rounded-full bg-brand/30 blur-3xl" />
          <div className="absolute right-0 top-32 h-64 w-64 rounded-full bg-gold/35 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-52 w-52 rounded-full bg-brand/15 blur-3xl" />
        </div>
        <Script id="rp-theme" strategy="beforeInteractive">
          {`try{var t=localStorage.getItem('rp-theme')||localStorage.getItem('wit-theme');if(t==='dark')document.documentElement.dataset.theme='dark'}catch(e){}`}
        </Script>
        <AppStatus />
        <SiteHeader />
        <main id="content" className="mx-auto w-full min-w-0 max-w-3xl flex-1 px-3 py-4 sm:px-4 sm:py-6">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}

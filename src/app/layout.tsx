import type { Metadata, Viewport } from "next";
import { Cairo, Playfair_Display, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";
import { Providers } from "@/components/shared/providers";

const cairo = Cairo({
  variable: "--font-cairo",
  subsets: ["arabic", "latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const playfair = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  display: "swap",
});

const mono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "فندق دار الياسمين الملكي | Dar Al-Yasmin Royal Hotel",
  description:
    "منتجع ساحلي فاخر يطل على البحر العربي في قلب عدن. احجز إقامتك الفاخرة الآن. Luxury coastal resort overlooking the Arabian Sea in Aden.",
  keywords: [
    "فندق عدن",
    "فندق دار الياسمين",
    "فندق فاخر اليمن",
    "Aden hotel",
    "luxury hotel Yemen",
    "Dar Al-Yasmin",
    "hotel booking Aden",
  ],
  authors: [{ name: "Dar Al-Yasmin Royal Hotel" }],
  manifest: "/manifest.json",
  applicationName: "Dar Al-Yasmin Hotel",
  appleWebApp: {
    capable: true,
    title: "Dar Al-Yasmin Hotel",
    statusBarStyle: "black-translucent",
    startupImage: ["/icons/apple-touch-icon.png"],
  },
  formatDetection: {
    telephone: true,
    address: false,
    email: false,
  },
  openGraph: {
    title: "فندق دار الياسمين الملكي | Dar Al-Yasmin Royal Hotel",
    description: "إقامة فاخرة على ساحل عدن. Luxury stay on the Aden coast.",
    type: "website",
    locale: "ar_YE",
  },
  alternates: {
    languages: {
      "ar-YE": "/",
      "en-US": "/",
    },
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: ["/favicon.ico"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#1a4d3e" },
    { media: "(prefers-color-scheme: dark)", color: "#0f3d2e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <body
        className={`${cairo.variable} ${playfair.variable} ${mono.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        <Providers>
          {children}
          <Toaster />
          <SonnerToaster position="top-center" />
        </Providers>
      </body>
    </html>
  );
}

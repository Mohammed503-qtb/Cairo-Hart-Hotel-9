import type { Metadata } from "next";
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

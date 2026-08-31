"use client";

import { ThemeProvider } from "next-themes";
import { useEffect, useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useUIStore } from "@/stores/ui-store";
import { isRTL } from "@/lib/i18n";
import { PWARegister } from "@/components/app/pwa-register";

export function Providers({ children }: { children: React.ReactNode }) {
  const locale = useUIStore((s) => s.locale);
  const theme = useUIStore((s) => s.theme);
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000,
            retry: 1,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  // Sync html lang/dir with locale
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = locale;
    document.documentElement.dir = isRTL(locale) ? "rtl" : "ltr";
  }, [locale]);

  // Sync persisted theme
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
        <PWARegister />
        {children}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

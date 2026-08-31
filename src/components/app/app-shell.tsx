"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { useAppStore } from "@/stores/app-store";
import { useUIStore } from "@/stores/ui-store";
import { AppLogin } from "./app-login";
import { GuestApp } from "./guest/guest-app";
import { ReceptionApp } from "./reception/reception-app";
import { AdminApp } from "./admin/admin-app";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

// Detect if running as installed PWA (standalone) — when true, the app fills the
// entire screen with no browser chrome and we hide the "close" affordance.
function useStandaloneMode(): boolean {
  const [standalone, setStandalone] = React.useState(false);
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const check = () => {
      const mq = window.matchMedia("(display-mode: standalone)");
      const iosStandalone = (window.navigator as unknown as { standalone?: boolean }).standalone === true;
      setStandalone(mq.matches || iosStandalone);
    };
    check();
    window.matchMedia("(display-mode: standalone)").addEventListener?.("change", check);
    return () => window.matchMedia("(display-mode: standalone)").removeEventListener?.("change", check);
  }, []);
  return standalone;
}

export function AppShell() {
  const appOpen = useAppStore((s) => s.appOpen);
  const closeApp = useAppStore((s) => s.closeApp);
  const session = useAppStore((s) => s.session);
  const setSession = useAppStore((s) => s.setSession);
  const sessionLoading = useAppStore((s) => s.sessionLoading);
  const setSessionLoading = useAppStore((s) => s.setSessionLoading);
  const locale = useUIStore((s) => s.locale);
  const isRTL = locale === "ar";
  const [wasOpen, setWasOpen] = React.useState(false);
  const standalone = useStandaloneMode();

  // Restore session when app opens (or on first mount if open)
  React.useEffect(() => {
    if (!appOpen) return;
    if (session) return; // already have session
    let cancelled = false;
    (async () => {
      setSessionLoading(true);
      try {
        const res = await fetch("/api/app/session", { cache: "no-store" });
        if (cancelled) return;
        const data = await res.json();
        if (res.ok && data.ok) {
          setSession(data);
        } else {
          setSession(null);
        }
      } catch {
        if (!cancelled) setSession(null);
      } finally {
        if (!cancelled) setSessionLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [appOpen, session, setSession, setSessionLoading]);

  // Open via ?app=1 query param (deep link support)
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    if (params.get("app") === "1") {
      useAppStore.getState().openApp();
      // Clean the URL
      params.delete("app");
      const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  // Lock body scroll when open
  React.useEffect(() => {
    if (appOpen && !wasOpen) {
      document.body.style.overflow = "hidden";
      setWasOpen(true);
    } else if (!appOpen && wasOpen) {
      document.body.style.overflow = "";
      setWasOpen(false);
    }
  }, [appOpen, wasOpen]);

  async function handleLogout() {
    try {
      await fetch("/api/app/auth/logout", { method: "POST" });
    } catch {
      // ignore
    }
    setSession(null);
    toast.success(isRTL ? "تم تسجيل الخروج" : "Logged out");
  }

  function handleClose() {
    closeApp();
    // In standalone mode, closing the app means going back to the website.
    // Keep session so reopen restores fast. User can logout explicitly.
  }

  // In standalone mode, the dialog fills the whole viewport with no rounded corners
  // (no browser chrome to suggest a "window" inside a window).
  // In browser mode, we constrain to a mobile frame on larger screens.
  const containerClass = standalone
    ? "p-0 m-0 w-screen h-[100dvh] max-w-screen max-h-[100dvh] rounded-none overflow-hidden border-0 bg-slate-50"
    : "p-0 m-0 w-screen h-screen max-w-screen max-h-screen sm:w-full sm:h-[100dvh] sm:max-w-md sm:max-h-[100dvh] sm:rounded-none overflow-hidden border-0 sm:border-x border-slate-200 bg-slate-50";

  return (
    <Dialog open={appOpen} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent
        className={containerClass}
        dir={isRTL ? "rtl" : "ltr"}
        showCloseButton={false}
      >
        <VisuallyHidden>
          <DialogTitle>Hotel App</DialogTitle>
        </VisuallyHidden>

        {/* Mobile-frame container with safe-area padding */}
        <div className="relative h-[100dvh] w-full overflow-hidden bg-slate-50 flex flex-col pt-safe pb-safe px-safe">
          {/* Top accent bar — visible only when logged in */}
          {session && (
            <div className="absolute top-0 inset-x-0 z-50 h-1 bg-gradient-to-l from-amber-500 to-emerald-600" />
          )}

          <div className="flex-1 overflow-hidden flex flex-col">
            {sessionLoading ? (
              <div className="flex-1 flex items-center justify-center bg-emerald-900 text-white">
                <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
              </div>
            ) : !session ? (
              <AppLogin />
            ) : session.persona === "GUEST" ? (
              <GuestApp onLogout={handleLogout} onClose={handleClose} standalone={standalone} />
            ) : session.persona === "RECEPTION" ? (
              <ReceptionApp onLogout={handleLogout} onClose={handleClose} standalone={standalone} />
            ) : (
              <AdminApp onLogout={handleLogout} onClose={handleClose} standalone={standalone} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

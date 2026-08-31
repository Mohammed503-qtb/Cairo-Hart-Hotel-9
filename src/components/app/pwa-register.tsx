"use client";

import * as React from "react";

// Registers the service worker on mount (only in production).
// Listens for the PWA install prompt event and exposes a "beforeinstallprompt" hook.
// Also detects standalone mode (installed PWA) so the app can hide browser-only UI.

export function PWARegister() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Only register in production OR when running as standalone (installed PWA)
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (process.env.NODE_ENV !== "production" && !isStandalone) return;

    const onLoad = () => {
      navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch((err) => {
        console.warn("[sw] registration failed", err);
      });
    };
    window.addEventListener("load", onLoad);
    return () => window.removeEventListener("load", onLoad);
  }, []);

  return null;
}

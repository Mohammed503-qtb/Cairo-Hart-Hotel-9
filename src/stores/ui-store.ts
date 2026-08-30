"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Locale } from "@/lib/i18n";

type Section =
  | "home"
  | "rooms"
  | "facilities"
  | "gallery"
  | "offers"
  | "about"
  | "location"
  | "contact"
  | "faq"
  | "policies";

interface UIState {
  locale: Locale;
  setLocale: (l: Locale) => void;
  toggleLocale: () => void;
  theme: "light" | "dark";
  setTheme: (t: "light" | "dark") => void;
  toggleTheme: () => void;
  // Modals
  bookingOpen: boolean;
  openBooking: () => void;
  closeBooking: () => void;
  manageOpen: boolean;
  openManage: () => void;
  closeManage: () => void;
  // Active section (for nav highlighting)
  activeSection: Section;
  setActiveSection: (s: Section) => void;
  // Mobile menu
  mobileMenuOpen: boolean;
  setMobileMenu: (open: boolean) => void;
  // Room detail
  roomDetailSlug: string | null;
  openRoomDetail: (slug: string) => void;
  closeRoomDetail: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set, get) => ({
      locale: "ar",
      setLocale: (l) => set({ locale: l }),
      toggleLocale: () => set({ locale: get().locale === "ar" ? "en" : "ar" }),
      theme: "light",
      setTheme: (t) => set({ theme: t }),
      toggleTheme: () => set({ theme: get().theme === "light" ? "dark" : "light" }),
      bookingOpen: false,
      openBooking: () => set({ bookingOpen: true }),
      closeBooking: () => set({ bookingOpen: false }),
      manageOpen: false,
      openManage: () => set({ manageOpen: true }),
      closeManage: () => set({ manageOpen: false }),
      activeSection: "home",
      setActiveSection: (s) => set({ activeSection: s }),
      mobileMenuOpen: false,
      setMobileMenu: (open) => set({ mobileMenuOpen: open }),
      roomDetailSlug: null,
      openRoomDetail: (slug) => set({ roomDetailSlug: slug }),
      closeRoomDetail: () => set({ roomDetailSlug: null }),
    }),
    {
      name: "dar-yasmin-ui",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return {
            getItem: () => null,
            setItem: () => {},
            removeItem: () => {},
          };
        }
        return localStorage;
      }),
      partialize: (s) => ({ locale: s.locale, theme: s.theme }),
    }
  )
);

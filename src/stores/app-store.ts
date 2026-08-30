"use client";

import { create } from "zustand";

export type AppPersona = "GUEST" | "RECEPTION" | "ADMIN";

export interface AppSession {
  persona: AppPersona;
  sessionId: string;
  stay?: {
    id: string;
    stayNumber: string;
    guestName: string;
    roomNumber: string;
    roomTypeName: string;
    roomTypeNameEn?: string;
    checkIn: string;
    checkOut: string;
    nights: number;
    adults: number;
    children: number;
    status: string;
    balance: number;
  };
  staff?: {
    id: string;
    fullName: string;
    role: string;
  };
}

interface AppState {
  appOpen: boolean;
  openApp: () => void;
  closeApp: () => void;
  session: AppSession | null;
  setSession: (s: AppSession | null) => void;
  clearSession: () => void;
  // loading state for session restore
  sessionLoading: boolean;
  setSessionLoading: (b: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  appOpen: false,
  openApp: () => set({ appOpen: true }),
  closeApp: () => set({ appOpen: false }),
  session: null,
  setSession: (s) => set({ session: s }),
  clearSession: () => set({ session: null }),
  sessionLoading: true,
  setSessionLoading: (b) => set({ sessionLoading: b }),
}));

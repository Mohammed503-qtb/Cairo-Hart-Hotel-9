"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface RecentlyViewedRoom {
  slug: string;
  nameAr: string;
  nameEn: string;
  imageUrl: string;
  basePrice: number;
  viewedAt: number; // timestamp
}

interface RecentlyViewedState {
  rooms: RecentlyViewedRoom[];
  addRoom: (room: Omit<RecentlyViewedRoom, "viewedAt">) => void;
  clearAll: () => void;
  removeRoom: (slug: string) => void;
}

const MAX_RECENT = 6;

export const useRecentlyViewedStore = create<RecentlyViewedState>()(
  persist(
    (set, get) => ({
      rooms: [],
      addRoom: (room) => {
        const existing = get().rooms.filter((r) => r.slug !== room.slug);
        const updated = [{ ...room, viewedAt: Date.now() }, ...existing].slice(0, MAX_RECENT);
        set({ rooms: updated });
      },
      clearAll: () => set({ rooms: [] }),
      removeRoom: (slug) => set({ rooms: get().rooms.filter((r) => r.slug !== slug) }),
    }),
    {
      name: "dar-yasmin-recently-viewed",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return localStorage;
      }),
    }
  )
);

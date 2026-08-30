"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface FavoriteRoom {
  slug: string;
  nameAr: string;
  nameEn: string;
  imageUrl: string;
  basePrice: number;
  addedAt: number;
}

interface FavoritesState {
  favorites: FavoriteRoom[];
  toggleFavorite: (room: Omit<FavoriteRoom, "addedAt">) => void;
  isFavorite: (slug: string) => boolean;
  removeFavorite: (slug: string) => void;
  clearAll: () => void;
}

export const useFavoritesStore = create<FavoritesState>()(
  persist(
    (set, get) => ({
      favorites: [],
      toggleFavorite: (room) => {
        const exists = get().favorites.some((r) => r.slug === room.slug);
        if (exists) {
          set({ favorites: get().favorites.filter((r) => r.slug !== room.slug) });
        } else {
          set({ favorites: [...get().favorites, { ...room, addedAt: Date.now() }] });
        }
      },
      isFavorite: (slug) => get().favorites.some((r) => r.slug === slug),
      removeFavorite: (slug) => set({ favorites: get().favorites.filter((r) => r.slug !== slug) }),
      clearAll: () => set({ favorites: [] }),
    }),
    {
      name: "dar-yasmin-favorites",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return localStorage;
      }),
    }
  )
);

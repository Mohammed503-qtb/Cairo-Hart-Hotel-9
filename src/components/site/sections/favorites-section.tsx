"use client";

import { useState } from "react";
import { Heart, X, Trash2, ArrowRight, ArrowLeft } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useUIStore } from "@/stores/ui-store";
import { useMoney, useCurrencyRates } from "@/hooks/use-currency";
import { useLocalized } from "@/hooks/use-t";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export function FavoritesSection() {
  const { t, locale } = useT();
  const loc = useLocalized();
  const money = useMoney();
  useCurrencyRates();
  const { favorites, removeFavorite, clearAll } = useFavoritesStore();
  const openRoomDetail = useUIStore((s) => s.openRoomDetail);

  if (!favorites || favorites.length === 0) return null;

  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section id="favorites-section" className="py-12 bg-gradient-to-b from-rose-50/30 to-background scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />
            </div>
            <div>
              <h2 className="font-display text-xl sm:text-2xl font-bold">
                {locale === "ar" ? "المفضلة" : "Favorites"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {favorites.length} {locale === "ar" ? "غرفة محفوظة" : "rooms saved"}
              </p>
            </div>
          </div>
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" />
            {locale === "ar" ? "مسح الكل" : "Clear all"}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {favorites.map((room) => (
            <div
              key={room.slug}
              className="group relative rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-gold/40 hover:shadow-luxury transition-all duration-300"
            >
              <button
                onClick={() => openRoomDetail(room.slug)}
                className="block w-full text-start"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                  <img
                    src={room.imageUrl}
                    alt={loc(room.nameAr, room.nameEn)}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-deep/70 via-deep/10 to-transparent opacity-60" />
                  <div className="absolute top-2 end-2 w-8 h-8 rounded-full bg-rose-500 flex items-center justify-center shadow-lg">
                    <Heart className="w-4 h-4 text-white fill-white" />
                  </div>
                  <div className="absolute bottom-2 inset-x-2">
                    <h3 className="font-semibold text-sm text-white leading-tight line-clamp-1 drop-shadow">
                      {loc(room.nameAr, room.nameEn)}
                    </h3>
                    <div className="text-xs text-gold font-bold mt-0.5">
                      {money(room.basePrice, locale)}
                      <span className="text-white/60 font-normal text-[10px]"> / {locale === "ar" ? "ليلة" : "night"}</span>
                    </div>
                  </div>
                </div>
              </button>
              <button
                onClick={() => removeFavorite(room.slug)}
                className="absolute top-2 start-2 w-7 h-7 rounded-full glass-dark text-white hover:bg-destructive flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
                aria-label="Remove"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

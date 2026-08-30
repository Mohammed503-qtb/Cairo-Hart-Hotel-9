"use client";

import { Clock, X, ArrowRight, ArrowLeft } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useRecentlyViewedStore } from "@/stores/recently-viewed-store";
import { useUIStore } from "@/stores/ui-store";
import { useMoney, useCurrencyRates } from "@/hooks/use-currency";
import { useLocalized } from "@/hooks/use-t";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RecentlyViewedSection() {
  const { t, locale } = useT();
  const loc = useLocalized();
  const money = useMoney();
  useCurrencyRates();
  const { rooms, removeRoom, clearAll } = useRecentlyViewedStore();
  const openRoomDetail = useUIStore((s) => s.openRoomDetail);

  if (!rooms || rooms.length === 0) return null;

  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <section className="py-12 bg-cream/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-gold" />
            <h2 className="font-display text-xl sm:text-2xl font-bold">
              {locale === "ar" ? "شاهدت مؤخراً" : "Recently Viewed"}
            </h2>
          </div>
          <button
            onClick={clearAll}
            className="text-xs text-muted-foreground hover:text-destructive transition-colors flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            {locale === "ar" ? "مسح الكل" : "Clear all"}
          </button>
        </div>

        <div className="flex gap-4 overflow-x-auto custom-scroll pb-2 snap-x">
          {rooms.map((room) => (
            <div
              key={room.slug}
              className="group relative shrink-0 w-64 snap-start rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-gold/40 hover:shadow-luxury transition-all duration-300"
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
                  <div className="absolute inset-0 bg-gradient-to-t from-deep/60 to-transparent opacity-60" />
                  <div className="absolute bottom-2 end-2 glass-dark text-white rounded-lg px-2.5 py-1 text-xs font-bold">
                    <span className="text-gold">{money(room.basePrice, locale)}</span>
                  </div>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm leading-tight line-clamp-1 group-hover:text-gold transition-colors">
                    {loc(room.nameAr, room.nameEn)}
                  </h3>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {locale === "ar" ? "غرفة / ليلة" : "room / night"}
                  </p>
                </div>
              </button>
              {/* Remove button */}
              <button
                onClick={() => removeRoom(room.slug)}
                className="absolute top-2 end-2 w-7 h-7 rounded-full glass-dark text-white hover:bg-destructive flex items-center justify-center transition-colors opacity-0 group-hover:opacity-100"
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

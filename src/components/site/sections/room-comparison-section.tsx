"use client";

import { GitCompare, Check, X, Minus } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useRooms, type RoomTypeData } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import { useMoney, useCurrencyRates } from "@/hooks/use-currency";
import { useLocalized } from "@/hooks/use-t";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

export function RoomComparisonSection() {
  const { t, locale } = useT();
  const loc = useLocalized();
  const money = useMoney();
  useCurrencyRates();
  const { data: rooms, isLoading } = useRooms();

  if (!isLoading && (!rooms || rooms.length === 0)) return null;

  const roomList = (rooms || []).slice(0, 4); // max 4 columns

  // All unique amenities across rooms
  const allAmenitySlugs = Array.from(
    new Set(roomList.flatMap((r) => r.amenities.map((a) => a.amenity.slug)))
  );
  const amenityMap = new Map<string, { ar: string; en: string }>();
  for (const r of roomList) {
    for (const a of r.amenities) {
      amenityMap.set(a.amenity.slug, { ar: a.amenity.nameAr, en: a.amenity.nameEn });
    }
  }

  const hasAmenity = (room: RoomTypeData, slug: string) =>
    room.amenities.some((a) => a.amenity.slug === slug);

  // Comparison rows
  const specRows = [
    {
      labelAr: "السعر يبدأ من",
      labelEn: "Price from",
      getValue: (r: RoomTypeData) => money(r.basePrice, locale),
      isPrice: true,
    },
    {
      labelAr: "السعة القصوى",
      labelEn: "Max occupancy",
      getValue: (r: RoomTypeData) => `${r.maxAdults + r.maxChildren} ${locale === "ar" ? "ضيف" : "guests"}`,
    },
    {
      labelAr: "البالغون",
      labelEn: "Adults",
      getValue: (r: RoomTypeData) => `${r.maxAdults}`,
    },
    {
      labelAr: "الأطفال",
      labelEn: "Children",
      getValue: (r: RoomTypeData) => `${r.maxChildren}`,
    },
    {
      labelAr: "المساحة",
      labelEn: "Size",
      getValue: (r: RoomTypeData) => (r.sizeSqm ? `${r.sizeSqm} m²` : "—"),
    },
    {
      labelAr: "ترتيب السرير",
      labelEn: "Bed configuration",
      getValue: (r: RoomTypeData) => loc(r.bedConfigAr, r.bedConfigEn),
      small: true,
    },
    {
      labelAr: "الغيور المتاحة",
      labelEn: "Total inventory",
      getValue: (r: RoomTypeData) => `${r.totalInventory} ${locale === "ar" ? "غرف" : "rooms"}`,
    },
    {
      labelAr: "سياسة الإلغاء",
      labelEn: "Cancellation",
      getValue: (r: RoomTypeData) =>
        r.ratePlan?.isRefundable
          ? locale === "ar"
            ? `مجاني قبل ${r.ratePlan.cancellationDays} أيام`
            : `Free ${r.ratePlan.cancellationDays} days before`
          : locale === "ar"
          ? "غير قابل للاسترداد"
          : "Non-refundable",
      small: true,
    },
  ];

  return (
    <section id="comparison" className="py-16 lg:py-24 bg-background scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-10 lg:mb-14">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gold mb-3">
            <GitCompare className="w-3.5 h-3.5" />
            {locale === "ar" ? "مقارنة الغرف" : "Compare Rooms"}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
            {locale === "ar" ? "قارن بين أنواع الغرف" : "Compare Room Types"}
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg">
            {locale === "ar"
              ? "اعثر على الغرفة المثالية لك بمقارنة الميزات والأسعار"
              : "Find your perfect room by comparing features and prices"}
          </p>
        </Reveal>

        {isLoading ? (
          <Skeleton className="h-96 w-full rounded-2xl" />
        ) : (
          <Reveal direction="up">
            <div className="overflow-x-auto custom-scroll rounded-2xl border border-border/50 shadow-sm">
              <table className="w-full min-w-[768px]">
                {/* Header row with room images */}
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="sticky start-0 bg-card z-10 p-4 text-start min-w-[140px]">
                      <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                        {locale === "ar" ? "الميزة" : "Feature"}
                      </span>
                    </th>
                    {roomList.map((room) => (
                      <th key={room.id} className="p-3 min-w-[180px] align-bottom">
                        <div className="flex flex-col items-center gap-2">
                          <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-muted mb-1">
                            <img
                              src={room.imageUrl}
                              alt={loc(room.nameAr, room.nameEn)}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                            {room.isFeatured && (
                              <div className="absolute top-2 end-2 glass-dark text-gold text-[9px] font-bold px-2 py-0.5 rounded-full">
                                ★ {locale === "ar" ? "مميزة" : "Featured"}
                              </div>
                            )}
                          </div>
                          <h3 className="font-display font-bold text-sm text-center leading-tight">
                            {loc(room.nameAr, room.nameEn)}
                          </h3>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {/* Spec rows */}
                  {specRows.map((row, idx) => (
                    <tr
                      key={idx}
                      className={cn(
                        "border-b border-border/30 transition-colors hover:bg-cream/30",
                        idx % 2 === 0 ? "bg-card" : "bg-cream/10"
                      )}
                    >
                      <td className="sticky start-0 bg-inherit z-10 p-4 text-xs font-semibold text-muted-foreground">
                        {loc(row.labelAr, row.labelEn)}
                      </td>
                      {roomList.map((room) => (
                        <td
                          key={room.id}
                          className={cn(
                            "p-3 text-center",
                            row.isPrice && "font-bold text-gradient-gold text-base"
                          )}
                        >
                          <span className={cn(row.small && "text-[11px]")}>
                            {row.getValue(room)}
                          </span>
                        </td>
                      ))}
                    </tr>
                  ))}

                  {/* Amenities separator */}
                  <tr className="border-b-2 border-gold/30">
                    <td colSpan={roomList.length + 1} className="p-3 bg-cream/20">
                      <span className="text-xs font-bold uppercase tracking-wider text-gold">
                        {locale === "ar" ? "المرافق" : "Amenities"}
                      </span>
                    </td>
                  </tr>

                  {/* Amenity rows */}
                  {allAmenitySlugs.map((slug, idx) => {
                    const names = amenityMap.get(slug);
                    if (!names) return null;
                    return (
                      <tr
                        key={slug}
                        className={cn(
                          "border-b border-border/20 transition-colors hover:bg-cream/30",
                          idx % 2 === 0 ? "bg-card" : "bg-cream/5"
                        )}
                      >
                        <td className="sticky start-0 bg-inherit z-10 p-3 text-xs text-muted-foreground">
                          {loc(names.ar, names.en)}
                        </td>
                        {roomList.map((room) => {
                          const has = hasAmenity(room, slug);
                          return (
                            <td key={room.id} className="p-3 text-center">
                              {has ? (
                                <Check className="w-4 h-4 text-emerald-500 mx-auto" />
                              ) : (
                                <Minus className="w-4 h-4 text-muted-foreground/30 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Reveal>
        )}

        {/* Legend */}
        <div className="mt-4 flex items-center justify-center gap-6 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Check className="w-3.5 h-3.5 text-emerald-500" />
            {locale === "ar" ? "متوفر" : "Included"}
          </div>
          <div className="flex items-center gap-1.5">
            <Minus className="w-3.5 h-3.5 text-muted-foreground/30" />
            {locale === "ar" ? "غير متوفر" : "Not included"}
          </div>
        </div>
      </div>
    </section>
  );
}

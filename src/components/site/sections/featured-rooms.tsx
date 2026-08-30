"use client";

import { useState, useMemo } from "react";
import { ArrowRight, ArrowLeft, Users, Maximize, BedDouble, Star, Eye, Filter, X, SlidersHorizontal } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useRooms, useHotel, type RoomTypeData } from "@/hooks/use-data";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUIStore } from "@/stores/ui-store";
import { useMoney, useCurrencyRates } from "@/hooks/use-currency";
import { useLocalized } from "@/hooks/use-t";
import { FavoriteButton } from "@/components/site/favorite-button";
import { cn } from "@/lib/utils";

export function FeaturedRooms() {
  const { t, locale } = useT();
  const { data: rooms, isLoading } = useRooms();
  const { data: hotel } = useHotel();
  const openRoomDetail = useUIStore((s) => s.openRoomDetail);
  useCurrencyRates();

  // Filter state
  const [showAll, setShowAll] = useState(false);
  const [maxPrice, setMaxPrice] = useState<number | null>(null);
  const [minGuests, setMinGuests] = useState<number>(0);
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);

  const featured = (rooms || []).filter((r) => r.isFeatured).slice(0, 3);
  const list = featured.length ? featured : (rooms || []).slice(0, 3);

  // All amenities available
  const allAmenities = useMemo(() => {
    const map = new Map<string, { ar: string; en: string }>();
    for (const r of rooms || []) {
      for (const a of r.amenities) {
        map.set(a.amenity.slug, { ar: a.amenity.nameAr, en: a.amenity.nameEn });
      }
    }
    return Array.from(map.entries()).map(([slug, names]) => ({ slug, ...names }));
  }, [rooms]);

  // Filtered rooms (when showAll is true)
  const filteredRooms = useMemo(() => {
    let result = rooms || [];
    if (maxPrice !== null) {
      result = result.filter((r) => r.basePrice <= maxPrice);
    }
    if (minGuests > 0) {
      result = result.filter((r) => r.maxAdults + r.maxChildren >= minGuests);
    }
    if (selectedAmenities.length > 0) {
      result = result.filter((r) =>
        selectedAmenities.every((slug) => r.amenities.some((a) => a.amenity.slug === slug))
      );
    }
    return result;
  }, [rooms, maxPrice, minGuests, selectedAmenities]);

  const hasActiveFilters = maxPrice !== null || minGuests > 0 || selectedAmenities.length > 0;
  const clearFilters = () => {
    setMaxPrice(null);
    setMinGuests(0);
    setSelectedAmenities([]);
  };

  return (
    <section id="rooms" className="py-16 lg:py-24 bg-background scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10 lg:mb-14">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gold mb-3">
            <Star className="w-3.5 h-3.5 fill-gold" />
            {t("rooms.featured")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
            {t("rooms.title")}
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg leading-relaxed">
            {t("rooms.subtitle")}
          </p>
        </div>

        {/* View toggle */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <button
            onClick={() => setShowAll(false)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all",
              !showAll ? "bg-gold-gradient text-gold-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            {t("rooms.featured")}
          </button>
          <button
            onClick={() => setShowAll(true)}
            className={cn(
              "px-4 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5",
              showAll ? "bg-gold-gradient text-gold-foreground shadow-md" : "bg-muted text-muted-foreground hover:bg-accent"
            )}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            {t("rooms.allRooms")}
          </button>
        </div>

        {/* Filters (only when showAll) */}
        {showAll && (
          <div className="mb-8 animate-fade-in">
            <div className="bg-card rounded-2xl border border-border/50 p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Filter className="w-4 h-4 text-gold" />
                  {locale === "ar" ? "تصفية النتائج" : "Filter results"}
                </div>
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
                  >
                    <X className="w-3 h-3" />
                    {locale === "ar" ? "مسح الفلاتر" : "Clear filters"}
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Price filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    {locale === "ar" ? "أقصى سعر (لليلة)" : "Max price (per night)"}
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min={30000}
                      max={150000}
                      step={5000}
                      value={maxPrice ?? 150000}
                      onChange={(e) => setMaxPrice(Number(e.target.value))}
                      className="flex-1 accent-gold"
                    />
                    <span className="text-xs font-semibold min-w-[60px] text-end">
                      {maxPrice ? (
                        <>
                          ≤ <PriceDisplay amount={maxPrice} locale={locale} />
                        </>
                      ) : (
                        locale === "ar" ? "الكل" : "All"
                      )}
                    </span>
                  </div>
                </div>

                {/* Min guests filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    {locale === "ar" ? "أقل عدد ضيوف" : "Min guests"}
                  </label>
                  <div className="flex gap-1.5">
                    {[0, 2, 3, 4, 6].map((n) => (
                      <button
                        key={n}
                        onClick={() => setMinGuests(n)}
                        className={cn(
                          "h-8 px-3 rounded-lg text-xs font-medium transition-all",
                          minGuests === n
                            ? "bg-gold-gradient text-gold-foreground"
                            : "bg-muted hover:bg-accent"
                        )}
                      >
                        {n === 0 ? (locale === "ar" ? "الكل" : "All") : `${n}+`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Amenities filter */}
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-2 block">
                    {locale === "ar" ? "المرافق" : "Amenities"}
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-[80px] overflow-y-auto custom-scroll">
                    {allAmenities.slice(0, 10).map((a) => {
                      const selected = selectedAmenities.includes(a.slug);
                      return (
                        <button
                          key={a.slug}
                          onClick={() => {
                            setSelectedAmenities((prev) =>
                              prev.includes(a.slug) ? prev.filter((s) => s !== a.slug) : [...prev, a.slug]
                            );
                          }}
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-medium transition-all",
                            selected
                              ? "bg-gold-gradient text-gold-foreground"
                              : "bg-muted hover:bg-accent text-muted-foreground"
                          )}
                        >
                          {locale === "ar" ? a.ar : a.en}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Result count */}
              <div className="mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
                {locale === "ar"
                  ? `${filteredRooms.length} غرفة متاحة`
                  : `${filteredRooms.length} rooms available`}
              </div>
            </div>
          </div>
        )}

        {/* Room grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <RoomCardSkeleton key={i} />)
            : (showAll ? filteredRooms : list).map((room, idx) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  currency={hotel?.currency || "YER"}
                  locale={locale}
                  onView={() => openRoomDetail(room.slug)}
                  priority={idx === 0}
                />
              ))}
        </div>

        {/* Empty state for filtered results */}
        {showAll && filteredRooms.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-3">
              {locale === "ar" ? "لا توجد غرف مطابقة للفلاتر المحددة" : "No rooms match the selected filters"}
            </p>
            <Button onClick={clearFilters} variant="outline" className="rounded-full border-gold/40 text-gold">
              {locale === "ar" ? "مسح الفلاتر" : "Clear filters"}
            </Button>
          </div>
        )}

        {/* View all button (when not in showAll mode) */}
        {!showAll && (
          <div className="text-center mt-10">
            <Button
              onClick={() => setShowAll(true)}
              variant="outline"
              className="rounded-full border-gold/40 text-gold hover:bg-gold hover:text-gold-foreground transition-colors"
            >
              {t("rooms.allRooms")}
              {locale === "ar" ? <ArrowLeft className="w-4 h-4 ms-2" /> : <ArrowRight className="w-4 h-4 ms-2" />}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}

// Helper to display money in the filtered price (uses static YER for simplicity in filter)
function PriceDisplay({ amount, locale }: { amount: number; locale: "ar" | "en" }) {
  const money = useMoney();
  return <>{money(amount, locale)}</>;
}

function RoomCard({
  room,
  currency,
  locale,
  onView,
  priority,
}: {
  room: RoomTypeData;
  currency: string;
  locale: "ar" | "en";
  onView: () => void;
  priority?: boolean;
}) {
  const { t } = useT();
  const loc = useLocalized();
  const money = useMoney();
  const Arrow = locale === "ar" ? ArrowLeft : ArrowRight;

  return (
    <article className="group relative rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-gold/40 hover:shadow-card-hover transition-all duration-500 flex flex-col hover:-translate-y-1">
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        <img
          src={room.imageUrl}
          alt={loc(room.nameAr, room.nameEn)}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
          loading={priority ? "eager" : "lazy"}
        />
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-deep/70 via-deep/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />

        {/* Featured badge */}
        {room.isFeatured && (
          <div className="absolute top-3 start-3">
            <span className="glass-dark text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full flex items-center gap-1 border border-gold/30">
              <Star className="w-3 h-3 text-gold fill-gold" />
              {locale === "ar" ? "مميزة" : "Featured"}
            </span>
          </div>
        )}

        {/* Favorite button */}
        <div className="absolute top-3 end-3">
          <FavoriteButton
            room={{
              slug: room.slug,
              nameAr: room.nameAr,
              nameEn: room.nameEn,
              imageUrl: room.imageUrl,
              basePrice: room.basePrice,
            }}
            size="sm"
          />
        </div>

        {/* Price tag */}
        <div className="absolute bottom-3 end-3 glass-dark text-white rounded-2xl px-4 py-2 shadow-lg border border-white/10">
          <div className="text-[9px] uppercase tracking-wider text-white/60 leading-none mb-0.5">{t("rooms.from")}</div>
          <div className="text-base font-bold leading-tight">
            <span className="text-gold">{money(room.basePrice, locale)}</span>
          </div>
          <div className="text-[9px] text-white/60 leading-none mt-0.5">{t("rooms.perNight")}</div>
        </div>

        {/* Quick view overlay on hover */}
        <button
          onClick={onView}
          className="absolute inset-0 flex items-center justify-center bg-deep/40 opacity-0 group-hover:opacity-100 transition-opacity"
          aria-label={t("rooms.viewDetails")}
        >
          <span className="glass-dark text-white text-xs font-medium px-4 py-2 rounded-full flex items-center gap-1.5 border border-white/20">
            <Eye className="w-3.5 h-3.5" />
            {t("rooms.viewDetails")}
          </span>
        </button>
      </div>

      {/* Body */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-bold text-lg lg:text-xl mb-1.5 group-hover:text-gold transition-colors">
          {loc(room.nameAr, room.nameEn)}
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed mb-4 line-clamp-2 flex-1">
          {loc(room.shortDescriptionAr, room.shortDescriptionEn)}
        </p>

        {/* Quick specs */}
        <div className="grid grid-cols-3 gap-2 mb-4 py-3 border-y border-border/50">
          <Spec icon={Users} label={`${room.maxAdults + room.maxChildren}`} sub={t("rooms.maxGuests")} />
          <Spec
            icon={BedDouble}
            label={loc(room.bedConfigAr.split("(")[0].trim(), room.bedConfigEn.split("(")[0].trim())}
            sub={t("rooms.bedConfig")}
            small
          />
          <Spec icon={Maximize} label={room.sizeSqm ? `${room.sizeSqm}m²` : "—"} sub={t("rooms.size")} />
        </div>

        {/* Amenities preview */}
        <div className="flex flex-wrap gap-1.5 mb-4 min-h-[24px]">
          {room.amenities.slice(0, 4).map((a) => (
            <span
              key={a.amenity.slug}
              className="text-[10px] px-2 py-1 rounded-full bg-cream/60 border border-gold/10 text-muted-foreground"
            >
              {loc(a.amenity.nameAr, a.amenity.nameEn)}
            </span>
          ))}
          {room.amenities.length > 4 && (
            <span className="text-[10px] px-2 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold font-medium">
              +{room.amenities.length - 4}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-auto">
          <Button
            onClick={onView}
            variant="outline"
            className="flex-1 rounded-full border-gold/30 hover:bg-gold/10 hover:border-gold/50"
          >
            {t("rooms.viewDetails")}
          </Button>
          <Button
            onClick={onView}
            className="flex-1 rounded-full bg-gold-gradient text-gold-foreground font-semibold hover:opacity-90 hover:shadow-lg hover:shadow-gold/20 transition-shadow"
          >
            {t("rooms.book")}
            <Arrow className="w-4 h-4 ms-1.5" />
          </Button>
        </div>
      </div>
    </article>
  );
}

function Spec({
  icon: Icon,
  label,
  sub,
  small,
}: {
  icon: typeof Users;
  label: string;
  sub: string;
  small?: boolean;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-1">
      <Icon className="w-4 h-4 text-gold" />
      <span className={`font-semibold ${small ? "text-[10px]" : "text-xs"} leading-tight`}>{label}</span>
      <span className="text-[10px] text-muted-foreground">{sub}</span>
    </div>
  );
}

function RoomCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border/50">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

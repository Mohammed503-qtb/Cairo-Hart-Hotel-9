"use client";

import { useState, useRef, useEffect } from "react";
import { Star, Quote, ChevronLeft, ChevronRight, BadgeCheck, MapPin } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useReviews, type ReviewData } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalized } from "@/hooks/use-t";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

const COUNTRY_FLAGS: Record<string, string> = {
  SA: "🇸🇦",
  AE: "🇦🇪",
  YE: "🇾🇪",
  OM: "🇴🇲",
  GB: "🇬🇧",
  US: "🇺🇸",
  KW: "🇰🇼",
  QA: "🇶🇦",
  BH: "🇧🇭",
  EG: "🇪🇬",
  JO: "🇯🇴",
};

const ROOM_TYPE_NAMES: Record<string, { ar: string; en: string }> = {
  "standard-room": { ar: "الغرفة القياسية", en: "Standard Room" },
  "deluxe-sea-view": { ar: "غرفة ديلوكس بإطلالة بحرية", en: "Deluxe Sea View Room" },
  "family-suite": { ar: "الجناح العائلي", en: "Family Suite" },
  "executive-suite": { ar: "الجناح التنفيذي", en: "Executive Suite" },
};

export function ReviewsSection() {
  const { t, locale } = useT();
  const loc = useLocalized();
  const { data, isLoading } = useReviews();
  const [expanded, setExpanded] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollStart, setCanScrollStart] = useState(false);
  const [canScrollEnd, setCanScrollEnd] = useState(true);

  const reviews = data?.reviews || [];
  const summary = data?.summary;
  const visibleReviews = expanded ? reviews : reviews.slice(0, 4);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const update = () => {
      // In RTL, scrollLeft is negative or reversed depending on browser
      const maxScroll = el.scrollWidth - el.clientWidth;
      const currentScroll = Math.abs(el.scrollLeft);
      setCanScrollStart(currentScroll > 10);
      setCanScrollEnd(currentScroll < maxScroll - 10);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [reviews.length]);

  const scroll = (dir: "prev" | "next") => {
    const el = scrollRef.current;
    if (!el) return;
    const cardWidth = 320; // approximate card width + gap
    const direction = locale === "ar" ? (dir === "prev" ? 1 : -1) : dir === "prev" ? -1 : 1;
    el.scrollBy({ left: direction * cardWidth, behavior: "smooth" });
  };

  if (!isLoading && reviews.length === 0) return null;

  const ratingLabel =
    summary && summary.avgRating >= 4.5
      ? t("reviews.excellent")
      : summary && summary.avgRating >= 4
      ? t("reviews.veryGood")
      : t("reviews.good");

  return (
    <section id="reviews" className="py-16 lg:py-24 bg-gradient-to-b from-cream/40 to-background scroll-mt-20 relative overflow-hidden">
      {/* Decorative quote watermark */}
      <Quote className="absolute top-10 end-10 w-32 h-32 text-gold/5 -rotate-12 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <Reveal className="text-center max-w-2xl mx-auto mb-10 lg:mb-14">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gold mb-3">
            <Star className="w-3.5 h-3.5 fill-gold" /> {t("reviews.title")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
            {t("reviews.title")}
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg">{t("reviews.subtitle")}</p>
        </Reveal>

        {/* Summary banner */}
        {summary && (
          <div className="max-w-3xl mx-auto mb-10 lg:mb-14">
            <div className="bg-card rounded-3xl border border-gold/30 shadow-luxury p-6 lg:p-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                {/* Average rating */}
                <div className="text-center md:border-e md:border-border/50 md:pe-6">
                  <div className="flex items-center justify-center gap-1 mb-2">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star
                        key={s}
                        className={cn(
                          "w-6 h-6",
                          s <= Math.round(summary.avgRating)
                            ? "text-gold fill-gold"
                            : "text-muted-foreground/30"
                        )}
                      />
                    ))}
                  </div>
                  <div className="font-display text-5xl font-bold text-gradient-gold mb-1">
                    {summary.avgRating.toFixed(1)}
                  </div>
                  <div className="text-sm font-semibold text-foreground mb-0.5">{ratingLabel}</div>
                  <div className="text-xs text-muted-foreground">
                    {t("reviews.basedOn")} {summary.totalReviews} {t("reviews.reviews")}
                  </div>
                </div>

                {/* Distribution */}
                <div className="space-y-1.5">
                  {summary.distribution.map((d) => {
                    const pct = summary.totalReviews > 0 ? (d.count / summary.totalReviews) * 100 : 0;
                    return (
                      <div key={d.star} className="flex items-center gap-2 text-xs">
                        <span className="flex items-center gap-0.5 w-12 shrink-0">
                          {d.star}
                          <Star className="w-3 h-3 text-gold fill-gold" />
                        </span>
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gold-gradient rounded-full transition-all duration-700"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-8 text-end text-muted-foreground tabular-nums">{d.count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reviews grid (carousel on desktop, stacked on mobile) */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : (
          <>
            <div className="relative max-w-6xl mx-auto">
              {/* Nav arrows (desktop) */}
              {reviews.length > 3 && (
                <>
                  <button
                    onClick={() => scroll("prev")}
                    disabled={!canScrollStart}
                    className="hidden lg:flex absolute -start-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border shadow-luxury items-center justify-center hover:bg-gold hover:text-gold-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Previous"
                  >
                    <ChevronLeft className="w-5 h-5 rtl:rotate-180" />
                  </button>
                  <button
                    onClick={() => scroll("next")}
                    disabled={!canScrollEnd}
                    className="hidden lg:flex absolute -end-4 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border shadow-luxury items-center justify-center hover:bg-gold hover:text-gold-foreground transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    aria-label="Next"
                  >
                    <ChevronRight className="w-5 h-5 rtl:rotate-180" />
                  </button>
                </>
              )}

              <div
                ref={scrollRef}
                className="flex gap-5 overflow-x-auto custom-scroll snap-x snap-mandatory pb-2 lg:grid lg:grid-cols-3 lg:overflow-visible"
                style={{ scrollbarWidth: "none" }}
              >
                {visibleReviews.map((review) => (
                  <ReviewCard key={review.id} review={review} locale={locale} t={t} loc={loc} />
                ))}
              </div>
            </div>

            {reviews.length > 4 && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="px-6 py-2.5 rounded-full bg-card border border-gold/40 text-gold hover:bg-gold hover:text-gold-foreground transition-colors font-medium text-sm"
                >
                  {expanded ? t("common.close") : t("reviews.showAll")} ({reviews.length})
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

function ReviewCard({
  review,
  locale,
  t,
  loc,
}: {
  review: ReviewData;
  locale: "ar" | "en";
  t: (k: string) => string;
  loc: (ar: string, en: string) => string;
}) {
  const flag = COUNTRY_FLAGS[review.guestCountry] || "🌍";
  const roomName = review.roomTypeSlug
    ? ROOM_TYPE_NAMES[review.roomTypeSlug]
      ? loc(ROOM_TYPE_NAMES[review.roomTypeSlug].ar, ROOM_TYPE_NAMES[review.roomTypeSlug].en)
      : review.roomTypeSlug
    : null;
  const sourceLabel =
    review.source === "GOOGLE"
      ? t("reviews.sourceGoogle")
      : review.source === "BOOKING_COM"
      ? t("reviews.sourceBooking")
      : t("reviews.sourceWebsite");
  const initials = review.guestName
    .split(" ")
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
  const stayDate = review.stayDate ? new Date(review.stayDate) : null;
  const stayLabel = stayDate
    ? stayDate.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", { month: "long", year: "numeric" })
    : null;

  return (
    <article className="snap-start shrink-0 w-[300px] sm:w-[340px] lg:w-auto bg-card rounded-2xl border border-border/50 p-5 lg:p-6 hover:shadow-card-hover hover:border-gold/40 transition-all duration-300 flex flex-col">
      {/* Header: avatar + name + flag */}
      <div className="flex items-center gap-3 mb-4">
        <div className="w-12 h-12 rounded-full bg-luxury-gradient flex items-center justify-center shrink-0">
          <span className="font-display font-bold text-primary-foreground text-sm">{initials || "★"}</span>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold text-sm truncate">{review.guestName}</h3>
            <BadgeCheck className="w-4 h-4 text-gold shrink-0" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="text-base leading-none">{flag}</span>
            <span>•</span>
            <span className="truncate">{sourceLabel}</span>
          </div>
        </div>
      </div>

      {/* Rating stars */}
      <div className="flex items-center gap-0.5 mb-3">
        {[1, 2, 3, 4, 5].map((s) => {
          const filled = s <= Math.floor(review.rating);
          const half = !filled && s - 0.5 <= review.rating;
          return (
            <div key={s} className="relative">
              <Star className={cn("w-4 h-4", filled ? "text-gold fill-gold" : "text-muted-foreground/25")} />
              {half && (
                <div className="absolute inset-0 overflow-hidden" style={{ width: "50%" }}>
                  <Star className="w-4 h-4 text-gold fill-gold" />
                </div>
              )}
            </div>
          );
        })}
        <span className="text-xs font-semibold text-gold ms-1.5">
          {review.rating.toFixed(1)}
        </span>
      </div>

      {/* Title */}
      {review.titleAr && review.titleEn && (
        <h4 className="font-display font-bold text-sm mb-2 text-foreground">
          {loc(review.titleAr, review.titleEn)}
        </h4>
      )}

      {/* Body */}
      <p className="text-sm text-muted-foreground leading-relaxed flex-1 line-clamp-5">
        {loc(review.bodyAr, review.bodyEn)}
      </p>

      {/* Footer: room type + stay date */}
      <div className="mt-4 pt-3 border-t border-border/50 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground">
        {roomName && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-gold" />
            {t("reviews.stayed")} {roomName}
          </span>
        )}
        {stayLabel && (
          <span className="text-muted-foreground/70">• {stayLabel}</span>
        )}
      </div>
    </article>
  );
}

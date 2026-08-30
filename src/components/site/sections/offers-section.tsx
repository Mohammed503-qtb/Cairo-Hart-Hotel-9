"use client";

import { Tag, Calendar, ArrowRight, ArrowLeft, Percent } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useOffers } from "@/hooks/use-data";
import { useUIStore } from "@/stores/ui-store";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalized } from "@/hooks/use-t";
import { Reveal } from "@/components/site/reveal";
import { formatDate } from "@/lib/format";

export function OffersSection() {
  const { t, locale } = useT();
  const loc = useLocalized();
  const { data: offers, isLoading } = useOffers();
  const openBooking = useUIStore((s) => s.openBooking);

  if (!isLoading && (!offers || offers.length === 0)) return null;

  return (
    <section id="offers" className="py-16 lg:py-24 bg-cream/30 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-10 lg:mb-14">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gold mb-3">
            <Tag className="w-3.5 h-3.5" /> {t("nav.offers")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">{t("offers.title")}</h2>
          <p className="text-muted-foreground text-base lg:text-lg">{t("offers.subtitle")}</p>
        </Reveal>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => <OfferSkeleton key={i} />)
            : (offers || []).map((offer) => (
                <div
                  key={offer.id}
                  className="group relative rounded-2xl overflow-hidden bg-card border border-border/50 hover:shadow-card-hover transition-all duration-300 flex flex-col"
                >
                  {/* Image with discount badge */}
                  {offer.imageUrl && (
                    <div className="relative aspect-[16/10] overflow-hidden bg-muted">
                      <img
                        src={offer.imageUrl}
                        alt={loc(offer.titleAr, offer.titleEn)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-deep/60 to-transparent" />
                      {offer.discountPercent && (
                        <div className="absolute top-3 end-3 bg-gold-gradient text-gold-foreground rounded-full px-3 py-1.5 text-sm font-bold flex items-center gap-1 shadow-lg">
                          <Percent className="w-3.5 h-3.5" />
                          {offer.discountPercent}%
                        </div>
                      )}
                    </div>
                  )}

                  <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-display font-bold text-lg mb-2 group-hover:text-gold transition-colors">
                      {loc(offer.titleAr, offer.titleEn)}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed line-clamp-3 mb-3 flex-1">
                      {loc(offer.descriptionAr, offer.descriptionEn)}
                    </p>

                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4 pb-4 border-b border-border/50">
                      <Calendar className="w-3.5 h-3.5 text-gold" />
                      {t("offers.validUntil")} {formatDate(new Date(offer.validTo), locale)}
                    </div>

                    <Button
                      onClick={openBooking}
                      className="w-full bg-gold-gradient text-gold-foreground rounded-full font-semibold"
                    >
                      {t("offers.bookNow")}
                      {locale === "ar" ? <ArrowLeft className="w-4 h-4 ms-2" /> : <ArrowRight className="w-4 h-4 ms-2" />}
                    </Button>
                  </div>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

function OfferSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border/50">
      <Skeleton className="aspect-[16/10] w-full" />
      <div className="p-5 space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-2/3" />
      </div>
    </div>
  );
}

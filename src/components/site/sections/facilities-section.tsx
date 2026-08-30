"use client";

import { Clock } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useFacilities } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import { AmenityIcon } from "@/components/shared/amenity-icon";
import { useLocalized } from "@/hooks/use-t";
import { Reveal } from "@/components/site/reveal";

export function FacilitiesSection() {
  const { t } = useT();
  const loc = useLocalized();
  const { data: facilities, isLoading } = useFacilities();

  return (
    <section id="facilities" className="py-16 lg:py-24 bg-cream/30 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-10 lg:mb-14">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-gold mb-3">
            {t("nav.facilities")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">
            {t("facilities.title")}
          </h2>
          <p className="text-muted-foreground text-base lg:text-lg">{t("facilities.subtitle")}</p>
        </Reveal>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-5">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => <FacilitySkeleton key={i} />)
            : (facilities || []).map((f) => (
                <div
                  key={f.id}
                  className="group rounded-2xl overflow-hidden bg-card border border-border/50 hover:shadow-card-hover hover:border-gold/40 transition-all duration-300"
                >
                  {f.imageUrl ? (
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                      <img
                        src={f.imageUrl}
                        alt={loc(f.nameAr, f.nameEn)}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-deep/80 via-deep/20 to-transparent" />
                      <div className="absolute bottom-0 inset-x-0 p-3">
                        <div className="w-10 h-10 rounded-full bg-gold/90 flex items-center justify-center mb-1">
                          <AmenityIcon iconKey={f.iconKey} className="w-5 h-5 text-gold-foreground" />
                        </div>
                        <h3 className="font-display font-bold text-sm text-white drop-shadow">{loc(f.nameAr, f.nameEn)}</h3>
                      </div>
                    </div>
                  ) : (
                    <div className="p-5 flex flex-col items-center text-center">
                      <div className="w-14 h-14 rounded-full bg-gold-soft flex items-center justify-center mb-3 group-hover:bg-gold transition-colors">
                        <AmenityIcon iconKey={f.iconKey} className="w-6 h-6 text-gold group-hover:text-gold-foreground" />
                      </div>
                      <h3 className="font-display font-bold text-sm mb-1">{loc(f.nameAr, f.nameEn)}</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {loc(f.descriptionAr, f.descriptionEn)}
                      </p>
                      {f.hoursAr && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-gold">
                          <Clock className="w-3 h-3" />
                          {loc(f.hoursAr, f.hoursEn || "")}
                        </div>
                      )}
                    </div>
                  )}
                  {f.imageUrl && (
                    <div className="p-3">
                      <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                        {loc(f.descriptionAr, f.descriptionEn)}
                      </p>
                      {f.hoursAr && (
                        <div className="mt-2 flex items-center gap-1 text-[10px] text-gold">
                          <Clock className="w-3 h-3" />
                          {loc(f.hoursAr, f.hoursEn || "")}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}

function FacilitySkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden bg-card border border-border/50">
      <Skeleton className="aspect-[4/3] w-full" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

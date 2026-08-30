"use client";

import { useState } from "react";
import { X, ZoomIn } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useGallery, type GalleryItemData } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocalized } from "@/hooks/use-t";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent } from "@/components/ui/dialog";

const CATEGORIES = [
  { key: "all", labelKey: "gallery.all" },
  { key: "exterior", labelKey: "gallery.exterior" },
  { key: "rooms", labelKey: "gallery.rooms" },
  { key: "facilities", labelKey: "gallery.facilities" },
  { key: "surroundings", labelKey: "gallery.surroundings" },
];

export function GallerySection() {
  const { t } = useT();
  const loc = useLocalized();
  const { data: items, isLoading } = useGallery();
  const [activeCat, setActiveCat] = useState("all");
  const [lightbox, setLightbox] = useState<GalleryItemData | null>(null);

  const filtered = (items || []).filter((i) => activeCat === "all" || i.category === activeCat);

  return (
    <section id="gallery" className="py-16 lg:py-24 bg-background scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-8 lg:mb-12">
          <span className="inline-block text-xs font-bold uppercase tracking-widest text-gold mb-3">
            {t("nav.gallery")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">{t("gallery.title")}</h2>
          <p className="text-muted-foreground text-base lg:text-lg">{t("gallery.subtitle")}</p>
        </Reveal>

        {/* Filter tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCat(cat.key)}
              className={cn(
                "px-4 py-2 rounded-full text-sm font-medium transition-all",
                activeCat === cat.key
                  ? "bg-gold-gradient text-gold-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              )}
            >
              {t(cat.labelKey)}
            </button>
          ))}
        </div>

        {/* Masonry grid */}
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="aspect-square w-full rounded-xl" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 lg:gap-4 auto-rows-[180px]">
            {filtered.map((item, idx) => (
              <button
                key={item.id}
                onClick={() => setLightbox(item)}
                className={cn(
                  "group relative overflow-hidden rounded-xl bg-muted cursor-pointer",
                  // Make some items span 2 rows/cols for visual interest
                  idx % 7 === 0 ? "row-span-2" : "",
                  idx % 5 === 0 && idx % 7 !== 0 ? "col-span-2" : ""
                )}
              >
                <img
                  src={item.url}
                  alt={loc(item.altAr, item.altEn)}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-deep/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 inset-x-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <p className="text-xs text-white font-medium drop-shadow">{loc(item.captionAr || item.altAr, item.captionEn || item.altEn)}</p>
                </div>
                <div className="absolute top-2 end-2 w-8 h-8 rounded-full glass-dark flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ZoomIn className="w-4 h-4 text-white" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Dialog open={!!lightbox} onOpenChange={(o) => !o && setLightbox(null)}>
        <DialogContent className="max-w-4xl p-0 bg-deep border-none overflow-hidden">
          {lightbox && (
            <div className="relative">
              <img src={lightbox.url} alt={loc(lightbox.altAr, lightbox.altEn)} className="w-full max-h-[80vh] object-contain" />
              <button
                onClick={() => setLightbox(null)}
                className="absolute top-3 end-3 w-10 h-10 rounded-full glass-dark flex items-center justify-center text-white hover:bg-gold hover:text-gold-foreground transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-deep to-transparent">
                <p className="text-white text-sm font-medium">{loc(lightbox.captionAr || lightbox.altAr, lightbox.captionEn || lightbox.altEn)}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

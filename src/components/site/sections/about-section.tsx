"use client";

import { Award, Heart, MapPin, Sparkles, Star } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useHotel, useGallery } from "@/hooks/use-data";
import { useLocalized } from "@/hooks/use-t";
import { Skeleton } from "@/components/ui/skeleton";
import { CountUp } from "@/components/site/count-up";
import { Reveal } from "@/components/site/reveal";

const STATS = [
  { numValue: 25, suffix: "+", decimals: 0, key: "about.stats.years", icon: Award },
  { numValue: 29, suffix: "", decimals: 0, key: "about.stats.rooms", icon: Sparkles },
  { numValue: 15, suffix: "k+", decimals: 0, key: "about.stats.guests", icon: Heart },
  { numValue: 4.8, suffix: "", decimals: 1, key: "about.stats.rating", icon: Star },
];

export function AboutSection() {
  const { t, locale } = useT();
  const loc = useLocalized();
  const { data: hotel } = useHotel();
  const { data: gallery } = useGallery();

  // Pick 4 diverse images from gallery for the collage
  const collageImages = (gallery || [])
    .filter((g) => ["exterior", "rooms", "facilities"].includes(g.category))
    .slice(0, 4);
  // Fallback if gallery not loaded yet
  const fallback = [
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a6551c36a598.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/d829dc34b4f9.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/0af3339fad62.jpg",
    "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/3ca4bec76efd.png",
  ];
  const images =
    collageImages.length >= 4
      ? collageImages.map((g) => ({ url: g.url, alt: loc(g.altAr, g.altEn) }))
      : fallback.map((url) => ({ url, alt: t("about.title") }));

  return (
    <section id="about" className="py-16 lg:py-24 bg-background scroll-mt-20 overflow-hidden relative">
      {/* Subtle decorative pattern */}
      <div className="absolute inset-0 section-pattern opacity-30 pointer-events-none" />

      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Image collage */}
          <Reveal direction="left" className="relative order-2 lg:order-1">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-luxury group">
                  {images[0] ? (
                    <img
                      src={images[0].url}
                      alt={images[0].alt}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <Skeleton className="w-full h-full" />
                  )}
                </div>
                <div className="aspect-square rounded-2xl overflow-hidden shadow-luxury group">
                  {images[1] ? (
                    <img
                      src={images[1].url}
                      alt={images[1].alt}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <Skeleton className="w-full h-full" />
                  )}
                </div>
              </div>
              <div className="space-y-4 pt-8">
                <div className="aspect-square rounded-2xl overflow-hidden shadow-luxury group">
                  {images[2] ? (
                    <img
                      src={images[2].url}
                      alt={images[2].alt}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <Skeleton className="w-full h-full" />
                  )}
                </div>
                <div className="aspect-[3/4] rounded-2xl overflow-hidden shadow-luxury group">
                  {images[3] ? (
                    <img
                      src={images[3].url}
                      alt={images[3].alt}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <Skeleton className="w-full h-full" />
                  )}
                </div>
              </div>
            </div>

            {/* Floating stat card */}
            <div className="absolute -bottom-4 start-1/2 -translate-x-1/2 lg:start-auto lg:translate-x-0 lg:end-4 lg:-bottom-4 bg-card rounded-2xl shadow-luxury border border-gold/30 p-4 flex items-center gap-3 min-w-[200px] z-10">
              <div className="w-12 h-12 rounded-full bg-gold-gradient flex items-center justify-center shrink-0">
                <Award className="w-6 h-6 text-gold-foreground" />
              </div>
              <div>
                <div className="font-display font-bold text-lg text-gold leading-tight">25+</div>
                <div className="text-xs text-muted-foreground">{t("about.stats.years")}</div>
              </div>
            </div>

            {/* Decorative gold ring */}
            <div className="absolute -top-6 -end-6 w-24 h-24 rounded-full border-2 border-gold/20 -z-0 hidden lg:block" />
          </Reveal>

          {/* Text side */}
          <Reveal direction="right" className="order-1 lg:order-2">
            <span className="inline-block text-xs font-bold uppercase tracking-widest text-gold mb-3">
              {t("nav.about")}
            </span>
            <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">{t("about.title")}</h2>
            <p className="text-muted-foreground text-base lg:text-lg mb-6">{t("about.subtitle")}</p>

            {/* Story */}
            <div className="mb-6 relative ps-4 border-s-2 border-gold/40">
              <h3 className="font-display font-bold text-lg mb-2 flex items-center gap-2">
                <Heart className="w-4 h-4 text-gold" />
                {t("about.storyTitle")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {hotel ? loc(hotel.storyAr || "", hotel.storyEn || "") : ""}
              </p>
            </div>

            {/* Philosophy */}
            <div className="mb-6 relative ps-4 border-s-2 border-gold/40">
              <h3 className="font-display font-bold text-lg mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-gold" />
                {t("about.philosophyTitle")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {hotel ? loc(hotel.descriptionAr, hotel.descriptionEn) : ""}
              </p>
            </div>

            {/* Location advantage */}
            <div className="mb-8 relative ps-4 border-s-2 border-gold/40">
              <h3 className="font-display font-bold text-lg mb-2 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-gold" />
                {t("about.locationTitle")}
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {hotel ? loc(hotel.addressAr + "، " + hotel.cityAr, hotel.addressEn + ", " + hotel.cityEn) : ""}
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STATS.map((stat, i) => (
                <div
                  key={stat.key}
                  className="text-center p-3 rounded-xl bg-cream/60 border border-gold/20 hover:border-gold/50 hover:shadow-luxury transition-all"
                >
                  <stat.icon className="w-4 h-4 text-gold mx-auto mb-1" />
                  <div className="font-display font-bold text-2xl text-gradient-gold mb-0.5 leading-none">
                    <CountUp end={stat.numValue} suffix={stat.suffix} decimals={stat.decimals} locale={locale} />
                  </div>
                  <div className="text-[10px] text-muted-foreground leading-tight">{t(stat.key)}</div>
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

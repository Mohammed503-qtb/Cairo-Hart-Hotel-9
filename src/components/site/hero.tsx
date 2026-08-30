"use client";

import { ChevronDown, Star, MapPin, Waves } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useHotel } from "@/hooks/use-data";
import { useScrollParallax } from "@/hooks/use-scroll-parallax";
import { BookingWidget } from "./booking-widget";

export function Hero() {
  const { t, locale } = useT();
  const { data: hotel } = useHotel();
  const parallaxOffset = useScrollParallax(0.4, 200);

  const heroImage = hotel?.heroImageUrl || "https://z-cdn.chatglm.cn/image-search-mcp/images-ppt/a6551c36a598.jpg";

  return (
    <section id="home" className="relative min-h-screen flex flex-col justify-end overflow-hidden">
      {/* Background image with parallax */}
      <div className="absolute inset-0 z-0" style={{ transform: `translateY(${parallaxOffset}px) scale(1.15)` }}>
        <img
          src={heroImage}
          alt={locale === "ar" ? hotel?.nameAr || "Dar Al-Yasmin" : hotel?.nameEn || "Dar Al-Yasmin"}
          className="w-full h-full object-cover will-change-transform"
        />
        <div className="absolute inset-0 hero-overlay" />
        {/* Subtle gradient at top for nav readability */}
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/40 to-transparent" />
      </div>

      {/* Decorative floating elements with parallax */}
      <div
        className="absolute top-32 end-10 w-2 h-2 rounded-full bg-gold/40 blur-sm z-0 hidden lg:block"
        style={{ transform: `translateY(${-parallaxOffset * 0.5}px)` }}
      />
      <div
        className="absolute top-48 start-16 w-3 h-3 rounded-full bg-gold/30 blur-sm z-0 hidden lg:block"
        style={{ transform: `translateY(${-parallaxOffset * 0.7}px)` }}
      />

      {/* Floating badges */}
      <div
        className="absolute top-24 inset-x-0 z-10 hidden md:flex justify-center gap-3 px-4"
        style={{ transform: `translateY(${parallaxOffset * 0.2}px)`, opacity: Math.max(0, 1 - parallaxOffset / 100) }}
      >
        <div className="glass-dark text-white rounded-full px-4 py-2 text-xs font-medium flex items-center gap-2 border border-gold/20">
          <MapPin className="w-3.5 h-3.5 text-gold" />
          {locale === "ar" ? "خور مكسر، عدن" : "Khormaksar, Aden"}
        </div>
        <div className="glass-dark text-white rounded-full px-4 py-2 text-xs font-medium flex items-center gap-2 border border-gold/20">
          <Star className="w-3.5 h-3.5 text-gold fill-gold" />
          {locale === "ar" ? "فندق 5 نجوم" : "5-star hotel"}
        </div>
        <div className="glass-dark text-white rounded-full px-4 py-2 text-xs font-medium flex items-center gap-2 border border-gold/20">
          <Waves className="w-3.5 h-3.5 text-gold" />
          {locale === "ar" ? "إطلالة بحرية" : "Sea view"}
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 pb-8 pt-32">
        <div className="max-w-3xl mb-8 animate-fade-up">
          <div className="inline-flex items-center gap-2 glass-dark text-gold-soft rounded-full px-4 py-1.5 text-xs font-semibold mb-4 border border-gold/20">
            <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse" />
            {t("hero.badge")}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-bold text-white leading-[1.1] mb-4 drop-shadow-2xl">
            {t("hero.title")}
          </h1>
          <p className="text-base sm:text-lg text-white/85 max-w-2xl leading-relaxed drop-shadow-lg">
            {t("hero.subtitle")}
          </p>
        </div>

        {/* Booking widget */}
        <div className="max-w-5xl animate-fade-up" style={{ animationDelay: "0.1s" }}>
          <BookingWidget variant="hero" />
        </div>
      </div>

      {/* Scroll indicator */}
      <button
        onClick={() => document.querySelector("#rooms")?.scrollIntoView({ behavior: "smooth" })}
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 text-white/70 hover:text-white transition-colors flex flex-col items-center gap-1 group"
        aria-label={t("hero.scroll")}
      >
        <span className="text-[10px] uppercase tracking-widest">{t("hero.scroll")}</span>
        <div className="w-6 h-10 rounded-full border-2 border-white/40 flex items-start justify-center p-1.5 group-hover:border-gold transition-colors">
          <ChevronDown className="w-3 h-3 text-white/70 animate-bounce group-hover:text-gold transition-colors" />
        </div>
      </button>
    </section>
  );
}

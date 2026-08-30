"use client";

import { useState, useEffect } from "react";
import { Menu, X, Globe, Sun, Moon, CalendarClock, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { useUIStore } from "@/stores/ui-store";
import { useFavoritesStore } from "@/stores/favorites-store";
import { useT } from "@/hooks/use-t";
import { useHotel } from "@/hooks/use-data";
import { CurrencySelector } from "@/components/site/currency-selector";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { key: "nav.home", href: "#home" },
  { key: "nav.rooms", href: "#rooms" },
  { key: "nav.facilities", href: "#facilities" },
  { key: "nav.gallery", href: "#gallery" },
  { key: "nav.offers", href: "#offers" },
  { key: "nav.about", href: "#about" },
  { key: "nav.location", href: "#location" },
  { key: "nav.contact", href: "#contact" },
  { key: "nav.faq", href: "#faq" },
];

export function Header() {
  const { t, locale } = useT();
  const { toggleLocale, theme, toggleTheme, openBooking, openManage, mobileMenuOpen, setMobileMenu } = useUIStore();
  const { data: hotel } = useHotel();
  const favCount = useFavoritesStore((s) => s.favorites.length);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const name = hotel ? (locale === "ar" ? hotel.nameAr : hotel.nameEn) : t("brand.name");

  const handleNav = (href: string) => {
    setMobileMenu(false);
    const el = document.querySelector(href);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <header
      className={cn(
        "fixed top-0 inset-x-0 z-50 transition-all duration-300",
        scrolled ? "glass shadow-sm border-b border-border/50 py-2" : "bg-transparent py-4"
      )}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          {/* Logo + Brand */}
          <button
            onClick={() => handleNav("#home")}
            className="flex items-center gap-3 group shrink-0"
            aria-label={name}
          >
            <div className={cn(
              "w-11 h-11 rounded-full bg-gold-gradient flex items-center justify-center shadow-lg transition-transform group-hover:scale-105",
            )}>
              <span className="font-display text-xl font-bold text-gold-foreground">ي</span>
            </div>
            <div className="hidden sm:block text-start leading-tight">
              <div className={cn("font-display font-bold text-base transition-colors", scrolled ? "text-foreground" : "text-white drop-shadow")}>
                {name}
              </div>
              <div className={cn("text-[10px] tracking-wide uppercase transition-colors", scrolled ? "text-gold" : "text-gold-soft")}>
                {locale === "ar" ? "عدن • اليمن" : "Aden • Yemen"}
              </div>
            </div>
          </button>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.key}
                onClick={() => handleNav(item.href)}
                className={cn(
                  "px-3 py-2 text-sm font-medium rounded-full transition-all hover:bg-accent/60 hover:text-accent-foreground",
                  scrolled ? "text-foreground/80 hover:text-foreground" : "text-white/90 hover:text-white hover:bg-white/10"
                )}
              >
                {t(item.key)}
              </button>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center transition-all hover:bg-accent/60",
                scrolled ? "text-foreground" : "text-white hover:bg-white/10"
              )}
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
            <button
              onClick={toggleLocale}
              className={cn(
                "h-10 px-3 rounded-full flex items-center gap-1.5 text-sm font-semibold transition-all hover:bg-accent/60",
                scrolled ? "text-foreground" : "text-white hover:bg-white/10"
              )}
              aria-label="Toggle language"
            >
              <Globe className="w-4 h-4" />
              {locale === "ar" ? "EN" : "ع"}
            </button>
            <CurrencySelector variant="header" />
            {/* Favorites button with count badge */}
            <button
              onClick={() => document.querySelector("#favorites-section")?.scrollIntoView({ behavior: "smooth" })}
              className={cn(
                "relative h-10 px-3 rounded-full flex items-center gap-1.5 text-sm font-semibold transition-all hover:bg-accent/60",
                scrolled ? "text-foreground" : "text-white hover:bg-white/10"
              )}
              aria-label="Favorites"
            >
              <Heart className="w-4 h-4" />
              {favCount > 0 && (
                <span className="absolute -top-1 -end-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-scale-in">
                  {favCount}
                </span>
              )}
            </button>
            <Button
              variant="ghost"
              size="sm"
              onClick={openManage}
              className={cn(
                "hidden md:flex rounded-full",
                scrolled ? "text-foreground hover:bg-accent" : "text-white hover:bg-white/10"
              )}
            >
              <CalendarClock className="w-4 h-4 me-1.5" />
              {t("nav.manageBooking")}
            </Button>
            <Button
              onClick={openBooking}
              size="sm"
              className="bg-gold-gradient text-gold-foreground hover:opacity-90 rounded-full font-semibold shadow-lg shadow-gold/20 hidden sm:flex"
            >
              {t("nav.bookNow")}
            </Button>

            {/* Mobile menu */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenu}>
              <SheetTrigger asChild>
                <button
                  className={cn(
                    "lg:hidden w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                    scrolled ? "text-foreground hover:bg-accent" : "text-white hover:bg-white/10"
                  )}
                  aria-label="Open menu"
                >
                  <Menu className="w-6 h-6" />
                </button>
              </SheetTrigger>
              <SheetContent side={locale === "ar" ? "right" : "left"} className="w-[300px] sm:w-[340px] p-0">
                <SheetHeader className="p-5 border-b">
                  <SheetTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gold-gradient flex items-center justify-center">
                      <span className="font-display text-lg font-bold text-gold-foreground">ي</span>
                    </div>
                    <span className="font-display font-bold text-base">{name}</span>
                  </SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col p-4 gap-1 overflow-y-auto custom-scroll" style={{ maxHeight: "calc(100vh - 200px)" }}>
                  {NAV_ITEMS.map((item) => (
                    <button
                      key={item.key}
                      onClick={() => handleNav(item.href)}
                      className="px-4 py-3 text-start text-sm font-medium rounded-xl hover:bg-accent transition-colors"
                    >
                      {t(item.key)}
                    </button>
                  ))}
                  <button
                    onClick={() => { setMobileMenu(false); openManage(); }}
                    className="px-4 py-3 text-start text-sm font-medium rounded-xl hover:bg-accent transition-colors flex items-center gap-2"
                  >
                    <CalendarClock className="w-4 h-4" />
                    {t("nav.manageBooking")}
                  </button>
                </nav>
                <div className="p-4 border-t mt-auto">
                  <Button onClick={() => { setMobileMenu(false); openBooking(); }} className="w-full bg-gold-gradient text-gold-foreground rounded-full font-semibold">
                    {t("nav.bookNow")}
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useState, useEffect } from "react";
import { ArrowUp, MessageCircle } from "lucide-react";
import { useHotel } from "@/hooks/use-data";
import { useUIStore } from "@/stores/ui-store";

export function FloatingActions() {
  const [showTop, setShowTop] = useState(false);
  const { data: hotel } = useHotel();
  const locale = useUIStore((s) => s.locale);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const whatsappUrl = hotel?.whatsapp
    ? `https://wa.me/${hotel.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
        locale === "ar"
          ? "مرحباً، أرغب في الاستفسار عن الحجز في فندق دار الياسمين الملكي"
          : "Hello, I'd like to inquire about booking at Dar Al-Yasmin Royal Hotel"
      )}`
    : null;

  return (
    <div className="fixed bottom-4 end-4 sm:end-6 z-40 flex flex-col gap-3 items-end">
      {/* Back to top */}
      <button
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`group w-11 h-11 rounded-full bg-card border border-gold/40 shadow-luxury flex items-center justify-center hover:bg-gold hover:text-gold-foreground transition-all duration-300 ${
          showTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
        aria-label={locale === "ar" ? "العودة للأعلى" : "Back to top"}
      >
        <ArrowUp className="w-5 h-5 group-hover:-translate-y-0.5 transition-transform" />
      </button>

      {/* WhatsApp */}
      {whatsappUrl && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative w-14 h-14 rounded-full bg-[#25D366] shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
          aria-label="WhatsApp"
        >
          <MessageCircle className="w-7 h-7 text-white" />
          {/* Pulse ring */}
          <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-30" />
          {/* Tooltip */}
          <span className="absolute end-full me-3 top-1/2 -translate-y-1/2 whitespace-nowrap bg-card text-foreground text-xs font-medium px-3 py-1.5 rounded-lg shadow-luxury border border-border opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {locale === "ar" ? "تواصل معنا عبر واتساب" : "Chat with us on WhatsApp"}
          </span>
        </a>
      )}
    </div>
  );
}

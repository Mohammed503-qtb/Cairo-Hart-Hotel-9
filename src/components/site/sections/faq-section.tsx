"use client";

import { useState } from "react";
import { ChevronDown, HelpCircle } from "lucide-react";
import { useT } from "@/hooks/use-t";
import { useFaqs } from "@/hooks/use-data";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useLocalized } from "@/hooks/use-t";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

const CATEGORY_LABELS: Record<string, { ar: string; en: string }> = {
  booking: { ar: "الحجز", en: "Booking" },
  checkin: { ar: "الوصول", en: "Check-in" },
  cancellation: { ar: "الإلغاء", en: "Cancellation" },
  payment: { ar: "الدفع", en: "Payment" },
  rooms: { ar: "الغرف", en: "Rooms" },
  facilities: { ar: "المرافق", en: "Facilities" },
  general: { ar: "عام", en: "General" },
};

export function FaqSection() {
  const { t, locale } = useT();
  const loc = useLocalized();
  const { data: faqs, isLoading } = useFaqs();
  const [openId, setOpenId] = useState<string | null>(null);

  const categories = Array.from(new Set((faqs || []).map((f) => f.category)));

  return (
    <section id="faq" className="py-16 lg:py-24 bg-cream/30 scroll-mt-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <Reveal className="text-center max-w-2xl mx-auto mb-10 lg:mb-14">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest text-gold mb-3">
            <HelpCircle className="w-3.5 h-3.5" /> {t("nav.faq")}
          </span>
          <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-3">{t("faq.title")}</h2>
          <p className="text-muted-foreground text-base lg:text-lg">{t("faq.subtitle")}</p>
        </Reveal>

        <div className="max-w-3xl mx-auto space-y-8">
          {isLoading ? (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          ) : (
            categories.map((cat) => (
              <div key={cat}>
                <h3 className="font-display font-bold text-sm text-gold uppercase tracking-wider mb-3">
                  {CATEGORY_LABELS[cat] ? loc(CATEGORY_LABELS[cat].ar, CATEGORY_LABELS[cat].en) : cat}
                </h3>
                <div className="space-y-2">
                  {(faqs || []).filter((f) => f.category === cat).map((faq) => {
                    const isOpen = openId === faq.id;
                    return (
                      <div
                        key={faq.id}
                        className={cn(
                          "rounded-xl border bg-card transition-all",
                          isOpen ? "border-gold/40 shadow-sm" : "border-border/50"
                        )}
                      >
                        <button
                          onClick={() => setOpenId(isOpen ? null : faq.id)}
                          className="w-full flex items-center justify-between gap-3 p-4 text-start"
                        >
                          <span className="text-sm font-semibold flex-1">{loc(faq.questionAr, faq.questionEn)}</span>
                          <ChevronDown
                            className={cn("w-5 h-5 text-gold shrink-0 transition-transform", isOpen && "rotate-180")}
                          />
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 -mt-1 text-sm text-muted-foreground leading-relaxed animate-fade-in">
                            {loc(faq.answerAr, faq.answerEn)}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="text-center mt-10">
          <Button
            onClick={() => document.querySelector("#contact")?.scrollIntoView({ behavior: "smooth" })}
            variant="outline"
            className="rounded-full border-gold/40 text-gold hover:bg-gold hover:text-gold-foreground"
          >
            {t("faq.contactUs")}
          </Button>
        </div>
      </div>
    </section>
  );
}

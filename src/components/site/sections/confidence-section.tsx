"use client";

import { ShieldCheck, RefreshCw, Headset, BadgeDollarSign } from "lucide-react";
import { useT } from "@/hooks/use-t";

const ITEMS = [
  { icon: ShieldCheck, key: "confidence.secure", descKey: "confidence.secureDesc" },
  { icon: RefreshCw, key: "confidence.flexible", descKey: "confidence.flexibleDesc" },
  { icon: Headset, key: "confidence.support", descKey: "confidence.supportDesc" },
  { icon: BadgeDollarSign, key: "confidence.bestPrice", descKey: "confidence.bestPriceDesc" },
];

export function ConfidenceSection() {
  const { t } = useT();
  return (
    <section className="py-12 lg:py-16 bg-cream/40 border-y border-border/50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {ITEMS.map((item) => (
            <div
              key={item.key}
              className="flex flex-col items-center text-center p-4 lg:p-6 rounded-2xl bg-card border border-border/50 hover:border-gold/40 hover:shadow-luxury transition-all duration-300 group"
            >
              <div className="w-14 h-14 rounded-full bg-gold-soft flex items-center justify-center mb-3 group-hover:bg-gold group-hover:text-gold-foreground transition-colors">
                <item.icon className="w-6 h-6 text-gold group-hover:text-gold-foreground" />
              </div>
              <h3 className="font-display font-bold text-sm lg:text-base mb-1">{t(item.key)}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{t(item.descKey)}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

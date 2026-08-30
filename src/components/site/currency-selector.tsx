"use client";

import { useState } from "react";
import { useCurrencyStore } from "@/stores/currency-store";
import { useCurrencyRates } from "@/hooks/use-currency";
import { useT } from "@/hooks/use-t";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

export function CurrencySelector({ variant = "header" }: { variant?: "header" | "footer" }) {
  const { displayCurrency, setDisplayCurrency, rates } = useCurrencyStore();
  const [open, setOpen] = useState(false);
  useCurrencyRates();
  const { t, locale } = useT();

  const currencyCodes = Object.keys(rates);
  if (currencyCodes.length <= 1) return null; // only base currency, no toggle

  const current = rates[displayCurrency] || rates["YER"];
  const isHeader = variant === "header";
  const textColor = isHeader ? "text-white hover:bg-white/10" : "text-white/70 hover:text-gold";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "h-9 px-2.5 rounded-full flex items-center gap-1 text-xs font-semibold transition-all",
          textColor
        )}
        aria-label="Select currency"
      >
        <span className="font-bold">{displayCurrency}</span>
        <svg className={cn("w-3 h-3 transition-transform", open && "rotate-180")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          {/* Dropdown */}
          <div
            className={cn(
              "absolute z-50 mt-1 w-44 rounded-xl bg-card border border-border/50 shadow-luxury p-1.5",
              locale === "ar" ? "start-0" : "end-0"
            )}
          >
            {currencyCodes.map((code) => {
              const info = rates[code];
              const isSelected = code === displayCurrency;
              return (
                <button
                  key={code}
                  onClick={() => {
                    setDisplayCurrency(code);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-xs hover:bg-accent transition-colors",
                    isSelected && "bg-gold/10"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold w-8">{code}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {locale === "ar" ? info.nameAr : info.nameEn}
                    </span>
                  </div>
                  <span className="flex items-center gap-1">
                    <span className="text-muted-foreground">{info.symbol}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-gold" />}
                  </span>
                </button>
              );
            })}
            <div className="px-3 py-1.5 mt-1 border-t border-border/30 text-[9px] text-muted-foreground text-center">
              {locale === "ar" ? "أسعار تقريبية للعرض فقط" : "Approximate display rates"}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

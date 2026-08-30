"use client";

import { useEffect } from "react";
import { useCurrencyStore } from "@/stores/currency-store";
import type { Locale } from "@/lib/i18n";

// Fetch exchange rates on mount
export function useCurrencyRates() {
  const setRates = useCurrencyStore((s) => s.setRates);

  useEffect(() => {
    let mounted = true;
    fetch("/api/currency", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (mounted && data?.currencies) {
          setRates(data.baseCurrency, data.currencies);
        }
      })
      .catch(() => {
        // Silent fail — falls back to YER
      });
    return () => {
      mounted = false;
    };
  }, [setRates]);
}

// Convert an amount from base currency to display currency and format
export function useMoney() {
  const displayCurrency = useCurrencyStore((s) => s.displayCurrency);
  const rates = useCurrencyStore((s) => s.rates);

  return (amountInBase: number, locale: Locale = "ar"): string => {
    const info = rates[displayCurrency] || rates["YER"] || {
      rate: 1,
      symbol: "ر.ي",
      decimals: 0,
      code: "YER",
      nameAr: "",
      nameEn: "",
    };
    const converted = amountInBase * info.rate;
    const rounded = info.decimals > 0 ? Math.round(converted * 100) / 100 : Math.round(converted);
    const numStr = rounded.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
      minimumFractionDigits: info.decimals > 0 && rounded % 1 !== 0 ? 2 : 0,
      maximumFractionDigits: info.decimals,
    });
    const symbol = displayCurrency === "YER" ? (locale === "ar" ? "ر.ي" : "YER") : info.symbol;
    return locale === "ar" ? `${numStr} ${symbol}` : `${symbol} ${numStr}`;
  };
}

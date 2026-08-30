"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export interface CurrencyInfo {
  code: string;
  rate: number;
  symbol: string;
  nameAr: string;
  nameEn: string;
  decimals: number;
}

interface CurrencyState {
  displayCurrency: string; // code: YER, USD, SAR, AED
  setDisplayCurrency: (code: string) => void;
  rates: Record<string, CurrencyInfo>;
  baseCurrency: string;
  setRates: (base: string, currencies: CurrencyInfo[]) => void;
}

export const useCurrencyStore = create<CurrencyState>()(
  persist(
    (set) => ({
      displayCurrency: "YER",
      setDisplayCurrency: (code) => set({ displayCurrency: code }),
      rates: {
        YER: { code: "YER", rate: 1, symbol: "ر.ي", nameAr: "ريال يمني", nameEn: "Yemeni Rial", decimals: 0 },
      },
      baseCurrency: "YER",
      setRates: (base, currencies) => {
        const map: Record<string, CurrencyInfo> = {};
        for (const c of currencies) map[c.code] = c;
        set({ baseCurrency: base, rates: map });
      },
    }),
    {
      name: "dar-yasmin-currency",
      storage: createJSONStorage(() => {
        if (typeof window === "undefined") {
          return { getItem: () => null, setItem: () => {}, removeItem: () => {} };
        }
        return localStorage;
      }),
      partialize: (s) => ({ displayCurrency: s.displayCurrency }),
    }
  )
);

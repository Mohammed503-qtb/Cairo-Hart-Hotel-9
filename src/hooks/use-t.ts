"use client";

import { useUIStore } from "@/stores/ui-store";
import { t as translate, isRTL, type Locale } from "@/lib/i18n";

// Translation hook bound to the current locale in the UI store.
export function useLocale() {
  const locale = useUIStore((s) => s.locale);
  return { locale, isRTL: isRTL(locale) };
}

export function useT() {
  const locale = useUIStore((s) => s.locale);
  const tr = (key: string) => translate(locale as Locale, key);
  return { t: tr, locale: locale as Locale };
}

// Localized field picker: returns the Arabic or English field based on locale.
export function localized(locale: Locale, ar: string, en: string) {
  return locale === "ar" ? ar : en;
}

export function useLocalized() {
  const locale = useUIStore((s) => s.locale) as Locale;
  return (ar: string, en: string) => (locale === "ar" ? ar : en);
}

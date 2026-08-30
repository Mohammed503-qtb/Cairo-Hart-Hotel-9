// Formatting helpers — currency, dates, numbers
// Money is stored as Float but always rounded to 2 decimals in calculations to avoid float drift.

import type { Locale } from "./i18n";

export function formatMoney(amount: number, currency = "YER", locale: Locale = "ar"): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const rounded = Math.round(safe * 100) / 100;
  const num = rounded.toLocaleString(locale === "ar" ? "ar-EG" : "en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  const symbol = currency === "YER" ? (locale === "ar" ? "ر.ي" : "YER") : currency;
  return locale === "ar" ? `${num} ${symbol}` : `${num} ${symbol}`;
}

export function formatMoneyShort(amount: number, currency = "YER", locale: Locale = "ar"): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  const rounded = Math.round(safe * 100) / 100;
  const symbol = currency === "YER" ? (locale === "ar" ? "ر.ي" : "YER") : currency;
  return locale === "ar" ? `${rounded.toLocaleString("ar-EG")} ${symbol}` : `${rounded.toLocaleString("en-US")} ${symbol}`;
}

// Calculate number of nights between two dates (date-boundary based, not time-based)
export function calculateNights(checkIn: Date, checkOut: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const ci = startOfDay(checkIn);
  const co = startOfDay(checkOut);
  const diff = co.getTime() - ci.getTime();
  return Math.max(0, Math.round(diff / msPerDay));
}

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function addDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function fromISODate(s: string): Date {
  // Parse as local date (no timezone shift)
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

export function formatDate(d: Date, locale: Locale = "ar"): string {
  const lang = locale === "ar" ? "ar-EG" : "en-US";
  return d.toLocaleDateString(lang, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function formatDateShort(d: Date, locale: Locale = "ar"): string {
  const lang = locale === "ar" ? "ar-EG" : "en-US";
  return d.toLocaleDateString(lang, {
    month: "short",
    day: "numeric",
  });
}

export function formatDateTime(d: Date, locale: Locale = "ar"): string {
  const lang = locale === "ar" ? "ar-EG" : "en-US";
  return d.toLocaleString(lang, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Round money to 2 decimals safely
export function roundMoney(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

export function clamp(n: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, n));
}

// Generate a human-friendly booking reference: HTL-YYYY-000001
let _refCounter = 0;
export function generateBookingReferenceHint(): string {
  _refCounter += 1;
  const year = new Date().getFullYear();
  const seq = String(_refCounter).padStart(6, "0");
  return `HTL-${year}-${seq}`;
}

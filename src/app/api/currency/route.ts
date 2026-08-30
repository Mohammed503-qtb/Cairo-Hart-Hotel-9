import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// GET /api/currency
// Returns supported currencies + exchange rates relative to base currency (YER).
// In production, these would be fetched from a live FX API. For now, static rates.
export async function GET() {
  const hotel = await db.hotel.findFirst({ select: { currency: true } });
  const baseCurrency = hotel?.currency || "YER";

  // Static exchange rates (1 base unit = X target units)
  // These would be updated via a scheduled job in production
  const rates: Record<string, { rate: number; symbol: string; nameAr: string; nameEn: string; decimals: number }> = {
    YER: { rate: 1, symbol: "ر.ي", nameAr: "ريال يمني", nameEn: "Yemeni Rial", decimals: 0 },
    USD: { rate: 0.004, symbol: "$", nameAr: "دولار أمريكي", nameEn: "US Dollar", decimals: 2 },
    SAR: { rate: 0.015, symbol: "﷼", nameAr: "ريال سعودي", nameEn: "Saudi Riyal", decimals: 2 },
    AED: { rate: 0.015, symbol: "د.إ", nameAr: "درهم إماراتي", nameEn: "UAE Dirham", decimals: 2 },
  };

  return NextResponse.json({
    baseCurrency,
    currencies: Object.entries(rates).map(([code, info]) => ({
      code,
      ...info,
    })),
  });
}

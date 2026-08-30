import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { computeSeasonalPrice } from "@/lib/booking";
import { startOfDay } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const roomTypeId = body.roomTypeId;
    const checkIn = body.checkIn;
    const checkOut = body.checkOut;
    const rooms = Number(body.rooms) || 1;

    const hotel = await db.hotel.findFirst();
    if (!hotel) return NextResponse.json({ error: "hotel_not_configured" }, { status: 500 });

    const rt = await db.roomType.findUnique({ where: { id: roomTypeId } });
    if (!rt) return NextResponse.json({ error: "room_not_found" }, { status: 404 });

    const ci = startOfDay(new Date(checkIn));
    const co = startOfDay(new Date(checkOut));

    const price = await computeSeasonalPrice({
      basePrice: rt.basePrice,
      checkIn: ci,
      checkOut: co,
      rooms,
      roomTypeId: rt.id,
      ratePlanId: rt.ratePlanId,
      taxRatePercent: hotel.taxRatePercent,
      serviceChargePercent: hotel.serviceChargePercent,
      currency: hotel.currency,
    });

    return NextResponse.json({
      price,
      roomType: { nameAr: rt.nameAr, nameEn: rt.nameEn, basePrice: rt.basePrice, imageUrl: rt.imageUrl },
      hasSeasonalRate: price.nightlyRates?.some((nr) => nr.rate !== rt.basePrice) ?? false,
    });
  } catch (e) {
    console.error("[booking/calculate] error", e);
    return NextResponse.json({ error: "calculation_failed" }, { status: 500 });
  }
}

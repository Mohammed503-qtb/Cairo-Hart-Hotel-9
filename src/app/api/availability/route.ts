import { NextResponse } from "next/server";
import { computeAvailability, validateBookingQuery, getSeasonalStayLimits } from "@/lib/booking";
import { fromISODate, calculateNights } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = {
      checkIn: body.checkIn,
      checkOut: body.checkOut,
      adults: Number(body.adults) || 1,
      children: Number(body.children) || 0,
      rooms: Number(body.rooms) || 1,
    };

    const { roomTypes, hotel } = await computeAvailability(query);
    const validation = validateBookingQuery(query, hotel);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    // Check seasonal stay limits (min/max stay per season)
    const ci = fromISODate(query.checkIn);
    const co = fromISODate(query.checkOut);
    const nights = calculateNights(ci, co);
    const seasonalLimits = await getSeasonalStayLimits(ci, co);
    if (seasonalLimits.minStayNights && nights < seasonalLimits.minStayNights) {
      return NextResponse.json({ error: "tooShort" }, { status: 400 });
    }
    if (seasonalLimits.maxStayNights && nights > seasonalLimits.maxStayNights) {
      return NextResponse.json({ error: "tooLong" }, { status: 400 });
    }

    // Only return room types that have availability for requested rooms
    const available = roomTypes
      .filter((r) => r.availableCount >= query.rooms)
      .map((r) => ({
        ...r,
        affordable: true,
      }));

    return NextResponse.json({
      results: available,
      query,
      hotel: {
        currency: hotel.currency,
        taxRatePercent: hotel.taxRatePercent,
        serviceChargePercent: hotel.serviceChargePercent,
        checkInTime: hotel.checkInTime,
        checkOutTime: hotel.checkOutTime,
      },
    });
  } catch (e) {
    console.error("[availability] error", e);
    return NextResponse.json({ error: "availability_error" }, { status: 500 });
  }
}

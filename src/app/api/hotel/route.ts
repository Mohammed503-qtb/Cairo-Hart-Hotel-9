import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  const hotel = await db.hotel.findFirst({
    select: {
      id: true,
      nameAr: true,
      nameEn: true,
      taglineAr: true,
      taglineEn: true,
      descriptionAr: true,
      descriptionEn: true,
      storyAr: true,
      storyEn: true,
      phone: true,
      whatsapp: true,
      email: true,
      addressAr: true,
      addressEn: true,
      cityAr: true,
      cityEn: true,
      countryAr: true,
      countryEn: true,
      latitude: true,
      longitude: true,
      checkInTime: true,
      checkOutTime: true,
      currency: true,
      timezone: true,
      defaultLanguage: true,
      heroImageUrl: true,
      bookingHorizonDays: true,
      minStayNights: true,
      maxStayNights: true,
      maxAdultsPerRoom: true,
      maxChildrenPerRoom: true,
      taxRatePercent: true,
      serviceChargePercent: true,
      whatsappEnabled: true,
      emailEnabled: true,
    },
  });

  if (!hotel) {
    return NextResponse.json({ error: "Hotel not configured" }, { status: 404 });
  }

  return NextResponse.json({ hotel });
}

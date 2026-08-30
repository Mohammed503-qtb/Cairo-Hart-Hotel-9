// GET /api/app/reception/arrivals
// Returns today's arrivals (reservations with checkIn today, status CONFIRMED or PAYMENT_PENDING).
// Supports ?date=YYYY-MM-DD (default today).

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";
import { startOfDay, addDays, fromISODate } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "RECEPTION");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");

  let dayStart: Date;
  if (dateParam) {
    const d = fromISODate(dateParam);
    if (isNaN(d.getTime())) {
      return NextResponse.json({ error: "invalidDate" }, { status: 400 });
    }
    dayStart = startOfDay(d);
  } else {
    dayStart = startOfDay(new Date());
  }
  const dayEnd = startOfDay(addDays(dayStart, 1));

  const reservations = await db.reservation.findMany({
    where: {
      checkIn: { gte: dayStart, lt: dayEnd },
      status: { in: ["CONFIRMED", "PAYMENT_PENDING"] },
    },
    include: {
      guest: true,
      items: { include: { roomType: true } },
    },
    orderBy: { checkIn: "asc" },
  });

  return NextResponse.json({
    ok: true,
    date: dateParam || dayStart.toISOString().slice(0, 10),
    arrivals: reservations.map((r) => ({
      id: r.id,
      bookingReference: r.bookingReference,
      status: r.status,
      paymentStatus: r.paymentStatus,
      paymentMethod: r.paymentMethod,
      grandTotal: r.grandTotal,
      paidTotal: r.paidTotal,
      adults: r.adults,
      children: r.children,
      nights: r.nights,
      rooms: r.rooms,
      checkIn: r.checkIn,
      checkOut: r.checkOut,
      guest: {
        id: r.guest.id,
        fullName: r.guest.fullName,
        phone: r.guest.phone,
        email: r.guest.email,
        countryCode: r.guest.countryCode,
      },
      items: r.items.map((it) => ({
        id: it.id,
        roomTypeId: it.roomTypeId,
        quantity: it.quantity,
        nights: it.nights,
        nightlyRate: it.nightlyRate,
        subtotal: it.subtotal,
        roomType: it.roomType
          ? {
              id: it.roomType.id,
              slug: it.roomType.slug,
              nameAr: it.roomType.nameAr,
              nameEn: it.roomType.nameEn,
            }
          : null,
      })),
    })),
  });
}

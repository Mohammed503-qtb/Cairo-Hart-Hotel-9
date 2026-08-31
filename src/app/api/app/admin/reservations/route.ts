// GET /api/app/admin/reservations?status=...
// Returns last 100 reservations (most recent first), with guest name,
// first item's roomType name, payment status, etc.

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { requireSession } from "@/lib/app/session";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const ctx = await requireSession(req, "ADMIN");
  if (!ctx.ok) return NextResponse.json({ error: ctx.error }, { status: ctx.status });

  const url = new URL(req.url);
  const statusParam = url.searchParams.get("status") || "";

  const where: { status?: string } = {};
  if (statusParam) where.status = statusParam.toUpperCase();

  const reservations = await db.reservation.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      guest: true,
      items: { include: { roomType: true }, take: 1 },
    },
  });

  const list = reservations.map((r) => ({
    id: r.id,
    bookingReference: r.bookingReference,
    status: r.status,
    checkIn: r.checkIn,
    checkOut: r.checkOut,
    nights: r.nights,
    adults: r.adults,
    children: r.children,
    grandTotal: r.grandTotal,
    paidTotal: r.paidTotal,
    paymentStatus: r.paymentStatus,
    paymentMethod: r.paymentMethod,
    currency: r.currency,
    source: r.source,
    createdAt: r.createdAt,
    guestName: r.guest.fullName,
    guestPhone: r.guest.phone,
    guestEmail: r.guest.email,
    roomTypeName: r.items[0]?.roomType?.nameAr || null,
    roomTypeNameEn: r.items[0]?.roomType?.nameEn || null,
    roomTypeSlug: r.items[0]?.roomType?.slug || null,
  }));

  return NextResponse.json({ ok: true, reservations: list });
}
